-- ============================================================
-- Supabase publishers 테이블 확장 컬럼 추가
-- 이미 있는 컬럼은 IF NOT EXISTS로 무시됩니다.
-- Supabase 대시보드 → SQL Editor 에서 실행하세요.
-- ============================================================

ALTER TABLE publishers ADD COLUMN IF NOT EXISTS phone           TEXT DEFAULT '';
ALTER TABLE publishers ADD COLUMN IF NOT EXISTS emergency_phone TEXT DEFAULT '';
ALTER TABLE publishers ADD COLUMN IF NOT EXISTS relationship    TEXT DEFAULT '';
ALTER TABLE publishers ADD COLUMN IF NOT EXISTS address         TEXT DEFAULT '';
ALTER TABLE publishers ADD COLUMN IF NOT EXISTS family_head     TEXT DEFAULT '';
ALTER TABLE publishers ADD COLUMN IF NOT EXISTS special_notes   TEXT DEFAULT '';

-- 확인: 현재 컬럼 목록 조회
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'publishers'
ORDER BY ordinal_position;
