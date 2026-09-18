import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxUSlqPLNeIANcSIsy9dDv4ObHNdD_V2wvbf20CrYHvnr58iu3j6WKVlQFsyq2KS4c/exec';
const ADMIN_EMAIL = 'admin@example.com';
const MONTHS = ['9월', '10월', '11월', '12월', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월'];

const SPREADSHEET_2025 = '1zWrarRmDbTCssxoHqWigjeHsN1lUpOAMV43Bn_sYeg4';
const SPREADSHEET_2026 = '134CgG8LsC3ifDRZ2VnqhoyP1xWvuGbaDCS9jj9H139Y';

async function switchYear(id) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'changeServiceYear', spreadsheetId: id })
  });
  return await res.json();
}

async function fetchJson(url) {
  const res = await fetch(url);
  return await res.json();
}

async function run() {
  console.log('=== [1] 2025 봉사연도(2024-2025)로 전환 확인 ===');
  await switchYear(SPREADSHEET_2025);

  console.log('=== [2] 2024-2025 전체 전도인 명단 조회 ===');
  const allMembers = await fetchJson(`${APPS_SCRIPT_URL}?action=getAllMembers&email=${encodeURIComponent(ADMIN_EMAIL)}`);
  console.log(`2024-2025 전도인 수: ${allMembers.length}명`);

  console.log('=== [3] 2024-2025 12개월 마감 상태 조회 ===');
  const monthlyStatuses = {};
  for (const m of MONTHS) {
    try {
      const st = await fetchJson(`${APPS_SCRIPT_URL}?action=checkStatus&month=${encodeURIComponent(m)}`);
      monthlyStatuses[m] = !!st.isClosed;
    } catch {
      monthlyStatuses[m] = true;
    }
  }
  console.log('2024-2025 마감 상태:', monthlyStatuses);

  console.log('=== [4] 2024-2025 12개월 월별 보고서 수집 ===');
  const reportsByMonth = {};
  let count = 0;
  for (const m of MONTHS) {
    try {
      const reps = await fetchJson(`${APPS_SCRIPT_URL}?action=monthlyDetail&month=${encodeURIComponent(m)}&email=${encodeURIComponent(ADMIN_EMAIL)}`);
      reportsByMonth[m] = Array.isArray(reps) ? reps : [];
      count += reportsByMonth[m].length;
      console.log(`2024-2025 [${m}]: ${reportsByMonth[m].length}건`);
    } catch (e) {
      console.error(`2024-2025 [${m}] 실패:`, e.message);
      reportsByMonth[m] = [];
    }
  }
  console.log(`2024-2025 총 ${count}건 수집 완료`);

  // 2026 연도로 다시 원복
  console.log('=== [5] 2026 봉사연도로 스프레드시트 원복 ===');
  await switchYear(SPREADSHEET_2026);

  const data2025 = {
    yearName: '2024-2025',
    serviceYearId: 'a0000000-0000-0000-0000-000000002025',
    members: allMembers,
    monthlyStatuses,
    reportsByMonth
  };

  const outPath = path.join(__dirname, '..', 'src', 'data', 'data2025.json');
  fs.writeFileSync(outPath, JSON.stringify(data2025, null, 2), 'utf-8');
  console.log(`✅ 2024-2025 데이터 저장 완료: ${outPath}`);
}

run().catch(console.error);
