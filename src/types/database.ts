// Database & Model Type Definitions for Ministry System

export type Gender = '남' | '여';
export type Hope = '다른 양' | '기름부음받은 자' | '기타';
export type Position = '장로' | '봉사의 종' | '봉종' | '전도인' | '미침' | '일반';
export type PioneerStatus = '일반' | 'RP' | 'AP' | 'SP' | 'FM' | '자녀' | '자녀 (집계 제외)';

export const isChildStatus = (status?: string | null): boolean => {
  if (!status) return false;
  return status === '자녀' || status === '자녀 (집계 제외)' || status.includes('자녀');
};
export type ManagerRole = 'super' | 'group';

export type ServiceMonth = 
  | '9월' | '10월' | '11월' | '12월' 
  | '1월' | '2월' | '3월' | '4월' 
  | '5월' | '6월' | '7월' | '8월';

export const SERVICE_MONTHS: ServiceMonth[] = [
  '9월', '10월', '11월', '12월', 
  '1월', '2월', '3월', '4월', 
  '5월', '6월', '7월', '8월'
];

/**
 * 현재 실제 날짜 및 봉사연도 기간을 기준으로 가장 적합한 봉사연도 월(ServiceMonth)을 반환합니다.
 * - 이미 종료된 과거 봉사연도(예: 2026 봉사연도는 2026년 8월 31일 종료): 마지막 달인 '8월'
 * - 아직 시작되지 않은 미래 봉사연도: 첫 달인 '9월'
 * - 현재 진행 중인 봉사연도(예: 2026년 9월 시점의 2027 봉사연도):
 *   - 9월인 경우: 봉사연도의 첫 달이므로 1~20일이라도 새 봉사연도 기준 '9월'을 기본 표시
 *   - 10월~8월인 경우: 1~20일은 직전 월 보고 수합 기간, 21일 이후는 당월
 */
export const getCurrentDateServiceMonth = (serviceYearName?: string): ServiceMonth => {
  const now = new Date();
  const currentCalMonth = now.getMonth() + 1; // 1 ~ 12
  const date = now.getDate();

  if (serviceYearName) {
    const syNum = parseInt(serviceYearName, 10);
    if (!isNaN(syNum)) {
      const syStartDate = new Date(syNum - 1, 8, 1); // (syNum - 1)년 9월 1일 00:00:00
      const syEndDate = new Date(syNum, 7, 31, 23, 59, 59); // syNum년 8월 31일 23:59:59

      // 1) 해당 봉사연도가 이미 지난 과거 연도인 경우 -> 마지막 달인 '8월'
      if (now > syEndDate) {
        return '8월';
      }

      // 2) 해당 봉사연도가 아직 시작되지 않은 미래 연도인 경우 -> 첫 달인 '9월'
      if (now < syStartDate) {
        return '9월';
      }

      // 3) 현재 진행 중인 봉사연도인 경우:
      // 9월에는 새 봉사연도가 막 시작되었으므로 1~20일이라도 이 봉사연도 안의 '9월'을 표시
      if (currentCalMonth === 9) {
        return '9월';
      }

      // 10월~12월, 1월~8월:
      // 매월 1~20일은 직전 월(예: 10월 초 -> 9월 보고 수합), 21일 이후는 당월
      if (date <= 20) {
        const prevMonth = currentCalMonth === 1 ? 12 : currentCalMonth - 1;
        return `${prevMonth}월` as ServiceMonth;
      } else {
        return `${currentCalMonth}월` as ServiceMonth;
      }
    }
  }

  // serviceYearName이 전달되지 않은 경우의 fallback
  let targetMonthNum: number;
  if (currentCalMonth === 9) {
    targetMonthNum = 9;
  } else if (date <= 20) {
    targetMonthNum = currentCalMonth === 1 ? 12 : currentCalMonth - 1;
  } else {
    targetMonthNum = currentCalMonth;
  }

  const monthStr = `${targetMonthNum}월` as ServiceMonth;
  return SERVICE_MONTHS.includes(monthStr) ? monthStr : '9월';
};

export interface ServiceYear {
  id: string;
  year_name: string;
  is_current: boolean;
  start_date?: string;
  end_date?: string;
  created_at?: string;
}

export interface Group {
  id: string;
  name: string;
  overseer_name?: string;
  assistant_overseer_name?: string;
  display_order: number;
}

export interface Publisher {
  id: string;
  name: string;
  group_id?: string | null;
  group_name?: string;
  gender?: Gender;
  birth_date?: string;
  baptism_date?: string;
  hope?: Hope;
  position?: Position;
  pioneer_status?: PioneerStatus;
  phone?: string;
  emergency_phone?: string;
  relationship?: string;
  address?: string;
  family_head?: string;
  special_notes?: string;
  is_active: boolean;
  deactivated_reason?: string;
  deactivated_at?: string;
  created_at?: string;
}

export interface EmergencyContact {
  id: string;
  publisher_id?: string;
  name: string;
  group_id?: string | null;
  group_name?: string;
  birth_date?: string;
  baptism_date?: string;
  gender?: Gender;
  hope?: Hope;
  position?: string;
  rp?: string;
  phone?: string;
  emergency_phone?: string;
  relationship?: string;
  address?: string;
  family_head?: string;
  special_notes?: string;
  is_active: boolean;
  is_child?: boolean;
  updated_at?: string;
}

export interface MonthlyStatus {
  id: string;
  service_year_id: string;
  month: ServiceMonth;
  is_closed: boolean;
  closed_at?: string;
  closed_by?: string;
}

export interface RemarkItem {
  type: string;
  hours: string;
  etc?: string;
}

export interface MonthlyReport {
  id: string;
  service_year_id: string;
  publisher_id: string;
  publisher_name?: string;
  group_name?: string;
  position?: string;
  pioneer_status?: string;
  month: ServiceMonth;
  participated: boolean;
  hours: number;
  bible_studies: number;
  remarks: RemarkItem[];
  submitted_at: string;
  updated_at?: string;
}

export interface Manager {
  id: string;
  email: string;
  name: string;
  role: ManagerRole;
  group_id?: string | null;
  group_name?: string;
}

export interface MonthlyKpiStats {
  totalPublishers: number;
  totalReporters: number;
  totalSubmitted?: number;
  unsharedCount?: number;
  reportRate: number;
  totalBibleStudies: number;
  totalHours: number;
  publisherCount: number;
  publisherStudies: number;
  rpCount: number;
  rpHours: number;
  rpStudies: number;
  apCount: number;
  apHours: number;
  apStudies: number;
}

export interface YearlyPublisherRecord {
  userInfo: {
    name: string;
    birthDate: string;
    gender: string;
    baptismDate: string;
    hope: string;
    isElder: boolean;
    isMinisterialServant: boolean;
    isRegularPioneer: boolean;
    isSpecialPioneer: boolean;
    isMissionary: boolean;
    isChild?: boolean;
    groupName?: string;
  };
  monthlyRecords: Array<{
    month: ServiceMonth;
    participated: boolean;
    bibleStudies: number;
    hours: number;
    remarks: string;
    division?: string;
  }>;
  totals: {
    totalHours: number;
    totalStudies: number;
    activeMonths: number;
    averageHours: number;
    averageStudies: number;
  };
}
