import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '..', 'src', 'data', 'actualData.json');
const actualData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function normalizePosition(pos) {
  if (!pos || pos === '일반') return '일반';
  if (pos === '장로') return '장로';
  if (pos === '봉종' || pos === '봉사의 종') return '봉사의 종';
  return '일반';
}

let sql = `-- ==============================================================================
-- Google Sheets -> Supabase Actual Data Migration Script
-- 실제 구글 시트 데이터 (90명 전도인, 5개 집단, 1,016건 월별 보고서) 마이그레이션
-- ==============================================================================

-- 0. 제약조건 안전 완화 (기존 테이블 호환성 보장)
ALTER TABLE public.publishers DROP CONSTRAINT IF EXISTS publishers_position_check;
ALTER TABLE public.publishers ADD CONSTRAINT publishers_position_check CHECK (position IN ('장로', '봉사의 종', '봉종', '일반', ''));

-- 1. 봉사연도 생성
INSERT INTO public.service_years (id, year_name, is_current, start_date, end_date)
VALUES 
  ('a0000000-0000-0000-0000-000000002026', '2026', true, '2025-09-01', '2026-08-31'),
  ('a0000000-0000-0000-0000-000000002025', '2025', false, '2024-09-01', '2025-08-31')
ON CONFLICT (year_name) DO UPDATE SET is_current = EXCLUDED.is_current;

-- 2. 실제 집단 삽입
`;

const groupUuidMap = new Map();
actualData.groups.forEach((g, idx) => {
  const uuid = `b0000000-0000-0000-0000-00000000000${idx + 1}`;
  groupUuidMap.set(g.name, uuid);
  sql += `INSERT INTO public.groups (id, name, overseer_name, display_order)
VALUES ('${uuid}', ${escapeSql(g.name)}, ${escapeSql(g.name + ' 감독자')}, ${idx + 1})
ON CONFLICT (name) DO NOTHING;\n`;
});

sql += `\n-- 3. 실제 90명 전도인 명단 삽입\n`;
const pubUuidMap = new Map();
actualData.publishers.forEach((p, idx) => {
  const hex = (idx + 1).toString().padStart(12, '0');
  const uuid = `c0000000-0000-0000-0000-${hex}`;
  pubUuidMap.set(p.name, uuid);

  const groupUuid = groupUuidMap.get(p.group_name) || 'NULL';
  const groupVal = groupUuid === 'NULL' ? 'NULL' : `'${groupUuid}'`;

  const pos = normalizePosition(p.position);
  sql += `INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('${uuid}', ${escapeSql(p.name)}, ${groupVal}, '남', '다른 양', ${escapeSql(pos)}, ${escapeSql(p.pioneer_status || '일반')}, true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;\n`;
});

sql += `\n-- 4. 12개월 마감 상태 삽입\n`;
const sy2026Uuid = 'a0000000-0000-0000-0000-000000002026';
const statuses = actualData.monthlyStatuses['sy-2026'] || {};
Object.entries(statuses).forEach(([m, closed]) => {
  sql += `INSERT INTO public.monthly_statuses (service_year_id, month, is_closed)
VALUES ('${sy2026Uuid}', ${escapeSql(m)}, ${closed})
ON CONFLICT (service_year_id, month) DO UPDATE SET is_closed = EXCLUDED.is_closed;\n`;
});

sql += `\n-- 5. 실제 월별 보고서 데이터 (총 ${actualData.reports.length}건) 삽입\n`;
// 100건씩 분할 삽입
const chunkSize = 100;
for (let i = 0; i < actualData.reports.length; i += chunkSize) {
  const chunk = actualData.reports.slice(i, i + chunkSize);
  sql += `INSERT INTO public.monthly_reports (service_year_id, publisher_id, month, participated, hours, bible_studies, remarks, submitted_at)\nVALUES\n`;
  const values = chunk.map(r => {
    const pubUuid = pubUuidMap.get(r.publisher_name);
    if (!pubUuid) return null;
    const remarksJson = escapeSql(JSON.stringify(r.remarks || []));
    return `  ('${sy2026Uuid}', '${pubUuid}', ${escapeSql(r.month)}, ${r.participated}, ${r.hours || 0}, ${r.bible_studies || 0}, ${remarksJson}::JSONB, NOW())`;
  }).filter(Boolean);

  sql += values.join(',\n') + `\nON CONFLICT (service_year_id, publisher_id, month) DO NOTHING;\n\n`;
}

sql += `\n-- 6. 실제 집단별 관리자 계정 생성\n`;
actualData.groups.forEach((g, idx) => {
  const gUuid = groupUuidMap.get(g.name);
  sql += `INSERT INTO public.managers (email, name, role, group_id)
VALUES ('group_${idx + 1}@example.com', '${g.name} 감독자', 'group', '${gUuid}')
ON CONFLICT (email) DO NOTHING;\n`;
});

sql += `INSERT INTO public.managers (email, name, role, group_id)
VALUES ('admin@example.com', '최고관리자(서기)', 'super', NULL)
ON CONFLICT (email) DO NOTHING;\n`;

const outSqlPath = path.join(__dirname, '..', 'supabase', 'actual_seed.sql');
fs.writeFileSync(outSqlPath, sql, 'utf-8');
console.log(`✅ Supabase 실제 데이터 마이그레이션 SQL 생성 완료: ${outSqlPath} (${(sql.length / 1024).toFixed(1)} KB)`);
