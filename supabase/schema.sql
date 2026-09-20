-- ==============================================================================
-- Ministry Database Schema for Supabase (PostgreSQL)
-- 봉사 보고 및 전도인 관리 시스템 통합 DDL & 초기 시드 데이터
-- ==============================================================================

-- 확장 기능 활성화 (UUID 생성 등)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 봉사연도 테이블 (Service Years)
-- 예: "2024-2025", "2025-2026"
CREATE TABLE IF NOT EXISTS public.service_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year_name VARCHAR(20) NOT NULL UNIQUE,
    is_current BOOLEAN DEFAULT false,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 봉사 집단 테이블 (Groups)
-- 예: 1집단, 2집단, 3집단 ...
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    overseer_name VARCHAR(50),
    assistant_overseer_name VARCHAR(50),
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 전도인 명단 테이블 (Publishers)
-- 기존 '전체명단' 시트 대체
CREATE TABLE IF NOT EXISTS public.publishers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    gender VARCHAR(10) CHECK (gender IN ('남', '여')),
    birth_date DATE,
    baptism_date DATE,
    hope VARCHAR(30) DEFAULT '다른 양' CHECK (hope IN ('다른 양', '기름부음받은 자', '기타')),
    position VARCHAR(30) DEFAULT '일반' CHECK (position IN ('장로', '봉사의 종', '봉종', '전도인', '미침', '일반')),
    pioneer_status VARCHAR(30) DEFAULT '일반' CHECK (pioneer_status IN ('일반', 'RP', 'AP', 'SP', 'FM')),
    phone VARCHAR(50),
    emergency_phone VARCHAR(50),
    relationship VARCHAR(50),
    address TEXT,
    family_head VARCHAR(50),
    special_notes TEXT,
    is_active BOOLEAN DEFAULT true,
    deactivated_reason TEXT,
    deactivated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_publisher_name UNIQUE (name)
);

-- 4. 월별 마감 상태 테이블 (Monthly Statuses)
-- 기존 '집계' 시트의 K열 마감 상태 대체
CREATE TABLE IF NOT EXISTS public.monthly_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_year_id UUID NOT NULL REFERENCES public.service_years(id) ON DELETE CASCADE,
    month VARCHAR(10) NOT NULL CHECK (month IN ('9월', '10월', '11월', '12월', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월')),
    is_closed BOOLEAN DEFAULT false,
    closed_at TIMESTAMPTZ,
    closed_by VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_year_month_status UNIQUE (service_year_id, month)
);

-- 5. 월별 봉사 보고서 테이블 (Monthly Reports)
-- 기존 각 월별 시트('9월', '10월' ...) 통합 대체
CREATE TABLE IF NOT EXISTS public.monthly_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_year_id UUID NOT NULL REFERENCES public.service_years(id) ON DELETE CASCADE,
    publisher_id UUID NOT NULL REFERENCES public.publishers(id) ON DELETE CASCADE,
    month VARCHAR(10) NOT NULL CHECK (month IN ('9월', '10월', '11월', '12월', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월')),
    participated BOOLEAN DEFAULT true,
    hours NUMERIC(5, 1) DEFAULT 0,
    bible_studies INT DEFAULT 0,
    remarks JSONB DEFAULT '[]'::JSONB, -- [{ "type": "원격봉사", "hours": "5", "etc": "" }]
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_publisher_monthly_report UNIQUE (service_year_id, publisher_id, month)
);

-- 6. 관리자 계정 및 권한 테이블 (Managers)
-- 기존 '집단명' 시트 대체
CREATE TABLE IF NOT EXISTS public.managers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super', 'congregation', 'group')), -- super: 최고관리자, congregation: 회중관리자(서기), group: 집단관리자
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL, -- 집단관리자의 경우 해당 집단
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 인덱스 생성 (성능 최적화)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_publishers_group ON public.publishers(group_id);
CREATE INDEX IF NOT EXISTS idx_publishers_active ON public.publishers(is_active);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_year_month ON public.monthly_reports(service_year_id, month);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_publisher ON public.monthly_reports(publisher_id);
CREATE INDEX IF NOT EXISTS idx_monthly_statuses_lookup ON public.monthly_statuses(service_year_id, month);

-- ==============================================================================
-- RLS (Row Level Security) 설정 및 Public 익명 권한 허용 (필요에 맞게 조정 가능)
-- ==============================================================================
ALTER TABLE public.service_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;

-- 익명(Anon) 및 인증(Authenticated) 사용자에게 기본 읽기/쓰기 허용 정책
CREATE POLICY "Allow public read on service_years" ON public.service_years FOR SELECT USING (true);
CREATE POLICY "Allow public write on service_years" ON public.service_years FOR ALL USING (true);

CREATE POLICY "Allow public read on groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Allow public write on groups" ON public.groups FOR ALL USING (true);

CREATE POLICY "Allow public read on publishers" ON public.publishers FOR SELECT USING (true);
CREATE POLICY "Allow public write on publishers" ON public.publishers FOR ALL USING (true);

CREATE POLICY "Allow public read on monthly_statuses" ON public.monthly_statuses FOR SELECT USING (true);
CREATE POLICY "Allow public write on monthly_statuses" ON public.monthly_statuses FOR ALL USING (true);

CREATE POLICY "Allow public read on monthly_reports" ON public.monthly_reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on monthly_reports" ON public.monthly_reports FOR ALL USING (true);

CREATE POLICY "Allow public read on managers" ON public.managers FOR SELECT USING (true);
CREATE POLICY "Allow public write on managers" ON public.managers FOR ALL USING (true);

-- ==============================================================================
-- 초기 시드 데이터 (기본 봉사연도, 집단, 마감상태, 샘플 전도인 및 관리자)
-- ==============================================================================

-- 1. 봉사연도 삽입
INSERT INTO public.service_years (year_name, is_current, start_date, end_date)
VALUES 
    ('2024-2025', true, '2024-09-01', '2025-08-31'),
    ('2025-2026', false, '2025-09-01', '2026-08-31')
ON CONFLICT (year_name) DO NOTHING;

-- 2. 기본 집단 삽입
INSERT INTO public.groups (name, overseer_name, display_order)
VALUES 
    ('1집단', '김인도', 1),
    ('2집단', '이인도', 2),
    ('3집단', '박인도', 3),
    ('4집단', '최인도', 4)
ON CONFLICT (name) DO NOTHING;

-- 3. 2024-2025 봉사연도 12개월 마감 상태 기본값(모두 오픈) 생성
DO $$
DECLARE
    sy_id UUID;
    m TEXT;
BEGIN
    SELECT id INTO sy_id FROM public.service_years WHERE year_name = '2024-2025' LIMIT 1;
    IF sy_id IS NOT NULL THEN
        FOREACH m IN ARRAY ARRAY['9월', '10월', '11월', '12월', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월']
        LOOP
            INSERT INTO public.monthly_statuses (service_year_id, month, is_closed)
            VALUES (sy_id, m, false)
            ON CONFLICT (service_year_id, month) DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- 4. 샘플 전도인 생성
DO $$
DECLARE
    g1 UUID;
    g2 UUID;
BEGIN
    SELECT id INTO g1 FROM public.groups WHERE name = '1집단' LIMIT 1;
    SELECT id INTO g2 FROM public.groups WHERE name = '2집단' LIMIT 1;

    INSERT INTO public.publishers (name, group_id, gender, birth_date, baptism_date, hope, position, pioneer_status)
    VALUES 
        ('홍길동', g1, '남', '1985-05-12', '2005-08-20', '다른 양', '장로', '일반'),
        ('김전도', g1, '남', '1992-11-03', '2010-06-15', '다른 양', '봉사의 종', 'RP'),
        ('이영희', g1, '여', '1990-03-22', '2008-04-10', '다른 양', '일반', '일반'),
        ('박봉사', g2, '남', '1978-01-19', '1998-02-14', '다른 양', '장로', '일반'),
        ('최순종', g2, '여', '1995-09-08', '2014-07-25', '다른 양', '일반', 'AP')
    ON CONFLICT (name) DO NOTHING;
END $$;

-- 5. 기본 관리자 등록 (최고관리자 및 집단관리자 예시)
DO $$
DECLARE
    g1 UUID;
BEGIN
    SELECT id INTO g1 FROM public.groups WHERE name = '1집단' LIMIT 1;

    INSERT INTO public.managers (email, name, role, group_id)
    VALUES 
        ('admin@example.com', '최고관리자', 'super', NULL),
        ('group1@example.com', '1집단감독자', 'group', g1)
    ON CONFLICT (email) DO NOTHING;
END $$;
