import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 기본 환경변수 또는 localStorage에서 Supabase 설정 로드
const STORAGE_KEY_URL = 'ministry_supabase_url';
const STORAGE_KEY_KEY = 'ministry_supabase_anon_key';

export function getStoredSupabaseConfig() {
  const url = localStorage.getItem(STORAGE_KEY_URL) || (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const anonKey = localStorage.getItem(STORAGE_KEY_KEY) || (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
  return { url, anonKey };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string) {
  if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
  else localStorage.removeItem(STORAGE_KEY_URL);

  if (anonKey) localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  else localStorage.removeItem(STORAGE_KEY_KEY);

  // 클라이언트 재생성을 위해 리로드 트리거 또는 인스턴스 갱신
  cachedClient = null;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const { url, anonKey } = getStoredSupabaseConfig();
  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return cachedClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

// Supabase 연결 유효성 테스트
export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url || !anonKey) {
      return { success: false, message: 'URL과 Anon Key를 모두 입력해주세요.' };
    }
    const testClient = createClient(url, anonKey);
    const { error } = await testClient.from('service_years').select('id').limit(1);

    if (error) {
      return { success: false, message: `연결 실패: ${error.message}` };
    }
    return { success: true, message: 'Supabase DB에 성공적으로 연결되었습니다!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '알 수 없는 네트워크 오류';
    return { success: false, message: `연결 테스트 중 오류 발생: ${msg}` };
  }
}
