import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import JSZip from 'jszip';
import { YearlyPublisherRecord, SERVICE_MONTHS, ServiceMonth } from '../types/database';

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

    // 봉사에 참여했음 체크박스 (참여하지 않은 경우 명시적 언체크)
    setCheckSafe(`${mName} 봉사에 참여했음`, !!record.participated);

    // 성서연구 수 (0이면 빈 칸)
    setTextFieldSafe(`${mName} 성서 연구`, record.bibleStudies > 0 ? String(record.bibleStudies) : '');

    // 봉사 시간 (0이면 빈 칸으로 명시적 초기화하여 템플릿 기본값 방지)
    setTextFieldSafe(`${mName} 시간`, record.hours > 0 ? String(record.hours) : '');

    // 보조 파이오니아
    const isAp = record.division === 'AP' || record.division === '보조 파이오니아' || !!record.remarks?.includes('보조');
    setCheckSafe(`${mName} 보조 파이오니아`, isAp);

    // 비고
    setTextFieldSafe(`${mName} 비고`, record.remarks || '', 9);
  });

  // 4. 합계 및 비고 합계
  setTextFieldSafe('총계 시간', yearlyData.totals.totalHours > 0 ? String(yearlyData.totals.totalHours) : '');

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

  setTextFieldSafe('총계 비고', totalRemarkHours > 0 ? `${totalRemarkHours}시간` : '');

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
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * 여러 전도인의 S-21 기록 카드를 단일 다중 페이지 PDF 문서로 병합 생성
 */
export async function generateMergedPublisherCardsPdf(
  records: YearlyPublisherRecord[],
  serviceYearName: string,
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (onProgress) {
      onProgress(i + 1, records.length);
    }
    const singlePdfBytes = await generatePublisherCardPdf(record, serviceYearName);
    const singleDoc = await PDFDocument.load(singlePdfBytes);
    const copiedPages = await mergedPdf.copyPages(singleDoc, singleDoc.getPageIndices());
    copiedPages.forEach(page => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * 브라우저 시스템 인쇄 대화상자를 호출하여 PDF를 직접 인쇄
 */
export async function printPdfBlob(bytes: Uint8Array): Promise<void> {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  // iframe을 통한 직접 인쇄 시도
  let iframe: HTMLIFrameElement | null = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl;

  document.body.appendChild(iframe);

  return new Promise<void>((resolve) => {
    const cleanup = () => {
      setTimeout(() => {
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
          iframe = null;
        }
        URL.revokeObjectURL(blobUrl);
        resolve();
      }, 3000);
    };

    iframe!.onload = () => {
      try {
        iframe?.contentWindow?.focus();
        iframe?.contentWindow?.print();
        cleanup();
      } catch (e) {
        console.warn('iframe 인쇄 실패, 새 탭 인쇄로 폴백:', e);
        // iframe 인쇄 실패 시 새 창 폴백
        const printWindow = window.open(blobUrl, '_blank');
        if (printWindow) {
          printWindow.focus();
        }
        cleanup();
      }
    };
  });
}

/**
 * 각 전도인별로 개별 PDF 파일을 생성하고 이를 단일 ZIP 파일로 압축하여 반환
 */
export async function generateIndividualPublisherCardsZip(
  records: YearlyPublisherRecord[],
  serviceYearName: string,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const yearStr = serviceYearName.match(/\d{4}/)?.[0] || serviceYearName;
  const usedFileNames = new Set<string>();

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (onProgress) {
      onProgress(i + 1, records.length);
    }
    const singlePdfBytes = await generatePublisherCardPdf(record, serviceYearName);
    
    // 파일명 중복 방지 (동명이인 등)
    let safeName = record.userInfo.name || `전도인_${i + 1}`;
    let fileName = `S-21_${yearStr}연도_${safeName}.pdf`;
    let counter = 1;
    while (usedFileNames.has(fileName)) {
      fileName = `S-21_${yearStr}연도_${safeName}_${counter}.pdf`;
      counter++;
    }
    usedFileNames.add(fileName);

    zip.file(fileName, singlePdfBytes);
  }

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
}

/**
 * S-21 PDF 파일에서 전도인 정보 및 12개월 봉사 보고 기록을 추출하는 파서
 */
export interface ParsedS21CardData {
  name: string;
  birthDate: string;
  baptismDate: string;
  gender: '남' | '여';
  hope: '다른 양' | '기름부음받은 자';
  position: '장로' | '봉사의 종' | '일반';
  pioneerStatus: '일반' | 'RP' | 'SP' | 'FM';
  serviceYearName?: string;
  monthlyRecords: Array<{
    month: ServiceMonth;
    participated: boolean;
    bibleStudies: number;
    hours: number;
    isAuxiliaryPioneer: boolean;
    remarks: string;
  }>;
}

function decodePdfFormString(obj: any): string {
  if (!obj) return '';
  let str = '';
  if (typeof obj.value === 'string') str = obj.value;
  else if (typeof obj.asString === 'function') str = obj.asString();
  else str = obj.toString();

  // UTF-16BE BOM 체크 (þÿ 또는 \xfe\xff)
  if (str.startsWith('\xfe\xff') || str.startsWith('þÿ') || str.charCodeAt(0) === 0xfeff) {
    try {
      let decoded = '';
      // 2바이트씩 유니코드 변환
      const startIdx = (str.startsWith('\xfe\xff') || str.startsWith('þÿ')) ? 2 : 1;
      for (let i = startIdx; i < str.length - 1; i += 2) {
        const code = (str.charCodeAt(i) << 8) | str.charCodeAt(i + 1);
        if (code !== 0) decoded += String.fromCharCode(code);
      }
      if (decoded.trim()) return decoded.trim();
    } catch {
      // fallback
    }
  }
  return str.replace(/^\uFEFF/, '').trim();
}

export async function parseS21Pdf(pdfBytes: Uint8Array): Promise<ParsedS21CardData> {
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // 날짜 문자열 YYYY-MM-DD 정규화
  const normalizeDate = (raw: string): string => {
    if (!raw) return '';
    const m = raw.match(/(\d{4})\D*(\d{1,2})\D*(\d{1,2})/);
    if (m) {
      return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    }
    return raw;
  };

  // 1. 페이지의 Annots(주석 위젯)에서 공식 S-21 필드 파싱 시도
  let parsedFromAnnots: ParsedS21CardData | null = null;
  try {
    const page = pdfDoc.getPage(0);
    const annots = page.node.Annots();
    if (annots && annots.size() > 0) {
      const count = annots.size();
      const fields: Record<string, { v: string; as: string; tu: string }> = {};

      for (let i = 0; i < count; i++) {
        const annot: any = annots.lookup(i);
        if (!annot || !annot.dict) continue;

        let t = '';
        let tu = '';
        let v = '';
        let as = '';

        for (const [keyName, valObj] of annot.dict.entries()) {
          const k = String(keyName.encodedName || keyName.value || keyName);
          if (k === '/T' || k === 'T') t = decodePdfFormString(valObj);
          else if (k === '/TU' || k === 'TU') tu = decodePdfFormString(valObj);
          else if (k === '/V' || k === 'V') v = decodePdfFormString(valObj);
          else if (k === '/AS' || k === 'AS') as = decodePdfFormString(valObj);
        }
        if (t) {
          fields[t] = { v, as, tu };
        }
      }

      // 인적사항 추출
      const name = fields['900_1_Text_SanSerif']?.v || fields['성명']?.v || '';
      const birthDate = normalizeDate(fields['900_2_Text_SanSerif']?.v || fields['생년월일']?.v || '');
      const isFemale = fields['900_4_CheckBox']?.as === '/Yes' || fields['여']?.as === '/Yes';
      const gender: '남' | '여' = isFemale ? '여' : '남';
      const baptismDate = normalizeDate(fields['900_5_Text_SanSerif']?.v || fields['침례 일자']?.v || fields['침례일자']?.v || '');
      const isOtherSheep = fields['900_6_CheckBox']?.as === '/Yes' || fields['다른 양']?.as === '/Yes';
      const hope: '다른 양' | '기름부음받은 자' = isOtherSheep ? '다른 양' : '기름부음받은 자';

      let position: '장로' | '봉사의 종' | '일반' = '일반';
      if (fields['900_8_CheckBox']?.as === '/Yes' || fields['장로']?.as === '/Yes') position = '장로';
      else if (fields['900_9_CheckBox']?.as === '/Yes' || fields['봉사의 종']?.as === '/Yes') position = '봉사의 종';

      let pioneerStatus: '일반' | 'RP' | 'SP' | 'FM' = '일반';
      if (fields['900_10_CheckBox']?.as === '/Yes' || fields['정규 파이오니아']?.as === '/Yes') pioneerStatus = 'RP';
      else if (fields['900_11_CheckBox']?.as === '/Yes' || fields['특별 파이오니아']?.as === '/Yes') pioneerStatus = 'SP';
      else if (fields['900_12_CheckBox']?.as === '/Yes' || fields['야외 선교인']?.as === '/Yes') pioneerStatus = 'FM';

      const serviceYearName = fields['900_13_Text_C_SanSerif']?.v || fields['봉사 연도']?.v || '';

      // 12개월 실적 매핑 (index 20: 9월 ~ index 31: 8월)
      const monthlyRecords = SERVICE_MONTHS.map((m, idx) => {
        const rowIdx = 20 + idx;
        const partField = fields[`901_${rowIdx}_CheckBox`] || fields[`${m} 봉사에 참여했음`];
        const studiesStr = fields[`902_${rowIdx}_Text_C_SanSerif`]?.v || fields[`${m} 성서 연구`]?.v || fields[`${m} 성서연구`]?.v || '';
        const apField = fields[`903_${rowIdx}_CheckBox`] || fields[`${m} 보조 파이오니아`] || fields[`${m} 보조파이오니아`];
        const isAuxiliaryPioneer = apField?.as === '/Yes' || apField?.v === '/Yes';
        const hoursStr = fields[`904_${rowIdx}_S21_Value`]?.v || fields[`${m} 시간`]?.v || '';
        const remarks = fields[`905_${rowIdx}_Text_SanSerif`]?.v || fields[`${m} 비고`]?.v || '';

        const hours = parseFloat(hoursStr.replace(/[^0-9.]/g, '')) || 0;
        const bibleStudies = parseInt(studiesStr.replace(/[^0-9]/g, ''), 10) || 0;

        // 사용자의 비즈니스 룰:
        // 1) 시간이 입력된 경우 참여에 체크 (hours > 0)
        // 2) 시간이 없거나 0인 경우: 명시적으로 /Yes 체크된 경우에만 참여 체크 (/0, /Off 등은 비체크로 판정)
        const isExplicitlyChecked = partField?.as === '/Yes' || partField?.v === '/Yes' || partField?.as === 'Yes' || partField?.v === 'Yes';
        const participated = hours > 0 || isExplicitlyChecked;

        return {
          month: m,
          participated,
          bibleStudies,
          hours,
          isAuxiliaryPioneer,
          remarks,
        };
      });

      if (name || birthDate || baptismDate || monthlyRecords.some(r => r.participated || r.hours > 0)) {
        parsedFromAnnots = {
          name,
          birthDate,
          baptismDate,
          gender,
          hope,
          position,
          pioneerStatus,
          serviceYearName,
          monthlyRecords,
        };
      }
    }
  } catch (err) {
    console.warn('Annots 파싱 중 예외 발생:', err);
  }

  if (parsedFromAnnots) {
    return parsedFromAnnots;
  }

  // 2. Fallback: pdfDoc.getForm() 폼 필드 조회
  const form = pdfDoc.getForm();

  const getTextField = (name: string): string => {
    try {
      const field = form.getTextField(name);
      return (field.getText() || '').trim();
    } catch {
      return '';
    }
  };

  const getCheckBox = (name: string): boolean => {
    try {
      const field = form.getCheckBox(name);
      return field.isChecked();
    } catch {
      return false;
    }
  };

  const name = getTextField('성명');
  const birthDate = normalizeDate(getTextField('생년월일'));
  const baptismDate = normalizeDate(getTextField('침례 일자') || getTextField('침례일자'));
  const serviceYearName = getTextField('봉사 연도') || getTextField('봉사연도');

  const isFemale = getCheckBox('여');
  const gender: '남' | '여' = isFemale ? '여' : '남';

  const isAnointed = getCheckBox('기름부음받은 자');
  const hope: '다른 양' | '기름부음받은 자' = isAnointed ? '기름부음받은 자' : '다른 양';

  let position: '장로' | '봉사의 종' | '일반' = '일반';
  if (getCheckBox('장로')) position = '장로';
  else if (getCheckBox('봉사의 종')) position = '봉사의 종';

  let pioneerStatus: '일반' | 'RP' | 'SP' | 'FM' = '일반';
  if (getCheckBox('정규 파이오니아')) pioneerStatus = 'RP';
  else if (getCheckBox('특별 파이오니아')) pioneerStatus = 'SP';
  else if (getCheckBox('야외 선교인')) pioneerStatus = 'FM';

  const monthlyRecords = SERVICE_MONTHS.map(month => {
    const participated = getCheckBox(`${month} 봉사에 참여했음`);
    const hoursStr = getTextField(`${month} 시간`);
    const studiesStr = getTextField(`${month} 성서 연구`) || getTextField(`${month} 성서연구`);
    const isAuxiliaryPioneer = getCheckBox(`${month} 보조 파이오니아`) || getCheckBox(`${month} 보조파이오니아`);
    const remarks = getTextField(`${month} 비고`);

    const hours = parseFloat(hoursStr.replace(/[^0-9.]/g, '')) || 0;
    const bibleStudies = parseInt(studiesStr.replace(/[^0-9]/g, ''), 10) || 0;

    return {
      month,
      participated: participated || hours > 0,
      bibleStudies,
      hours,
      isAuxiliaryPioneer,
      remarks,
    };
  });

  return {
    name,
    birthDate,
    baptismDate,
    gender,
    hope,
    position,
    pioneerStatus,
    serviceYearName,
    monthlyRecords,
  };
}

/**
 * 범용 파일 다운로드 헬퍼
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}




