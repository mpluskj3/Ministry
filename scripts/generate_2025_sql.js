import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const data2025Path = path.join(__dirname, '..', 'src', 'data', 'data2025.json');
const data2025 = JSON.parse(fs.readFileSync(data2025Path, 'utf-8'));

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function normalizePosition(pos) {
  if (!pos || pos === '일반' || pos.trim() === '') return '일반';
  if (pos === '장로') return '장로';
  if (pos === '봉종' || pos === '봉사의 종') return '봉사의 종';
  return '일반';
}

function normalizePioneerStatus(status) {
  if (!status || status.trim() === '' || status === '일반') return '일반';
  if (['RP', 'AP', 'SP', 'FM'].includes(status.trim())) return status.trim();
  return '일반';
}

let sql = `-- ==============================================================================
-- 2024-2025 봉사연도 구글시트 실제 데이터 마이그레이션 SQL
-- 충돌 방지 및 안전한 외래키(UUID) 연동 스크립트
-- ==============================================================================

-- 0. 제약조건 안전 완화 (기존 테이블 호환)
ALTER TABLE public.publishers DROP CONSTRAINT IF EXISTS publishers_position_check;
ALTER TABLE public.publishers ADD CONSTRAINT publishers_position_check CHECK (position IN ('장로', '봉사의 종', '봉종', '일반', ''));

-- 1. 2024-2025 봉사연도 등록 (year_name = '2025')
INSERT INTO public.service_years (year_name, is_current, start_date, end_date)
VALUES ('2025', false, '2024-09-01', '2025-08-31')
ON CONFLICT (year_name) DO UPDATE SET start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date;

-- 2. 집단 등록 (효자, 수어, 석사, 현대, 운교, 퇴계 등)
-- id를 하드코딩하지 않아 기존 그룹과 충돌 없이 안전하게 매핑됩니다.
INSERT INTO public.groups (name, overseer_name, display_order)
VALUES 
  ('효자', '효자 감독자', 1),
  ('수어', '수어 감독자', 2),
  ('석사', '석사 감독자', 3),
  ('현대', '현대 감독자', 4),
  ('운교', '운교 감독자', 5),
  ('퇴계', '퇴계 감독자', 6)
ON CONFLICT (name) DO NOTHING;

-- 3. 2024-2025 전도인 명단 등록
-- 기존 전도인은 그룹/정보를 유지하고, 전출자/신규자만 안전하게 추가됩니다.
`;

// 1. 유효한 전도인 취합 (시트 헤더 제외 및 월별 보고서 등장 전도인 모두 포함)
const publishersMap = new Map();

// 멤버 명단 기반
data2025.members.forEach(m => {
  if (!m.name || m.name === '이름' || m.group === '집단') return;
  publishersMap.set(m.name.trim(), {
    name: m.name.trim(),
    group: m.group ? m.group.trim() : null,
    position: '일반',
    pioneer_status: '일반',
    is_active: true
  });
});

// 월별 보고서 기반 최신 직책/구분/전출자 보강
const months = ['9월', '10월', '11월', '12월', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월'];
months.forEach(m => {
  const list = data2025.reportsByMonth[m] || [];
  list.forEach(r => {
    if (!r.name || r.name === '이름') return;
    const name = r.name.trim();
    if (!publishersMap.has(name)) {
      publishersMap.set(name, {
        name,
        group: r.group ? r.group.trim() : null,
        position: normalizePosition(r.position),
        pioneer_status: normalizePioneerStatus(r.division),
        is_active: false // 명단에 없던 전출자
      });
    } else {
      const p = publishersMap.get(name);
      if (r.position && r.position !== '일반') p.position = normalizePosition(r.position);
      if (r.division && r.division !== '일반') p.pioneer_status = normalizePioneerStatus(r.division);
      if (!p.group && r.group) p.group = r.group.trim();
    }
  });
});

const pubList = Array.from(publishersMap.values());
const pubValueRows = pubList.map(p => {
  const grpVal = p.group ? escapeSql(p.group) : 'NULL';
  return `  (${escapeSql(p.name)}, ${grpVal}, ${escapeSql(p.position)}, ${escapeSql(p.pioneer_status)}, ${p.is_active})`;
});

sql += `INSERT INTO public.publishers (name, group_id, gender, hope, position, pioneer_status, is_active)
SELECT 
  v.name,
  g.id,
  '남',
  '다른 양',
  v.position,
  v.pioneer_status,
  v.is_active
FROM (VALUES
${pubValueRows.join(',\n')}
) AS v(name, group_name, position, pioneer_status, is_active)
LEFT JOIN public.groups g ON g.name = v.group_name
ON CONFLICT (name) DO UPDATE SET
  group_id = COALESCE(public.publishers.group_id, EXCLUDED.group_id);
`;

// 4. 월별 마감 상태 (2025년도 12개월 모두 마감 완료 처리)
sql += `\n-- 4. 2024-2025 12개월 마감 상태 삽입\n`;
sql += `INSERT INTO public.monthly_statuses (service_year_id, month, is_closed)
SELECT 
  sy.id,
  m.month,
  true
FROM public.service_years sy
CROSS JOIN (VALUES
  ('9월'), ('10월'), ('11월'), ('12월'),
  ('1월'), ('2월'), ('3월'), ('4월'),
  ('5월'), ('6월'), ('7월'), ('8월')
) AS m(month)
WHERE sy.year_name = '2025'
ON CONFLICT (service_year_id, month) DO UPDATE SET is_closed = EXCLUDED.is_closed;
`;

// 5. 월별 봉사 보고서 삽입
sql += `\n-- 5. 2024-2025 월별 봉사 보고서 삽입 (총 1,105건)\n`;

let allReports = [];
months.forEach(m => {
  const list = data2025.reportsByMonth[m] || [];
  list.forEach(r => {
    if (!r.name || r.name === '이름') return;
    allReports.push({
      month: m,
      name: r.name.trim(),
      participated: !!r.participated,
      hours: Number(r.hours || 0),
      bibleStudies: Number(r.bibleStudies || 0),
      remarks: r.remarks ? [{ type: '비고', hours: '0', etc: String(r.remarks).trim() }] : []
    });
  });
});

const chunkSize = 100;
for (let i = 0; i < allReports.length; i += chunkSize) {
  const chunk = allReports.slice(i, i + chunkSize);
  const rows = chunk.map(r => {
    const remarksJson = escapeSql(JSON.stringify(r.remarks || []));
    return `  (${escapeSql(r.name)}, ${escapeSql(r.month)}, ${r.participated}, ${r.hours}, ${r.bibleStudies}, ${remarksJson}::text)`;
  });

  sql += `\nINSERT INTO public.monthly_reports (service_year_id, publisher_id, month, participated, hours, bible_studies, remarks, submitted_at)
SELECT 
  sy.id,
  p.id,
  v.month,
  v.participated,
  v.hours,
  v.bible_studies,
  v.remarks::JSONB,
  '2024-09-01 00:00:00+00'::TIMESTAMPTZ
FROM (VALUES
${rows.join(',\n')}
) AS v(name, month, participated, hours, bible_studies, remarks)
CROSS JOIN (SELECT id FROM public.service_years WHERE year_name = '2025' LIMIT 1) sy
JOIN public.publishers p ON p.name = v.name
ON CONFLICT (service_year_id, publisher_id, month) 
DO UPDATE SET 
  participated = EXCLUDED.participated,
  hours = EXCLUDED.hours,
  bible_studies = EXCLUDED.bible_studies,
  remarks = EXCLUDED.remarks;
`;
}

const outPath = path.join(__dirname, '..', 'supabase', 'actual_seed_2024_2025.sql');
fs.writeFileSync(outPath, sql, 'utf-8');
console.log(`✅ 2024-2025 SQL 파일 생성 완료: ${outPath} (${(sql.length / 1024).toFixed(1)} KB, 총 ${allReports.length}건 보고서)`);
