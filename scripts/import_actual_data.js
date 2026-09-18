import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxUSlqPLNeIANcSIsy9dDv4ObHNdD_V2wvbf20CrYHvnr58iu3j6WKVlQFsyq2KS4c/exec';
const ADMIN_EMAIL = 'admin@example.com';
const MONTHS = ['9월', '10월', '11월', '12월', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월'];

async function fetchJson(url) {
  const res = await fetch(url);
  return await res.json();
}

async function runMigration() {
  console.log('=== [1/5] 실제 봉사연도 조회 ===');
  const syRes = await fetchJson(`${APPS_SCRIPT_URL}?action=getServiceYears`);
  const serviceYears = syRes.data?.years || [{ year: '2026', spreadsheetId: '134CgG8LsC3ifDRZ2VnqhoyP1xWvuGbaDCS9jj9H139Y' }];
  console.log('Service years:', serviceYears);

  console.log('\n=== [2/5] 전체 전도인 명단 조회 ===');
  const allMembers = await fetchJson(`${APPS_SCRIPT_URL}?action=getAllMembers&email=${encodeURIComponent(ADMIN_EMAIL)}`);
  console.log(`전도인 총 ${allMembers.length}명 로드됨`);

  // 집단 목록 추출
  const groupSet = new Set();
  allMembers.forEach(m => {
    if (m.group && m.group.trim()) groupSet.add(m.group.trim());
  });
  const groupNames = Array.from(groupSet);
  console.log('발견된 실제 집단명:', groupNames);

  console.log('\n=== [3/5] 12개월 마감 상태 조회 ===');
  const monthlyStatuses = {};
  for (const m of MONTHS) {
    try {
      const st = await fetchJson(`${APPS_SCRIPT_URL}?action=checkStatus&month=${encodeURIComponent(m)}`);
      monthlyStatuses[m] = !!st.isClosed;
    } catch (e) {
      monthlyStatuses[m] = false;
    }
  }
  console.log('월별 마감 상태:', monthlyStatuses);

  console.log('\n=== [4/5] 12개월 월별 실제 보고 내역 수집 ===');
  const monthlyReportsByMonth = {};
  let totalReportsCount = 0;
  for (const m of MONTHS) {
    try {
      const reports = await fetchJson(`${APPS_SCRIPT_URL}?action=monthlyDetail&month=${encodeURIComponent(m)}&email=${encodeURIComponent(ADMIN_EMAIL)}`);
      monthlyReportsByMonth[m] = Array.isArray(reports) ? reports : [];
      totalReportsCount += monthlyReportsByMonth[m].length;
      console.log(`[${m}] ${monthlyReportsByMonth[m].length}건 수집 완료`);
    } catch (e) {
      console.error(`[${m}] 조회 실패:`, e.message);
      monthlyReportsByMonth[m] = [];
    }
  }
  console.log(`총 ${totalReportsCount}건의 실제 보고서 데이터 수집 완료`);

  console.log('\n=== [5/5] 전도인별 직책 및 상세 정보 보강 ===');
  // monthlyReports에 포함된 직책(position) 및 구분(division)을 전도인 명단에 매핑
  const publisherMap = new Map();
  allMembers.forEach((m, idx) => {
    publisherMap.set(m.name, {
      id: `pub-${idx + 1}`,
      name: m.name,
      group_name: m.group || '미배정',
      position: '일반',
      pioneer_status: '일반',
      gender: '남',
      hope: '다른 양',
      birth_date: '',
      baptism_date: '',
      phone: '',
      is_active: true
    });
  });

  // 월별 보고서에서 직책 및 구분 정보 추출하여 업데이트
  Object.values(monthlyReportsByMonth).forEach(reportList => {
    reportList.forEach(r => {
      const pub = publisherMap.get(r.name);
      if (pub) {
        if (r.position && r.position !== '일반') {
          pub.position = r.position;
        }
        if (r.division && r.division !== '일반') {
          pub.pioneer_status = r.division;
        }
      }
    });
  });

  // 전체명단 시트에서 생년월일, 침례일자, 성별, 희망 정보 수집 (yearlyReport 액션 활용)
  console.log('\n=== [5-1] 전체명단에서 생년월일, 침례일자, 성별, 희망 수집 ===');
  function normalizeDate(d) {
    if (!d) return '';
    const match = d.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    if (match) {
      return match[1] + '-' + match[2].padStart(2, '0') + '-' + match[3].padStart(2, '0');
    }
    return d.trim();
  }

  const memberList = Array.from(publisherMap.values());
  for (let i = 0; i < memberList.length; i += 10) {
    const chunk = memberList.slice(i, i + 10);
    const promises = chunk.map(pub =>
      fetchJson(`${APPS_SCRIPT_URL}?action=yearlyReport&name=${encodeURIComponent(pub.name)}&email=${encodeURIComponent(ADMIN_EMAIL)}`)
        .then(data => {
          if (data && data.userInfo) {
            pub.birth_date = normalizeDate(data.userInfo.birthDate);
            pub.baptism_date = normalizeDate(data.userInfo.baptismDate);
            if (data.userInfo.gender) pub.gender = data.userInfo.gender;
            if (data.userInfo.hope) pub.hope = data.userInfo.hope;
          }
        })
        .catch(err => {
          console.warn(`[${pub.name}] 생년월일 조회 실패:`, err.message);
        })
    );
    await Promise.all(promises);
    process.stdout.write('.');
  }
  console.log('\n생년월일 및 침례일자 보강 완료');

  // 집단 객체 리스트 생성
  const groupsList = groupNames.map((gName, idx) => ({
    id: `grp-${idx + 1}`,
    name: gName,
    overseer_name: `${gName} 감독자`,
    display_order: idx + 1
  }));
  const groupNameToId = new Map(groupsList.map(g => [g.name, g.id]));

  // 전도인 객체 리스트에 group_id 매핑
  const publishersList = Array.from(publisherMap.values()).map(p => ({
    ...p,
    group_id: groupNameToId.get(p.group_name) || null
  }));

  // 가공된 전체 월별 보고서 리스트 생성
  const flattenedReports = [];
  let repId = 1;
  MONTHS.forEach(m => {
    const list = monthlyReportsByMonth[m] || [];
    list.forEach(r => {
      const pub = publisherMap.get(r.name);
      if (!pub) return;

      const rawRemarks = r.remarks ? String(r.remarks).trim() : '';
      const remarksArr = [];
      if (rawRemarks) {
        // "원격봉사: 5시간" 또는 줄바꿈 형태 파싱
        const lines = rawRemarks.split(/[\n,]/);
        lines.forEach(l => {
          const parts = l.split(':');
          if (parts.length === 2) {
            remarksArr.push({
              type: parts[0].trim(),
              hours: parts[1].replace(/시간|h/g, '').trim()
            });
          } else {
            remarksArr.push({
              type: '기타',
              hours: '0',
              etc: l.trim()
            });
          }
        });
      }

      flattenedReports.push({
        id: `rep-${repId++}`,
        service_year_id: 'sy-2026',
        publisher_id: pub.id,
        publisher_name: pub.name,
        group_name: pub.group_name,
        position: r.position || pub.position || '일반',
        pioneer_status: r.division || pub.pioneer_status || '일반',
        month: m,
        participated: !!r.participated,
        hours: Number(r.hours || 0),
        bible_studies: Number(r.bibleStudies || 0),
        remarks: remarksArr,
        submitted_at: new Date('2025-09-01').toISOString()
      });
    });
  });

  const finalData = {
    serviceYears: [
      { id: 'sy-2026', year_name: '2026', is_current: true, start_date: '2025-09-01', end_date: '2026-08-31' },
      { id: 'sy-2025', year_name: '2025', is_current: false, start_date: '2024-09-01', end_date: '2025-08-31' }
    ],
    groups: groupsList,
    publishers: publishersList,
    monthlyStatuses: {
      'sy-2026': monthlyStatuses
    },
    reports: flattenedReports
  };

  const outputPath = path.join(__dirname, '..', 'src', 'data', 'actualData.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2), 'utf-8');
  console.log(`\n✅ 실제 구글시트 데이터가 성공적으로 저장되었습니다: ${outputPath}`);
  console.log(`- 전도인: ${publishersList.length}명`);
  console.log(`- 집단: ${groupsList.length}개 (${groupNames.join(', ')})`);
  console.log(`- 총 보고서: ${flattenedReports.length}건`);
}

runMigration().catch(console.error);
