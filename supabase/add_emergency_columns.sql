-- =============================================================
-- 전도인 테이블(publishers) 비상연락처 및 주소, 관계 확장 컬럼 추가 SQL
-- Supabase SQL Editor에서 실행하시면 즉시 반영됩니다.
-- =============================================================

-- 1. 신규 컬럼 추가
ALTER TABLE public.publishers ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.publishers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.publishers ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(50);
ALTER TABLE public.publishers ADD COLUMN IF NOT EXISTS relationship VARCHAR(50);
ALTER TABLE public.publishers ADD COLUMN IF NOT EXISTS family_head VARCHAR(50);
ALTER TABLE public.publishers ADD COLUMN IF NOT EXISTS special_notes TEXT;
ALTER TABLE public.publishers ADD COLUMN IF NOT EXISTS deactivated_reason TEXT;
ALTER TABLE public.publishers ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- 월별 보고서 테이블에도 월별 파이오니아 상태(AP/RP/일반) 컬럼 보장
ALTER TABLE public.monthly_reports ADD COLUMN IF NOT EXISTS pioneer_status VARCHAR(20);

-- 2. 직책 및 구분 제약 조건 완화 ('자녀' 포함 허용)
ALTER TABLE public.publishers DROP CONSTRAINT IF EXISTS publishers_position_check;
ALTER TABLE public.publishers ADD CONSTRAINT publishers_position_check 
  CHECK (position IN ('장로', '봉사의 종', '봉종', '전도인', '미침', '일반'));

ALTER TABLE public.publishers DROP CONSTRAINT IF EXISTS publishers_pioneer_status_check;
ALTER TABLE public.publishers ADD CONSTRAINT publishers_pioneer_status_check 
  CHECK (pioneer_status IN ('일반', 'RP', 'AP', 'SP', 'FM', '자녀', '자녀 (집계 제외)', ''));

-- 3. 스키마 캐시 리로드
NOTIFY pgrst, 'reload schema';
