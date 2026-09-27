/**
 * 두벌식 영문 자판 입력을 한글로 자동 변환하는 오토마타 함수
 */

const ENG_KEY: Record<string, string> = {
  q: 'ㅂ', Q: 'ㅃ', w: 'ㅈ', W: 'ㅉ', e: 'ㄷ', E: 'ㄸ', r: 'ㄱ', R: 'ㄲ', t: 'ㅅ', T: 'ㅆ',
  y: 'ㅛ', Y: 'ㅛ', u: 'ㅕ', U: 'ㅕ', i: 'ㅑ', I: 'ㅑ', o: 'ㅐ', O: 'ㅒ', p: 'ㅔ', P: 'ㅖ',
  a: 'ㅁ', A: 'ㅁ', s: 'ㄴ', S: 'ㄴ', d: 'ㅇ', D: 'ㅇ', f: 'ㄹ', F: 'ㄹ', g: 'ㅎ', G: 'ㅎ',
  h: 'ㅗ', H: 'ㅗ', j: 'ㅓ', J: 'ㅓ', k: 'ㅏ', K: 'ㅏ', l: 'ㅣ', L: 'ㅣ',
  z: 'ㅋ', Z: 'ㅋ', x: 'ㅌ', X: 'ㅌ', c: 'ㅊ', C: 'ㅊ', v: 'ㅍ', V: 'ㅍ', b: 'ㅠ', B: 'ㅠ',
  n: 'ㅜ', N: 'ㅜ', m: 'ㅡ', M: 'ㅡ'
};

const CHO = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

const JUNG = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];

const JONG = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// 복합 모음 결합 테이블
const COMBINED_VOWELS: Record<string, string> = {
  'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ',
  'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ',
  'ㅡㅣ': 'ㅢ'
};

// 복합 종성 결합 테이블
const COMBINED_FINALS: Record<string, string> = {
  'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ',
  'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ',
  'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ'
};

// 복합 모음 분해 테이블
const DECOMPOSED_JUNG: Record<string, string[]> = {
  'ㅘ': ['ㅗ', 'ㅏ'],
  'ㅙ': ['ㅗ', 'ㅐ'],
  'ㅚ': ['ㅗ', 'ㅣ'],
  'ㅝ': ['ㅜ', 'ㅓ'],
  'ㅞ': ['ㅜ', 'ㅔ'],
  'ㅟ': ['ㅜ', 'ㅣ'],
  'ㅢ': ['ㅡ', 'ㅣ'],
};

// 복합 종성 분해 테이블
const DECOMPOSED_JONG: Record<string, string[]> = {
  'ㄳ': ['ㄱ', 'ㅅ'],
  'ㄵ': ['ㄴ', 'ㅈ'],
  'ㄶ': ['ㄴ', 'ㅎ'],
  'ㄺ': ['ㄹ', 'ㄱ'],
  'ㄻ': ['ㄹ', 'ㅁ'],
  'ㄼ': ['ㄹ', 'ㅂ'],
  'ㄽ': ['ㄹ', 'ㅅ'],
  'ㄾ': ['ㄹ', 'ㅌ'],
  'ㄿ': ['ㄹ', 'ㅍ'],
  'ㅀ': ['ㄹ', 'ㅎ'],
  'ㅄ': ['ㅂ', 'ㅅ'],
};

const isConsonant = (c: string) => CHO.includes(c) || ['ㄳ', 'ㄵ', 'ㄶ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅄ'].includes(c);
const isVowel = (c: string) => JUNG.includes(c);

function makeHangul(cho: string, jung: string, jong: string = ''): string {
  const choIdx = CHO.indexOf(cho);
  const jungIdx = JUNG.indexOf(jung);
  const jongIdx = JONG.indexOf(jong);
  if (choIdx === -1 || jungIdx === -1 || jongIdx === -1) {
    return (cho || '') + (jung || '') + (jong || '');
  }
  return String.fromCharCode(0xac00 + (choIdx * 21 + jungIdx) * 28 + jongIdx);
}

/**
 * 한 글자를 자모 단위로 분해
 */
export function decomposeHangulChar(char: string): string[] {
  const code = char.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const syllableIndex = code - 0xac00;
    const choIdx = Math.floor(syllableIndex / 588);
    const jungIdx = Math.floor((syllableIndex % 588) / 28);
    const jongIdx = syllableIndex % 28;

    const cho = CHO[choIdx];
    const jung = JUNG[jungIdx];
    const jong = JONG[jongIdx];

    const result = [cho];
    if (DECOMPOSED_JUNG[jung]) {
      result.push(...DECOMPOSED_JUNG[jung]);
    } else {
      result.push(jung);
    }

    if (jong) {
      if (DECOMPOSED_JONG[jong]) {
        result.push(...DECOMPOSED_JONG[jong]);
      } else {
        result.push(jong);
      }
    }
    return result;
  }

  if (DECOMPOSED_JUNG[char]) return DECOMPOSED_JUNG[char];
  if (DECOMPOSED_JONG[char]) return DECOMPOSED_JONG[char];

  return [char];
}

/**
 * 자모 배열을 한글 음절로 조합하는 오토마타 함수
 */
export function assembleHangul(jamoList: string[]): string {
  let result = '';
  let i = 0;
  while (i < jamoList.length) {
    const curr = jamoList[i];

    // 초성이 될 수 있는 자음인지 확인
    if (CHO.includes(curr)) {
      const cho = curr;
      const next1 = jamoList[i + 1];

      // 다음 글자가 모음인 경우 -> 음절 형성 시작
      if (next1 && isVowel(next1)) {
        let jung = next1;
        i += 2;

        // 복합 모음 검사 (예: ㅗ + ㅏ = ㅘ)
        const next2 = jamoList[i];
        if (next2 && isVowel(next2) && COMBINED_VOWELS[jung + next2]) {
          jung = COMBINED_VOWELS[jung + next2];
          i++;
        }

        // 종성 검사
        const next3 = jamoList[i];
        const next4 = jamoList[i + 1];

        // 종성 후보가 자음이고, 그 다음 글자가 모음이 아니면 종성 결합
        if (next3 && isConsonant(next3)) {
          // next4가 모음이면 next3은 다음 글자의 초성으로 넘어가야 함
          if (next4 && isVowel(next4)) {
            result += makeHangul(cho, jung);
            continue;
          }

          // 복합 종성 검사 (예: ㄹ + ㄱ)
          const next5 = jamoList[i + 2];
          if (next4 && isConsonant(next4) && COMBINED_FINALS[next3 + next4]) {
            if (next5 && isVowel(next5)) {
              if (JONG.includes(next3)) {
                result += makeHangul(cho, jung, next3);
                i++;
                continue;
              }
            } else {
              const compJong = COMBINED_FINALS[next3 + next4];
              result += makeHangul(cho, jung, compJong);
              i += 2;
              continue;
            }
          }

          // 단일 종성 검사
          if (JONG.includes(next3)) {
            result += makeHangul(cho, jung, next3);
            i++;
            continue;
          }
        }

        // 종성 없이 완료
        result += makeHangul(cho, jung);
        continue;
      } else {
        // 모음이 뒤따르지 않는 자음 (단독 자음)
        result += curr;
        i++;
        continue;
      }
    } else {
      // 모음 단독이거나 기타 문자
      result += curr;
      i++;
    }
  }

  return result;
}

/**
 * 한글, 자모, 영문 알파벳이 혼합된 텍스트를 두벌식 자모로 분해 후
 * 한글 오토마타로 온전하게 재조합하는 함수.
 * 영문 키보드 모드에서 타이핑할 때 실시간으로 한글로 자동 변환.
 */
export function convertMixedToKor(input: string): string {
  if (!input) return '';
  if (!/[a-zA-Z]/.test(input)) return input;

  const jamoList: string[] = [];
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ENG_KEY[ch]) {
      jamoList.push(ENG_KEY[ch]);
    } else {
      jamoList.push(...decomposeHangulChar(ch));
    }
  }

  return assembleHangul(jamoList);
}

/**
 * 영문 문자열을 한글 음절로 변환 (혼합 문자열도 지원)
 */
export function engToKor(input: string): string {
  return convertMixedToKor(input);
}
