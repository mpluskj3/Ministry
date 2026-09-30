import React, { useState, useEffect, useCallback } from 'react';
import {
  Send,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  BookOpen,
  Check,
  Calendar,
  Lock,
  UserCheck,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  FileText,
  Share2,
  HelpCircle,
  Sparkles,
  Info,
  History,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Publisher,
  ServiceMonth,
  SERVICE_MONTHS,
  ServiceYear,
  RemarkItem,
  MonthlyReport,
  isChildStatus,
  Manager
} from '../types/database';
import {
  getPublishers,
  getMonthlyStatuses,
  submitMinistryReport,
  getExistingReport,
  getAutoSelectServiceMonth
} from '../services/ministryService';
import { engToKor } from '../utils/hangulUtils';

const REMARK_TYPES = [
  '원격봉사',
  'LDC',
  '장로학교',
  '유지보수',
  '파이오니아학교',
  '베델봉사',
  '대회자원봉사',
  '병교위/환자방문',
  '재해구호',
  '기타',
];

interface ReportFormProps {
  currentYear: ServiceYear;
  onSuccessNavigate?: () => void;
  isStandalone?: boolean;
  manager?: Manager | null;
}

export const ReportForm: React.FC<ReportFormProps> = ({
  currentYear,
  onSuccessNavigate,
  isStandalone = false,
  manager
}) => {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [selectedPublisher, setSelectedPublisher] = useState<Publisher | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // 최근 제출/입력한 전도인 이름 캐시 (로컬 스토리지 연동)
  const [recentNames, setRecentNames] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ministry_recent_names');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((n): n is string => typeof n === 'string' && n.trim().length > 0);
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const handleRemoveRecentName = (nameToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setRecentNames(prev => {
      const updated = prev.filter(n => n !== nameToRemove);
      try {
        localStorage.setItem('ministry_recent_names', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearAllRecentNames = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setRecentNames([]);
    try {
      localStorage.removeItem('ministry_recent_names');
    } catch {}
  };

  // 자동 월 선택 (현재 날짜 및 봉사연도 기준)
  const [month, setMonth] = useState<ServiceMonth>(() => getAutoSelectServiceMonth(undefined, currentYear?.year_name));
  const [monthStatuses, setMonthStatuses] = useState<Record<ServiceMonth, boolean>>({} as any);

  // S-4 양식 항목
  const [participated, setParticipated] = useState(true);
  const [hours, setHours] = useState<string>('');
  const [bibleStudies, setBibleStudies] = useState<string>('');
  const [isAuxiliaryPioneer, setIsAuxiliaryPioneer] = useState(false);
  const [remarks, setRemarks] = useState<RemarkItem[]>([]);

  // 중복 제출/수정 모드 상태
  const [existingReport, setExistingReport] = useState<MonthlyReport | null>(null);
  const [showExistingAlert, setShowExistingAlert] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // 보조 파이오니아(AP) 확인 안내 모달 상태
  const [showApConfirmModal, setShowApConfirmModal] = useState(false);
  const [pendingPublisher, setPendingPublisher] = useState<Publisher | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedReceipt, setSubmittedReceipt] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    async function loadInitial() {
      try {
        const [pubs, statuses] = await Promise.all([
          getPublishers(false),
          getMonthlyStatuses(currentYear.id)
        ]);
        // '자녀 (집계 제외)'는 봉사 보고 제출 대상이 아니므로 선택 명단에서 제외
        let availablePubs = pubs.filter(p => !isChildStatus(p.pioneer_status));
        if (!isStandalone && manager?.role === 'group') {
          const gName = manager.group_name;
          availablePubs = availablePubs.filter(p => p.group_id === manager.group_id || (gName && p.group_name === gName));
        }
        setPublishers(availablePubs);
        setMonthStatuses(statuses);

        // 자동 선택 월 보정 (마감 상태 및 봉사연도 고려)
        const autoMonth = getAutoSelectServiceMonth(statuses, currentYear?.year_name);
        setMonth(autoMonth);

        // 새로고침 시 항상 입력창을 빈 상태로 초기화 (이전 제출 안내 팝업 자동 노출 방지)
        localStorage.removeItem('ministry_last_reporter');
        setSelectedPublisher(null);
        setSearchQuery('');
        setExistingReport(null);
        setShowExistingAlert(false);
        setIsEditMode(false);
      } catch (err) {
        console.error('Failed to load initial form data:', err);
      }
    }
    loadInitial();
  }, [currentYear.id, currentYear.year_name, isStandalone, manager]);

  const nameInputRef = React.useRef<HTMLInputElement>(null);
  const hoursInputRef = React.useRef<HTMLInputElement>(null);
  const blurTimeoutRef = React.useRef<any>(null);
  const searchQueryRef = React.useRef<string>('');
  const isCancellingRef = React.useRef<boolean>(false);

  // searchQuery 변경 시 ref 동기화
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  // 전도인 또는 월 변경 시 기존 제출 내역 확인
  const checkForExistingReport = useCallback(async (pubId: string, targetMonth: ServiceMonth) => {
    if (isCancellingRef.current) return;
    // 마감된 월이면 누구든 기존 보고 알림을 띄우지 않음
    if (!!monthStatuses[targetMonth]) {
      setExistingReport(null);
      setShowExistingAlert(false);
      setIsEditMode(false);
      return;
    }
    try {
      const prev = await getExistingReport(currentYear.id, pubId, targetMonth);
      if (isCancellingRef.current) return;
      if (prev) {
        setExistingReport(prev);
        setShowExistingAlert(true);
      } else {
        setExistingReport(null);
        setShowExistingAlert(false);
        setIsEditMode(false);
      }
    } catch (err) {
      console.error('Failed to check existing report:', err);
    }
  }, [currentYear.id, monthStatuses]);

  useEffect(() => {
    if (selectedPublisher && !isCancellingRef.current) {
      checkForExistingReport(selectedPublisher.id, month);
    } else {
      setExistingReport(null);
      setShowExistingAlert(false);
      setIsEditMode(false);
    }
  }, [selectedPublisher, month, checkForExistingReport]);

  // 야외 봉사 보고 제출 페이지에서는 관리자도 마감된 월에는 제출/수정 불가 (마감 월은 잠김)
  const isManager = !isStandalone && (manager?.role === 'super' || manager?.role === 'congregation' || manager?.role === 'group');
  const isClosed = !!monthStatuses[month];

  // 기존 보고 불러와서 수정 모드로 전환
  const handleLoadExistingReport = () => {
    if (!existingReport) return;
    setParticipated(existingReport.participated);
    setHours(existingReport.hours > 0 ? String(existingReport.hours) : '');
    setBibleStudies(existingReport.bible_studies > 0 ? String(existingReport.bible_studies) : '');
    setRemarks(existingReport.remarks || []);
    setIsAuxiliaryPioneer(existingReport.pioneer_status === 'AP');
    setIsEditMode(true);
    setShowExistingAlert(false);
  };

  const handleDismissExistingAlert = () => {
    setShowExistingAlert(false);
    setIsEditMode(true); // 여전히 수정 모드(덮어쓰기)로 진행
  };

  // 폼 전체 완전 초기화 (이름, 기존 보고, 수정 모드, 봉사 시간/연구/비고 등 전체)
  const handleResetForm = () => {
    // 1. 대기 중인 onBlur 타이머 즉시 취소
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    // 2. 취소 플래그 활성화 및 검색어 ref 비우기
    isCancellingRef.current = true;
    searchQueryRef.current = '';

    // 3. 폼 상태 완전 초기화
    setShowExistingAlert(false);
    setExistingReport(null);
    setSelectedPublisher(null);
    setSearchQuery('');
    setIsEditMode(false);
    setShowDropdown(false);
    setHours('');
    setBibleStudies('');
    setIsAuxiliaryPioneer(false);
    setRemarks([]);
    setParticipated(true);
    setErrorMsg(null);

    // 4. 안전한 지연 후 플래그 해제 및 이름 입력창으로 포커스
    setTimeout(() => {
      isCancellingRef.current = false;
      nameInputRef.current?.focus();
    }, 200);
  };

  const handleCancelExistingAlert = handleResetForm;

  // 전도인 선택
  const handleSelectPublisher = (pub: Publisher) => {
    if (isCancellingRef.current) return;
    searchQueryRef.current = pub.name;
    setSelectedPublisher(pub);
    setSearchQuery(pub.name);
    setShowDropdown(false);
    setErrorMsg(null);

    // RP인 경우 참여 자동 true
    if (pub.pioneer_status === 'RP') {
      setParticipated(true);
    }
  };

  const handleAddRemark = () => {
    const usedTypes = new Set(remarks.map(r => r.type));
    const nextType = REMARK_TYPES.find(t => !usedTypes.has(t)) || REMARK_TYPES[remarks.length % REMARK_TYPES.length];
    setRemarks([...remarks, { type: nextType, hours: '', etc: '' }]);
  };

  const handleRemoveRemark = (index: number) => {
    setRemarks(remarks.filter((_, i) => i !== index));
  };

  const handleRemarkChange = (index: number, field: keyof RemarkItem, val: string) => {
    const next = [...remarks];
    next[index] = { ...next[index], [field]: val };
    setRemarks(next);
  };

  // 보고서 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let targetPublisher = selectedPublisher;
    if (!targetPublisher) {
      const rawTrimmed = searchQuery.trim();
      if (!rawTrimmed) {
        setErrorMsg('전도인 이름을 입력해주세요.');
        nameInputRef.current?.focus();
        return;
      }
      const korTrimmed = engToKor(rawTrimmed);

      // 1. 원본 입력(영문 포함) 및 한글 변환 일치 검사
      const exactMatches = publishers.filter(p => 
        p.name.trim().toLowerCase() === rawTrimmed.toLowerCase() ||
        p.name.trim() === korTrimmed
      );
      if (exactMatches.length === 1) {
        targetPublisher = exactMatches[0];
        setSelectedPublisher(exactMatches[0]);
      } else if (exactMatches.length > 1) {
        setErrorMsg('동일한 이름의 전도인이 여러 명 있습니다. 아래 목록에서 본인의 소속 집단을 선택해주세요.');
        setShowDropdown(true);
        return;
      } else {
        // 공백 무시 검색 (예: '홍 길동' -> '홍길동')
        const noSpaceRaw = rawTrimmed.replace(/\s+/g, '').toLowerCase();
        const noSpaceKor = korTrimmed.replace(/\s+/g, '');
        const fuzzyMatches = publishers.filter(p => {
          const pNameNoSpace = p.name.replace(/\s+/g, '');
          return pNameNoSpace.toLowerCase() === noSpaceRaw || pNameNoSpace === noSpaceKor;
        });
        if (fuzzyMatches.length === 1) {
          targetPublisher = fuzzyMatches[0];
          setSelectedPublisher(fuzzyMatches[0]);
        } else {
          setErrorMsg(`'${rawTrimmed}' 전도인 명단을 찾을 수 없습니다. 등록된 성명을 올바르게 입력해주세요.`);
          nameInputRef.current?.focus();
          return;
        }
      }
    }

    if (isClosed) {
      setErrorMsg(`${month} 보고는 이미 마감되어 잠겨 있습니다. 집단 감독자나 서기에게 문의하세요.`);
      return;
    }

    const numHours = parseFloat(hours) || 0;
    const numStudies = parseInt(bibleStudies) || 0;

    // RP인 경우 봉사 시간 필수 입력 안내
    if (targetPublisher.pioneer_status === 'RP' && participated && numHours <= 0) {
      alert('정규 파이오니아(RP)는 봉사 시간을 입력해야 합니다.\n봉사 시간을 입력하고 보고해주세요.');
      setErrorMsg('정규 파이오니아(RP)는 봉사 시간을 입력해주세요.');
      hoursInputRef.current?.focus();
      return;
    }

    // 이번 달 보조 파이오니아(AP) 체크 시 봉사 시간 필수 입력 안내
    if (isAuxiliaryPioneer && participated && numHours <= 0) {
      alert('보조 파이오니아로 봉사하신 경우 봉사 시간을 입력해야 합니다.\n봉사 시간을 입력하고 보고해주세요.');
      setErrorMsg('보조 파이오니아는 봉사 시간을 입력해주세요.');
      hoursInputRef.current?.focus();
      return;
    }

    // RP, SP, FM이 아닌 전도인이 시간 입력을 한 경우: 보조 파이오니아 확인 모달 노출 (파이오니아가 아니면 시간 입력 불가)
    const isFulltimePioneer = ['RP', 'SP', 'FM'].includes(targetPublisher.pioneer_status || '');
    if (!isFulltimePioneer && participated && numHours > 0 && !isAuxiliaryPioneer) {
      setPendingPublisher(targetPublisher);
      setShowApConfirmModal(true);
      return;
    }

    await doSubmit(targetPublisher, isAuxiliaryPioneer);
  };

  // 실제 보고서 저장 및 제출 실행
  const doSubmit = async (targetPublisher: Publisher, finalIsAuxiliaryPioneer: boolean, overrideHours?: number) => {
    const numHours = overrideHours !== undefined ? overrideHours : (parseFloat(hours) || 0);
    const numStudies = parseInt(bibleStudies) || 0;

    setLoading(true);
    try {
      const validRemarks = remarks
        .filter(r => r.hours && String(r.hours).trim().length > 0)
        .map(r => ({
          type: r.type,
          hours: String(r.hours).trim(),
          etc: ''
        }));

      await submitMinistryReport({
        serviceYearId: currentYear.id,
        publisherName: targetPublisher.name,
        month,
        participated,
        bibleStudies: numStudies,
        hours: numHours,
        remarks: validRemarks,
        isAuxiliaryPioneer: finalIsAuxiliaryPioneer,
        isAdminOverride: isManager,
      });

      // 마지막 제출자 로컬 저장: 전도인 본인 기기(isStandalone && !manager)일 때만 저장
      if (isStandalone && !manager) {
        localStorage.setItem('ministry_last_reporter', targetPublisher.name);
      } else {
        localStorage.removeItem('ministry_last_reporter');
      }

      // 축하 폭죽 효과
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }

      // 접수 완료 영수증 데이터 세팅
      setSubmittedReceipt({
        name: targetPublisher.name,
        groupName: targetPublisher.group_name || '미배정',
        pioneerStatus: finalIsAuxiliaryPioneer ? 'AP' : targetPublisher.pioneer_status,
        month,
        participated,
        hours: numHours,
        bibleStudies: numStudies,
        remarks: validRemarks,
        isEdited: isEditMode,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      });

      // 제출 완료된 전도인 이름을 최근 캐시 목록에 기억 (최신순 최대 10개)
      setRecentNames(prev => {
        const updated = [targetPublisher.name, ...prev.filter(n => n !== targetPublisher.name)].slice(0, 10);
        try {
          localStorage.setItem('ministry_recent_names', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // 폼 리셋: 이름, 시간, 성서 연구, 보조 파이오니아, 비고 등 모든 입력값 초기화
      setSelectedPublisher(null);
      setSearchQuery('');
      setHours('');
      setBibleStudies('');
      setIsAuxiliaryPioneer(false);
      setRemarks([]);
      setIsEditMode(false);
      setExistingReport(null);
      localStorage.removeItem('ministry_last_reporter');
    } catch (err: any) {
      setErrorMsg(err.message || '보고서 제출 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setShowApConfirmModal(false);
      setPendingPublisher(null);
    }
  };

  // 전도인 검색 필터 (영문 자판으로 입력된 경우에도 한글로 자동 변환하여 매칭)
  const filteredPublishers = publishers.filter(p => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const korQ = engToKor(q).toLowerCase();
    return p.name.toLowerCase().includes(q) || p.name.toLowerCase().includes(korQ);
  });

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', paddingBottom: 40 }}>
      {/* ------------------------------------------------------------- */}
      {/* S-4 공식 양식 카드 */}
      {/* ------------------------------------------------------------- */}
      <div className="nfox-card" style={{ padding: '36px 32px', position: 'relative' }}>
        {/* Card Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            야외 봉사 보고
          </h2>
        </div>

        {/* 이전 보고 수정 모드 안내 배너 */}
        {isEditMode && (
          <div style={{
            background: 'rgba(79, 70, 229, 0.1)',
            border: '1px solid rgba(79, 70, 229, 0.3)',
            color: 'var(--primary)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} />
              <span><strong>기존 보고 수정 모드</strong>: 수정할 내용을 입력 후 다시 제출해주세요.</span>
            </div>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleResetForm}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              초기화
            </button>
          </div>
        )}

        {/* 에러 메시지 */}
        {errorMsg && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: 'var(--accent-rose)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9rem',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* 한 행에 '이름'과 '월' 나란히 표시 (이름 칸을 넓게, 월 선택은 90px 콤팩트 크기로 최적화) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 90px',
            gap: 10,
            marginBottom: 20,
            alignItems: 'start'
          }}>
            {/* 1. 전도인 이름 검색 & 선택 */}
            <div className="form-group" style={{ margin: 0, position: 'relative' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>이름 <span style={{ color: 'var(--accent-rose)' }}>*</span></span>
                {selectedPublisher && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {selectedPublisher.group_name} · {(selectedPublisher.pioneer_status === '일반' || selectedPublisher.pioneer_status === 'AP') ? '전도인' : selectedPublisher.pioneer_status}
                  </span>
                )}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={nameInputRef}
                  type="text"
                  name="search_publisher_query"
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                  aria-autocomplete="none"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="form-input"
                  placeholder={isStandalone ? "이름을 입력하세요" : "전도인 이름 입력 또는 목록 선택"}
                  style={{ paddingRight: selectedPublisher ? 36 : 14 }}
                  value={searchQuery}
                  onClick={() => setShowDropdown(true)}
                  onFocus={() => setShowDropdown(true)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    setErrorMsg(null);
                    const trimmed = val.trim();

                    if (!trimmed) {
                      setSelectedPublisher(null);
                      setShowDropdown(true);
                      return;
                    }

                    // 영문 입력 또는 한글 입력 모두 매칭 (영타로 쳐도 전도인 자동인식)
                    const korTrimmed = engToKor(trimmed);
                    const exactMatches = publishers.filter(p => 
                      p.name.trim().toLowerCase() === trimmed.toLowerCase() || 
                      p.name.trim() === korTrimmed
                    );
                    if (exactMatches.length === 1) {
                      handleSelectPublisher(exactMatches[0]);
                      setShowDropdown(false);
                    } else if (exactMatches.length > 1) {
                      setSelectedPublisher(null);
                      setShowDropdown(true);
                    } else {
                      if (selectedPublisher && 
                          selectedPublisher.name.trim().toLowerCase() !== trimmed.toLowerCase() && 
                          selectedPublisher.name.trim() !== korTrimmed) {
                        setSelectedPublisher(null);
                      }
                      if (!isStandalone) {
                        setShowDropdown(true);
                      } else {
                        setShowDropdown(false);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const trimmed = searchQuery.trim();
                      const korTrimmed = engToKor(trimmed);
                      const exactMatches = publishers.filter(p => 
                        p.name.trim().toLowerCase() === trimmed.toLowerCase() || 
                        p.name.trim() === korTrimmed
                      );
                      if (exactMatches.length === 1) {
                        e.preventDefault();
                        handleSelectPublisher(exactMatches[0]);
                        setShowDropdown(false);
                      } else if (filteredPublishers.length === 1) {
                        e.preventDefault();
                        handleSelectPublisher(filteredPublishers[0]);
                        setShowDropdown(false);
                      }
                    }
                  }}
                  onBlur={() => {
                    if (blurTimeoutRef.current) {
                      clearTimeout(blurTimeoutRef.current);
                    }
                    blurTimeoutRef.current = setTimeout(() => {
                      setShowDropdown(false);
                      if (isCancellingRef.current) return;
                      const trimmed = searchQueryRef.current.trim();
                      if (trimmed) {
                        const korTrimmed = engToKor(trimmed);
                        const exactMatches = publishers.filter(p => 
                          p.name.trim().toLowerCase() === trimmed.toLowerCase() || 
                          p.name.trim() === korTrimmed
                        );
                        if (exactMatches.length === 1) {
                          handleSelectPublisher(exactMatches[0]);
                        }
                      }
                    }, 250);
                  }}
                  required
                />
                {selectedPublisher && (
                  <div style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--accent-emerald)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                  }} title="확인됨">
                    <UserCheck size={18} />
                  </div>
                )}
              </div>

              {/* 자동 완성 및 최근 기억된 이름 캐시 드롭다운 */}
              {showDropdown && (
                (searchQuery.trim() === '' ? (!isStandalone || recentNames.length > 0) : (!isStandalone ? true : publishers.filter(p => p.name === searchQuery.trim()).length > 1))
              ) && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 40,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  maxHeight: 240,
                  overflowY: 'auto',
                  marginTop: 4
                }}>
                  {/* 1. 검색어가 비어있는 경우: 최근 입력/제출한 캐시 이름 노출 */}
                  {searchQuery.trim() === '' ? (
                    <>
                      {recentNames.length > 0 && (
                        <div>
                          {recentNames.map((name) => {
                            const matchedPubs = publishers.filter(p => p.name === name);
                            const p = matchedPubs[0];
                            return (
                              <div
                                key={name}
                                onMouseDown={() => {
                                  if (p) {
                                    handleSelectPublisher(p);
                                  } else {
                                    setSearchQuery(name);
                                  }
                                  setShowDropdown(false);
                                }}
                                style={{
                                  padding: '11px 14px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  borderBottom: '1px solid var(--border-color)',
                                  fontSize: '0.94rem',
                                  whiteSpace: 'nowrap',
                                  transition: 'var(--transition-fast)'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary-light)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
                                  <History size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                  <span style={{ fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>{name}</span>
                                </div>
                                <button
                                  type="button"
                                  onMouseDown={(e) => handleRemoveRecentName(name, e)}
                                  title="기록에서 삭제"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '4px 6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    marginLeft: 8
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-rose)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                                >
                                  <X size={15} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 관리자 모드인 경우: 전체 전도인 목록도 함께 표시 */}
                      {!isStandalone && (
                        <div>
                          {recentNames.length > 0 && (
                            <div style={{
                              padding: '6px 12px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: 'var(--text-muted)',
                              background: 'var(--bg-subtle, rgba(0,0,0,0.02))',
                              borderBottom: '1px solid var(--border-color)'
                            }}>
                              전체 전도인 목록
                            </div>
                          )}
                          {publishers.map((p) => (
                            <div
                              key={p.id}
                              onMouseDown={() => {
                                handleSelectPublisher(p);
                                setShowDropdown(false);
                              }}
                              style={{
                                padding: '10px 14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: '1px solid var(--border-color)',
                                fontSize: '0.9rem',
                                transition: 'var(--transition-fast)'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary-light)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div>
                                <span style={{ fontWeight: 700 }}>{p.name}</span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                                  {p.group_name}
                                </span>
                              </div>
                              <div>
                                {p.pioneer_status !== '일반' && p.pioneer_status !== 'AP' && (
                                  <span className={`badge badge-${p.pioneer_status?.toLowerCase()}`}>
                                    {p.pioneer_status}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    /* 2. 검색어가 입력된 경우 */
                    !isStandalone ? (
                      /* 관리자 모드: 검색된 전도인 목록 */
                      filteredPublishers.length > 0 ? (
                        filteredPublishers.map((p) => (
                          <div
                            key={p.id}
                            onMouseDown={() => {
                              handleSelectPublisher(p);
                              setShowDropdown(false);
                            }}
                            style={{
                              padding: '10px 14px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderBottom: '1px solid var(--border-color)',
                              fontSize: '0.9rem',
                              transition: 'var(--transition-fast)'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary-light)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div>
                              <span style={{ fontWeight: 700 }}>{p.name}</span>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                                {p.group_name}
                              </span>
                            </div>
                            <div>
                              {p.pioneer_status !== '일반' && p.pioneer_status !== 'AP' && (
                                <span className={`badge badge-${p.pioneer_status?.toLowerCase()}`}>
                                  {p.pioneer_status}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          검색된 전도인이 없습니다.
                        </div>
                      )
                    ) : (
                      /* 공개 전도인 모드: 동명이인일 때 집단 선택 */
                      publishers.filter(p => p.name === searchQuery.trim()).length > 1 ? (
                        <>
                          <div style={{
                            padding: '8px 12px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            background: 'var(--primary-light)',
                            borderBottom: '1px solid var(--border-color)'
                          }}>
                            동일한 이름의 전도인이 있습니다. 본인의 소속 집단을 선택해주세요:
                          </div>
                          {publishers.filter(p => p.name === searchQuery.trim()).map((p) => (
                            <div
                              key={p.id}
                              onMouseDown={() => {
                                handleSelectPublisher(p);
                                setShowDropdown(false);
                              }}
                              style={{
                                padding: '10px 14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: '1px solid var(--border-color)',
                                fontSize: '0.9rem',
                                transition: 'var(--transition-fast)'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary-light)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div>
                                <span style={{ fontWeight: 700 }}>{p.name}</span>
                                <span style={{ fontSize: '0.84rem', color: 'var(--primary)', marginLeft: 8, fontWeight: 700 }}>
                                  ({p.group_name})
                                </span>
                              </div>
                              {p.pioneer_status !== '일반' && p.pioneer_status !== 'AP' && (
                                <span className={`badge badge-${p.pioneer_status?.toLowerCase()}`}>
                                  {p.pioneer_status}
                                </span>
                              )}
                            </div>
                          ))}
                        </>
                      ) : null
                    )
                  )}
                </div>
              )}
            </div>

            {/* 2. 해당 월 (날짜 기준 자동 선택, 콤팩트 셀렉트) */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <span>월</span>
                <span style={{ color: 'var(--accent-rose)' }}>*</span>
                {isClosed && <Lock size={12} style={{ color: 'var(--accent-rose)', marginLeft: 'auto' }} />}
              </label>
              <select
                className="form-select"
                value={month}
                onChange={(e) => setMonth(e.target.value as ServiceMonth)}
                style={{ fontWeight: 700, padding: '10px 8px', textAlign: 'center', fontSize: '0.92rem' }}
              >
                {SERVICE_MONTHS.map((m) => {
                  const closed = !!monthStatuses[m];
                  return (
                    <option key={m} value={m}>
                      {m}{closed ? ' (마감)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {isClosed && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              color: 'var(--accent-rose)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 16
            }}>
              <Lock size={14} />
              <span>{month} 봉사 보고는 마감되었습니다.</span>
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '20px 0' }} />

          {/* 3. 해당 월에 어떤 형태로든 봉사에 참여했습니까? (S-4 필수 항목) */}
          <div className="form-group">
            <label className="form-label" style={{
              whiteSpace: 'nowrap',
              fontSize: 'clamp(0.76rem, 3.4vw, 0.92rem)',
              letterSpacing: '-0.025em',
              display: 'block'
            }}>
              해당 월에 어떤 형태로든 야외 봉사에 참여했습니까? <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={() => setParticipated(true)}
                disabled={isClosed}
                style={{
                  padding: '12px 6px',
                  borderRadius: 'var(--radius-md)',
                  border: participated ? '2px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                  background: participated ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-app)',
                  color: participated ? 'var(--accent-emerald)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: 'clamp(0.82rem, 3.2vw, 0.94rem)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.02em',
                  cursor: isClosed ? 'not-allowed' : 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                <Check size={16} style={{ flexShrink: 0 }} />
                <span>예 (참여함)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setParticipated(false);
                  setHours('');
                  setBibleStudies('');
                }}
                disabled={isClosed}
                style={{
                  padding: '12px 6px',
                  borderRadius: 'var(--radius-md)',
                  border: !participated ? '2px solid var(--accent-rose)' : '1px solid var(--border-color)',
                  background: !participated ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg-app)',
                  color: !participated ? 'var(--accent-rose)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: 'clamp(0.82rem, 3.2vw, 0.94rem)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.02em',
                  cursor: isClosed ? 'not-allowed' : 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                <span>아니오 (미참여)</span>
              </button>
            </div>

            {/* 이미 보고했거나 N으로 선택 시 실제 미참여 확인 안내 */}
            {!participated && (
              <div style={{
                marginTop: 12,
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#d97706',
                fontSize: '0.86rem',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10
              }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--accent-amber)' }} />
                <div>
                  <strong>봉사 미참여(N) 확인 안내:</strong><br />
                  이번 달에 야외 봉사에 실제로 전혀 참여하지 못하셨습니까?<br />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    ※ 어떤 형태로든 증거하셨다면 '예 (참여함)'으로 보고하실 수 있습니다.
                  </span>
                </div>
              </div>
            )}
          </div>

          {participated && (
            <>
              {/* 4. 성서 연구 건수 & 봉사 시간 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                {/* 성서 연구 건수 */}
                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BookOpen size={16} color="var(--accent-amber)" />
                    <span>성서 연구</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      lang="ko"
                      className="form-input"
                      placeholder="0"
                      value={bibleStudies}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setBibleStudies(val);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          const cur = parseInt(bibleStudies || '0', 10);
                          setBibleStudies(String(Math.min(99, cur + 1)));
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          const cur = parseInt(bibleStudies || '0', 10);
                          setBibleStudies(String(Math.max(0, cur - 1)));
                        }
                      }}
                      disabled={isClosed}
                      style={{ fontSize: '1.05rem', fontWeight: 700, paddingRight: 28 }}
                    />
                    <div style={{
                      position: 'absolute',
                      right: 4,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0
                    }}>
                      <button
                        type="button"
                        tabIndex={-1}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          const cur = parseInt(bibleStudies || '0', 10);
                          setBibleStudies(String(Math.min(99, cur + 1)));
                        }}
                        disabled={isClosed}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '1px 2px',
                          cursor: isClosed ? 'not-allowed' : 'pointer',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        type="button"
                        tabIndex={-1}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          const cur = parseInt(bibleStudies || '0', 10);
                          setBibleStudies(String(Math.max(0, cur - 1)));
                        }}
                        disabled={isClosed}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '1px 2px',
                          cursor: isClosed ? 'not-allowed' : 'pointer',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <ChevronDown size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 봉사 시간 */}
                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={16} color="var(--primary)" />
                    <span>봉사 시간</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={hoursInputRef}
                      type="text"
                      lang="ko"
                      className="form-input"
                      placeholder="0"
                      value={hours}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setHours(val);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          const cur = parseInt(hours || '0', 10);
                          setHours(String(Math.min(300, cur + 1)));
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          const cur = parseInt(hours || '0', 10);
                          setHours(String(Math.max(0, cur - 1)));
                        }
                      }}
                      disabled={isClosed}
                      style={{ fontSize: '1.05rem', fontWeight: 700, paddingRight: 28 }}
                    />
                    <div style={{
                      position: 'absolute',
                      right: 4,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0
                    }}>
                      <button
                        type="button"
                        tabIndex={-1}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          const cur = parseInt(hours || '0', 10);
                          setHours(String(Math.min(300, cur + 1)));
                        }}
                        disabled={isClosed}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '1px 2px',
                          cursor: isClosed ? 'not-allowed' : 'pointer',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        type="button"
                        tabIndex={-1}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          const cur = parseInt(hours || '0', 10);
                          setHours(String(Math.max(0, cur - 1)));
                        }}
                        disabled={isClosed}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '1px 2px',
                          cursor: isClosed ? 'not-allowed' : 'pointer',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <ChevronDown size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. 보조 파이오니아 활동 여부 */}
              <div style={{
                background: isAuxiliaryPioneer ? 'var(--primary-light)' : 'var(--bg-app)',
                border: isAuxiliaryPioneer ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                cursor: isClosed ? 'not-allowed' : 'pointer'
              }} onClick={() => !isClosed && setIsAuxiliaryPioneer(!isAuxiliaryPioneer)}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: 'clamp(0.82rem, 3.4vw, 0.92rem)',
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.02em'
                  }}>
                    이번 달 보조 파이오니아로 봉사함
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    보조 파이오니아 15시간 또는 30시간 활동 시 체크해 주세요.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isAuxiliaryPioneer}
                  onChange={(e) => setIsAuxiliaryPioneer(e.target.checked)}
                  disabled={isClosed}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer', flexShrink: 0 }}
                />
              </div>

              {/* 6. 비고 (고려받을 시간) */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                  <label className="form-label" style={{
                    margin: 0,
                    whiteSpace: 'nowrap',
                    fontSize: 'clamp(0.82rem, 3.4vw, 0.9rem)',
                    letterSpacing: '-0.02em'
                  }}>
                    비고 (고려받을 시간)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddRemark}
                    disabled={isClosed}
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.78rem', gap: 4, whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    <Plus size={14} /> <span>비고 항목 추가</span>
                  </button>
                </div>

                {remarks.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-faint)', margin: 0 }}>
                    원격봉사, LDC, 파이오니아학교 등 비고 사항이 있는 경우 추가해 주세요.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {remarks.map((r, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <select
                          className="form-select"
                          value={r.type}
                          onChange={(e) => handleRemarkChange(idx, 'type', e.target.value)}
                          disabled={isClosed}
                          style={{ width: '40%', minWidth: 105 }}
                        >
                          {REMARK_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          className="form-input"
                          lang="ko"
                          inputMode="text"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          placeholder="시간 또는 비고 내용"
                          value={r.hours}
                          onChange={(e) => handleRemarkChange(idx, 'hours', e.target.value)}
                          disabled={isClosed}
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveRemark(idx)}
                          disabled={isClosed}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-rose)',
                            cursor: 'pointer',
                            padding: 6
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* 제출 버튼 바로 위 에러 안내 (모바일 및 긴 폼에서 즉시 피드백 확인) */}
          {errorMsg && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              marginTop: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 600 }}>{errorMsg}</span>
            </div>
          )}

          {/* 제출 버튼 */}
          <div style={{ marginTop: errorMsg ? 16 : 28 }}>
            <button
              type="submit"
              disabled={loading || isClosed}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '1.05rem',
                fontWeight: 800,
                justifyContent: 'center',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                opacity: (loading || isClosed) ? 0.6 : 1,
                cursor: (loading || isClosed) ? 'not-allowed' : 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              {loading ? (
                <span>보고를 저장하는 중...</span>
              ) : isClosed ? (
                <>
                  <Lock size={18} />
                  <span>{month} 보고는 마감되었습니다</span>
                </>
              ) : isEditMode ? (
                <>
                  <RotateCcw size={18} />
                  <span>{month} 봉사 보고 다시 제출하기</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>{month} 야외 봉사 보고 제출</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 중복 제출 감지 모달 (이전 동일한 자료가 있을 때 확인 후 수정) */}
      {/* ------------------------------------------------------------- */}
      {showExistingAlert && existingReport && (
        <div className="modal-overlay" onClick={handleCancelExistingAlert}>
          <div
            className="modal-content"
            style={{ maxWidth: 460, animation: 'scaleUp 0.2s ease-out', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 우측 상단 닫기(X) 버튼 */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCancelExistingAlert}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s ease'
              }}
              title="닫기 및 취소"
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(79, 70, 229, 0.12)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12
              }}>
                <RotateCcw size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0' }}>
                이전 제출된 봉사 보고가 있습니다
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0 }}>
                <strong>{selectedPublisher?.name}</strong>님의 <strong>{month}</strong> 보고가 이미 접수되어 있습니다.
              </p>
            </div>

            {/* 이전 보고 상세 내역 */}
            <div style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              fontSize: '0.88rem',
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>제출 일시</span>
                <span style={{ fontWeight: 600 }}>{new Date(existingReport.submitted_at).toLocaleString('ko-KR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>봉사 참여 여부</span>
                <span style={{ fontWeight: 700, color: existingReport.participated ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                  {existingReport.participated ? '예 (참여함)' : '아니오 (미참여)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>봉사 시간</span>
                <span style={{ fontWeight: 700 }}>{existingReport.hours > 0 ? `${existingReport.hours}` : '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>성서 연구</span>
                <span style={{ fontWeight: 700 }}>{existingReport.bible_studies > 0 ? `${existingReport.bible_studies}` : '-'}</span>
              </div>
              {existingReport.remarks && existingReport.remarks.length > 0 && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>비고 내역:</span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-color)' }}>
                    {existingReport.remarks.map((r, i) => (
                      <div key={i}>• {r.type}: {r.hours}h {r.etc ? `(${r.etc})` : ''}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 20 }}>
              기존 보고 내용을 불러와서 수정하시겠습니까?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleLoadExistingReport}
                className="btn-primary"
                style={{ padding: '12px', justifyContent: 'center', fontWeight: 700 }}
              >
                ✏️ 이전 내용 불러와서 수정하기
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleDismissExistingAlert}
                className="btn-secondary"
                style={{ padding: '10px', justifyContent: 'center' }}
              >
                새로 입력하여 덮어쓰기
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleCancelExistingAlert}
                style={{
                  padding: '10px',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.88rem'
                }}
              >
                취소하고 다른 전도인 입력하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 제출 완료 영수증 모달 (S-4 확인서) */}
      {/* ------------------------------------------------------------- */}
      {submittedReceipt && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 440, animation: 'scaleUp 0.25s ease-out', textAlign: 'center' }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-emerald)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <CheckCircle size={36} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 6px 0' }}>
              {submittedReceipt.isEdited ? '봉사 보고가 수정되었습니다!' : '봉사 보고가 접수되었습니다!'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 20px 0' }}>
              {submittedReceipt.month} 야외 봉사 보고가 성공적으로 등록되었습니다.
            </p>

            {/* Receipt Box */}
            <div style={{
              background: 'var(--bg-app)',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 20px',
              textAlign: 'left',
              marginBottom: 20,
              fontSize: '0.88rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>전도인 이름</span>
                <span style={{ fontWeight: 800 }}>{submittedReceipt.name} ({submittedReceipt.groupName} 집단)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>해당 월</span>
                <span style={{ fontWeight: 700 }}>{submittedReceipt.month}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>봉사 참여 여부</span>
                <span style={{ fontWeight: 700, color: submittedReceipt.participated ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                  {submittedReceipt.participated ? '예 (참여함)' : '아니오 (미참여)'}
                </span>
              </div>
              {submittedReceipt.participated && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>봉사 시간</span>
                    <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
                      {submittedReceipt.hours > 0 ? `${submittedReceipt.hours}` : '-'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>성서 연구</span>
                    <span style={{ fontWeight: 700 }}>
                      {submittedReceipt.bibleStudies > 0 ? `${submittedReceipt.bibleStudies}` : '-'}
                    </span>
                  </div>
                </>
              )}
              {submittedReceipt.remarks && submittedReceipt.remarks.length > 0 && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>비고 (고려받을 시간)</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingLeft: 2 }}>
                    {submittedReceipt.remarks.map((r: any, idx: number) => {
                      const val = String(r.hours || '').trim();
                      const displayVal = val ? (!isNaN(Number(val)) && Number(val) > 0 ? `${val}시간` : val) : '';
                      return (
                        <div key={idx} style={{ fontSize: '0.84rem', color: 'var(--text-color)', fontWeight: 600 }}>
                          • {r.type}{displayVal ? `: ${displayVal}` : ''}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-faint)' }}>
                <span>접수 일시</span>
                <span>{submittedReceipt.time}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSubmittedReceipt(null);
                  handleResetForm();
                }}
                className="btn-primary"
                style={{ padding: '12px', justifyContent: 'center' }}
              >
                확인 완료
              </button>

              {onSuccessNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedReceipt(null);
                    onSuccessNavigate();
                  }}
                  className="btn-secondary"
                  style={{ padding: '10px', justifyContent: 'center' }}
                >
                  관리자 대시보드로 이동
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ------------------------------------------------------------- */}
      {/* 보조 파이오니아(AP) 확인 안내 모달 */}
      {/* RP, SP, FM이 아닌 전도인이 시간 입력 후 AP 미체크 상태로 제출 시 안내 */}
      {/* ------------------------------------------------------------- */}
      {showApConfirmModal && pendingPublisher && (
        <div className="modal-overlay" onClick={() => setShowApConfirmModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 440, animation: 'scaleUp 0.2s ease-out', position: 'relative', textAlign: 'center', padding: '24px 20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={() => {
                setShowApConfirmModal(false);
                setPendingPublisher(null);
              }}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s ease'
              }}
              title="닫기"
            >
              <X size={18} />
            </button>

            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}>
              <HelpCircle size={28} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px 0' }}>
              보조 파이오니아 확인
            </h3>

            <div style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              fontSize: '0.88rem',
              lineHeight: 1.5,
              marginBottom: 20,
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>전도인</span>
                <span style={{ fontWeight: 700 }}>{pendingPublisher.name} ({pendingPublisher.group_name || '미배정'})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>보고 월</span>
                <span style={{ fontWeight: 700 }}>{month}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>입력된 봉사 시간</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{hours}시간</span>
              </div>
              <p style={{ margin: '10px 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                일반 전도인은 봉사 시간을 보고하지 않습니다 (참여 여부만 보고).<br />
                봉사 시간을 보고하시려면 이번 달 <strong>보조 파이오니아</strong>로 봉사하셨어야 합니다.<br /><br />
                이번 달에 <strong>보조 파이오니아</strong>로 봉사하셨습니까?
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setIsAuxiliaryPioneer(true);
                  setShowApConfirmModal(false);
                  doSubmit(pendingPublisher, true);
                }}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Check size={16} />
                <span>예, 보조 파이오니아입니다 (체크 후 제출)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAuxiliaryPioneer(false);
                  setHours('');
                  setShowApConfirmModal(false);
                  doSubmit(pendingPublisher, false, 0);
                }}
                className="btn-secondary"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  justifyContent: 'center'
                }}
              >
                <span>아니오, 일반 전도인입니다 (시간 삭제 후 제출)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowApConfirmModal(false);
                  setPendingPublisher(null);
                  hoursInputRef.current?.focus();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  padding: '6px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                취소하고 직접 수정하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
