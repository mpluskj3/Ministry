import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { YearlyPublisherRecord, SERVICE_MONTHS } from '../types/database';

let cachedTemplate: Uint8Array | null = null;
let cachedFontBytes: Uint8Array | null = null;
let cachedCoordinates: any | null = null;

export async function loadPdfAssets(): Promise<{
  templateBytes: Uint8Array;
  fontBytes: Uint8Array;
  coordinates: any;
}> {
  if (cachedTemplate && cachedFontBytes && cachedCoordinates) {
    return {
      templateBytes: cachedTemplate,
      fontBytes: cachedFontBytes,
      coordinates: cachedCoordinates,
    };
  }

  const [templateRes, fontRes, coordRes] = await Promise.all([
    fetch('/S-21_KO.pdf'),
    fetch('/GowunDodum-Regular.ttf'),
    fetch('/pdf-coordinates.json'),
  ]);

  cachedTemplate = new Uint8Array(await templateRes.arrayBuffer());
  cachedFontBytes = new Uint8Array(await fontRes.arrayBuffer());
  cachedCoordinates = await coordRes.json();

  return {
    templateBytes: cachedTemplate,
    fontBytes: cachedFontBytes,
    coordinates: cachedCoordinates,
  };
}

export async function generatePublisherCardPdf(
  yearlyData: YearlyPublisherRecord,
  serviceYearName: string
): Promise<Uint8Array> {
  const { templateBytes, fontBytes } = await loadPdfAssets();

  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);
  const font = await pdfDoc.embedFont(fontBytes);

  const form = pdfDoc.getForm();
  form.deleteXFA();

  const userInfo = yearlyData.userInfo;

  // 1. 기본 인적사항 텍스트 필드
  const setTextFieldSafe = (name: string, value: string, size = 11) => {
    try {
      const field = form.getTextField(name);
      if (field) {
        field.setText(value || '');
        field.setFontSize(size);
        field.updateAppearances(font);
      }
    } catch {
      // 필드가 없는 경우 패스
    }
  };

  setTextFieldSafe('성명', userInfo.name, 12);
  setTextFieldSafe('생년월일', userInfo.birthDate);
  setTextFieldSafe('침례 일자', userInfo.baptismDate);
  const yearStr = serviceYearName.match(/\d{4}/)?.[0] || serviceYearName;
  setTextFieldSafe('봉사 연도', yearStr);

  // 2. 체크박스 필드 매핑
  const setCheckSafe = (name: string, checked: boolean) => {
    try {
      const field = form.getCheckBox(name);
      if (field) {
        if (checked) field.check();
        else field.uncheck();
      }
    } catch {
      // ignore
    }
  };

  setCheckSafe('남', userInfo.gender === '남');
  setCheckSafe('여', userInfo.gender === '여');
  setCheckSafe('다른 양', userInfo.hope === '다른 양');
  setCheckSafe('기름부음받은 자', userInfo.hope === '기름부음받은 자');
  setCheckSafe('장로', userInfo.isElder);
  setCheckSafe('봉사의 종', userInfo.isMinisterialServant);
  setCheckSafe('정규 파이오니아', userInfo.isRegularPioneer);
  setCheckSafe('특별 파이오니아', userInfo.isSpecialPioneer);
  setCheckSafe('야외 선교인', userInfo.isMissionary);

  // 3. 12개월 월별 데이터 매핑 (9월부터 8월)
  yearlyData.monthlyRecords.forEach((record, index) => {
    const mName = SERVICE_MONTHS[index]; // '9월', '10월', ...

    // 봉사에 참여했음 체크박스 (정확한 PDF 필드명 매핑)
    if (record.participated) {
      setCheckSafe(`${mName} 봉사에 참여했음`, true);
    }

    // 성서연구 수
    if (record.bibleStudies > 0) {
      setTextFieldSafe(`${mName} 성서 연구`, String(record.bibleStudies));
    }

    // 봉사 시간
    if (record.hours > 0) {
      setTextFieldSafe(`${mName} 시간`, String(record.hours));
    }

    // 보조 파이오니아
    if (record.division === 'AP' || record.division === '보조 파이오니아' || record.remarks?.includes('보조')) {
      setCheckSafe(`${mName} 보조 파이오니아`, true);
    }

    // 비고
    if (record.remarks) {
      setTextFieldSafe(`${mName} 비고`, record.remarks, 9);
    }
  });

  // 4. 합계 및 비고 합계
  if (yearlyData.totals.totalHours > 0) {
    setTextFieldSafe('총계 시간', String(yearlyData.totals.totalHours));
  }

  // 비고 열 시간(?시간) 합계
  const totalRemarkHours = yearlyData.monthlyRecords.reduce((acc, m) => {
    if (!m.remarks) return acc;
    const matches = m.remarks.match(/(\d+(?:\.\d+)?)\s*시간/g);
    if (matches) {
      matches.forEach(match => {
        const num = parseFloat(match.replace(/[^0-9.]/g, ''));
        if (!isNaN(num)) acc += num;
      });
    }
    return acc;
  }, 0);

  if (totalRemarkHours > 0) {
    setTextFieldSafe('총계 비고', `${totalRemarkHours}시간`);
  }

  // 폼 필드 플래트닝 (인쇄 및 저장 최적화)
  try {
    form.flatten();
  } catch {
    // ignore
  }

  return await pdfDoc.save();
}

export function downloadPdfBlob(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
