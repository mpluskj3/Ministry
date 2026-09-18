-- ==============================================================================
-- Google Sheets -> Supabase Actual Data Migration Script
-- 실제 구글 시트 데이터 (90명 전도인, 5개 집단, 1,016건 월별 보고서) 마이그레이션
-- ==============================================================================

-- 0. 제약조건 안전 완화 (기존 테이블 호환성 보장)
ALTER TABLE public.publishers DROP CONSTRAINT IF EXISTS publishers_position_check;
ALTER TABLE public.publishers ADD CONSTRAINT publishers_position_check CHECK (position IN ('장로', '봉사의 종', '봉종', '일반', ''));

-- 1. 봉사연도 생성
INSERT INTO public.service_years (id, year_name, is_current, start_date, end_date)
VALUES 
  ('a0000000-0000-0000-0000-000000002026', '2026', true, '2025-09-01', '2026-08-31'),
  ('a0000000-0000-0000-0000-000000002025', '2025', false, '2024-09-01', '2025-08-31')
ON CONFLICT (year_name) DO UPDATE SET is_current = EXCLUDED.is_current;

-- 2. 실제 집단 삽입
INSERT INTO public.groups (id, name, overseer_name, display_order)
VALUES ('b0000000-0000-0000-0000-000000000001', '효자', '효자 감독자', 1)
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.groups (id, name, overseer_name, display_order)
VALUES ('b0000000-0000-0000-0000-000000000002', '수어', '수어 감독자', 2)
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.groups (id, name, overseer_name, display_order)
VALUES ('b0000000-0000-0000-0000-000000000003', '석사', '석사 감독자', 3)
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.groups (id, name, overseer_name, display_order)
VALUES ('b0000000-0000-0000-0000-000000000004', '현대', '현대 감독자', 4)
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.groups (id, name, overseer_name, display_order)
VALUES ('b0000000-0000-0000-0000-000000000005', '운교', '운교 감독자', 5)
ON CONFLICT (name) DO NOTHING;

-- 3. 실제 90명 전도인 명단 삽입
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000001', '강미숙', 'b0000000-0000-0000-0000-000000000001', '남', '다른 양', '일반', 'AP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000002', '강석찬', 'b0000000-0000-0000-0000-000000000001', '남', '다른 양', '장로', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000003', '강선아', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000004', '강영아', 'b0000000-0000-0000-0000-000000000001', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000005', '강은구', 'b0000000-0000-0000-0000-000000000001', '남', '다른 양', '일반', 'AP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000006', '강정구', 'b0000000-0000-0000-0000-000000000003', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000007', '권빈', 'b0000000-0000-0000-0000-000000000004', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000008', '권선', 'b0000000-0000-0000-0000-000000000003', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000009', '권윤', 'b0000000-0000-0000-0000-000000000004', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000010', '권지민', 'b0000000-0000-0000-0000-000000000005', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000011', '김기림', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000012', '김미옥', 'b0000000-0000-0000-0000-000000000003', '남', '다른 양', '일반', 'AP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000013', '김상만', 'b0000000-0000-0000-0000-000000000005', '남', '다른 양', '장로', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000014', '김승연', 'b0000000-0000-0000-0000-000000000005', '남', '다른 양', '장로', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000015', '김승일', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '장로', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000016', '김예림', 'b0000000-0000-0000-0000-000000000003', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000017', '김유진', 'b0000000-0000-0000-0000-000000000005', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000018', '김인자', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000019', '김정남', 'b0000000-0000-0000-0000-000000000004', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000020', '김정숙', 'b0000000-0000-0000-0000-000000000004', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000021', '김주연', 'b0000000-0000-0000-0000-000000000005', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000022', '김준', 'b0000000-0000-0000-0000-000000000004', '남', '다른 양', '장로', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000023', '김지애', 'b0000000-0000-0000-0000-000000000001', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000024', '김태민', 'b0000000-0000-0000-0000-000000000005', '남', '다른 양', '봉사의 종', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000025', '김태호', 'b0000000-0000-0000-0000-000000000001', '남', '다른 양', '장로', 'AP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000026', '김하나', 'b0000000-0000-0000-0000-000000000001', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000027', '김하연', 'b0000000-0000-0000-0000-000000000005', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000028', '김홍철', 'b0000000-0000-0000-0000-000000000004', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000029', '김희웅', 'b0000000-0000-0000-0000-000000000004', '남', '다른 양', '장로', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000030', '김희정', 'b0000000-0000-0000-0000-000000000003', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000031', '문경주', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '장로', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000032', '문광호', 'b0000000-0000-0000-0000-000000000005', '남', '다른 양', '장로', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000033', '문정은', 'b0000000-0000-0000-0000-000000000005', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000034', '박근미', 'b0000000-0000-0000-0000-000000000004', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000035', '박미희', 'b0000000-0000-0000-0000-000000000004', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000036', '박세진', 'b0000000-0000-0000-0000-000000000005', '남', '다른 양', '장로', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000037', '박주현', 'b0000000-0000-0000-0000-000000000004', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000038', '박형빈', 'b0000000-0000-0000-0000-000000000003', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000039', '손지영', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000040', '신경희', 'b0000000-0000-0000-0000-000000000001', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000041', '신미연', 'b0000000-0000-0000-0000-000000000001', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000042', '오경숙', 'b0000000-0000-0000-0000-000000000003', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000043', '우성제', 'b0000000-0000-0000-0000-000000000003', '남', '다른 양', '봉사의 종', 'AP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000044', '윤지후', 'b0000000-0000-0000-0000-000000000003', '남', '다른 양', '일반', 'AP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000045', '이경진', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '장로', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000046', '이숙현', 'b0000000-0000-0000-0000-000000000005', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000047', '이순금', 'b0000000-0000-0000-0000-000000000001', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000048', '이순주', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000049', '이슬아', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000050', '이용규', 'b0000000-0000-0000-0000-000000000003', '남', '다른 양', '봉사의 종', 'AP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000051', '이은옥', 'b0000000-0000-0000-0000-000000000003', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000052', '이은우', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '봉사의 종', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000053', '이재춘', 'b0000000-0000-0000-0000-000000000004', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000054', '이정구', 'b0000000-0000-0000-0000-000000000003', '남', '다른 양', '일반', 'AP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000055', '이정인', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '장로', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000056', '이채민', 'b0000000-0000-0000-0000-000000000004', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000057', '이춘자', 'b0000000-0000-0000-0000-000000000001', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000058', '이혜미', 'b0000000-0000-0000-0000-000000000004', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000059', '이혜숙', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000060', '인혜진', 'b0000000-0000-0000-0000-000000000005', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000061', '임연순', 'b0000000-0000-0000-0000-000000000005', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000062', '장지은', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000063', '전은아', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000064', '전재관', 'b0000000-0000-0000-0000-000000000004', '남', '다른 양', '장로', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000065', '전지훈', 'b0000000-0000-0000-0000-000000000001', '남', '다른 양', '장로', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000066', '전진혁', 'b0000000-0000-0000-0000-000000000003', '남', '다른 양', '장로', 'AP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000067', '전채균', 'b0000000-0000-0000-0000-000000000005', '남', '다른 양', '일반', 'AP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000068', '전혜인', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000069', '전호진', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '봉사의 종', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000070', '정금석', 'b0000000-0000-0000-0000-000000000004', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000071', '정명희', 'b0000000-0000-0000-0000-000000000005', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000072', '정복희', 'b0000000-0000-0000-0000-000000000001', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000073', '정승헌', 'b0000000-0000-0000-0000-000000000004', '남', '다른 양', '장로', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000074', '정태희', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '일반', 'AP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000075', '정향순', 'b0000000-0000-0000-0000-000000000003', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000076', '조용호', 'b0000000-0000-0000-0000-000000000001', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000077', '조월동', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '일반', 'AP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000078', '조인형', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000079', '조행진', 'b0000000-0000-0000-0000-000000000001', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000080', '주우규', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000081', '진선미', 'b0000000-0000-0000-0000-000000000001', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000082', '채영진', 'b0000000-0000-0000-0000-000000000004', '남', '다른 양', '장로', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000083', '최선율', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '일반', 'AP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000084', '최수정', 'b0000000-0000-0000-0000-000000000003', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000085', '최승준', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '봉사의 종', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000086', '최윤', 'b0000000-0000-0000-0000-000000000005', '남', '다른 양', '일반', '일반', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000087', '최현수', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '봉사의 종', 'AP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000088', '한명숙', 'b0000000-0000-0000-0000-000000000001', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000089', '함빈', 'b0000000-0000-0000-0000-000000000002', '남', '다른 양', '봉사의 종', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;
INSERT INTO public.publishers (id, name, group_id, gender, hope, position, pioneer_status, is_active)
VALUES ('c0000000-0000-0000-0000-000000000090', '허율', 'b0000000-0000-0000-0000-000000000003', '남', '다른 양', '일반', 'RP', true)
ON CONFLICT (name) DO UPDATE SET group_id = EXCLUDED.group_id, position = EXCLUDED.position, pioneer_status = EXCLUDED.pioneer_status;

-- 4. 12개월 마감 상태 삽입
INSERT INTO public.monthly_statuses (service_year_id, month, is_closed)
VALUES ('a0000000-0000-0000-0000-000000002026', '9월', true)
ON CONFLICT (service_year_id, month) DO UPDATE SET is_closed = EXCLUDED.is_closed;
INSERT INTO public.monthly_statuses (service_year_id, month, is_closed)
VALUES ('a0000000-0000-0000-0000-000000002026', '10월', true)
ON CONFLICT (service_year_id, month) DO UPDATE SET is_closed = EXCLUDED.is_closed;
INSERT INTO public.monthly_statuses (service_year_id, month, is_closed)
VALUES ('a0000000-0000-0000-0000-000000002026', '11월', true)
ON CONFLICT (service_year_id, month) DO UPDATE SET is_closed = EXCLUDED.is_closed;
INSERT INTO public.monthly_statuses (service_year_id, month, is_closed)
VALUES ('a0000000-0000-0000-0000-000000002026', '12월', true)
ON CONFLICT (service_year_id, month) DO UPDATE SET is_closed = EXCLUDED.is_closed;
INSERT INTO public.monthly_statuses (service_year_id, month, is_closed)
VALUES ('a0000000-0000-0000-0000-000000002026', '1월', true)
ON CONFLICT (service_year_id, month) DO UPDATE SET is_closed = EXCLUDED.is_closed;
INSERT INTO public.monthly_statuses (service_year_id, month, is_closed)
VALUES ('a0000000-0000-0000-0000-000000002026', '2월', true)
ON CONFLICT (service_year_id, month) DO UPDATE SET is_closed = EXCLUDED.is_closed;
INSERT INTO public.monthly_statuses (service_year_id, month, is_closed)
VALUES ('a0000000-0000-0000-0000-000000002026', '3월', true)
ON CONFLICT (service_year_id, month) DO UPDATE SET is_closed = EXCLUDED.is_closed;
INSERT INTO public.monthly_statuses (service_year_id, month, is_closed)
VALUES ('a0000000-0000-0000-0000-000000002026', '4월', true)
ON CONFLICT (service_year_id, month) DO UPDATE SET is_closed = EXCLUDED.is_closed;
INSERT INTO public.monthly_statuses (service_year_id, month, is_closed)
VALUES ('a0000000-0000-0000-0000-000000002026', '5월', true)
ON CONFLICT (service_year_id, month) DO UPDATE SET is_closed = EXCLUDED.is_closed;
INSERT INTO public.monthly_statuses (service_year_id, month, is_closed)
VALUES ('a0000000-0000-0000-0000-000000002026', '6월', true)
ON CONFLICT (service_year_id, month) DO UPDATE SET is_closed = EXCLUDED.is_closed;
INSERT INTO public.monthly_statuses (service_year_id, month, is_closed)
VALUES ('a0000000-0000-0000-0000-000000002026', '7월', true)
ON CONFLICT (service_year_id, month) DO UPDATE SET is_closed = EXCLUDED.is_closed;
INSERT INTO public.monthly_statuses (service_year_id, month, is_closed)
VALUES ('a0000000-0000-0000-0000-000000002026', '8월', true)
ON CONFLICT (service_year_id, month) DO UPDATE SET is_closed = EXCLUDED.is_closed;

-- 5. 실제 월별 보고서 데이터 (총 1016건) 삽입
INSERT INTO public.monthly_reports (service_year_id, publisher_id, month, participated, hours, bible_studies, remarks, submitted_at)
VALUES
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000001', '9월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000002', '9월', true, 53, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000003', '9월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000004', '9월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000006', '9월', true, 62, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000008', '9월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000009', '9월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000011', '9월', true, 53, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000012', '9월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000013', '9월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000014', '9월', true, 38, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000015', '9월', true, 38, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000018', '9월', true, 66, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000019', '9월', true, 55, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000020', '9월', true, 48, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000021', '9월', true, 70, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000022', '9월', true, 38, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000023', '9월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000024', '9월', true, 40, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000025', '9월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000026', '9월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000027', '9월', true, 55, 0, '[{"type":"왕국회관 유지보수","hours":"2"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000028', '9월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000029', '9월', true, 71, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000030', '9월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000031', '9월', true, 25, 2, '[{"type":"원격봉사","hours":"25"},{"type":"LDC","hours":"8"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000032', '9월', true, 13, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000033', '9월', true, 43, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000034', '9월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000035', '9월', true, 65, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000038', '9월', true, 60, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000039', '9월', true, 65, 2, '[{"type":"LDC","hours":"8"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000040', '9월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000041', '9월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000042', '9월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000043', '9월', true, 17, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000045', '9월', true, 40, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000047', '9월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000048', '9월', true, 52, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000049', '9월', true, 48, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000050', '9월', true, 16, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000051', '9월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000052', '9월', true, 35, 0, '[{"type":"기타","hours":"0","etc":"파이오니아 시작"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000053', '9월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000054', '9월', true, 31, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000055', '9월', true, 41, 1, '[{"type":"LDC","hours":"8"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000056', '9월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000057', '9월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000058', '9월', true, 50, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000059', '9월', true, 52, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000060', '9월', true, 60, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000061', '9월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000062', '9월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000063', '9월', true, 51, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000064', '9월', true, 57, 3, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000065', '9월', true, 56, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000066', '9월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000067', '9월', true, 17, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000068', '9월', true, 52, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000069', '9월', true, 56, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000070', '9월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000071', '9월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000072', '9월', true, 57, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000073', '9월', true, 41, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000074', '9월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000075', '9월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000077', '9월', true, 30, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000078', '9월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000079', '9월', true, 47, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000080', '9월', true, 54, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000081', '9월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000082', '9월', true, 54, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000083', '9월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000084', '9월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000085', '9월', true, 54, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000087', '9월', true, 17, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000088', '9월', true, 72, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000090', '9월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000001', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000002', '10월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000003', '10월', true, 52, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000004', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000005', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000006', '10월', true, 52, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000008', '10월', true, 53, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000009', '10월', true, 40, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000011', '10월', true, 44, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000012', '10월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000013', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000014', '10월', true, 35, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000015', '10월', true, 40, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000018', '10월', true, 74, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000019', '10월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000020', '10월', true, 56, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000021', '10월', true, 41, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000022', '10월', true, 36, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000023', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000024', '10월', true, 36, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000025', '10월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000026', '10월', true, 0, 0, '[]'::JSONB, NOW())
ON CONFLICT (service_year_id, publisher_id, month) DO NOTHING;

INSERT INTO public.monthly_reports (service_year_id, publisher_id, month, participated, hours, bible_studies, remarks, submitted_at)
VALUES
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000027', '10월', true, 47, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000028', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000029', '10월', true, 76, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000030', '10월', true, 46, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000031', '10월', true, 30, 2, '[{"type":"원격봉사","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000032', '10월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000033', '10월', true, 40, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000034', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000035', '10월', true, 55, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000038', '10월', true, 77, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000039', '10월', true, 58, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000040', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000041', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000042', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000043', '10월', true, 16, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000045', '10월', true, 42, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000046', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000047', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000048', '10월', true, 40, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000049', '10월', true, 55, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000050', '10월', true, 16, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000051', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000052', '10월', true, 38, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000053', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000054', '10월', true, 32, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000055', '10월', true, 57, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000056', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000057', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000058', '10월', true, 68, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000059', '10월', true, 54, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000060', '10월', true, 71, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000061', '10월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000062', '10월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000063', '10월', true, 51, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000064', '10월', true, 55, 3, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000065', '10월', true, 43, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000066', '10월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000067', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000068', '10월', true, 50, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000069', '10월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000070', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000071', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000072', '10월', true, 58, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000073', '10월', true, 35, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000074', '10월', true, 53, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000075', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000077', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000078', '10월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000079', '10월', true, 37, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000080', '10월', true, 70, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000081', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000082', '10월', true, 64, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000083', '10월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000084', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000085', '10월', true, 55, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000087', '10월', true, 22, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000088', '10월', true, 76, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000090', '10월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000001', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000002', '11월', true, 43, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000003', '11월', true, 37, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000004', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000005', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000006', '11월', true, 54, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000008', '11월', true, 56, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000009', '11월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000010', '11월', true, 67, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000011', '11월', true, 55, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000012', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000013', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000014', '11월', true, 41, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000015', '11월', true, 40, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000018', '11월', true, 69, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000019', '11월', true, 53, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000020', '11월', true, 54, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000021', '11월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000022', '11월', true, 42, 0, '[{"type":"축제특별공개증거","hours":"2"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000023', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000024', '11월', true, 55, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000025', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000026', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000027', '11월', true, 43, 0, '[{"type":"원격봉사","hours":"72"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000028', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000029', '11월', true, 68, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000030', '11월', true, 47, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000031', '11월', true, 35, 2, '[{"type":"원격봉사","hours":"64"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000032', '11월', true, 28, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000033', '11월', true, 38, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000034', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000035', '11월', true, 63, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000036', '11월', true, 58, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000038', '11월', true, 49, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000039', '11월', true, 60, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000040', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000041', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000042', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000043', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000045', '11월', true, 26, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000046', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000047', '11월', true, 0, 0, '[]'::JSONB, NOW())
ON CONFLICT (service_year_id, publisher_id, month) DO NOTHING;

INSERT INTO public.monthly_reports (service_year_id, publisher_id, month, participated, hours, bible_studies, remarks, submitted_at)
VALUES
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000048', '11월', true, 52, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000049', '11월', true, 59, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000050', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000051', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000052', '11월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000053', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000054', '11월', true, 30, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000055', '11월', true, 72, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000056', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000057', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000058', '11월', true, 55, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000059', '11월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000060', '11월', true, 61, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000061', '11월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000062', '11월', true, 50, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000063', '11월', true, 52, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000064', '11월', true, 59, 3, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000065', '11월', true, 29, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000066', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000067', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000068', '11월', true, 53, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000069', '11월', true, 40, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000070', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000071', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000072', '11월', true, 55, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000073', '11월', true, 34, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000074', '11월', true, 52, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000075', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000077', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000078', '11월', true, 52, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000079', '11월', true, 40, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000080', '11월', true, 59, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000081', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000082', '11월', true, 53, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000083', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000084', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000085', '11월', true, 38, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000087', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000088', '11월', true, 33, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000090', '11월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000001', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000002', '12월', true, 48, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000003', '12월', true, 50, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000004', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000005', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000006', '12월', true, 66, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000008', '12월', true, 58, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000009', '12월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000010', '12월', true, 78, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000011', '12월', true, 40, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000012', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000013', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000014', '12월', true, 37, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000015', '12월', true, 40, 1, '[{"type":"축특공 자원봉사","hours":"3"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000018', '12월', true, 45, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000019', '12월', true, 55, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000020', '12월', true, 55, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000021', '12월', true, 120, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000022', '12월', true, 38, 0, '[{"type":"축특공 자원봉사","hours":"4"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000023', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000024', '12월', true, 53, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000025', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000026', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000027', '12월', true, 12, 0, '[{"type":"원격봉사","hours":"112"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000028', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000029', '12월', true, 73, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000030', '12월', true, 60, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000031', '12월', true, 35, 2, '[{"type":"원격봉사","hours":"48"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000032', '12월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000033', '12월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000034', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000035', '12월', true, 59, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000036', '12월', true, 54, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000038', '12월', true, 28, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000039', '12월', true, 61, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000040', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000041', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000042', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000043', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000045', '12월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000046', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000047', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000048', '12월', true, 46, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000049', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000050', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000051', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000052', '12월', true, 34, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000053', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000054', '12월', true, 32, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000055', '12월', true, 48, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000056', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000057', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000058', '12월', true, 50, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000059', '12월', true, 58, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000060', '12월', true, 58, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000061', '12월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000062', '12월', true, 57, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000063', '12월', true, 57, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000064', '12월', true, 63, 3, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000065', '12월', true, 53, 0, '[]'::JSONB, NOW())
ON CONFLICT (service_year_id, publisher_id, month) DO NOTHING;

INSERT INTO public.monthly_reports (service_year_id, publisher_id, month, participated, hours, bible_studies, remarks, submitted_at)
VALUES
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000066', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000067', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000068', '12월', true, 47, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000069', '12월', true, 52, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000070', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000071', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000072', '12월', true, 49, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000073', '12월', true, 31, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000074', '12월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000075', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000077', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000078', '12월', true, 46, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000079', '12월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000080', '12월', true, 53, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000081', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000082', '12월', true, 54, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000083', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000084', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000085', '12월', true, 58, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000087', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000088', '12월', true, 51, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000090', '12월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000001', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000002', '1월', true, 55, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000003', '1월', true, 34, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000004', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000005', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000006', '1월', true, 68, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000008', '1월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000009', '1월', true, 45, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000010', '1월', true, 67, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000011', '1월', true, 49, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000012', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000013', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000014', '1월', true, 36, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000015', '1월', true, 40, 1, '[{"type":"축특공 자원봉사","hours":"5"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000018', '1월', true, 69, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000019', '1월', true, 52, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000020', '1월', true, 27, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000021', '1월', true, 52, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000022', '1월', true, 35, 0, '[{"type":"축제특별공개증거 관리","hours":"15"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000023', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000024', '1월', true, 46, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000025', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000026', '1월', true, 32, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000027', '1월', true, 16, 0, '[{"type":"원격봉사","hours":"104"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000028', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000029', '1월', true, 62, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000030', '1월', true, 55, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000031', '1월', true, 35, 2, '[{"type":"원격봉사","hours":"45"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000032', '1월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000033', '1월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000034', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000035', '1월', true, 59, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000036', '1월', true, 42, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000038', '1월', true, 43, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000039', '1월', true, 66, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000040', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000041', '1월', true, 0, 0, '[{"type":"기타","hours":"1"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000042', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000043', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000045', '1월', true, 81, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000046', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000047', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000048', '1월', true, 48, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000049', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000050', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000051', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000052', '1월', true, 35, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000053', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000054', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000055', '1월', true, 38, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000056', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000057', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000058', '1월', true, 66, 4, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000059', '1월', true, 52, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000060', '1월', true, 33, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000061', '1월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000062', '1월', true, 53, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000063', '1월', true, 63, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000064', '1월', true, 78, 3, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000065', '1월', true, 70, 1, '[{"type":"LDC","hours":"3"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000066', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000067', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000068', '1월', true, 42, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000069', '1월', true, 52, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000070', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000071', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000072', '1월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000073', '1월', true, 32, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000074', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000075', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000077', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000078', '1월', true, 63, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000079', '1월', true, 45, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000080', '1월', true, 68, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000081', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000082', '1월', true, 53, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000083', '1월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000084', '1월', true, 0, 0, '[]'::JSONB, NOW())
ON CONFLICT (service_year_id, publisher_id, month) DO NOTHING;

INSERT INTO public.monthly_reports (service_year_id, publisher_id, month, participated, hours, bible_studies, remarks, submitted_at)
VALUES
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000085', '1월', true, 44, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000087', '1월', true, 38, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000088', '1월', true, 52, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000089', '1월', true, 54, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000090', '1월', true, 31, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000001', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000002', '2월', true, 41, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000003', '2월', true, 22, 1, '[{"type":"LDC","hours":"8"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000004', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000005', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000006', '2월', true, 58, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000008', '2월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000009', '2월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000010', '2월', true, 48, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000011', '2월', true, 41, 0, '[{"type":"대회자원봉사","hours":"6"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000012', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000013', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000014', '2월', true, 36, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000015', '2월', true, 36, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000018', '2월', true, 60, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000019', '2월', true, 54, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000020', '2월', true, 25, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000021', '2월', true, 40, 0, '[{"type":"LDC","hours":"8"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000022', '2월', true, 45, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000023', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000024', '2월', true, 42, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000025', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000026', '2월', true, 30, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000027', '2월', true, 14, 0, '[{"type":"원격봉사","hours":"88"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000028', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000029', '2월', true, 42, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000030', '2월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000031', '2월', true, 30, 2, '[{"type":"원격봉사","hours":"45"},{"type":"LDC","hours":"8"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000032', '2월', true, 54, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000033', '2월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000034', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000035', '2월', true, 56, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000036', '2월', true, 45, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000038', '2월', true, 30, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000039', '2월', true, 48, 2, '[{"type":"LDC","hours":"8"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000040', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000041', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000042', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000043', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000045', '2월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000046', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000047', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000048', '2월', true, 38, 0, '[{"type":"대회자원봉사","hours":"8"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000049', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000050', '2월', true, 0, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000051', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000052', '2월', true, 29, 0, '[{"type":"대회자원봉사","hours":"6"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000053', '2월', true, 0, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000054', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000055', '2월', true, 14, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000056', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000057', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000058', '2월', true, 43, 3, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000059', '2월', true, 56, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000060', '2월', true, 44, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000061', '2월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000062', '2월', true, 43, 1, '[{"type":"대회자원봉사","hours":"8"},{"type":"베델 촬영","hours":"8"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000063', '2월', true, 40, 1, '[{"type":"베델 수어 촬영","hours":"8"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000064', '2월', true, 50, 3, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000065', '2월', true, 40, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000066', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000067', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000068', '2월', true, 31, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000069', '2월', true, 46, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000070', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000071', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000072', '2월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000073', '2월', true, 35, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000074', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000075', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000077', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000078', '2월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000079', '2월', true, 31, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000080', '2월', true, 97, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000081', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000082', '2월', true, 57, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000083', '2월', true, 28, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000084', '2월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000085', '2월', true, 30, 0, '[{"type":"대회자원봉사","hours":"8"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000087', '2월', true, 26, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000088', '2월', true, 52, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000089', '2월', true, 40, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000090', '2월', true, 32, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000063', '3월', true, 52, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000080', '3월', true, 97, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000011', '3월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000045', '3월', true, 49, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000087', '3월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000074', '3월', true, 56, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000078', '3월', true, 59, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000015', '3월', true, 36, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000050', '3월', true, 16, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000024', '3월', true, 60, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000083', '3월', true, 17, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000039', '3월', true, 45, 2, '[]'::JSONB, NOW())
ON CONFLICT (service_year_id, publisher_id, month) DO NOTHING;

INSERT INTO public.monthly_reports (service_year_id, publisher_id, month, participated, hours, bible_studies, remarks, submitted_at)
VALUES
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000066', '3월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000051', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000030', '3월', true, 53, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000090', '3월', true, 25, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000006', '3월', true, 70, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000071', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000046', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000013', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000067', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000008', '3월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000018', '3월', true, 59, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000089', '3월', true, 42, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000062', '3월', true, 45, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000069', '3월', true, 44, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000052', '3월', true, 33, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000027', '3월', true, 16, 0, '[{"type":"원격봉사","hours":"88"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000082', '3월', true, 61, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000053', '3월', true, 0, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000029', '3월', true, 35, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000028', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000019', '3월', true, 52, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000022', '3월', true, 55, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000054', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000012', '3월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000035', '3월', true, 24, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000009', '3월', true, 57, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000043', '3월', true, 17, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000073', '3월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000040', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000072', '3월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000057', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000077', '3월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000031', '3월', true, 35, 2, '[{"type":"원격봉사","hours":"35"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000049', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000048', '3월', true, 53, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000003', '3월', true, 42, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000041', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000068', '3월', true, 30, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000065', '3월', true, 55, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000058', '3월', true, 64, 3, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000064', '3월', true, 52, 3, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000055', '3월', true, 37, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000075', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000026', '3월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000088', '3월', true, 37, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000081', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000020', '3월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000059', '3월', true, 54, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000070', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000056', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000034', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000085', '3월', true, 40, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000060', '3월', true, 51, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000016', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000010', '3월', true, 52, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000004', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000037', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000079', '3월', true, 28, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000047', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000001', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000002', '3월', true, 56, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000036', '3월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000084', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000014', '3월', true, 40, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000023', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000021', '3월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000033', '3월', true, 48, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000025', '3월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000086', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000061', '3월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000032', '3월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000042', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000005', '3월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000038', '3월', true, 14, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000001', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000002', '4월', true, 21, 0, '[{"type":"장로학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000003', '4월', true, 29, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000004', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000005', '4월', true, 16, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000006', '4월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000008', '4월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000009', '4월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000010', '4월', true, 67, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000011', '4월', true, 44, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000012', '4월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000013', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000014', '4월', true, 35, 1, '[{"type":"회중장로학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000015', '4월', true, 38, 1, '[{"type":"장로학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000016', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000017', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000018', '4월', true, 65, 3, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000019', '4월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000020', '4월', true, 52, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000021', '4월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000022', '4월', true, 35, 1, '[{"type":"장로학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000023', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000024', '4월', true, 59, 0, '[{"type":"LDC","hours":"8"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000025', '4월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000026', '4월', true, 19, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000027', '4월', true, 12, 0, '[{"type":"원격봉사","hours":"96"}]'::JSONB, NOW())
ON CONFLICT (service_year_id, publisher_id, month) DO NOTHING;

INSERT INTO public.monthly_reports (service_year_id, publisher_id, month, participated, hours, bible_studies, remarks, submitted_at)
VALUES
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000028', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000029', '4월', true, 55, 0, '[{"type":"장로학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000030', '4월', true, 52, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000031', '4월', true, 35, 2, '[{"type":"원격봉사","hours":"45"},{"type":"장로학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000032', '4월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000033', '4월', true, 45, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000034', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000035', '4월', true, 56, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000036', '4월', true, 31, 0, '[{"type":"장로학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000037', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000038', '4월', true, 40, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000039', '4월', true, 50, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000040', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000041', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000042', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000043', '4월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000045', '4월', true, 45, 0, '[{"type":"장로학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000046', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000047', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000048', '4월', true, 54, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000049', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000050', '4월', true, 18, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000051', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000052', '4월', true, 35, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000053', '4월', true, 0, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000054', '4월', true, 31, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000055', '4월', true, 51, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000056', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000057', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000058', '4월', true, 47, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000059', '4월', true, 45, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000060', '4월', true, 46, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000061', '4월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000062', '4월', true, 47, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000063', '4월', true, 45, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000064', '4월', true, 46, 3, '[{"type":"장로학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000065', '4월', true, 30, 1, '[{"type":"장로학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000066', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000067', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000068', '4월', true, 44, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000069', '4월', true, 54, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000070', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000071', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000072', '4월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000073', '4월', true, 55, 0, '[{"type":"장로학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000074', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000075', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000076', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000077', '4월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000078', '4월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000079', '4월', true, 45, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000080', '4월', true, 99, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000081', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000082', '4월', true, 39, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000083', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000084', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000085', '4월', true, 24, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000086', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000087', '4월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000088', '4월', true, 45, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000089', '4월', true, 44, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000090', '4월', true, 40, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000001', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000002', '5월', true, 28, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000003', '5월', true, 43, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000004', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000005', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000006', '5월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000008', '5월', true, 63, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000009', '5월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000010', '5월', true, 95, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000011', '5월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000012', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000013', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000014', '5월', true, 44, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000015', '5월', true, 45, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000016', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000017', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000018', '5월', true, 59, 3, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000019', '5월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000020', '5월', true, 55, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000021', '5월', true, 78, 0, '[{"type":"LDC","hours":"8"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000022', '5월', true, 60, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000023', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000024', '5월', true, 58, 0, '[{"type":"LDC","hours":"16"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000025', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000026', '5월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000027', '5월', true, 36, 0, '[{"type":"원격봉사","hours":"24"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000028', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000029', '5월', true, 65, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000030', '5월', true, 40, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000031', '5월', true, 35, 1, '[{"type":"원격봉사","hours":"48"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000032', '5월', true, 57, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000033', '5월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000034', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000035', '5월', true, 64, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000036', '5월', true, 57, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000037', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000038', '5월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000039', '5월', true, 52, 2, '[]'::JSONB, NOW())
ON CONFLICT (service_year_id, publisher_id, month) DO NOTHING;

INSERT INTO public.monthly_reports (service_year_id, publisher_id, month, participated, hours, bible_studies, remarks, submitted_at)
VALUES
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000040', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000041', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000042', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000043', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000045', '5월', true, 56, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000046', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000047', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000048', '5월', true, 55, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000049', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000050', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000051', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000052', '5월', true, 42, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000053', '5월', true, 0, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000054', '5월', true, 32, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000055', '5월', true, 47, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000056', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000057', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000058', '5월', true, 49, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000059', '5월', true, 65, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000060', '5월', true, 50, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000061', '5월', true, 45, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000062', '5월', true, 64, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000063', '5월', true, 52, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000064', '5월', true, 60, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000065', '5월', true, 62, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000066', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000067', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000068', '5월', true, 42, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000069', '5월', true, 56, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000070', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000071', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000072', '5월', true, 60, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000073', '5월', true, 41, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000074', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000075', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000076', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000077', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000078', '5월', true, 55, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000079', '5월', true, 73, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000080', '5월', true, 88, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000081', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000082', '5월', true, 55, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000083', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000084', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000085', '5월', true, 53, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000086', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000087', '5월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000088', '5월', true, 29, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000089', '5월', true, 87, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000090', '5월', true, 47, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000001', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000002', '6월', true, 35, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000003', '6월', true, 48, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000004', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000005', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000006', '6월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000007', '6월', true, 41, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000008', '6월', true, 60, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000009', '6월', true, 42, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000010', '6월', true, 72, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000011', '6월', true, 47, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000012', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000013', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000014', '6월', true, 51, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000015', '6월', true, 40, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000016', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000018', '6월', true, 69, 4, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000019', '6월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000020', '6월', true, 60, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000021', '6월', true, 100, 0, '[{"type":"LDC","hours":"5"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000022', '6월', true, 50, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000024', '6월', true, 45, 0, '[{"type":"LDC","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000025', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000026', '6월', true, 65, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000027', '6월', true, 49, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000028', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000029', '6월', true, 61, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000030', '6월', true, 47, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000031', '6월', true, 35, 1, '[{"type":"원격봉사","hours":"55"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000032', '6월', true, 49, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000033', '6월', true, 41, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000034', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000035', '6월', true, 52, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000036', '6월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000037', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000038', '6월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000039', '6월', true, 46, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000040', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000041', '6월', true, 0, 0, '[{"type":"기타","hours":"2"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000042', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000043', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000045', '6월', true, 30, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000047', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000048', '6월', true, 55, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000049', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000050', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000051', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000052', '6월', true, 32, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000053', '6월', true, 0, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000054', '6월', true, 32, 0, '[]'::JSONB, NOW())
ON CONFLICT (service_year_id, publisher_id, month) DO NOTHING;

INSERT INTO public.monthly_reports (service_year_id, publisher_id, month, participated, hours, bible_studies, remarks, submitted_at)
VALUES
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000055', '6월', true, 57, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000056', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000057', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000058', '6월', true, 51, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000059', '6월', true, 38, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000060', '6월', true, 57, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000061', '6월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000062', '6월', true, 38, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000063', '6월', true, 12, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000064', '6월', true, 46, 2, '[{"type":"유지보수","hours":"2"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000065', '6월', true, 47, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000066', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000067', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000069', '6월', true, 52, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000070', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000071', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000072', '6월', true, 61, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000073', '6월', true, 38, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000074', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000075', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000076', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000077', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000078', '6월', true, 40, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000079', '6월', true, 52, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000080', '6월', true, 81, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000081', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000082', '6월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000083', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000084', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000085', '6월', true, 32, 0, '[{"type":"LDC","hours":"16"},{"type":"병교위","hours":"4"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000086', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000087', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000088', '6월', true, 51, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000089', '6월', true, 43, 0, '[{"type":"LDC","hours":"5"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000090', '6월', true, 35, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000007', '6월', true, 41, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000068', '6월', true, 45, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000017', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000046', '6월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000001', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000066', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000012', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000051', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000050', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000008', '7월', true, 46, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000076', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000081', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000042', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000045', '7월', true, 54, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000010', '7월', true, 45, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000061', '7월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000057', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000031', '7월', true, 25, 2, '[{"type":"파이오니아학교","hours":"30"},{"type":"원격봉사","hours":"45"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000049', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000046', '7월', true, 7, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000021', '7월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000024', '7월', true, 42, 0, '[{"type":"LDC","hours":"8"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000036', '7월', true, 40, 0, '[{"type":"대회자원봉사","hours":"18"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000087', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000054', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000039', '7월', true, 30, 2, '[{"type":"파이오니아학교","hours":"30"},{"type":"LDC","hours":"8"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000078', '7월', true, 52, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000032', '7월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000048', '7월', true, 42, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000069', '7월', true, 20, 0, '[{"type":"파이오니아학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000080', '7월', true, 63, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000086', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000062', '7월', true, 46, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000060', '7월', true, 62, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000058', '7월', true, 38, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000064', '7월', true, 27, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000027', '7월', true, 39, 0, '[{"type":"대회자원봉사","hours":"2"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000006', '7월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000090', '7월', true, 65, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000074', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000059', '7월', true, 62, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000072', '7월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000089', '7월', true, 52, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000018', '7월', true, 71, 5, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000022', '7월', true, 55, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000035', '7월', true, 35, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000029', '7월', true, 34, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000007', '7월', true, 33, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000019', '7월', true, 30, 0, '[{"type":"파이오니아학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000026', '7월', true, 48, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000028', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000053', '7월', true, 0, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000020', '7월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000040', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000070', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000034', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000056', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000082', '7월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000068', '7월', true, 44, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000052', '7월', true, 31, 0, '[{"type":"파이오니아학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000075', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000055', '7월', true, 49, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000009', '7월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000011', '7월', true, 46, 1, '[{"type":"파이오니아학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000083', '7월', true, 0, 0, '[]'::JSONB, NOW())
ON CONFLICT (service_year_id, publisher_id, month) DO NOTHING;

INSERT INTO public.monthly_reports (service_year_id, publisher_id, month, participated, hours, bible_studies, remarks, submitted_at)
VALUES
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000003', '7월', true, 106, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000077', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000063', '7월', true, 64, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000015', '7월', true, 40, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000085', '7월', true, 33, 0, '[{"type":"파이오니아학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000013', '7월', true, 0, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000071', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000033', '7월', true, 48, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000038', '7월', true, 70, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000084', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000014', '7월', true, 52, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000030', '7월', true, 44, 0, '[{"type":"파이오니아학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000079', '7월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000002', '7월', true, 31, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000025', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000065', '7월', true, 40, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000005', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000004', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000043', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000073', '7월', true, 41, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000016', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000041', '7월', true, 1, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000088', '7월', true, 62, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000017', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000067', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000037', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000047', '7월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000049', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000087', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000063', '8월', true, 51, 1, '[{"type":"대회자원봉사","hours":"4"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000074', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000062', '8월', true, 44, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000015', '8월', true, 33, 1, '[{"type":"대회자원봉사","hours":"9"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000011', '8월', true, 44, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000039', '8월', true, 27, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000085', '8월', true, 40, 0, '[{"type":"병교위","hours":"3"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000048', '8월', true, 55, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000083', '8월', true, 32, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000089', '8월', true, 49, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000018', '8월', true, 93, 5, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000066', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000067', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000016', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000050', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000029', '8월', true, 18, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000051', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000052', '8월', true, 28, 0, '[{"type":"대회자원봉사","hours":"10"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000082', '8월', true, 54, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000008', '8월', true, 14, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000007', '8월', true, 40, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000060', '8월', true, 43, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000045', '8월', true, 33, 0, '[{"type":"대회자원봉사","hours":"12"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000030', '8월', true, 25, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000053', '8월', true, 0, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000028', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000027', '8월', true, 33, 0, '[{"type":"파이오니아학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000020', '8월', true, 71, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000058', '8월', true, 24, 1, '[{"type":"파이오니아학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000064', '8월', true, 23, 2, '[{"type":"파이오니아학교","hours":"30"},{"type":"유지보수","hours":"2"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000022', '8월', true, 40, 2, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000090', '8월', true, 40, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000073', '8월', true, 54, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000019', '8월', true, 54, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000004', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000025', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000026', '8월', true, 47, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000001', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000072', '8월', true, 33, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000040', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000035', '8월', true, 19, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000081', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000065', '8월', true, 64, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000076', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000088', '8월', true, 43, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000070', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000034', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000056', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000079', '8월', true, 53, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000042', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000069', '8월', true, 40, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000075', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000057', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000003', '8월', true, 93, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000014', '8월', true, 40, 1, '[{"type":"파이오니아학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000010', '8월', true, 15, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000036', '8월', true, 47, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000086', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000013', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000071', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000024', '8월', true, 44, 0, '[{"type":"LDC","hours":"16"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000017', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000032', '8월', true, 51, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000061', '8월', true, 50, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000046', '8월', true, 2, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000021', '8월', true, 50, 0, '[{"type":"파이오니아학교","hours":"30"}]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000055', '8월', true, 58, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000078', '8월', true, 35, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000043', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000041', '8월', true, 1, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000031', '8월', true, 35, 2, '[{"type":"원격봉사","hours":"45"}]'::JSONB, NOW())
ON CONFLICT (service_year_id, publisher_id, month) DO NOTHING;

INSERT INTO public.monthly_reports (service_year_id, publisher_id, month, participated, hours, bible_studies, remarks, submitted_at)
VALUES
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000077', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000068', '8월', true, 45, 1, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000033', '8월', true, 46, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000059', '8월', true, 41, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000080', '8월', true, 62, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000009', '8월', true, 40, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000002', '8월', true, 76, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000047', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000054', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000005', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000006', '8월', true, 13, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000037', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000038', '8월', true, 80, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000084', '8월', true, 0, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000044', '8월', true, 30, 0, '[]'::JSONB, NOW()),
  ('a0000000-0000-0000-0000-000000002026', 'c0000000-0000-0000-0000-000000000012', '8월', false, 0, 0, '[]'::JSONB, NOW())
ON CONFLICT (service_year_id, publisher_id, month) DO NOTHING;


-- 6. 실제 집단별 관리자 계정 생성
INSERT INTO public.managers (email, name, role, group_id)
VALUES ('group_1@example.com', '효자 감독자', 'group', 'b0000000-0000-0000-0000-000000000001')
ON CONFLICT (email) DO NOTHING;
INSERT INTO public.managers (email, name, role, group_id)
VALUES ('group_2@example.com', '수어 감독자', 'group', 'b0000000-0000-0000-0000-000000000002')
ON CONFLICT (email) DO NOTHING;
INSERT INTO public.managers (email, name, role, group_id)
VALUES ('group_3@example.com', '석사 감독자', 'group', 'b0000000-0000-0000-0000-000000000003')
ON CONFLICT (email) DO NOTHING;
INSERT INTO public.managers (email, name, role, group_id)
VALUES ('group_4@example.com', '현대 감독자', 'group', 'b0000000-0000-0000-0000-000000000004')
ON CONFLICT (email) DO NOTHING;
INSERT INTO public.managers (email, name, role, group_id)
VALUES ('group_5@example.com', '운교 감독자', 'group', 'b0000000-0000-0000-0000-000000000005')
ON CONFLICT (email) DO NOTHING;
INSERT INTO public.managers (email, name, role, group_id)
VALUES ('admin@example.com', '최고관리자(서기)', 'super', NULL)
ON CONFLICT (email) DO NOTHING;
