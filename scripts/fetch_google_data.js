const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxUSlqPLNeIANcSIsy9dDv4ObHNdD_V2wvbf20CrYHvnr58iu3j6WKVlQFsyq2KS4c/exec';

async function fetchAll() {
  try {
    console.log('Fetching Service Years...');
    const syRes = await fetch(`${APPS_SCRIPT_URL}?action=getServiceYears`);
    const sy = await syRes.json();
    console.log('Service Years:', JSON.stringify(sy, null, 2));

    console.log('\nFetching All Members...');
    const memRes = await fetch(`${APPS_SCRIPT_URL}?action=getAllMembers&email=admin@example.com`);
    const members = await memRes.json();
    console.log(`Members count: ${members.length}`);
    if (members.length > 0) {
      console.log('Sample member:', JSON.stringify(members[0], null, 2));
    }

    console.log('\nFetching Aggregate Data...');
    const aggRes = await fetch(`${APPS_SCRIPT_URL}?action=aggregateData&email=admin@example.com`);
    const agg = await aggRes.json();
    console.log('Aggregate data reports count:', agg.reports?.length);

    console.log('\nFetching Monthly Details for 9월 ~ 8월...');
    const months = ['9월', '10월', '11월', '12월', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월'];
    const monthDetails = {};
    for (const m of months) {
      const detailRes = await fetch(`${APPS_SCRIPT_URL}?action=monthlyDetail&month=${encodeURIComponent(m)}&email=admin@example.com`);
      const detail = await detailRes.json();
      monthDetails[m] = Array.isArray(detail) ? detail : [];
      console.log(`${m}: ${monthDetails[m].length} reports`);
    }

  } catch (err) {
    console.error('Error fetching data:', err);
  }
}

fetchAll();
