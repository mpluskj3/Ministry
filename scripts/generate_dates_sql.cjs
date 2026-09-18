const fs = require('fs');
const path = require('path');

const actualDataPath = path.join(__dirname, '..', 'src', 'data', 'actualData.json');
const actualData = JSON.parse(fs.readFileSync(actualDataPath, 'utf8'));

let sql = '-- ==============================================================================\n';
sql += '-- 춘천남부 전체 90명 전도인 생년월일, 침례일자, 성별, 희망 일괄 업데이트 SQL\n';
sql += '-- ==============================================================================\n\n';

actualData.publishers.forEach(p => {
  const bDate = p.birth_date ? `'${p.birth_date}'` : 'NULL';
  const bpDate = p.baptism_date ? `'${p.baptism_date}'` : 'NULL';
  const g = p.gender ? `'${p.gender}'` : `'남'`;
  const h = p.hope ? `'${p.hope}'` : `'다른 양'`;
  const escapedName = p.name.replace(/'/g, "''");
  
  sql += `UPDATE public.publishers SET birth_date = ${bDate}, baptism_date = ${bpDate}, gender = ${g}, hope = ${h} WHERE name = '${escapedName}';\n`;
});

const outPath = path.join(__dirname, '..', 'supabase', 'update_publishers_dates.sql');
fs.writeFileSync(outPath, sql, 'utf8');
console.log('Generated ' + outPath + ' successfully!');
