-- ==============================================================================
-- 전입 전도인 및 봉사 보고서 확장 컬럼 추가 마이그레이션
-- Supabase 대시보드 → SQL Editor 에서 실행하세요.
-- (IF NOT EXISTS 구문으로 이미 추가된 컬럼은 안전하게 건너뜁니다)
-- ==============================================================================

-- 1. publishers (전도인 명단) 테이블에 전입 정보 컬럼 추가
ALTER TABLE public.publishers ADD COLUMN IF NOT EXISTS transfer_date DATE;
ALTER TABLE public.publishers ADD COLUMN IF NOT EXISTS transfer_month VARCHAR(10);
ALTER TABLE public.publishers ADD COLUMN IF NOT EXISTS prev_congregation VARCHAR(100);

-- 2. monthly_reports (월별 보고서) 테이블에 전입 실적 및 파이오니아 상태 컬럼 추가
ALTER TABLE public.monthly_reports ADD COLUMN IF NOT EXISTS is_transferred BOOLEAN DEFAULT false;
ALTER TABLE public.monthly_reports ADD COLUMN IF NOT EXISTS transferred_from VARCHAR(100);
ALTER TABLE public.monthly_reports ADD COLUMN IF NOT EXISTS pioneer_status VARCHAR(30) DEFAULT '일반';

-- 3. 인덱스 생성 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_monthly_reports_transferred ON public.monthly_reports(is_transferred);
CREATE INDEX IF NOT EXISTS idx_publishers_transfer_date ON public.publishers(transfer_date);

-- 4. 확인: 정상 추가된 컬럼 목록 조회
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('publishers', 'monthly_reports') 
  AND column_name IN ('transfer_date', 'transfer_month', 'prev_congregation', 'is_transferred', 'transferred_from', 'pioneer_status')
ORDER BY table_name, ordinal_position;
