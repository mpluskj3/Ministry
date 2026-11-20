/**
 * 한국 전화번호 자동 하이픈(-) 포맷팅 함수
 * 사용자가 '-'를 입력하지 않더라도 숫자에 맞춰 자동으로 '-'를 붙여줍니다.
 * 
 * - 휴대폰: 010-1234-5678 (11자리), 011-123-4567 (10자리)
 * - 서울 지역번호: 02-123-4567 (9자리), 02-1234-5678 (10자리)
 * - 시도 지역번호: 031-123-4567 (10자리), 031-1234-5678 (11자리)
 * - 안심번호: 0505-1234-5678 (12자리)
 * - 대표번호: 1588-1234 (8자리)
 */
export function formatPhoneNumber(value: string | null | undefined): string {
  if (!value) return '';
  // 숫자만 추출
  const clean = value.replace(/[^0-9]/g, '');
  if (!clean) return '';

  // 1) 서울 지역번호 (02)
  if (clean.startsWith('02')) {
    if (clean.length <= 2) return clean;
    if (clean.length <= 5) {
      return `${clean.slice(0, 2)}-${clean.slice(2)}`;
    }
    if (clean.length <= 9) {
      return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5)}`;
    }
    return `${clean.slice(0, 2)}-${clean.slice(2, 6)}-${clean.slice(6, 10)}`;
  }

  // 2) 4자리 전국대표번호 (15xx, 16xx, 18xx 등)
  if (!clean.startsWith('0') && clean.length <= 8) {
    if (clean.length <= 4) return clean;
    return `${clean.slice(0, 4)}-${clean.slice(4, 8)}`;
  }

  // 3) 안심번호 050 계열 (11~12자리)
  if (clean.startsWith('050') && clean.length >= 11) {
    if (clean.length <= 4) return clean;
    if (clean.length <= 8) {
      return `${clean.slice(0, 4)}-${clean.slice(4)}`;
    }
    return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`;
  }

  // 4) 일반 휴대폰(010, 011 등) 및 3자리 지역번호(031, 033 등)
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  if (clean.length <= 10) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`;
}
