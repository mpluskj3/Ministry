import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Lock, 
  Unlock, 
  UserX, 
  Download, 
  Search, 
  Calendar, 
  Filter,
  Building2,
  Copy,
  Check,
  ArrowUpRight,
  TrendingUp,
  FileText,
  AlertTriangle,
  AlertCircle,
  Edit2,
  BarChart3,
  Layers,
  Table,
  Award,
  Target,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ChevronDown,
  Printer,
  FileBarChart,
  Edit3,
  Save
} from 'lucide-react';
import { 
  ServiceYear, 
  Group, 
  Manager, 
  MonthlyReport, 
  MonthlyKpiStats, 
  Publisher, 
  ServiceMonth, 
  SERVICE_MONTHS,
  isChildStatus,
  getCurrentDateServiceMonth
} from '../types/database';
import { 
  getMonthlyReports, 
  getMonthlyKpiStats, 
  getMonthlyStatuses, 
  toggleMonthStatus, 
  getGroups, 
  getUnreportedMembers,
  batchCloseUnreportedPublishers,
  getAllServiceYearReports,
  getPublishers
} from '../services/ministryService';
import { UnreportedListModal } from './UnreportedListModal';
import { PublisherCardModal } from './PublisherCardModal';
import { ReportEditModal } from './ReportEditModal';

interface DashboardProps {
  currentYear: ServiceYear;
  manager: Manager | null;
  selectedGroupId: string;
  onSelectGroup: (groupId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  currentYear, 
  manager,
  selectedGroupId,
  onSelectGroup
}) => {
  const [selectedMonth, setSelectedMonth] = useState<ServiceMonth>(() => getCurrentDateServiceMonth(currentYear?.year_name));
  const [viewMode, setViewMode] = useState<'yearly' | 'pioneers' | 'monthly' | 'analysis'>('yearly');
  const [groups, setGroups] = useState<Group[]>([]);
  const [allPublishers, setAllPublishers] = useState<Publisher[]>([]);
  const [kpiStats, setKpiStats] = useState<MonthlyKpiStats | null>(null);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [allYearReports, setAllYearReports] = useState<MonthlyReport[]>([]);
  const [statuses, setStatuses] = useState<Record<ServiceMonth, boolean>>({} as any);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pioneerSearchQuery, setPioneerSearchQuery] = useState('');
  const [congregationName, setCongregationName] = useState(() => localStorage.getItem('ministry_congregation_name') || '춘천남부 회중');
  
  // 주말 및 평일 집회 참석자 수
  const [meetingAttendance, setMeetingAttendance] = useState<string>(() => {
    return localStorage.getItem(`ministry_attendance_${currentYear.id}_${getCurrentDateServiceMonth(currentYear?.year_name)}`) || '0';
  });
  const [weekdayMeetingAttendance, setWeekdayMeetingAttendance] = useState<string>(() => {
    return localStorage.getItem(`ministry_attendance_weekday_${currentYear.id}_${getCurrentDateServiceMonth(currentYear?.year_name)}`) || '0';
  });

  // 회중 분석 보고 수동 오버라이드 및 수정 모달 상태
  const [analysisOverrides, setAnalysisOverrides] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem(`ministry_analysis_${currentYear.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [analysisEditModalOpen, setAnalysisEditModalOpen] = useState(false);
  const [analysisForm, setAnalysisForm] = useState<Record<string, any>>({});

  // 봉사연도 변경 시 선택 월 자동 갱신
  useEffect(() => {
    setSelectedMonth(getCurrentDateServiceMonth(currentYear?.year_name));
  }, [currentYear?.id, currentYear?.year_name]);

  // 회중명 변경 감지
  useEffect(() => {
    const handleNameChange = (e: any) => {
      if (e?.detail) {
        setCongregationName(e.detail);
      } else {
        setCongregationName(localStorage.getItem('ministry_congregation_name') || '춘천남부 회중');
      }
    };
    window.addEventListener('congregation_name_changed', handleNameChange);
    return () => window.removeEventListener('congregation_name_changed', handleNameChange);
  }, []);

  // 월 및 연도 변경 시 주말/평일 집회 참석자 수 및 분석 보고 불러오기
  useEffect(() => {
    const storedWeekend = localStorage.getItem(`ministry_attendance_${currentYear.id}_${selectedMonth}`);
    setMeetingAttendance(storedWeekend || '0');
    const storedWeekday = localStorage.getItem(`ministry_attendance_weekday_${currentYear.id}_${selectedMonth}`);
    setWeekdayMeetingAttendance(storedWeekday || '0');
  }, [currentYear.id, selectedMonth]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`ministry_analysis_${currentYear.id}`);
      setAnalysisOverrides(saved ? JSON.parse(saved) : {});
    } catch {
      setAnalysisOverrides({});
    }
  }, [currentYear.id]);

  // 집단별 통계 데이터 (우측 위젯용)
  const [groupStatsList, setGroupStatsList] = useState<Array<{
    groupId: string;
    groupName: string;
    total: number;
    reported: number;
    rate: number;
  }>>([]);

  // 미보고자 명단
  const [unreportedList, setUnreportedList] = useState<Publisher[]>([]);
  const [unreportedModalOpen, setUnreportedModalOpen] = useState(false);
  const [copiedReminder, setCopiedReminder] = useState(false);
  const [copiedSubmitLink, setCopiedSubmitLink] = useState(false);

  // 보고 마감 모달 및 상태
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  // 전도인 기록 카드 모달
  const [cardModalData, setCardModalData] = useState<{ id: string; name: string } | null>(null);

  // 관리자 보고서 작성/수정 모달
  const [editModalData, setEditModalData] = useState<{
    publisher: {
      id: string;
      name: string;
      group_name?: string;
      position?: string;
      pioneer_status?: string;
    };
    month: ServiceMonth;
    existingReport?: MonthlyReport | null;
  } | null>(null);

  // 집단 관리자일 경우 본인 소속 집단으로 강제 고정
  const effectiveGroupId = manager?.role === 'group'
    ? (manager.group_id || groups.find(g => g.name === manager.group_name)?.id || selectedGroupId)
    : selectedGroupId;

  const isClosed = !!statuses[selectedMonth];
  const canManageClosing = manager?.role === 'super' || !manager;
  const isSuperAdmin = manager?.role === 'super' || (!manager && import.meta.env.DEV);

  // 최고관리자가 아닌 경우 '회중 분석 보고' 뷰에 머무르지 못하도록 방어
  useEffect(() => {
    if (viewMode === 'analysis' && !isSuperAdmin) {
      setViewMode('yearly');
    }
  }, [viewMode, isSuperAdmin]);

  // 월별 세부 보고서 정렬 및 필터 상태 (기본값: 성명 이름순 오름차순)
  type MonthlySortField = 'publisher_name' | 'participated' | 'bible_studies' | 'hours' | 'remarks' | 'pioneer_status' | 'position' | 'group_name';
  const [monthlySortField, setMonthlySortField] = useState<MonthlySortField>('publisher_name');
  const [monthlySortOrder, setMonthlySortOrder] = useState<'asc' | 'desc'>('asc');

  // 필터 상태
  const [filterParticipated, setFilterParticipated] = useState<string>('all'); // 'all', 'yes', 'no'
  const [filterPioneerStatus, setFilterPioneerStatus] = useState<string>('all'); // 'all', 'RP', 'AP', '일반', '자녀'
  const [filterPosition, setFilterPosition] = useState<string>('all'); // 'all', '장로', '봉종', '일반'
  const [filterGroup, setFilterGroup] = useState<string>('all'); // 'all', group_name
  const [filterRemarks, setFilterRemarks] = useState<string>('all'); // 'all', 'has_remarks', 'no_remarks'

  // 정규파이오니아(RP) 통계 정렬 및 집단 필터 상태
  type RpSortField = 'name' | 'totalHours' | 'totalRemarkHours' | 'avgHours' | 'studies' | 'progressRate';
  const [rpSortField, setRpSortField] = useState<RpSortField>('progressRate');
  const [rpSortOrder, setRpSortOrder] = useState<'asc' | 'desc'>('desc');
  const [rpFilterGroup, setRpFilterGroup] = useState<string>('all'); // 'all' or group_name
  const [activeRpHeaderDropdown, setActiveRpHeaderDropdown] = useState<string | null>(null);

  const handleRpSort = (field: RpSortField) => {
    if (rpSortField === field) {
      setRpSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setRpSortField(field);
      setRpSortOrder(field === 'name' ? 'asc' : 'desc');
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const groupsData = await getGroups();
      setGroups(groupsData);

      const targetGroupId = manager?.role === 'group'
        ? (manager.group_id || groupsData.find(g => g.name === manager.group_name)?.id || selectedGroupId)
        : selectedGroupId;

      const [monthStatuses, kpi, reportList, unreported, allReports, pubs] = await Promise.all([
        getMonthlyStatuses(currentYear.id),
        getMonthlyKpiStats(currentYear.id, selectedMonth, targetGroupId === 'all' ? undefined : targetGroupId),
        getMonthlyReports(currentYear.id, selectedMonth),
        getUnreportedMembers(currentYear.id, selectedMonth, targetGroupId === 'all' ? undefined : targetGroupId),
        getAllServiceYearReports(currentYear.id),
        getPublishers(true),
      ]);

      setStatuses(monthStatuses);
      setKpiStats(kpi);
      setUnreportedList(unreported);
      setAllYearReports(allReports);
      setAllPublishers(pubs);

      // 집단 필터링 적용
      let filteredReports = reportList;
      if (targetGroupId !== 'all') {
        const targetGroup = groupsData.find(g => g.id === targetGroupId);
        const targetName = targetGroup?.name || manager?.group_name;
        if (targetName) {
          filteredReports = reportList.filter((r: MonthlyReport) => r.group_name === targetName);
        }
      }
      setReports(filteredReports);

      // 각 집단별 진척도 계산
      const gStats = await Promise.all(
        groupsData.map(async (g) => {
          const gKpi = await getMonthlyKpiStats(currentYear.id, selectedMonth, g.id);
          return {
            groupId: g.id,
            groupName: g.name,
            total: gKpi.totalPublishers,
            reported: gKpi.totalSubmitted ?? gKpi.totalReporters,
            rate: gKpi.reportRate,
          };
        })
      );
      setGroupStatsList(gStats);

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentYear.id, selectedMonth, selectedGroupId, manager]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // 마감 상태 토글
  const handleToggleStatus = async () => {
    if (isClosed) {
      if (!window.confirm(`${selectedMonth} 보고 마감을 해제하시겠습니까?`)) return;
      try {
        const newStatus = await toggleMonthStatus(currentYear.id, selectedMonth);
        setStatuses(prev => ({ ...prev, [selectedMonth]: newStatus }));
        await loadDashboardData();
      } catch (err: any) {
        alert('마감 상태 변경 실패: ' + (err.message || '오류'));
      }
      return;
    }

    // 마감 전 주말 집회 평균 참석자 수 누락 여부 사전 검증
    const attNum = Number(meetingAttendance || 0);
    if (attNum === 0) {
      const confirmProceed = window.confirm(
        `⚠️ [주말 집회 평균 참석자 수 누락]\n\n${selectedMonth} 주말 집회 평균 참석자 수가 아직 입력되지 않았습니다 (현재: 0명).\n\n• [확인]: 참석자 수 0명인 상태로 계속 마감 진행\n• [취소]: 마감 중단 후 참석자 수 입력하기`
      );
      if (!confirmProceed) {
        handleEditWeekendAttendance();
        return;
      }
    }

    // 마감(완료)하려는 경우: 미보고자가 있는지 확인
    if (unreportedList.length > 0) {
      setCloseModalOpen(true);
    } else {
      if (!window.confirm(`전도인 전원 보고가 완료되었습니다. ${selectedMonth} 보고를 마감하시겠습니까?`)) return;
      try {
        const newStatus = await toggleMonthStatus(currentYear.id, selectedMonth);
        setStatuses(prev => ({ ...prev, [selectedMonth]: newStatus }));
        await loadDashboardData();
      } catch (err: any) {
        alert('마감 실패: ' + (err.message || '오류'));
      }
    }
  };

  // 미보고자 전원 봉사 미참여(N) 기록 후 완료 처리
  const handleCloseWithUnreported = async () => {
    setClosing(true);
    try {
      await batchCloseUnreportedPublishers(currentYear.id, selectedMonth, unreportedList);
      setCloseModalOpen(false);
      await loadDashboardData();
      alert(`${selectedMonth} 미보고자(${unreportedList.length}명)를 '봉사 미참여(N)'로 일괄 등록하고 보고를 최종 마감 완료하였습니다.`);
    } catch (err: any) {
      alert('마감 처리 실패: ' + (err.message || '오류'));
    } finally {
      setClosing(false);
    }
  };

  // 미보고자 보고서 생성 없이 현재 상태 그대로 마감
  const handleCloseWithoutUnreported = async () => {
    setClosing(true);
    try {
      const newStatus = await toggleMonthStatus(currentYear.id, selectedMonth);
      setStatuses(prev => ({ ...prev, [selectedMonth]: newStatus }));
      setCloseModalOpen(false);
      await loadDashboardData();
    } catch (err: any) {
      alert('마감 실패: ' + (err.message || '오류'));
    } finally {
      setClosing(false);
    }
  };

  // 미보고자 알림 문구 복사 (작성 링크 포함)
  const handleCopyReminder = () => {
    const names = unreportedList.map(p => p.name).join(', ');
    const submitUrl = `${window.location.origin}${window.location.pathname}?mode=submit`;
    const text = `[봉사 보고 안내]
안녕하세요. ${selectedMonth} 야외 봉사 보고 기간입니다.
현재까지 보고가 확인되지 않은 형제자매들(${names})께서는 번거로우시더라도 아래 링크를 통해 오늘 중으로 봉사 보고서를 제출해주시기 바랍니다.

🔗 보고서 작성 링크:
${submitUrl}

감사합니다!`;
    navigator.clipboard.writeText(text);
    setCopiedReminder(true);
    setTimeout(() => setCopiedReminder(false), 2500);
  };

  // 전도인 봉사 보고 제출 페이지 링크 복사
  const handleCopySubmitLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?mode=submit`;
    navigator.clipboard.writeText(url);
    setCopiedSubmitLink(true);
    setTimeout(() => setCopiedSubmitLink(false), 2500);
  };

  const handleSort = (field: MonthlySortField) => {
    if (monthlySortField === field) {
      setMonthlySortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setMonthlySortField(field);
      // 숫자 관련 항목은 첫 클릭 시 큰 값(내림차순)부터, 텍스트는 오름차순(가나다순)부터
      if (field === 'hours' || field === 'bible_studies' || field === 'remarks') {
        setMonthlySortOrder('desc');
      } else {
        setMonthlySortOrder('asc');
      }
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterParticipated('all');
    setFilterPioneerStatus('all');
    setFilterPosition('all');
    setFilterGroup('all');
    setFilterRemarks('all');
    setMonthlySortField('publisher_name');
    setMonthlySortOrder('asc');
  };

  // Column Header Filter Dropdown Popover State
  const [activeHeaderDropdown, setActiveHeaderDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveHeaderDropdown(null);
      setActiveRpHeaderDropdown(null);
    };
    if (activeHeaderDropdown || activeRpHeaderDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeHeaderDropdown, activeRpHeaderDropdown]);

  const isFilterActive = searchQuery.trim() !== '' || 
    filterParticipated !== 'all' || 
    filterPioneerStatus !== 'all' || 
    filterPosition !== 'all' || 
    filterGroup !== 'all' || 
    filterRemarks !== 'all';

  const displayReports = useMemo(() => {
    // 1. 필터링
    let result = reports.filter(r => {
      // 성명 또는 집단 검색
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const nameMatch = (r.publisher_name || '').toLowerCase().includes(q);
        const groupMatch = (r.group_name || '').toLowerCase().includes(q);
        if (!nameMatch && !groupMatch) return false;
      }

      // 참여 여부 필터
      if (filterParticipated === 'yes' && !r.participated) return false;
      if (filterParticipated === 'no' && r.participated) return false;

      // 구분 필터 (RP가 아닌데 시간 보고가 되어 있다면 AP)
      if (filterPioneerStatus !== 'all') {
        const isChild = isChildStatus(r.pioneer_status);
        const isRp = r.pioneer_status === 'RP';
        const hasHours = Number(r.hours || 0) > 0;
        const effectiveStatus = isChild ? '자녀' : (isRp ? 'RP' : (hasHours ? 'AP' : '일반'));
        if (filterPioneerStatus === 'RP' && effectiveStatus !== 'RP') return false;
        if (filterPioneerStatus === 'AP' && effectiveStatus !== 'AP') return false;
        if (filterPioneerStatus === '자녀' && effectiveStatus !== '자녀') return false;
        if (filterPioneerStatus === '일반' && effectiveStatus !== '일반') return false;
      }

      // 직책 필터
      if (filterPosition !== 'all') {
        if (filterPosition === '장로' && r.position !== '장로') return false;
        if (filterPosition === '봉종' && r.position !== '봉종' && r.position !== '봉사의 종') return false;
        if (filterPosition === '일반' && r.position && r.position !== '일반') return false;
      }

      // 집단 필터
      if (filterGroup !== 'all') {
        if (r.group_name !== filterGroup) return false;
      }

      // 비고 필터
      if (filterRemarks === 'has_remarks') {
        const has = Array.isArray(r.remarks) && r.remarks.length > 0;
        if (!has) return false;
      } else if (filterRemarks === 'no_remarks') {
        const has = Array.isArray(r.remarks) && r.remarks.length > 0;
        if (has) return false;
      }

      return true;
    });

    // 2. 비고 시간 계산 헬퍼
    const getRemarkHours = (rep: MonthlyReport) => {
      if (!Array.isArray(rep.remarks) || rep.remarks.length === 0) return 0;
      return rep.remarks.reduce((acc, rem: any) => acc + (parseFloat(String(rem?.hours || 0)) || 0), 0);
    };

    // 구분 순위 헬퍼 (정렬용)
    const getPioneerRank = (status?: string) => {
      if (status === 'RP') return 1;
      if (status === 'AP') return 2;
      if (isChildStatus(status)) return 4;
      return 3; // 일반 전도인
    };

    // 직책 순위 헬퍼 (정렬용)
    const getPositionRank = (pos?: string) => {
      if (pos === '장로') return 1;
      if (pos === '봉사의 종' || pos === '봉종') return 2;
      return 3; // 일반
    };

    // 3. 정렬 (기본값: publisher_name 이름순 오름차순)
    result.sort((a, b) => {
      let cmp = 0;
      switch (monthlySortField) {
        case 'publisher_name':
          cmp = (a.publisher_name || '').localeCompare(b.publisher_name || '', 'ko-KR');
          break;
        case 'participated':
          cmp = (a.participated ? 1 : 0) - (b.participated ? 1 : 0);
          break;
        case 'bible_studies':
          cmp = (Number(a.bible_studies) || 0) - (Number(b.bible_studies) || 0);
          break;
        case 'hours':
          cmp = (Number(a.hours) || 0) - (Number(b.hours) || 0);
          break;
        case 'remarks': {
          const aRem = getRemarkHours(a);
          const bRem = getRemarkHours(b);
          cmp = aRem - bRem || (a.remarks?.[0]?.type || '').localeCompare(b.remarks?.[0]?.type || '', 'ko-KR');
          break;
        }
        case 'pioneer_status': {
          const getEff = (rep: MonthlyReport) => {
            if (isChildStatus(rep.pioneer_status)) return '자녀';
            if (rep.pioneer_status === 'RP') return 'RP';
            if (Number(rep.hours || 0) > 0) return 'AP';
            return '일반';
          };
          cmp = getPioneerRank(getEff(a)) - getPioneerRank(getEff(b));
          break;
        }
        case 'position':
          cmp = getPositionRank(a.position) - getPositionRank(b.position);
          break;
        case 'group_name':
          cmp = (a.group_name || '').localeCompare(b.group_name || '', 'ko-KR');
          break;
        default:
          cmp = (a.publisher_name || '').localeCompare(b.publisher_name || '', 'ko-KR');
      }

      if (monthlySortOrder === 'desc') {
        cmp = -cmp;
      }

      // 동률일 경우 항상 성명 오름차순으로 2차 정렬
      if (cmp === 0) {
        return (a.publisher_name || '').localeCompare(b.publisher_name || '', 'ko-KR');
      }
      return cmp;
    });

    return result;
  }, [reports, searchQuery, filterParticipated, filterPioneerStatus, filterPosition, filterGroup, filterRemarks, monthlySortField, monthlySortOrder]);

  // CSV 다운로드
  const handleExportCsv = () => {
    if (displayReports.length === 0) {
      alert('내보낼 보고서 데이터가 없습니다.');
      return;
    }
    const headers = ['이름', '참여', '성서연구', '봉사시간', '비고', '구분', '직책', '집단'];
    const rows = displayReports.map(r => [
      r.publisher_name || '',
      r.participated ? 'Y' : 'N',
      r.bible_studies || 0,
      r.hours || 0,
      (r.remarks || []).map(rm => `${rm.type}: ${rm.hours}시간`).join(' '),
      r.pioneer_status === 'RP' 
        ? 'RP' 
        : (Number(r.hours || 0) > 0 ? 'AP' : (isChildStatus(r.pioneer_status) ? '자녀' : '전도인')),
      r.position && r.position !== '일반' ? (r.position === '봉사의 종' ? '봉종' : r.position) : '',
      r.group_name || '',
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedMonth}_봉사보고집계_${currentYear.year_name}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // 1년 종합 통계 계산 (전도인, 보조, 정규 구분)
  // -------------------------------------------------------------
  const yearlyStats = SERVICE_MONTHS.map(m => {
    let mReports = allYearReports.filter(r => r.month === m);
    if (effectiveGroupId !== 'all') {
      const gName = groups.find(g => g.id === effectiveGroupId)?.name || manager?.group_name;
      if (gName) {
        mReports = mReports.filter(r => r.group_name === gName);
      }
    }

    let publisherCount = 0;
    let publisherStudies = 0;
    let apCount = 0;
    let apHours = 0;
    let apStudies = 0;
    let rpCount = 0;
    let rpHours = 0;
    let rpStudies = 0;

    mReports.forEach(r => {
      if (r.participated) {
        const hasHours = Number(r.hours || 0) > 0;
        const isRp = r.pioneer_status === 'RP';
        if (isRp) {
          rpCount++;
          rpHours += Number(r.hours || 0);
          rpStudies += Number(r.bible_studies || 0);
        } else if (hasHours) {
          apCount++;
          apHours += Number(r.hours || 0);
          apStudies += Number(r.bible_studies || 0);
        } else if (!isChildStatus(r.pioneer_status)) {
          publisherCount++;
          publisherStudies += Number(r.bible_studies || 0);
        }
      }
    });

    const totalReporters = publisherCount + apCount + rpCount;

    return {
      month: m,
      totalReporters,
      publisherCount,
      publisherStudies,
      apCount,
      apHours,
      apStudies,
      rpCount,
      rpHours,
      rpStudies,
      isClosed: !!statuses[m]
    };
  });

  // -------------------------------------------------------------
  // 1년 종합 통계 각 항목별 연간 합계 및 월평균 계산
  // -------------------------------------------------------------
  const yearlySummaryStats = useMemo(() => {
    const reportedMonths = yearlyStats.filter(r => r.totalReporters > 0);
    const mCount = reportedMonths.length > 0 ? reportedMonths.length : 1;

    const sumTotalReporters = yearlyStats.reduce((acc, r) => acc + r.totalReporters, 0);
    const sumPublisherCount = yearlyStats.reduce((acc, r) => acc + r.publisherCount, 0);
    const sumPublisherStudies = yearlyStats.reduce((acc, r) => acc + r.publisherStudies, 0);
    const sumApCount = yearlyStats.reduce((acc, r) => acc + r.apCount, 0);
    const sumApHours = yearlyStats.reduce((acc, r) => acc + r.apHours, 0);
    const sumApStudies = yearlyStats.reduce((acc, r) => acc + r.apStudies, 0);
    const sumRpCount = yearlyStats.reduce((acc, r) => acc + r.rpCount, 0);
    const sumRpHours = yearlyStats.reduce((acc, r) => acc + r.rpHours, 0);
    const sumRpStudies = yearlyStats.reduce((acc, r) => acc + r.rpStudies, 0);

    const sumTotalHours = sumApHours + sumRpHours;
    const sumTotalStudies = sumPublisherStudies + sumApStudies + sumRpStudies;

    const avgTotalReporters = Math.round((sumTotalReporters / mCount) * 10) / 10;
    const avgPublisherCount = Math.round((sumPublisherCount / mCount) * 10) / 10;
    const avgPublisherStudies = Math.round((sumPublisherStudies / mCount) * 10) / 10;
    const avgApCount = Math.round((sumApCount / mCount) * 10) / 10;
    const avgApHours = Math.round((sumApHours / mCount) * 10) / 10;
    const avgApStudies = Math.round((sumApStudies / mCount) * 10) / 10;
    const avgRpCount = Math.round((sumRpCount / mCount) * 10) / 10;
    const avgRpHours = Math.round((sumRpHours / mCount) * 10) / 10;
    const avgRpStudies = Math.round((sumRpStudies / mCount) * 10) / 10;

    const avgTotalHours = Math.round((sumTotalHours / mCount) * 10) / 10;
    const avgTotalStudies = Math.round((sumTotalStudies / mCount) * 10) / 10;

    return {
      reportedMonthsCount: reportedMonths.length,
      sum: {
        totalReporters: sumTotalReporters,
        publisherCount: sumPublisherCount,
        publisherStudies: sumPublisherStudies,
        apCount: sumApCount,
        apHours: sumApHours,
        apStudies: sumApStudies,
        rpCount: sumRpCount,
        rpHours: sumRpHours,
        rpStudies: sumRpStudies,
        totalHours: sumTotalHours,
        totalStudies: sumTotalStudies
      },
      avg: {
        totalReporters: avgTotalReporters,
        publisherCount: avgPublisherCount,
        publisherStudies: avgPublisherStudies,
        apCount: avgApCount,
        apHours: avgApHours,
        apStudies: avgApStudies,
        rpCount: avgRpCount,
        rpHours: avgRpHours,
        rpStudies: avgRpStudies,
        totalHours: avgTotalHours,
        totalStudies: avgTotalStudies
      }
    };
  }, [yearlyStats]);

  // -------------------------------------------------------------
  // 정규파이오니아 1년 통계 계산 (12개월 실적 및 600h 달성률)
  // -------------------------------------------------------------
  const pioneerStatsData = useMemo(() => {
    // 1. RP 대상자 추출: 등록 상태가 'RP'이거나 해당 봉사연도에 RP 보고 기록이 있는 전도인
    const rpNameMap = new Map<string, { id: string; name: string; group_id: string; group_name: string }>();

    allPublishers.forEach(p => {
      if (p.pioneer_status === 'RP') {
        rpNameMap.set(p.name, {
          id: p.id,
          name: p.name,
          group_id: p.group_id || '',
          group_name: p.group_name || '미배정'
        });
      }
    });

    allYearReports.forEach(r => {
      if (r.pioneer_status === 'RP' && r.publisher_name && !rpNameMap.has(r.publisher_name)) {
        const pub = allPublishers.find(p => p.name === r.publisher_name);
        rpNameMap.set(r.publisher_name, {
          id: pub?.id || r.publisher_id || ('rp-' + r.publisher_name),
          name: r.publisher_name,
          group_id: pub?.group_id || '',
          group_name: pub?.group_name || r.group_name || '미배정'
        });
      }
    });

    // 2. 집단 필터 적용: 상단 집단 필터 및 RP 테이블 자체 집단 필터
    let targetRpList = Array.from(rpNameMap.values());
    if (effectiveGroupId !== 'all') {
      const targetGroup = groups.find(g => g.id === effectiveGroupId);
      const targetGroupName = targetGroup?.name || manager?.group_name;
      targetRpList = targetRpList.filter(rp => 
        rp.group_id === effectiveGroupId || (targetGroupName && rp.group_name === targetGroupName)
      );
    }

    if (rpFilterGroup !== 'all') {
      targetRpList = targetRpList.filter(rp => rp.group_name === rpFilterGroup);
    }

    // 3. 검색어 필터
    if (pioneerSearchQuery.trim()) {
      const q = pioneerSearchQuery.trim().toLowerCase();
      targetRpList = targetRpList.filter(rp => 
        rp.name.toLowerCase().includes(q) || rp.group_name.toLowerCase().includes(q)
      );
    }

    // 4. 각 RP별 12개월 시간 및 통계 매핑
    const rows = targetRpList.map(rp => {
      const rpReports = allYearReports.filter(r => 
        r.publisher_name === rp.name || (rp.id && r.publisher_id === rp.id)
      );
      const monthMap: Record<ServiceMonth, { hours: number; remarkHours: number; studies: number; participated: boolean }> = {} as any;
      let totalHours = 0;
      let totalRemarkHours = 0;
      let totalStudies = 0;
      let activeMonths = 0;

      SERVICE_MONTHS.forEach(m => {
        const rep = rpReports.find(r => r.month === m);
        if (rep) {
          const h = Number(rep.hours || 0);
          const s = Number(rep.bible_studies || 0);

          let remH = 0;
          if (Array.isArray(rep.remarks)) {
            rep.remarks.forEach((rem: any) => {
              const parsed = parseFloat(String(rem?.hours || '0'));
              if (!isNaN(parsed)) remH += parsed;
            });
          }

          monthMap[m] = {
            hours: h,
            remarkHours: remH,
            studies: s,
            participated: !!rep.participated
          };
          if (rep.participated) {
            totalHours += h;
            totalRemarkHours += remH;
            totalStudies += s;
            activeMonths++;
          }
        } else {
          monthMap[m] = { hours: 0, remarkHours: 0, studies: 0, participated: false };
        }
      });

      const totalCombinedHours = totalHours + totalRemarkHours;
      const avgHours = activeMonths > 0 ? Math.round((totalHours / activeMonths) * 10) / 10 : 0;
      const avgStudies = activeMonths > 0 ? (totalStudies / activeMonths).toFixed(1) : '0.0';
      const progressRate = Math.min(Math.round((totalCombinedHours / 600) * 100), 999);
      const isTargetAchieved = totalCombinedHours >= 600;

      return {
        id: rp.id,
        name: rp.name,
        group_name: rp.group_name,
        monthMap,
        totalHours,
        totalRemarkHours,
        totalCombinedHours,
        totalStudies,
        activeMonths,
        avgHours,
        avgStudies,
        progressRate,
        isTargetAchieved
      };
    });

    // 정렬 (이름, 총 시간, 비고 시간, 월평균, 연구, 달성률)
    rows.sort((a, b) => {
      let cmp = 0;
      switch (rpSortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name, 'ko-KR');
          break;
        case 'totalHours':
          cmp = a.totalHours - b.totalHours;
          break;
        case 'totalRemarkHours':
          cmp = a.totalRemarkHours - b.totalRemarkHours;
          break;
        case 'avgHours':
          cmp = a.avgHours - b.avgHours;
          break;
        case 'studies':
          cmp = a.totalStudies - b.totalStudies || parseFloat(a.avgStudies) - parseFloat(b.avgStudies);
          break;
        case 'progressRate':
          cmp = a.totalCombinedHours - b.totalCombinedHours || a.progressRate - b.progressRate;
          break;
        default:
          cmp = a.totalCombinedHours - b.totalCombinedHours;
      }

      if (rpSortOrder === 'desc') {
        cmp = -cmp;
      }

      // 동률일 경우 항상 이름 가나다순으로 2차 정렬
      if (cmp === 0) {
        return a.name.localeCompare(b.name, 'ko-KR');
      }
      return cmp;
    });

    // 5. 전체 합계 및 KPI 요약
    const totalPioneers = rows.length;
    const grandTotalHours = rows.reduce((acc, r) => acc + r.totalHours, 0);
    const grandTotalRemarkHours = rows.reduce((acc, r) => acc + r.totalRemarkHours, 0);
    const grandTotalCombinedHours = grandTotalHours + grandTotalRemarkHours;
    const grandTotalStudies = rows.reduce((acc, r) => acc + r.totalStudies, 0);
    const overallMonthlyAvg = totalPioneers > 0 
      ? Math.round((grandTotalHours / (totalPioneers * 12)) * 10) / 10 
      : 0;
    const overallAvgStudies = totalPioneers > 0 
      ? (grandTotalStudies / (totalPioneers * 12)).toFixed(1) 
      : '0.0';
    const achievedCount = rows.filter(r => r.isTargetAchieved).length;
    const achievementRate = totalPioneers > 0 
      ? Math.round((achievedCount / totalPioneers) * 100) 
      : 0;

    // 월별 총 시간 합계
    const monthlyHourTotals: Record<ServiceMonth, number> = {} as any;
    SERVICE_MONTHS.forEach(m => {
      monthlyHourTotals[m] = rows.reduce((acc, r) => acc + (r.monthMap[m]?.hours || 0), 0);
    });

    return {
      rows,
      totalPioneers,
      grandTotalHours,
      grandTotalRemarkHours,
      grandTotalCombinedHours,
      grandTotalStudies,
      overallMonthlyAvg,
      overallAvgStudies,
      achievedCount,
      achievementRate,
      monthlyHourTotals
    };
  }, [allPublishers, allYearReports, groups, effectiveGroupId, manager, pioneerSearchQuery, rpFilterGroup, rpSortField, rpSortOrder]);

  // 정규파이오니아 1년 통계 CSV 다운로드
  const handleExportPioneerCsv = () => {
    if (pioneerStatsData.rows.length === 0) {
      alert('내보낼 정규파이오니아 데이터가 없습니다.');
      return;
    }
    const headers = [
      '이름', '집단', 
      '9월', '10월', '11월', '12월', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월',
      '총시간', '비고시간', '합계시간', '월평균', '연구(합계/평균)', '600h달성률(%)', '달성여부'
    ];
    const rows = pioneerStatsData.rows.map(r => [
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.group_name.replace(/"/g, '""')}"`,
      ...SERVICE_MONTHS.map(m => r.monthMap[m]?.hours || 0),
      r.totalHours,
      r.totalRemarkHours,
      r.totalCombinedHours,
      r.avgHours,
      `"${r.totalStudies} / ${r.avgStudies}"`,
      `${r.progressRate}%`,
      r.isTargetAchieved ? '달성' : '진행중'
    ]);
    const summaryRow = [
      '"전체 합계"', '""',
      ...SERVICE_MONTHS.map(m => pioneerStatsData.monthlyHourTotals[m]),
      pioneerStatsData.grandTotalHours,
      pioneerStatsData.grandTotalRemarkHours,
      pioneerStatsData.grandTotalCombinedHours,
      pioneerStatsData.overallMonthlyAvg,
      `"${pioneerStatsData.grandTotalStudies} / ${pioneerStatsData.overallAvgStudies}"`,
      `${pioneerStatsData.achievementRate}%`,
      `"${pioneerStatsData.achievedCount}명 달성"`
    ];
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(',')), summaryRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `정규파이오니아_1년통계_${currentYear.year_name}봉사연도_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // 선택된 월의 통계 계산 (상단 5열 표: 전도인/보조/정규/총계)
  // -------------------------------------------------------------
  const selectedMonthStat = (() => {
    let mReports = reports;
    let publisherCount = 0;
    let publisherStudies = 0;
    let apCount = 0;
    let apHours = 0;
    let apStudies = 0;
    let rpCount = 0;
    let rpHours = 0;
    let rpStudies = 0;
    let unsharedCount = 0; // 봉사 참여 N (미참여)

    mReports.forEach(r => {
      if (r.participated) {
        const hasHours = Number(r.hours || 0) > 0;
        const isRp = r.pioneer_status === 'RP';
        if (isRp) {
          rpCount++;
          rpHours += Number(r.hours || 0);
          rpStudies += Number(r.bible_studies || 0);
        } else if (hasHours) {
          apCount++;
          apHours += Number(r.hours || 0);
          apStudies += Number(r.bible_studies || 0);
        } else if (!isChildStatus(r.pioneer_status)) {
          publisherCount++;
          publisherStudies += Number(r.bible_studies || 0);
        }
      } else {
        // 자녀(집계 제외)를 제외한 봉사 참여 N(미참여) 인원 집계
        if (!isChildStatus(r.pioneer_status)) {
          unsharedCount++;
        }
      }
    });

    const totalReporters = publisherCount + apCount + rpCount;
    const totalHours = apHours + rpHours;
    const totalStudies = publisherStudies + apStudies + rpStudies;
    // 활동적인 전도인: 비정규(unsharedCount) 인원도 포함 (봉사 참여 ${totalReporters}명 + 비정규 ${unsharedCount}명)
    const activePublishersCount = totalReporters + unsharedCount;

    return {
      publisherCount,
      publisherStudies,
      publisherAvgStudies: publisherCount > 0 ? (publisherStudies / publisherCount).toFixed(1) : '0.0',
      apCount,
      apHours,
      apStudies,
      apAvgHours: apCount > 0 ? (apHours / apCount).toFixed(1) : '0.0',
      apAvgStudies: apCount > 0 ? (apStudies / apCount).toFixed(1) : '0.0',
      rpCount,
      rpHours,
      rpStudies,
      rpAvgHours: rpCount > 0 ? (rpHours / rpCount).toFixed(1) : '0.0',
      rpAvgStudies: rpCount > 0 ? (rpStudies / rpCount).toFixed(1) : '0.0',
      totalReporters,
      totalHours,
      totalStudies,
      totalAvgStudies: totalReporters > 0 ? (totalStudies / totalReporters).toFixed(1) : '0.0',
      unsharedCount,
      activePublishersCount,
    };
  })();

  const handleToggleStatusForMonth = async (month: ServiceMonth) => {
    if (!canManageClosing) return;
    const currentClosed = !!statuses[month];

    if (!currentClosed) {
      const monthAtt = Number(localStorage.getItem(`ministry_attendance_${currentYear.id}_${month}`) || 0);
      if (monthAtt === 0) {
        const confirmProceed = window.confirm(
          `⚠️ [주말 집회 평균 참석자 수 누락]\n\n${month} 주말 집회 평균 참석자 수가 아직 입력되지 않았습니다 (현재: 0명).\n\n• [확인]: 참석자 수 0명인 상태로 계속 마감 진행\n• [취소]: 마감 취소 (해당 월 상세에서 참석자 수 입력 필요)`
        );
        if (!confirmProceed) return;
      }
    }

    const confirmMsg = currentClosed
      ? `${month} 보고 마감을 해제하시겠습니까?`
      : `${month} 보고를 마감 완료 처리하시겠습니까?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const newStatus = await toggleMonthStatus(currentYear.id, month);
      setStatuses(prev => ({ ...prev, [month]: newStatus }));
      await loadDashboardData();
    } catch (err: any) {
      alert('마감 상태 변경 실패: ' + (err.message || '오류'));
    }
  };

  const handleSelectMonthAndGoDetail = (m: ServiceMonth) => {
    setSelectedMonth(m);
    setViewMode('monthly');
  };

  const handleEditWeekendAttendance = () => {
    const input = prompt(`${selectedMonth} 주말 집회 평균 참석자 수를 입력하세요:`, meetingAttendance);
    if (input !== null && input.trim() !== '') {
      setMeetingAttendance(input.trim());
      localStorage.setItem(`ministry_attendance_${currentYear.id}_${selectedMonth}`, input.trim());
    }
  };

  const handleEditWeekdayAttendance = () => {
    const input = prompt(`${selectedMonth} 평일 집회 평균 참석자 수를 입력하세요:`, weekdayMeetingAttendance);
    if (input !== null && input.trim() !== '') {
      setWeekdayMeetingAttendance(input.trim());
      localStorage.setItem(`ministry_attendance_weekday_${currentYear.id}_${selectedMonth}`, input.trim());
    }
  };

  // 회중 분석 보고 자동 계산 값
  const annualWeekendAttendance = useMemo(() => {
    let sum = 0;
    let count = 0;
    SERVICE_MONTHS.forEach(m => {
      const val = parseInt(localStorage.getItem(`ministry_attendance_${currentYear.id}_${m}`) || '0', 10);
      if (val > 0) {
        sum += val;
        count++;
      }
    });
    return count > 0 ? Math.round(sum / count) : 85;
  }, [currentYear.id, meetingAttendance]);

  const annualWeekdayAttendance = useMemo(() => {
    let sum = 0;
    let count = 0;
    SERVICE_MONTHS.forEach(m => {
      const val = parseInt(localStorage.getItem(`ministry_attendance_weekday_${currentYear.id}_${m}`) || '0', 10);
      if (val > 0) {
        sum += val;
        count++;
      }
    });
    return count > 0 ? Math.round(sum / count) : 83;
  }, [currentYear.id, weekdayMeetingAttendance]);

  const autoActivePublishers = useMemo(() => {
    return allPublishers.filter(p => p.is_active && !isChildStatus(p.pioneer_status)).length || 89;
  }, [allPublishers]);

  const autoDeafPublishers = useMemo(() => {
    const count = allPublishers.filter(p => p.is_active && ((p.special_notes || '').includes('농아') || (p.special_notes || '').includes('수어'))).length;
    return count > 0 ? count : 4;
  }, [allPublishers]);

  const autoBlindPublishers = useMemo(() => {
    return allPublishers.filter(p => p.is_active && (p.special_notes || '').includes('맹인')).length || 0;
  }, [allPublishers]);

  const autoInactivePublishers = useMemo(() => {
    // 6개월 동안 연속해서 야외 봉사를 보고하지 않은 전도인 수
    const activePubs = allPublishers.filter(p => p.is_active && !isChildStatus(p.pioneer_status));
    let count = 0;
    activePubs.forEach(pub => {
      const pubReports = allYearReports.filter(r => r.publisher_id === pub.id || r.publisher_name === pub.name);
      const posReports = pubReports.filter(r => r.participated);
      if (pubReports.length >= 6 && posReports.length === 0) {
        count++;
      }
    });
    return count;
  }, [allPublishers, allYearReports]);

  // 회중 분석 보고 수정 모달 열기
  const openAnalysisEditModal = () => {
    setAnalysisForm({
      weekendAttendance: analysisOverrides.weekendAttendance !== undefined ? analysisOverrides.weekendAttendance : annualWeekendAttendance,
      weekdayAttendance: analysisOverrides.weekdayAttendance !== undefined ? analysisOverrides.weekdayAttendance : annualWeekdayAttendance,
      activePublishers: analysisOverrides.activePublishers !== undefined ? analysisOverrides.activePublishers : autoActivePublishers,
      deafPublishers: analysisOverrides.deafPublishers !== undefined ? analysisOverrides.deafPublishers : autoDeafPublishers,
      inactivePublishers: analysisOverrides.inactivePublishers !== undefined ? analysisOverrides.inactivePublishers : autoInactivePublishers,
      blindPublishers: analysisOverrides.blindPublishers !== undefined ? analysisOverrides.blindPublishers : autoBlindPublishers,
      reactivatedPublishers: analysisOverrides.reactivatedPublishers !== undefined ? analysisOverrides.reactivatedPublishers : 0,
      confinedPublishers: analysisOverrides.confinedPublishers !== undefined ? analysisOverrides.confinedPublishers : 0,
      totalTerritories: analysisOverrides.totalTerritories !== undefined ? analysisOverrides.totalTerritories : 749,
      unworkedTerritories: analysisOverrides.unworkedTerritories !== undefined ? analysisOverrides.unworkedTerritories : 0,
    });
    setAnalysisEditModalOpen(true);
  };

  const handleSaveAnalysisOverrides = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(`ministry_analysis_${currentYear.id}`, JSON.stringify(analysisForm));
    setAnalysisOverrides(analysisForm);
    setAnalysisEditModalOpen(false);
  };

  const handleResetAnalysisOverrides = () => {
    if (window.confirm('모든 회중 분석 보고 항목을 자동 계산값으로 초기화하시겠습니까?')) {
      localStorage.removeItem(`ministry_analysis_${currentYear.id}`);
      setAnalysisOverrides({});
      setAnalysisEditModalOpen(false);
    }
  };

  // 인쇄/PDF 저장 시 동적 파일명 생성 함수
  const getPrintDocumentTitle = () => {
    const cName = congregationName || '춘천남부 회중';
    if (viewMode === 'yearly') {
      return `${cName} - 봉사보고 - ${currentYear.year_name || ''} 1년 통계`.trim();
    }
    if (viewMode === 'monthly') {
      return `${cName} - 봉사보고 - ${selectedMonth}`.trim();
    }
    if (viewMode === 'pioneers') {
      return `${cName} - 봉사보고 - ${currentYear.year_name || ''} RP통계`.trim();
    }
    if (viewMode === 'analysis') {
      return `${cName} - 봉사보고 - ${currentYear.year_name || ''} 회중분석보고`.trim();
    }
    return `${cName} - 봉사보고`;
  };

  // 인쇄 실행 핸들러 (버튼 클릭 시)
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = getPrintDocumentTitle();
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // 브라우저 단축키(Ctrl+P)로 인쇄할 때도 자동 적용되는 이벤트 리스너
  useEffect(() => {
    let savedTitle = '';
    const onBeforePrint = () => {
      savedTitle = document.title;
      document.title = getPrintDocumentTitle();
    };
    const onAfterPrint = () => {
      if (savedTitle) {
        document.title = savedTitle;
      }
    };

    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, [congregationName, currentYear.year_name, viewMode, selectedMonth]);

  return (
    <div className="dashboard-content-container" style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Unified Header Card */}
      <div className="nfox-card unified-header-card" style={{
        padding: '26px 30px',
        textAlign: 'center',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        marginBottom: 20
      }}>
        {/* Main Title */}
        <h1 style={{
          fontSize: '1.9rem',
          fontWeight: 900,
          color: 'var(--title-color, #1e3a8a)',
          margin: '0 0 16px 0',
          letterSpacing: '-0.02em'
        }}>
          {currentYear.year_name} {congregationName.replace('회중', '').trim()} 봉사보고
        </h1>

        {/* View Mode Switcher: 1년 통계, 월별 상세 내역, RP 통계 */}
        <div className="no-print view-mode-switcher-container">
          <div className="view-mode-pill-bar">
            <button
              onClick={() => setViewMode('yearly')}
              className={`view-mode-pill-btn ${viewMode === 'yearly' ? 'active' : ''}`}
            >
              <BarChart3 size={15} />
              <span>1년 통계</span>
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`view-mode-pill-btn ${viewMode === 'monthly' ? 'active' : ''}`}
            >
              <FileText size={15} />
              <span>월별 상세 내역</span>
            </button>
            <button
              onClick={() => setViewMode('pioneers')}
              className={`view-mode-pill-btn ${viewMode === 'pioneers' ? 'active' : ''}`}
            >
              <Award size={15} />
              <span>RP 통계</span>
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => setViewMode('analysis')}
                className={`view-mode-pill-btn ${viewMode === 'analysis' ? 'active' : ''}`}
              >
                <FileBarChart size={15} />
                <span>회중 분석 보고</span>
              </button>
            )}
          </div>

          <div className="view-mode-print-btn-wrapper no-print">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-secondary"
              style={{
                gap: 6,
                fontSize: '0.82rem',
                padding: '7px 15px',
                borderRadius: 'var(--radius-full)'
              }}
              title={`${viewMode === 'yearly' ? '1년 통계' : viewMode === 'monthly' ? `${selectedMonth} 상세 내역` : viewMode === 'pioneers' ? 'RP 통계' : '회중 분석 보고'} 인쇄`}
            >
              <Printer size={15} />
              <span>
                {viewMode === 'yearly' ? '1년 통계 인쇄' : viewMode === 'monthly' ? `${selectedMonth} 인쇄` : viewMode === 'pioneers' ? 'RP 통계 인쇄' : '분석 보고 인쇄'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 1. 1년 종합 통계 페이지 */}
      {/* ============================================================= */}
      {viewMode === 'yearly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 1-Year Summary: 1년 각 항목의 합계/평균 통계표 */}
          <div className="nfox-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '12px 18px',
              background: 'var(--bg-card-subtle, #f8fafc)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  background: 'var(--primary-light)',
                  color: 'var(--primary)'
                }}>
                  <BarChart3 size={15} />
                </span>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {currentYear.year_name} 봉사연도 1년 합계 및 월평균 통계표
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginLeft: 4 }}>
                  (보고된 {yearlySummaryStats.reportedMonthsCount}개 월 기준 집계)
                </span>
              </div>
            </div>

            <div className="data-table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                <thead>
                  <tr style={{ background: 'var(--table-header-bg, #f1f5f9)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ width: 85, textAlign: 'center', fontWeight: 800, color: 'var(--text-main)' }}>구분</th>
                    <th style={{ width: 95, textAlign: 'center' }}>보고자 수</th>
                    <th style={{ width: 95, textAlign: 'center' }}>전도인 수</th>
                    <th style={{ width: 95, textAlign: 'center' }}>전도인 연구</th>
                    <th style={{ width: 90, textAlign: 'center' }}>보조 수</th>
                    <th style={{ width: 90, textAlign: 'center' }}>보조 시간</th>
                    <th style={{ width: 90, textAlign: 'center' }}>보조 연구</th>
                    <th style={{ width: 90, textAlign: 'center' }}>정규 수</th>
                    <th style={{ width: 95, textAlign: 'center' }}>정규 시간</th>
                    <th style={{ width: 95, textAlign: 'center' }}>정규 연구</th>
                    <th style={{ width: 140, textAlign: 'center' }}>비고 (총계/평균)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 행 1: 1년 합계 */}
                  <tr style={{ background: 'rgba(59, 130, 246, 0.04)', borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>
                      1년 합계
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                      {yearlySummaryStats.sum.totalReporters > 0 ? `${yearlySummaryStats.sum.totalReporters.toLocaleString()}명` : '-'}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {yearlySummaryStats.sum.publisherCount > 0 ? `${yearlySummaryStats.sum.publisherCount.toLocaleString()}명` : '-'}
                    </td>
                    <td>
                      {yearlySummaryStats.sum.publisherStudies > 0 ? yearlySummaryStats.sum.publisherStudies.toLocaleString() : '-'}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {yearlySummaryStats.sum.apCount > 0 ? `${yearlySummaryStats.sum.apCount.toLocaleString()}명` : '-'}
                    </td>
                    <td style={{ fontWeight: 700, color: '#0284c7' }}>
                      {yearlySummaryStats.sum.apHours > 0 ? `${yearlySummaryStats.sum.apHours.toLocaleString()}` : '-'}
                    </td>
                    <td>
                      {yearlySummaryStats.sum.apStudies > 0 ? yearlySummaryStats.sum.apStudies.toLocaleString() : '-'}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {yearlySummaryStats.sum.rpCount > 0 ? `${yearlySummaryStats.sum.rpCount.toLocaleString()}명` : '-'}
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                      {yearlySummaryStats.sum.rpHours > 0 ? `${yearlySummaryStats.sum.rpHours.toLocaleString()}` : '-'}
                    </td>
                    <td>
                      {yearlySummaryStats.sum.rpStudies > 0 ? yearlySummaryStats.sum.rpStudies.toLocaleString() : '-'}
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.82rem' }}>
                      총 {yearlySummaryStats.sum.totalHours.toLocaleString()}h / 연구 {yearlySummaryStats.sum.totalStudies.toLocaleString()}건
                    </td>
                  </tr>

                  {/* 행 2: 월평균 */}
                  <tr style={{ background: 'rgba(16, 185, 129, 0.04)' }}>
                    <td style={{ fontWeight: 800, color: 'var(--accent-emerald)', fontSize: '0.9rem' }}>
                      월평균
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--accent-emerald)' }}>
                      {yearlySummaryStats.avg.totalReporters > 0 ? `${yearlySummaryStats.avg.totalReporters.toLocaleString()}명` : '-'}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {yearlySummaryStats.avg.publisherCount > 0 ? `${yearlySummaryStats.avg.publisherCount.toLocaleString()}명` : '-'}
                    </td>
                    <td>
                      {yearlySummaryStats.avg.publisherStudies > 0 ? yearlySummaryStats.avg.publisherStudies.toLocaleString() : '-'}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {yearlySummaryStats.avg.apCount > 0 ? `${yearlySummaryStats.avg.apCount.toLocaleString()}명` : '-'}
                    </td>
                    <td style={{ fontWeight: 700, color: '#0284c7' }}>
                      {yearlySummaryStats.avg.apHours > 0 ? `${yearlySummaryStats.avg.apHours.toLocaleString()}` : '-'}
                    </td>
                    <td>
                      {yearlySummaryStats.avg.apStudies > 0 ? yearlySummaryStats.avg.apStudies.toLocaleString() : '-'}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {yearlySummaryStats.avg.rpCount > 0 ? `${yearlySummaryStats.avg.rpCount.toLocaleString()}명` : '-'}
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                      {yearlySummaryStats.avg.rpHours > 0 ? `${yearlySummaryStats.avg.rpHours.toLocaleString()}` : '-'}
                    </td>
                    <td>
                      {yearlySummaryStats.avg.rpStudies > 0 ? yearlySummaryStats.avg.rpStudies.toLocaleString() : '-'}
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--accent-emerald)', fontSize: '0.82rem' }}>
                      월평균 {yearlySummaryStats.avg.totalHours.toLocaleString()}h / 연구 {yearlySummaryStats.avg.totalStudies.toLocaleString()}건
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 1-Year Summary Table (Image 1 Style) */}
          <div className="nfox-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="data-table-container">
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                <thead>
                  <tr style={{ background: 'var(--table-header-bg, #f8fafc)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ width: 85, textAlign: 'center', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 800, fontSize: '0.95rem' }}>
                      {currentYear.year_name}
                    </th>
                    <th style={{ width: 95, textAlign: 'center' }}>보고자 수</th>
                    <th style={{ width: 95, textAlign: 'center' }}>전도인 수</th>
                    <th style={{ width: 95, textAlign: 'center' }}>전도인 연구</th>
                    <th style={{ width: 90, textAlign: 'center' }}>보조 수</th>
                    <th style={{ width: 90, textAlign: 'center' }}>보조 시간</th>
                    <th style={{ width: 90, textAlign: 'center' }}>보조 연구</th>
                    <th style={{ width: 90, textAlign: 'center' }}>정규 수</th>
                    <th style={{ width: 95, textAlign: 'center' }}>정규 시간</th>
                    <th style={{ width: 95, textAlign: 'center' }}>정규 연구</th>
                    <th style={{ width: 140, textAlign: 'center' }} className="no-print">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyStats.map((row) => (
                    <tr 
                      key={row.month}
                      style={{ 
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      className="yearly-table-row"
                    >
                      {/* 월 (클릭 시 상세 이동) */}
                      <td 
                        onClick={() => handleSelectMonthAndGoDetail(row.month)}
                        style={{ 
                          fontWeight: 800, 
                          color: 'var(--primary)', 
                          background: 'rgba(99, 102, 241, 0.04)',
                          fontSize: '0.92rem'
                        }}
                      >
                        {row.month}
                      </td>

                      {/* 보고자 수 */}
                      <td onClick={() => handleSelectMonthAndGoDetail(row.month)} style={{ fontWeight: row.totalReporters > 0 ? 800 : 400 }}>
                        {row.totalReporters > 0 ? row.totalReporters : '-'}
                      </td>

                      {/* 전도인 수 */}
                      <td onClick={() => handleSelectMonthAndGoDetail(row.month)} style={{ fontWeight: row.publisherCount > 0 ? 600 : 400 }}>
                        {row.publisherCount > 0 ? row.publisherCount : '-'}
                      </td>

                      {/* 전도인 연구 */}
                      <td onClick={() => handleSelectMonthAndGoDetail(row.month)}>
                        {row.publisherStudies > 0 ? row.publisherStudies : ''}
                      </td>

                      {/* 보조 수 */}
                      <td onClick={() => handleSelectMonthAndGoDetail(row.month)} style={{ fontWeight: row.apCount > 0 ? 600 : 400 }}>
                        {row.apCount > 0 ? row.apCount : ''}
                      </td>

                      {/* 보조 시간 */}
                      <td onClick={() => handleSelectMonthAndGoDetail(row.month)}>
                        {row.apHours > 0 ? row.apHours : ''}
                      </td>

                      {/* 보조 연구 */}
                      <td onClick={() => handleSelectMonthAndGoDetail(row.month)}>
                        {row.apStudies > 0 ? row.apStudies : ''}
                      </td>

                      {/* 정규 수 */}
                      <td onClick={() => handleSelectMonthAndGoDetail(row.month)} style={{ fontWeight: row.rpCount > 0 ? 600 : 400 }}>
                        {row.rpCount > 0 ? row.rpCount : ''}
                      </td>

                      {/* 정규 시간 */}
                      <td onClick={() => handleSelectMonthAndGoDetail(row.month)} style={{ fontWeight: row.rpHours > 0 ? 700 : 400 }}>
                        {row.rpHours > 0 ? row.rpHours : ''}
                      </td>

                      {/* 정규 연구 */}
                      <td onClick={() => handleSelectMonthAndGoDetail(row.month)}>
                        {row.rpStudies > 0 ? row.rpStudies : ''}
                      </td>

                      {/* 관리 버튼들 ([상세], [완료/진행중]) */}
                      <td style={{ textAlign: 'center' }} className="no-print">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectMonthAndGoDetail(row.month);
                            }}
                            className="btn-secondary"
                            style={{
                              padding: '4px 10px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              borderColor: 'var(--primary)',
                              color: 'var(--primary)'
                            }}
                          >
                            상세
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatusForMonth(row.month);
                            }}
                            disabled={!canManageClosing}
                            style={{
                              padding: '4px 10px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              borderRadius: 'var(--radius-sm)',
                              border: 'none',
                              cursor: canManageClosing ? 'pointer' : 'default',
                              background: row.isClosed ? '#64748b' : 'var(--accent-amber)',
                              color: '#ffffff'
                            }}
                            title={canManageClosing ? '클릭하여 마감 상태 변경' : '마감 상태'}
                          >
                            {row.isClosed ? '완료' : '진행중'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 2. 정규파이오니아 1년 봉사 통계 페이지 */}
      {/* ============================================================= */}
      {viewMode === 'pioneers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 4 KPI Summary Cards */}
          <div className="rp-stat-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16
          }}>
            <div className="nfox-card rp-stat-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="rp-stat-icon" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="rp-stat-title" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>정규파이오니아</div>
                <div className="rp-stat-value" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>{pioneerStatsData.totalPioneers}명</div>
                <div className="rp-stat-desc" style={{ fontSize: '0.72rem', color: 'var(--text-faint)', whiteSpace: 'normal', wordBreak: 'keep-all' }}>{effectiveGroupId === 'all' ? '회중 전체 인원' : '해당 집단 인원'}</div>
              </div>
            </div>

            <div className="nfox-card rp-stat-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="rp-stat-icon" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="rp-stat-title" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>연간 총 봉사 시간</div>
                <div className="rp-stat-value" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-emerald)', whiteSpace: 'nowrap' }}>{pioneerStatsData.grandTotalHours.toLocaleString()}시간</div>
                <div className="rp-stat-desc" style={{ fontSize: '0.72rem', color: 'var(--text-faint)', whiteSpace: 'normal', wordBreak: 'keep-all', lineHeight: 1.25 }}>
                  {pioneerStatsData.grandTotalRemarkHours > 0 
                    ? `직접 ${pioneerStatsData.grandTotalHours.toLocaleString()}h + 비고 ${pioneerStatsData.grandTotalRemarkHours.toLocaleString()}h = 총 ${pioneerStatsData.grandTotalCombinedHours.toLocaleString()}h` 
                    : '12개월 누적 총계'}
                </div>
              </div>
            </div>

            <div className="nfox-card rp-stat-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="rp-stat-icon" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="rp-stat-title" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>1인당 월평균 시간</div>
                <div className="rp-stat-value" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-amber)', whiteSpace: 'nowrap' }}>{pioneerStatsData.overallMonthlyAvg}시간</div>
                <div className="rp-stat-desc" style={{ fontSize: '0.72rem', color: 'var(--text-faint)', whiteSpace: 'normal', wordBreak: 'keep-all' }}>목표: 월 50시간 (연 600h)</div>
              </div>
            </div>

            <div className="nfox-card rp-stat-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="rp-stat-icon" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 'var(--radius-md)', background: 'rgba(14, 165, 233, 0.12)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="rp-stat-title" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>600시간 목표 달성</div>
                <div className="rp-stat-value" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0284c7', whiteSpace: 'nowrap' }}>
                  {pioneerStatsData.achievedCount}명 <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>({pioneerStatsData.achievementRate}%)</span>
                </div>
                <div className="rp-stat-desc" style={{ fontSize: '0.72rem', color: 'var(--text-faint)', whiteSpace: 'normal', wordBreak: 'keep-all' }}>성서연구 총 {pioneerStatsData.grandTotalStudies}건 (월평균 {pioneerStatsData.overallAvgStudies})</div>
              </div>
            </div>
          </div>

          {/* Search Bar & Export Toolbar */}
          <div className="nfox-card no-print" style={{
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ position: 'relative', minWidth: 260 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
              <input
                type="text"
                placeholder="정규파이오니아 이름, 집단 검색..."
                value={pioneerSearchQuery}
                onChange={e => setPioneerSearchQuery(e.target.value)}
                className="form-input"
                style={{
                  paddingLeft: 34,
                  paddingRight: 12,
                  paddingTop: 7,
                  paddingBottom: 7,
                  fontSize: '0.84rem',
                  borderRadius: 'var(--radius-full)'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {(pioneerSearchQuery.trim() !== '' || rpFilterGroup !== 'all' || rpSortField !== 'progressRate') && (
                <button
                  type="button"
                  onClick={() => {
                    setPioneerSearchQuery('');
                    setRpFilterGroup('all');
                    setRpSortField('progressRate');
                    setRpSortOrder('desc');
                  }}
                  className="btn-secondary"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    gap: 5,
                    color: 'var(--accent-rose)',
                    borderColor: 'rgba(244, 63, 94, 0.3)'
                  }}
                  title="모든 필터와 정렬을 기본값으로 초기화합니다"
                >
                  <RotateCcw size={13} />
                  <span>필터 초기화</span>
                </button>
              )}

              <button
                onClick={handleExportPioneerCsv}
                className="btn-secondary"
                style={{ gap: 6, fontSize: '0.82rem', padding: '7px 14px' }}
                title="정규파이오니아 1년 통계 표를 CSV 파일로 다운로드합니다."
              >
                <Download size={14} />
                <span>CSV 다운로드</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="btn-secondary no-print"
                style={{ gap: 6, fontSize: '0.82rem', padding: '7px 14px' }}
                title="정규파이오니아(RP) 1년 통계표 인쇄"
              >
                <Printer size={14} />
                <span>RP 통계 인쇄</span>
              </button>
            </div>
          </div>

          {/* 1-Year Regular Pioneer Data Table */}
          <div className="nfox-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="data-table-container sticky-container">
              <table className="data-table data-table-sticky rp-yearly-table" style={{ minWidth: 1260, textAlign: 'center', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: 'var(--table-header-bg, #f8fafc)', borderBottom: '2px solid var(--border-color)' }}>
                    {/* 1. 이름 (정렬 가능) */}
                    <th 
                      onClick={() => handleRpSort('name')}
                      style={{ 
                        width: 110, 
                        minWidth: 110, 
                        textAlign: 'center', 
                        cursor: 'pointer',
                        userSelect: 'none',
                        background: rpSortField === 'name' ? 'var(--primary-light, #eff6ff)' : undefined
                      }}
                      title="클릭하여 이름 순으로 정렬"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <span style={{ color: rpSortField === 'name' ? 'var(--primary)' : undefined, fontWeight: 700 }}>이름</span>
                        {rpSortField === 'name' && (
                          rpSortOrder === 'asc' ? <ArrowUp size={13} color="var(--primary)" /> : <ArrowDown size={13} color="var(--primary)" />
                        )}
                      </div>
                    </th>

                    {/* 2. 집단 (그룹 선택 팝오버) */}
                    <th 
                      style={{ 
                        width: 95, 
                        minWidth: 95, 
                        textAlign: 'center',
                        cursor: 'pointer',
                        userSelect: 'none',
                        background: rpFilterGroup !== 'all' ? 'var(--primary-light, #eff6ff)' : undefined
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveRpHeaderDropdown(activeRpHeaderDropdown === 'group_name' ? null : 'group_name');
                      }}
                      title="클릭하여 집단 선택 필터"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <span style={{ fontWeight: 700, color: rpFilterGroup !== 'all' ? 'var(--primary)' : undefined }}>집단</span>
                        {rpFilterGroup !== 'all' && (
                          <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: 4, background: 'var(--primary)', color: '#fff', fontWeight: 800 }}>
                            {rpFilterGroup}
                          </span>
                        )}
                        <ChevronDown size={12} style={{ opacity: rpFilterGroup !== 'all' ? 1 : 0.45 }} />
                      </div>

                      {activeRpHeaderDropdown === 'group_name' && (
                        <div className="header-filter-popover" onClick={e => e.stopPropagation()}>
                          <div className="popover-header">
                            <span>집단 선택 필터</span>
                          </div>
                          <div 
                            className={`popover-item ${rpFilterGroup === 'all' ? 'active' : ''}`} 
                            onClick={() => { setRpFilterGroup('all'); setActiveRpHeaderDropdown(null); }}
                          >
                            <span>전체 집단</span>
                            {rpFilterGroup === 'all' && <Check size={13} />}
                          </div>
                          <div className="popover-divider" />
                          {groups.map(g => (
                            <div 
                              key={g.id} 
                              className={`popover-item ${rpFilterGroup === g.name ? 'active' : ''}`} 
                              onClick={() => { setRpFilterGroup(g.name); setActiveRpHeaderDropdown(null); }}
                            >
                              <span>{g.name} 집단</span>
                              {rpFilterGroup === g.name && <Check size={13} />}
                            </div>
                          ))}
                        </div>
                      )}
                    </th>

                    {SERVICE_MONTHS.map(m => (
                      <th key={m} style={{ width: 54, minWidth: 54, textAlign: 'center' }}>{m}</th>
                    ))}

                    {/* 총 시간 (정렬 가능) */}
                    <th 
                      onClick={() => handleRpSort('totalHours')}
                      style={{ 
                        width: 80, 
                        minWidth: 80, 
                        textAlign: 'center', 
                        cursor: 'pointer',
                        userSelect: 'none',
                        background: rpSortField === 'totalHours' ? 'var(--primary-light, #eff6ff)' : undefined, 
                        color: rpSortField === 'totalHours' ? 'var(--primary)' : 'var(--text-main)', 
                        fontWeight: 800 
                      }}
                      title="클릭하여 총 봉사시간으로 정렬"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <span>총 시간</span>
                        {rpSortField === 'totalHours' && (
                          rpSortOrder === 'asc' ? <ArrowUp size={13} color="var(--primary)" /> : <ArrowDown size={13} color="var(--primary)" />
                        )}
                      </div>
                    </th>

                    {/* 비고 시간 (정렬 가능) */}
                    <th 
                      onClick={() => handleRpSort('totalRemarkHours')}
                      style={{ 
                        width: 85, 
                        minWidth: 85, 
                        textAlign: 'center',
                        cursor: 'pointer',
                        userSelect: 'none',
                        background: rpSortField === 'totalRemarkHours' ? 'var(--primary-light, #eff6ff)' : undefined
                      }}
                      title="클릭하여 비고 시간으로 정렬"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <span style={{ color: rpSortField === 'totalRemarkHours' ? 'var(--primary)' : undefined, fontWeight: 700 }}>비고 시간</span>
                        {rpSortField === 'totalRemarkHours' && (
                          rpSortOrder === 'asc' ? <ArrowUp size={13} color="var(--primary)" /> : <ArrowDown size={13} color="var(--primary)" />
                        )}
                      </div>
                    </th>

                    {/* 월평균 (정렬 가능) */}
                    <th 
                      onClick={() => handleRpSort('avgHours')}
                      style={{ 
                        width: 75, 
                        minWidth: 75, 
                        textAlign: 'center',
                        cursor: 'pointer',
                        userSelect: 'none',
                        background: rpSortField === 'avgHours' ? 'var(--primary-light, #eff6ff)' : undefined
                      }}
                      title="클릭하여 월평균 시간으로 정렬"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <span style={{ color: rpSortField === 'avgHours' ? 'var(--primary)' : undefined, fontWeight: 700 }}>월평균</span>
                        {rpSortField === 'avgHours' && (
                          rpSortOrder === 'asc' ? <ArrowUp size={13} color="var(--primary)" /> : <ArrowDown size={13} color="var(--primary)" />
                        )}
                      </div>
                    </th>

                    {/* 연구 (합계/평균) (정렬 가능) */}
                    <th 
                      onClick={() => handleRpSort('studies')}
                      style={{ 
                        width: 110, 
                        minWidth: 110, 
                        textAlign: 'center',
                        cursor: 'pointer',
                        userSelect: 'none',
                        background: rpSortField === 'studies' ? 'var(--primary-light, #eff6ff)' : undefined
                      }}
                      title="클릭하여 성서 연구(합계/평균)로 정렬"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <span style={{ color: rpSortField === 'studies' ? 'var(--primary)' : undefined, fontWeight: 700 }}>연구 (합계/평균)</span>
                        {rpSortField === 'studies' && (
                          rpSortOrder === 'asc' ? <ArrowUp size={13} color="var(--primary)" /> : <ArrowDown size={13} color="var(--primary)" />
                        )}
                      </div>
                    </th>

                    {/* 600h 달성률 (정렬 가능) */}
                    <th 
                      onClick={() => handleRpSort('progressRate')}
                      style={{ 
                        width: 140, 
                        minWidth: 140, 
                        textAlign: 'center',
                        cursor: 'pointer',
                        userSelect: 'none',
                        background: rpSortField === 'progressRate' ? 'var(--primary-light, #eff6ff)' : undefined
                      }}
                      title="클릭하여 600시간 달성률로 정렬"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <span style={{ color: rpSortField === 'progressRate' ? 'var(--primary)' : undefined, fontWeight: 700 }}>600h 달성률</span>
                        {rpSortField === 'progressRate' && (
                          rpSortOrder === 'asc' ? <ArrowUp size={13} color="var(--primary)" /> : <ArrowDown size={13} color="var(--primary)" />
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pioneerStatsData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={19} style={{ padding: '40px', color: 'var(--text-muted)' }}>
                        조회된 정규파이오니아가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    pioneerStatsData.rows.map((row) => (
                      <tr key={row.name} className="yearly-table-row">
                        <td style={{ width: 110, minWidth: 110, textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setCardModalData({ id: row.id, name: row.name })}
                            className="name-link-btn"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              fontWeight: 700,
                              color: 'var(--primary)',
                              fontSize: '0.9rem',
                              textAlign: 'center'
                            }}
                            title={`${row.name} S-21 기록 카드 열기`}
                          >
                            {row.name}
                          </button>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-group" style={{ fontSize: '0.75rem' }}>
                            {row.group_name}
                          </span>
                        </td>
                        {SERVICE_MONTHS.map(m => {
                          const h = row.monthMap[m]?.hours;
                          return (
                            <td key={m} style={{ fontWeight: h && h > 0 ? 600 : 400, color: h && h > 0 ? 'var(--text-main)' : 'var(--text-faint)' }}>
                              {h && h > 0 ? h : '-'}
                            </td>
                          );
                        })}
                        {/* 총 시간 (단위 h 삭제) */}
                        <td style={{ 
                          fontWeight: 800, 
                          color: 'var(--primary)', 
                          background: 'rgba(99, 102, 241, 0.05)',
                          fontSize: '0.92rem'
                        }}>
                          {row.totalHours}
                        </td>
                        {/* 비고 시간 */}
                        <td style={{ 
                          fontWeight: row.totalRemarkHours > 0 ? 700 : 400,
                          color: row.totalRemarkHours > 0 ? 'var(--text-main)' : 'var(--text-faint)'
                        }}>
                          {row.totalRemarkHours > 0 ? row.totalRemarkHours : '-'}
                        </td>
                        {/* 월평균 (단위 h 삭제) */}
                        <td style={{ fontWeight: 600 }}>
                          {row.avgHours > 0 ? row.avgHours : '-'}
                        </td>
                        {/* 연구 (합계 / 평균) */}
                        <td style={{ fontWeight: row.totalStudies > 0 ? 600 : 400 }}>
                          {row.totalStudies > 0 ? `${row.totalStudies} / ${row.avgStudies}` : '-'}
                        </td>
                        {/* 600h 달성률 (총시간 + 비고시간 기준) */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                color: row.isTargetAchieved ? 'var(--accent-emerald)' : 'var(--primary)'
                              }}>
                                {row.progressRate}%
                              </span>
                              {row.isTargetAchieved && (
                                <span style={{
                                  fontSize: '0.68rem',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  background: 'rgba(16, 185, 129, 0.12)',
                                  color: 'var(--accent-emerald)',
                                  fontWeight: 800
                                }}>
                                  달성
                                </span>
                              )}
                            </div>
                            <div 
                              className="rp-progress-bar no-print"
                              style={{
                                width: 80,
                                height: 5,
                                borderRadius: 3,
                                background: 'var(--border-color)',
                                overflow: 'hidden'
                              }}
                              title={`총 ${row.totalHours}시간 + 비고 ${row.totalRemarkHours}시간 = 합계 ${row.totalCombinedHours}시간 / 600시간 (${row.progressRate}%)`}
                            >
                              <div style={{
                                width: `${Math.min(row.progressRate, 100)}%`,
                                height: '100%',
                                background: row.isTargetAchieved ? 'var(--accent-emerald)' : 'var(--primary)',
                                borderRadius: 3
                              }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {/* Total Summary Footer Row */}
                {pioneerStatsData.rows.length > 0 && (
                  <tfoot>
                    <tr style={{ background: 'var(--table-header-bg, #f1f5f9)', fontWeight: 800, borderTop: '2px solid var(--border-color)' }}>
                      <td colSpan={2} style={{ textAlign: 'center', padding: '12px' }}>
                        전체 합계 ({pioneerStatsData.totalPioneers}명)
                      </td>
                      {SERVICE_MONTHS.map(m => (
                        <td key={m} style={{ color: 'var(--primary)', fontWeight: 800 }}>
                          {pioneerStatsData.monthlyHourTotals[m]}
                        </td>
                      ))}
                      <td style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 900, fontSize: '0.94rem' }}>
                        {pioneerStatsData.grandTotalHours.toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                        {pioneerStatsData.grandTotalRemarkHours > 0 ? pioneerStatsData.grandTotalRemarkHours.toLocaleString() : '-'}
                      </td>
                      <td>
                        {pioneerStatsData.overallMonthlyAvg}
                      </td>
                      <td>
                        {pioneerStatsData.grandTotalStudies > 0 
                          ? `${pioneerStatsData.grandTotalStudies} / ${pioneerStatsData.overallAvgStudies}` 
                          : '-'}
                      </td>
                      <td>
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>
                          {pioneerStatsData.achievedCount}명 달성 ({pioneerStatsData.achievementRate}%)
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 2. 각 월별 상세 내역 페이지 (Image 2 Style 상단 통계 + 세부 보고) */}
      {/* ============================================================= */}
      {viewMode === 'monthly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top Month Navigation Bar */}
          {/* 12 Months Pill Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            overflowX: 'auto',
            padding: '4px 0',
            flexWrap: 'wrap'
          }}>
            {SERVICE_MONTHS.map((m) => {
              const isSelected = selectedMonth === m;
              const closed = !!statuses[m];
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.84rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{m}</span>
                  {closed && <span style={{ fontSize: '0.7rem' }}>🔒</span>}
                </button>
              );
            })}
          </div>

          {/* Month Header Banner */}
          <div className="nfox-card" style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                <h2 className="monthly-header-title">
                  {congregationName} {currentYear.year_name}년 {selectedMonth} 봉사보고
                </h2>
                <span className={`badge ${isClosed ? 'badge-closed' : 'badge-open'}`} style={{ whiteSpace: 'nowrap' }}>
                  {isClosed ? <Lock size={12} /> : <Unlock size={12} />}
                  {isClosed ? '보고 마감 완료' : '보고 접수 진행 중'}
                </span>
              </div>
              {!isClosed && (
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, marginTop: 4 }}>
                  {effectiveGroupId === 'all' ? '전체 회중' : `${groups.find(g => g.id === effectiveGroupId)?.name || manager?.group_name || ''} 집단`}
                  {' · '}
                  <span>
                    전도인 {kpiStats?.totalPublishers || 0}명 중 <strong>{kpiStats?.totalSubmitted ?? kpiStats?.totalReporters ?? 0}명</strong> 보고 접수 ({kpiStats?.reportRate || 0}%)
                  </span>
                </p>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handlePrint}
                className="btn-secondary no-print"
                style={{ gap: 6, fontSize: '0.82rem', padding: '6px 14px' }}
                title={`${selectedMonth} 상세 내역 인쇄`}
              >
                <Printer size={15} />
                <span>{selectedMonth} 상세 인쇄</span>
              </button>
              {!isClosed && (
                <>
                  <button
                    onClick={handleCopySubmitLink}
                    className="btn-secondary"
                    title="전도인 봉사 보고 입력 링크 복사"
                    style={{ gap: 6, fontSize: '0.82rem' }}
                  >
                    {copiedSubmitLink ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                    <span>{copiedSubmitLink ? '링크 복사됨!' : '제출 사이트 링크 복사'}</span>
                  </button>

                  <button
                    onClick={() => setUnreportedModalOpen(true)}
                    className="btn-secondary"
                    style={{
                      borderColor: 'rgba(244, 63, 94, 0.3)',
                      color: 'var(--accent-rose)',
                      background: 'var(--accent-rose-light)',
                      fontSize: '0.82rem'
                    }}
                  >
                    <UserX size={14} />
                    <span>미보고자 ({unreportedList.length}명)</span>
                  </button>
                </>
              )}

              {canManageClosing && (
                <button
                  onClick={handleToggleStatus}
                  className={isClosed ? 'btn-secondary' : 'btn-primary'}
                  style={{ fontSize: '0.82rem' }}
                >
                  {isClosed ? <Unlock size={14} /> : <Lock size={14} />}
                  <span>{isClosed ? `${selectedMonth} 마감 해제` : `${selectedMonth} 보고 마감`}</span>
                </button>
              )}
            </div>
          </div>

          {/* Image 2 Style: Monthly Top Statistics Summary Table & Boxes */}
          <div className="monthly-top-stats-container">
            {/* Left: Summary Table with Soft Blue Header (Image 2 style) */}
            <div className="nfox-card monthly-summary-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--table-border, #cbd5e1)' }}>
              <table className="monthly-summary-table">
                <colgroup>
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '17%' }} />
                </colgroup>
                <thead>
                  <tr style={{ background: 'var(--summary-header-bg, #cfe2ff)', borderBottom: '2px solid var(--table-border-accent, #94a3b8)' }}>
                    <th style={{ borderRight: '1px solid var(--table-border, #cbd5e1)', fontWeight: 800, color: 'var(--summary-header-text, #1e3a8a)' }}>{selectedMonth}</th>
                    <th style={{ borderRight: '1px solid var(--table-border, #cbd5e1)', fontWeight: 800, color: 'var(--summary-header-text, #1e3a8a)' }}>인원(명)</th>
                    <th style={{ borderRight: '1px solid var(--table-border, #cbd5e1)', fontWeight: 800, color: 'var(--summary-header-text, #1e3a8a)' }}>시간</th>
                    <th style={{ borderRight: '1px solid var(--table-border, #cbd5e1)', fontWeight: 800, color: 'var(--summary-header-text, #1e3a8a)' }}>연구</th>
                    <th style={{ borderRight: '1px solid var(--table-border, #cbd5e1)', fontWeight: 800, color: 'var(--summary-header-text, #1e3a8a)' }}>시간(평)</th>
                    <th style={{ fontWeight: 800, color: 'var(--summary-header-text, #1e3a8a)' }}>연구(평)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 전도인 */}
                  <tr style={{ borderBottom: '1px solid var(--table-border, #cbd5e1)' }}>
                    <td style={{ fontWeight: 700, borderRight: '1px solid var(--table-border, #cbd5e1)', background: 'rgba(0,0,0,0.01)' }}>전도인</td>
                    <td style={{ borderRight: '1px solid var(--table-border, #cbd5e1)', fontWeight: 700 }}>{selectedMonthStat.publisherCount}</td>
                    <td style={{ borderRight: '1px solid var(--table-border, #cbd5e1)', color: 'var(--text-faint)' }}></td>
                    <td style={{ borderRight: '1px solid var(--table-border, #cbd5e1)' }}>{selectedMonthStat.publisherStudies > 0 ? selectedMonthStat.publisherStudies : ''}</td>
                    <td style={{ borderRight: '1px solid var(--table-border, #cbd5e1)', color: 'var(--text-faint)' }}></td>
                    <td>{selectedMonthStat.publisherAvgStudies}</td>
                  </tr>

                  {/* 보조 */}
                  <tr style={{ borderBottom: '1px solid var(--table-border, #cbd5e1)' }}>
                    <td style={{ fontWeight: 700, borderRight: '1px solid var(--table-border, #cbd5e1)', background: 'rgba(0,0,0,0.01)' }}>보조</td>
                    <td style={{ borderRight: '1px solid var(--table-border, #cbd5e1)', fontWeight: 700 }}>{selectedMonthStat.apCount > 0 ? selectedMonthStat.apCount : ''}</td>
                    <td style={{ borderRight: '1px solid var(--table-border, #cbd5e1)' }}>{selectedMonthStat.apHours > 0 ? selectedMonthStat.apHours : ''}</td>
                    <td style={{ borderRight: '1px solid var(--table-border, #cbd5e1)' }}>{selectedMonthStat.apCount > 0 ? selectedMonthStat.apStudies : ''}</td>
                    <td style={{ borderRight: '1px solid var(--table-border, #cbd5e1)' }}>{selectedMonthStat.apCount > 0 ? selectedMonthStat.apAvgHours : ''}</td>
                    <td>{selectedMonthStat.apCount > 0 ? selectedMonthStat.apAvgStudies : ''}</td>
                  </tr>

                  {/* 정규 */}
                  <tr style={{ borderBottom: '2px solid var(--table-border-accent, #94a3b8)' }}>
                    <td style={{ fontWeight: 700, borderRight: '1px solid var(--table-border, #cbd5e1)', background: 'rgba(0,0,0,0.01)' }}>정규</td>
                    <td style={{ borderRight: '1px solid var(--table-border, #cbd5e1)', fontWeight: 700 }}>{selectedMonthStat.rpCount > 0 ? selectedMonthStat.rpCount : ''}</td>
                    <td style={{ borderRight: '1px solid var(--table-border, #cbd5e1)' }}>{selectedMonthStat.rpHours > 0 ? selectedMonthStat.rpHours : ''}</td>
                    <td style={{ borderRight: '1px solid var(--table-border, #cbd5e1)' }}>{selectedMonthStat.rpStudies > 0 ? selectedMonthStat.rpStudies : ''}</td>
                    <td style={{ borderRight: '1px solid var(--table-border, #cbd5e1)' }}>{selectedMonthStat.rpCount > 0 ? selectedMonthStat.rpAvgHours : ''}</td>
                    <td>{selectedMonthStat.rpCount > 0 ? selectedMonthStat.rpAvgStudies : ''}</td>
                  </tr>

                  {/* 총계 */}
                  <tr style={{ background: 'var(--bg-card-subtle, #f8fafc)', fontWeight: 800 }}>
                    <td style={{ borderRight: '1px solid var(--table-border, #cbd5e1)', color: 'var(--primary)' }}>총계</td>
                    <td style={{ borderRight: '1px solid var(--table-border, #cbd5e1)', color: 'var(--primary)' }}>{selectedMonthStat.totalReporters}</td>
                    <td style={{ borderRight: '1px solid var(--table-border, #cbd5e1)', color: 'var(--primary)' }}>{selectedMonthStat.totalHours > 0 ? selectedMonthStat.totalHours : ''}</td>
                    <td style={{ borderRight: '1px solid var(--table-border, #cbd5e1)', color: 'var(--primary)' }}>{selectedMonthStat.totalStudies > 0 ? selectedMonthStat.totalStudies : ''}</td>
                    <td style={{ borderRight: '1px solid var(--table-border, #cbd5e1)', color: 'var(--text-faint)' }}></td>
                    <td style={{ color: 'var(--primary)' }}>{selectedMonthStat.totalAvgStudies}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right: Summary Key Stats (2-Tier Card matching Table Height) */}
            <div className="nfox-card monthly-side-stats-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--table-border, #cbd5e1)' }}>
              {/* Tier 1 Header: 활동적인 전도인 & 비정규 */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                borderBottom: '1px solid var(--table-border, #cbd5e1)',
                background: 'var(--summary-header-bg, #cfe2ff)'
              }}>
                <div className="monthly-stat-header-cell" style={{ borderRight: '1px solid var(--table-border, #cbd5e1)' }}>
                  활동적인 전도인
                </div>
                <div className="monthly-stat-header-cell">
                  비정규
                </div>
              </div>

              {/* Tier 1 Values */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                borderBottom: '2px solid var(--table-border-accent, #94a3b8)',
                flex: 1
              }}>
                <div 
                  className="monthly-stat-val-box"
                  style={{ borderRight: '1px solid var(--table-border, #cbd5e1)' }}
                  title={`활동적인 전도인: 총 ${selectedMonthStat.activePublishersCount}명 (봉사 참여 ${selectedMonthStat.totalReporters}명 + 비정규 ${selectedMonthStat.unsharedCount}명)`}
                >
                  <div className="monthly-stat-number" style={{ color: 'var(--text-main)' }}>
                    {selectedMonthStat.activePublishersCount}
                  </div>
                </div>

                <div 
                  className="monthly-stat-val-box"
                  onClick={() => {
                    if (selectedMonthStat.unsharedCount > 0) {
                      setFilterParticipated(prev => prev === 'no' ? 'all' : 'no');
                    }
                  }}
                  style={{ 
                    cursor: selectedMonthStat.unsharedCount > 0 ? 'pointer' : 'default',
                    background: filterParticipated === 'no' ? 'rgba(244, 63, 94, 0.08)' : 'transparent',
                  }}
                  title={selectedMonthStat.unsharedCount > 0 
                    ? `봉사 미참여(비정규): ${selectedMonthStat.unsharedCount}명 (클릭 시 해당 전도인 명단 필터링)` 
                    : '비정규 전도인이 없습니다.'}
                >
                  <div className="monthly-stat-number" style={{ 
                    color: selectedMonthStat.unsharedCount > 0 ? 'var(--accent-rose)' : 'var(--text-main)', 
                  }}>
                    {selectedMonthStat.unsharedCount}
                  </div>
                  {selectedMonthStat.unsharedCount > 0 && (
                    <div className="no-print" style={{ fontSize: '0.68rem', color: 'var(--accent-rose)', fontWeight: 600, marginTop: 2 }}>
                      {filterParticipated === 'no' ? '필터링 중' : '클릭 시 필터'}
                    </div>
                  )}
                </div>
              </div>

              {/* Tier 2: 주말 집회 평균 참석자 수 / 평일 집회 참석자 수 2열 분할 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                borderTop: '1px solid var(--table-border, #cbd5e1)',
                flex: 1
              }}>
                {/* 주말 집회 */}
                <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--table-border, #cbd5e1)' }}>
                  <div className="monthly-stat-header-cell" style={{ 
                    background: 'var(--summary-header-bg, #cfe2ff)',
                    borderBottom: '1px solid var(--table-border, #cbd5e1)',
                  }}>
                    주말 집회 평균 참석자 수
                  </div>
                  <div 
                    className="monthly-stat-val-box"
                    onClick={handleEditWeekendAttendance}
                    style={{ cursor: 'pointer' }}
                    title="클릭하여 주말 집회 평균 참석자 수를 수정할 수 있습니다"
                  >
                    <div className="monthly-stat-number" style={{ color: (meetingAttendance === '0' || !meetingAttendance) ? 'var(--accent-rose)' : 'var(--primary)' }}>
                      {meetingAttendance}
                    </div>
                    {(meetingAttendance === '0' || !meetingAttendance) && (
                      <div className="no-print" style={{ fontSize: '0.65rem', color: 'var(--accent-rose)', fontWeight: 700, marginTop: 2 }}>
                        ⚠️ 미입력
                      </div>
                    )}
                  </div>
                </div>

                {/* 평일 집회 */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="monthly-stat-header-cell" style={{ 
                    background: 'var(--summary-header-bg-subtle, #e0ecff)',
                    borderBottom: '1px solid var(--table-border, #cbd5e1)',
                  }}>
                    평일 집회 참석자 수
                  </div>
                  <div 
                    className="monthly-stat-val-box"
                    onClick={handleEditWeekdayAttendance}
                    style={{ cursor: 'pointer' }}
                    title="클릭하여 평일 집회 참석자 수를 수정할 수 있습니다"
                  >
                    <div className="monthly-stat-number" style={{ color: (weekdayMeetingAttendance === '0' || !weekdayMeetingAttendance) ? 'var(--accent-rose)' : '#0284c7' }}>
                      {weekdayMeetingAttendance}
                    </div>
                    {(weekdayMeetingAttendance === '0' || !weekdayMeetingAttendance) && (
                      <div className="no-print" style={{ fontSize: '0.65rem', color: 'var(--accent-rose)', fontWeight: 700, marginTop: 2 }}>
                        ⚠️ 미입력
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

      {/* 4. Detailed Monthly Reports Table (Full Width) */}
      <div className="nfox-card monthly-detail-table-card" style={{ padding: '24px' }}>
          {/* Header & Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20
          }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {selectedMonth} 전도인 보고 세부 목록
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                총 {displayReports.length}건이 표시되고 있습니다.
              </p>
            </div>

            <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                <input
                  type="text"
                  placeholder="전도인 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{
                    paddingLeft: 30,
                    paddingRight: 10,
                    paddingTop: 6,
                    paddingBottom: 6,
                    fontSize: '0.82rem',
                    width: 170,
                    borderRadius: 'var(--radius-full)'
                  }}
                />
              </div>

              {/* 필터 초기화 버튼 (필터 또는 검색이 적용되었을 때만 노출) */}
              {isFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn-secondary"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    gap: 5,
                    color: 'var(--accent-rose)',
                    borderColor: 'rgba(244, 63, 94, 0.3)'
                  }}
                  title="모든 필터를 해제하고 기본 이름순으로 되돌립니다"
                >
                  <RotateCcw size={13} />
                  <span>필터 초기화</span>
                </button>
              )}

              {/* Export CSV */}
              <button
                onClick={handleExportCsv}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', gap: 5 }}
              >
                <Download size={13} />
                <span>엑셀/CSV</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="data-table-container sticky-container">
            <table className="data-table data-table-sticky monthly-report-data-table">
              <thead>
                <tr>
                  {/* 1. 이름 (클릭 시 가나다 오름/내림 정렬) */}
                  <th 
                    className="col-publisher-name"
                    onClick={() => handleSort('publisher_name')}
                    style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none', background: monthlySortField === 'publisher_name' ? 'var(--primary-light, #eff6ff)' : undefined }}
                    title="클릭하여 이름 순으로 정렬"
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <span style={{ color: monthlySortField === 'publisher_name' ? 'var(--primary)' : undefined, fontWeight: 700 }}>이름</span>
                      {monthlySortField === 'publisher_name' && (
                        monthlySortOrder === 'asc' ? <ArrowUp size={13} color="var(--primary)" /> : <ArrowDown size={13} color="var(--primary)" />
                      )}
                    </div>
                  </th>

                  {/* 2. 참여 (클릭 시 참여/미참여 필터 및 정렬 팝오버) */}
                  <th 
                    className="col-participated"
                    style={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      userSelect: 'none',
                      background: filterParticipated !== 'all' || monthlySortField === 'participated' ? 'var(--primary-light, #eff6ff)' : undefined
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveHeaderDropdown(activeHeaderDropdown === 'participated' ? null : 'participated');
                    }}
                    title="클릭하여 참여 여부 필터 및 정렬"
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <span style={{ fontWeight: 700, color: filterParticipated !== 'all' ? 'var(--primary)' : undefined }}>참여</span>
                      {monthlySortField === 'participated' && (
                        monthlySortOrder === 'asc' ? <ArrowUp size={11} color="var(--primary)" /> : <ArrowDown size={11} color="var(--primary)" />
                      )}
                      {filterParticipated !== 'all' && (
                        <span style={{ fontSize: '0.62rem', padding: '1px 4px', borderRadius: 4, background: 'var(--primary)', color: '#fff', fontWeight: 800 }}>
                          {filterParticipated === 'yes' ? 'Y' : 'N'}
                        </span>
                      )}
                      <ChevronDown size={11} style={{ opacity: filterParticipated !== 'all' ? 1 : 0.45 }} />
                    </div>

                    {activeHeaderDropdown === 'participated' && (
                      <div className="header-filter-popover" onClick={e => e.stopPropagation()}>
                        <div className="popover-header">
                          <span>참여 정렬 & 필터</span>
                        </div>
                        <div className={`popover-item ${monthlySortField === 'participated' && monthlySortOrder === 'asc' ? 'active' : ''}`} onClick={() => { handleSort('participated'); setActiveHeaderDropdown(null); }}>
                          <span>참여(Y) 우선 정렬</span>
                          {monthlySortField === 'participated' && monthlySortOrder === 'asc' && <Check size={13} />}
                        </div>
                        <div className="popover-divider" />
                        <div className={`popover-item ${filterParticipated === 'all' ? 'active' : ''}`} onClick={() => { setFilterParticipated('all'); setActiveHeaderDropdown(null); }}>
                          <span>참여 전체</span>
                          {filterParticipated === 'all' && <Check size={13} />}
                        </div>
                        <div className={`popover-item ${filterParticipated === 'yes' ? 'active' : ''}`} onClick={() => { setFilterParticipated('yes'); setActiveHeaderDropdown(null); }}>
                          <span>참여 (Y)</span>
                          {filterParticipated === 'yes' && <Check size={13} />}
                        </div>
                        <div className={`popover-item ${filterParticipated === 'no' ? 'active' : ''}`} onClick={() => { setFilterParticipated('no'); setActiveHeaderDropdown(null); }}>
                          <span>미참여 (N)</span>
                          {filterParticipated === 'no' && <Check size={13} />}
                        </div>
                      </div>
                    )}
                  </th>

                  {/* 3. 연구 (클릭 시 건수 정렬) */}
                  <th 
                    className="col-studies"
                    onClick={() => handleSort('bible_studies')}
                    style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none', background: monthlySortField === 'bible_studies' ? 'var(--primary-light, #eff6ff)' : undefined }}
                    title="클릭하여 성서연구 건수로 정렬"
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <span style={{ color: monthlySortField === 'bible_studies' ? 'var(--primary)' : undefined, fontWeight: 700 }}>연구</span>
                      {monthlySortField === 'bible_studies' && (
                        monthlySortOrder === 'asc' ? <ArrowUp size={13} color="var(--primary)" /> : <ArrowDown size={13} color="var(--primary)" />
                      )}
                    </div>
                  </th>

                  {/* 4. 시간 (클릭 시 봉사시간 정렬) */}
                  <th 
                    className="col-hours"
                    onClick={() => handleSort('hours')}
                    style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none', background: monthlySortField === 'hours' ? 'var(--primary-light, #eff6ff)' : undefined }}
                    title="클릭하여 봉사시간으로 정렬"
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <span style={{ color: monthlySortField === 'hours' ? 'var(--primary)' : undefined, fontWeight: 700 }}>시간</span>
                      {monthlySortField === 'hours' && (
                        monthlySortOrder === 'asc' ? <ArrowUp size={13} color="var(--primary)" /> : <ArrowDown size={13} color="var(--primary)" />
                      )}
                    </div>
                  </th>

                  {/* 5. 비고 (클릭 시 비고 유무 필터 및 정렬 팝오버) */}
                  <th 
                    style={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      userSelect: 'none',
                      background: filterRemarks !== 'all' || monthlySortField === 'remarks' ? 'var(--primary-light, #eff6ff)' : undefined
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveHeaderDropdown(activeHeaderDropdown === 'remarks' ? null : 'remarks');
                    }}
                    title="클릭하여 비고/인정시간 필터 및 정렬"
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <span style={{ fontWeight: 700, color: filterRemarks !== 'all' ? 'var(--primary)' : undefined }}>비고</span>
                      {monthlySortField === 'remarks' && (
                        monthlySortOrder === 'asc' ? <ArrowUp size={12} color="var(--primary)" /> : <ArrowDown size={12} color="var(--primary)" />
                      )}
                      {filterRemarks !== 'all' && (
                        <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: 4, background: 'var(--primary)', color: '#fff', fontWeight: 800 }}>
                          {filterRemarks === 'has_remarks' ? '있음' : '없음'}
                        </span>
                      )}
                      <ChevronDown size={12} style={{ opacity: filterRemarks !== 'all' ? 1 : 0.45 }} />
                    </div>

                    {activeHeaderDropdown === 'remarks' && (
                      <div className="header-filter-popover" onClick={e => e.stopPropagation()}>
                        <div className="popover-header">
                          <span>비고 정렬 & 필터</span>
                        </div>
                        <div className={`popover-item ${monthlySortField === 'remarks' && monthlySortOrder === 'desc' ? 'active' : ''}`} onClick={() => { handleSort('remarks'); setActiveHeaderDropdown(null); }}>
                          <span>인정시간 많은 순 정렬</span>
                          {monthlySortField === 'remarks' && monthlySortOrder === 'desc' && <Check size={13} />}
                        </div>
                        <div className="popover-divider" />
                        <div className={`popover-item ${filterRemarks === 'all' ? 'active' : ''}`} onClick={() => { setFilterRemarks('all'); setActiveHeaderDropdown(null); }}>
                          <span>비고 전체</span>
                          {filterRemarks === 'all' && <Check size={13} />}
                        </div>
                        <div className={`popover-item ${filterRemarks === 'has_remarks' ? 'active' : ''}`} onClick={() => { setFilterRemarks('has_remarks'); setActiveHeaderDropdown(null); }}>
                          <span>비고 있음 (인정시간)</span>
                          {filterRemarks === 'has_remarks' && <Check size={13} />}
                        </div>
                        <div className={`popover-item ${filterRemarks === 'no_remarks' ? 'active' : ''}`} onClick={() => { setFilterRemarks('no_remarks'); setActiveHeaderDropdown(null); }}>
                          <span>비고 없음</span>
                          {filterRemarks === 'no_remarks' && <Check size={13} />}
                        </div>
                      </div>
                    )}
                  </th>

                  {/* 6. 구분 (클릭 시 RP/AP/일반/자녀 선택 팝오버) */}
                  <th 
                    style={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      userSelect: 'none',
                      background: filterPioneerStatus !== 'all' || monthlySortField === 'pioneer_status' ? 'var(--primary-light, #eff6ff)' : undefined
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveHeaderDropdown(activeHeaderDropdown === 'pioneer_status' ? null : 'pioneer_status');
                    }}
                    title="클릭하여 구분(RP/AP/일반/자녀) 필터 선택"
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <span style={{ fontWeight: 700, color: filterPioneerStatus !== 'all' ? 'var(--primary)' : undefined }}>구분</span>
                      {monthlySortField === 'pioneer_status' && (
                        monthlySortOrder === 'asc' ? <ArrowUp size={12} color="var(--primary)" /> : <ArrowDown size={12} color="var(--primary)" />
                      )}
                      {filterPioneerStatus !== 'all' && (
                        <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: 4, background: 'var(--primary)', color: '#fff', fontWeight: 800 }}>
                          {filterPioneerStatus}
                        </span>
                      )}
                      <ChevronDown size={12} style={{ opacity: filterPioneerStatus !== 'all' ? 1 : 0.45 }} />
                    </div>

                    {activeHeaderDropdown === 'pioneer_status' && (
                      <div className="header-filter-popover" onClick={e => e.stopPropagation()}>
                        <div className="popover-header">
                          <span>구분 선택 필터</span>
                        </div>
                        <div className={`popover-item ${filterPioneerStatus === 'all' ? 'active' : ''}`} onClick={() => { setFilterPioneerStatus('all'); setActiveHeaderDropdown(null); }}>
                          <span>전체 구분</span>
                          {filterPioneerStatus === 'all' && <Check size={13} />}
                        </div>
                        <div className={`popover-item ${filterPioneerStatus === 'RP' ? 'active' : ''}`} onClick={() => { setFilterPioneerStatus('RP'); setActiveHeaderDropdown(null); }}>
                          <span>정규 (RP)</span>
                          {filterPioneerStatus === 'RP' && <Check size={13} />}
                        </div>
                        <div className={`popover-item ${filterPioneerStatus === 'AP' ? 'active' : ''}`} onClick={() => { setFilterPioneerStatus('AP'); setActiveHeaderDropdown(null); }}>
                          <span>보조 (AP)</span>
                          {filterPioneerStatus === 'AP' && <Check size={13} />}
                        </div>
                        <div className={`popover-item ${filterPioneerStatus === '일반' ? 'active' : ''}`} onClick={() => { setFilterPioneerStatus('일반'); setActiveHeaderDropdown(null); }}>
                          <span>일반 전도인</span>
                          {filterPioneerStatus === '일반' && <Check size={13} />}
                        </div>
                        <div className={`popover-item ${filterPioneerStatus === '자녀' ? 'active' : ''}`} onClick={() => { setFilterPioneerStatus('자녀'); setActiveHeaderDropdown(null); }}>
                          <span>자녀</span>
                          {filterPioneerStatus === '자녀' && <Check size={13} />}
                        </div>
                      </div>
                    )}
                  </th>

                  {/* 7. 직책 (클릭 시 장로/봉종/일반 선택 팝오버) */}
                  <th 
                    style={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      userSelect: 'none',
                      background: filterPosition !== 'all' || monthlySortField === 'position' ? 'var(--primary-light, #eff6ff)' : undefined
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveHeaderDropdown(activeHeaderDropdown === 'position' ? null : 'position');
                    }}
                    title="클릭하여 직책(장로/봉종/일반) 필터 선택"
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <span style={{ fontWeight: 700, color: filterPosition !== 'all' ? 'var(--primary)' : undefined }}>직책</span>
                      {monthlySortField === 'position' && (
                        monthlySortOrder === 'asc' ? <ArrowUp size={12} color="var(--primary)" /> : <ArrowDown size={12} color="var(--primary)" />
                      )}
                      {filterPosition !== 'all' && (
                        <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: 4, background: 'var(--primary)', color: '#fff', fontWeight: 800 }}>
                          {filterPosition}
                        </span>
                      )}
                      <ChevronDown size={12} style={{ opacity: filterPosition !== 'all' ? 1 : 0.45 }} />
                    </div>

                    {activeHeaderDropdown === 'position' && (
                      <div className="header-filter-popover" onClick={e => e.stopPropagation()}>
                        <div className="popover-header">
                          <span>직책 선택 필터</span>
                        </div>
                        <div className={`popover-item ${filterPosition === 'all' ? 'active' : ''}`} onClick={() => { setFilterPosition('all'); setActiveHeaderDropdown(null); }}>
                          <span>전체 직책</span>
                          {filterPosition === 'all' && <Check size={13} />}
                        </div>
                        <div className={`popover-item ${filterPosition === '장로' ? 'active' : ''}`} onClick={() => { setFilterPosition('장로'); setActiveHeaderDropdown(null); }}>
                          <span>장로</span>
                          {filterPosition === '장로' && <Check size={13} />}
                        </div>
                        <div className={`popover-item ${filterPosition === '봉종' ? 'active' : ''}`} onClick={() => { setFilterPosition('봉종'); setActiveHeaderDropdown(null); }}>
                          <span>봉종</span>
                          {filterPosition === '봉종' && <Check size={13} />}
                        </div>
                        <div className={`popover-item ${filterPosition === '일반' ? 'active' : ''}`} onClick={() => { setFilterPosition('일반'); setActiveHeaderDropdown(null); }}>
                          <span>일반</span>
                          {filterPosition === '일반' && <Check size={13} />}
                        </div>
                      </div>
                    )}
                  </th>

                  {/* 8. 집단 (클릭 시 집단 선택 팝오버 - 사용자 요청 핵심) */}
                  <th 
                    style={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      userSelect: 'none',
                      background: filterGroup !== 'all' || monthlySortField === 'group_name' ? 'var(--primary-light, #eff6ff)' : undefined
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveHeaderDropdown(activeHeaderDropdown === 'group_name' ? null : 'group_name');
                    }}
                    title="클릭하여 집단 선택 필터"
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <span style={{ fontWeight: 700, color: filterGroup !== 'all' ? 'var(--primary)' : undefined }}>집단</span>
                      {monthlySortField === 'group_name' && (
                        monthlySortOrder === 'asc' ? <ArrowUp size={12} color="var(--primary)" /> : <ArrowDown size={12} color="var(--primary)" />
                      )}
                      {filterGroup !== 'all' && (
                        <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: 4, background: 'var(--primary)', color: '#fff', fontWeight: 800 }}>
                          {filterGroup}
                        </span>
                      )}
                      <ChevronDown size={12} style={{ opacity: filterGroup !== 'all' ? 1 : 0.45 }} />
                    </div>

                    {activeHeaderDropdown === 'group_name' && (
                      <div className="header-filter-popover align-right" onClick={e => e.stopPropagation()}>
                        <div className="popover-header">
                          <span>집단 선택 필터</span>
                        </div>
                        <div className={`popover-item ${monthlySortField === 'group_name' && monthlySortOrder === 'asc' ? 'active' : ''}`} onClick={() => { handleSort('group_name'); setActiveHeaderDropdown(null); }}>
                          <span>집단순 정렬</span>
                          {monthlySortField === 'group_name' && monthlySortOrder === 'asc' && <Check size={13} />}
                        </div>
                        <div className="popover-divider" />
                        <div className={`popover-item ${filterGroup === 'all' ? 'active' : ''}`} onClick={() => { setFilterGroup('all'); setActiveHeaderDropdown(null); }}>
                          <span>전체 집단</span>
                          {filterGroup === 'all' && <Check size={13} />}
                        </div>
                        <div className="popover-divider" />
                        {groups.map(g => (
                          <div key={g.id} className={`popover-item ${filterGroup === g.name ? 'active' : ''}`} onClick={() => { setFilterGroup(g.name); setActiveHeaderDropdown(null); }}>
                            <span>{g.name} 집단</span>
                            {filterGroup === g.name && <Check size={13} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </th>

                  <th style={{ textAlign: 'center', width: 68 }} className="no-print">수정</th>
                </tr>
              </thead>
              <tbody>
                {displayReports.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      해당 조건의 보고서가 없습니다.
                    </td>
                  </tr>
                ) : (
                  displayReports.map((r) => (
                    <tr key={r.id}>
                      {/* 성명: 클릭 시 S-21 전도인 기록 카드 모달 실행 */}
                      <td className="col-publisher-name" style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => setCardModalData({ id: r.publisher_id, name: r.publisher_name || '' })}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            margin: 0,
                            cursor: 'pointer',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            fontSize: '0.92rem',
                            textAlign: 'center'
                          }}
                          className="name-link-btn"
                          title={`${r.publisher_name} 전도인 기록 카드 (S-21) 열기`}
                        >
                          {r.publisher_name}
                        </button>
                      </td>

                      {/* 참여: Y / N */}
                      <td className="col-participated" style={{ textAlign: 'center' }}>
                        {r.participated ? (
                          <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>Y</span>
                        ) : (
                          <span style={{ color: 'var(--accent-rose)', fontWeight: 800 }}>N</span>
                        )}
                      </td>

                      {/* 연구: '건' 글자 없이 숫자만 표시 */}
                      <td className="col-studies" style={{ textAlign: 'center' }}>
                        {r.bible_studies > 0 ? r.bible_studies : '-'}
                      </td>

                      {/* 시간: '시간' 글자 없이 숫자만 표시 */}
                      <td className="col-hours" style={{ textAlign: 'center', fontWeight: r.hours > 0 ? 700 : 400 }}>
                        {r.hours > 0 ? r.hours : '-'}
                      </td>

                      {/* 비고: 특기사항 및 인정시간 */}
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
                        {(r.remarks || []).map(rm => `${rm.type}: ${rm.hours}시간`).join(', ') || '-'}
                      </td>

                      {/* 구분: RP가 아닌데 시간 보고가 되어 있다면 AP로 표시 */}
                      <td style={{ textAlign: 'center' }}>
                        {isChildStatus(r.pioneer_status) ? (
                          <span className="badge badge-child">자녀</span>
                        ) : r.pioneer_status === 'RP' ? (
                          <span className="badge badge-rp">RP</span>
                        ) : Number(r.hours || 0) > 0 ? (
                          <span className="badge badge-ap">AP</span>
                        ) : r.pioneer_status && r.pioneer_status !== '일반' && r.pioneer_status !== 'AP' ? (
                          <span className={`badge badge-${r.pioneer_status?.toLowerCase()}`}>
                            {r.pioneer_status}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-faint)' }}>-</span>
                        )}
                      </td>

                      {/* 직책: '일반' 구분은 없앰 (오직 장로, 봉종만 표시) */}
                      <td style={{ textAlign: 'center' }}>
                        {r.position === '장로' ? (
                          <span className="badge badge-elder">장로</span>
                        ) : (r.position === '봉종' || r.position === '봉사의 종') ? (
                          <span className="badge badge-servant">봉종</span>
                        ) : r.position && r.position !== '일반' ? (
                          <span className="badge badge-publisher">{r.position}</span>
                        ) : (
                          ''
                        )}
                      </td>

                      {/* 집단 */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-group">
                          {r.group_name}
                        </span>
                      </td>

                      {/* 수정 버튼 */}
                      <td style={{ textAlign: 'center' }} className="no-print">
                        <button
                          onClick={() => setEditModalData({
                            publisher: {
                              id: r.publisher_id,
                              name: r.publisher_name || '',
                              group_name: r.group_name,
                              position: r.position,
                              pioneer_status: r.pioneer_status
                            },
                            month: selectedMonth,
                            existingReport: r
                          })}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.76rem', gap: 4 }}
                          title={`${r.publisher_name} 보고서 내용 수정`}
                        >
                          <Edit2 size={12} />
                          <span>수정</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      )}

      {/* 5. 회중 분석 보고 (1년에 한 번 지부 보고용) */}
      {viewMode === 'analysis' && isSuperAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Action Bar (화면용) */}
          <div className="no-print" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '14px 20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: '#e0e7ff',
                color: '#4338ca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileBarChart size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {currentYear.year_name} 봉사연도 회중 분석 보고
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  1년에 한 번 지부에 제출하는 연간 종합 보고입니다. (참석자와 활동 전도인은 자동 집계되며, 모든 수치는 직접 수정 가능합니다)
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {Object.keys(analysisOverrides).length > 0 && (
                <button
                  type="button"
                  onClick={handleResetAnalysisOverrides}
                  className="btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: 'var(--radius-md)' }}
                  title="수동 수정한 값을 모두 원래 자동 집계값으로 되돌립니다"
                >
                  자동 계산값으로 복원
                </button>
              )}
              <button
                type="button"
                onClick={openAnalysisEditModal}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.84rem',
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700
                }}
              >
                <Edit3 size={15} />
                <span>항목 직접 수정</span>
              </button>
            </div>
          </div>

          {/* 인쇄 전용 헤더 */}
          <div className="print-only" style={{ display: 'none', textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #0f172a', paddingBottom: 12 }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>
              {congregationName} 회중 분석 보고
            </h2>
            <div style={{ fontSize: '0.95rem', color: '#475569', marginTop: 4 }}>
              {currentYear.year_name} 봉사연도 (연 1회 지부 보고용)
            </div>
          </div>

          {/* 카드 1: 평균 집회 참석자 수 */}
          <div className="nfox-card" style={{
            padding: '24px 32px'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: 0, marginBottom: 20 }}>
              평균 집회 참석자 수
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 48px' }}>
              <div>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
                  주말 집회
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {analysisOverrides.weekendAttendance !== undefined ? analysisOverrides.weekendAttendance : annualWeekendAttendance}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
                  평일 집회
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {analysisOverrides.weekdayAttendance !== undefined ? analysisOverrides.weekdayAttendance : annualWeekdayAttendance}
                </div>
              </div>
            </div>
          </div>

          {/* 카드 2: 회중 총계 */}
          <div className="nfox-card" style={{
            padding: '24px 32px'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: 0, marginBottom: 20 }}>
              회중 총계
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 48, rowGap: 28 }}>
              {/* Row 1 */}
              <div>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
                  모든 활동적인 전도인
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {analysisOverrides.activePublishers !== undefined ? analysisOverrides.activePublishers : autoActivePublishers}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
                  농아인 전도인
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {analysisOverrides.deafPublishers !== undefined ? analysisOverrides.deafPublishers : autoDeafPublishers}
                </div>
              </div>

              {/* Row 2 */}
              <div>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
                  새로운 무활동 전도인
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {analysisOverrides.inactivePublishers !== undefined ? analysisOverrides.inactivePublishers : autoInactivePublishers}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
                  맹인 전도인
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {analysisOverrides.blindPublishers !== undefined ? analysisOverrides.blindPublishers : autoBlindPublishers}
                </div>
              </div>

              {/* Row 3 */}
              <div>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
                  재활동 전도인
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {analysisOverrides.reactivatedPublishers !== undefined ? analysisOverrides.reactivatedPublishers : 0}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
                  갇혀 지내는 전도인
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {analysisOverrides.confinedPublishers !== undefined ? analysisOverrides.confinedPublishers : 0}
                </div>
              </div>
            </div>
          </div>

          {/* 카드 3: 구역 현황 */}
          <div className="nfox-card" style={{
            padding: '24px 32px'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: 0, marginBottom: 20 }}>
              구역 현황
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 48px' }}>
              <div>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
                  구역의 총합계
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {analysisOverrides.totalTerritories !== undefined ? analysisOverrides.totalTerritories : 749}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
                  봉사되지 않은 구역 수
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {analysisOverrides.unworkedTerritories !== undefined ? analysisOverrides.unworkedTerritories : 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {unreportedModalOpen && (
        <UnreportedListModal
          month={selectedMonth}
          unreportedList={unreportedList}
          groupStatsList={groupStatsList}
          onClose={() => setUnreportedModalOpen(false)}
          onSelectPublisherToReport={(pub) => {
            setEditModalData({
              publisher: pub,
              month: selectedMonth,
              existingReport: null
            });
          }}
        />
      )}

      {/* 관리자 보고서 작성/수정 모달 */}
      {editModalData && (
        <ReportEditModal
          serviceYear={currentYear}
          publisher={editModalData.publisher}
          month={editModalData.month}
          existingReport={editModalData.existingReport}
          onClose={() => setEditModalData(null)}
          onSaved={() => {
            loadDashboardData();
          }}
        />
      )}

      {cardModalData && (
        <PublisherCardModal
          serviceYear={currentYear}
          publisherId={cardModalData.id}
          publisherName={cardModalData.name}
          onClose={() => setCardModalData(null)}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 보고 완료/마감 시 미보고자 조치 선택 모달 */}
      {/* ------------------------------------------------------------- */}
      {closeModalOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => !closing && setCloseModalOpen(false)}
        >
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: '28px' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#d97706',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto'
              }}>
                <AlertTriangle size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0' }}>
                {selectedMonth} 보고 마감 및 미보고자 조치
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0 }}>
                현재 {selectedMonth} 보고서가 미제출된 전도인이 <strong>{unreportedList.length}명</strong> 있습니다.
              </p>
            </div>

            <div style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: 20
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                미보고자 명단 ({unreportedList.length}명)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {unreportedList.map(p => (
                  <span key={p.id} className="badge" style={{ padding: '4px 8px', fontSize: '0.82rem' }}>
                    <strong>{p.name}</strong> ({p.group_name})
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {/* 옵션 1: 미참여(N) 일괄 기록 후 마감 (기본 권장) */}
              <button
                type="button"
                onClick={handleCloseWithUnreported}
                disabled={closing}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--primary)',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textAlign: 'left',
                  cursor: closing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'var(--transition-fast)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <CheckCircle size={16} />
                    <span>미보고자 전원 '봉사 미참여(N)' 기록 후 완료 (권장)</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400, lineHeight: 1.4 }}>
                    미보고자 {unreportedList.length}명을 '미참여(0시간)'로 자동 추가하여 미보고자를 0명으로 만들고 최종 마감합니다.
                  </div>
                </div>
              </button>

              {/* 옵션 2: 그대로 마감 */}
              <button
                type="button"
                onClick={handleCloseWithoutUnreported}
                disabled={closing}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-app)',
                  color: 'var(--text-color)',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  textAlign: 'left',
                  cursor: closing ? 'not-allowed' : 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                <div style={{ marginBottom: 2 }}>미보고자 보고서 생성 없이 그대로 마감</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                  미보고 상태를 그대로 유지한 채 추가 보고서 제출만 잠급니다.
                </div>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setCloseModalOpen(false)}
                className="btn-secondary"
                disabled={closing}
              >
                취소 (보고 접수 계속 진행)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회중 분석 보고 항목 직접 수정 모달 */}
      {analysisEditModalOpen && isSuperAdmin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: 20
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: 620,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px 28px',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  회중 분석 보고 항목 수정
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  필요한 항목의 수치를 직접 입력하거나 수정할 수 있습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAnalysisEditModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAnalysisOverrides} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* 섹션 1: 평균 집회 참석자 수 */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>
                  1. 평균 집회 참석자 수
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      주말 집회
                    </label>
                    <input
                      type="number"
                      className="input-base"
                      value={analysisForm.weekendAttendance ?? ''}
                      onChange={e => setAnalysisForm(prev => ({ ...prev, weekendAttendance: parseInt(e.target.value, 10) || 0 }))}
                      style={{ width: '100%', padding: '8px 12px', fontSize: '0.95rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      평일 집회
                    </label>
                    <input
                      type="number"
                      className="input-base"
                      value={analysisForm.weekdayAttendance ?? ''}
                      onChange={e => setAnalysisForm(prev => ({ ...prev, weekdayAttendance: parseInt(e.target.value, 10) || 0 }))}
                      style={{ width: '100%', padding: '8px 12px', fontSize: '0.95rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* 섹션 2: 회중 총계 */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>
                  2. 회중 총계
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      모든 활동적인 전도인
                    </label>
                    <input
                      type="number"
                      className="input-base"
                      value={analysisForm.activePublishers ?? ''}
                      onChange={e => setAnalysisForm(prev => ({ ...prev, activePublishers: parseInt(e.target.value, 10) || 0 }))}
                      style={{ width: '100%', padding: '8px 12px', fontSize: '0.95rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      농아인 전도인 (비고 농아/수어)
                    </label>
                    <input
                      type="number"
                      className="input-base"
                      value={analysisForm.deafPublishers ?? ''}
                      onChange={e => setAnalysisForm(prev => ({ ...prev, deafPublishers: parseInt(e.target.value, 10) || 0 }))}
                      style={{ width: '100%', padding: '8px 12px', fontSize: '0.95rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      새로운 무활동 전도인 (6개월 미보고)
                    </label>
                    <input
                      type="number"
                      className="input-base"
                      value={analysisForm.inactivePublishers ?? ''}
                      onChange={e => setAnalysisForm(prev => ({ ...prev, inactivePublishers: parseInt(e.target.value, 10) || 0 }))}
                      style={{ width: '100%', padding: '8px 12px', fontSize: '0.95rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      맹인 전도인 (비고 맹인)
                    </label>
                    <input
                      type="number"
                      className="input-base"
                      value={analysisForm.blindPublishers ?? ''}
                      onChange={e => setAnalysisForm(prev => ({ ...prev, blindPublishers: parseInt(e.target.value, 10) || 0 }))}
                      style={{ width: '100%', padding: '8px 12px', fontSize: '0.95rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      재활동 전도인
                    </label>
                    <input
                      type="number"
                      className="input-base"
                      value={analysisForm.reactivatedPublishers ?? ''}
                      onChange={e => setAnalysisForm(prev => ({ ...prev, reactivatedPublishers: parseInt(e.target.value, 10) || 0 }))}
                      style={{ width: '100%', padding: '8px 12px', fontSize: '0.95rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      갇혀 지내는 전도인
                    </label>
                    <input
                      type="number"
                      className="input-base"
                      value={analysisForm.confinedPublishers ?? ''}
                      onChange={e => setAnalysisForm(prev => ({ ...prev, confinedPublishers: parseInt(e.target.value, 10) || 0 }))}
                      style={{ width: '100%', padding: '8px 12px', fontSize: '0.95rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* 섹션 3: 구역 현황 */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>
                  3. 구역 현황
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      구역의 총합계
                    </label>
                    <input
                      type="number"
                      className="input-base"
                      value={analysisForm.totalTerritories ?? ''}
                      onChange={e => setAnalysisForm(prev => ({ ...prev, totalTerritories: parseInt(e.target.value, 10) || 0 }))}
                      style={{ width: '100%', padding: '8px 12px', fontSize: '0.95rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      봉사되지 않은 구역 수
                    </label>
                    <input
                      type="number"
                      className="input-base"
                      value={analysisForm.unworkedTerritories ?? ''}
                      onChange={e => setAnalysisForm(prev => ({ ...prev, unworkedTerritories: parseInt(e.target.value, 10) || 0 }))}
                      style={{ width: '100%', padding: '8px 12px', fontSize: '0.95rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={handleResetAnalysisOverrides}
                  className="btn-secondary"
                  style={{ fontSize: '0.82rem', color: 'var(--accent-rose)' }}
                >
                  자동 계산값으로 초기화
                </button>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setAnalysisEditModalOpen(false)}
                    className="btn-secondary"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Save size={15} />
                    <span>저장 완료</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

