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
  X
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

const REMARK_TYPES = [
  '원격봉사',
  'LDC봉사',
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

        // 이전 제출자 기억 불러오기: 전도인 본인 기기(isStandalone && !manager)일 때만 동작
        if (isStandalone && !manager) {
          const lastPubName = localStorage.getItem('ministry_last_reporter');
          if (lastPubName) {
            const matched = pubs.find(p => p.name === lastPubName);
            if (matched) {
              setSelectedPublisher(matched);
              setSearchQuery(matched.name);
            }
          }
        } else {
          // 관리자 대리 제출 모드에서는 항상 입력창을 빈 상태로 초기화
          setSelectedPublisher(null);
          setSearchQuery('');
          setExistingReport(null);
          setShowExistingAlert(false);
          setIsEditMode(false);
        }
      } catch (err) {
        console.error('Failed to load initial form data:', err);
      }
    }
    loadInitial();
  }, [currentYear.id, currentYear.year_name, isStandalone, manager]);

  const nameInputRef = React.useRef<HTMLInputElement>(null);

  // 전도인 또는 월 변경 시 기존 제출 내역 확인
  const checkForExistingReport = useCallback(async (pubId: string, targetMonth: ServiceMonth) => {
    // 마감된 월이면 누구든 기존 보고 알림을 띄우지 않음
    if (!!monthStatuses[targetMonth]) {
      setExistingReport(null);
      setShowExistingAlert(false);
      setIsEditMode(false);
      return;
    }
    try {
      const prev = await getExistingReport(currentYear.id, pubId, targetMonth);
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
    if (selectedPublisher) {
      checkForExistingReport(selectedPublisher.id, month);
    } else {
      setExistingReport(null);
      setShowExistingAlert(false);
      setIsEditMode(false);
    }
  }, [selectedPublisher, month, checkForExistingReport]);

  // 야외 봉사 보고 제출 페이지에서는 관리자도 마감된 월에는 제출/수정 불가 (마감 월은 잠김)
  const isManager = !isStandalone && (manager?.role === 'super' || manager?.role === 'group');
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

  const handleCancelExistingAlert = () => {
    setShowExistingAlert(false);
    setExistingReport(null);
    setSelectedPublisher(null);
    setSearchQuery('');
    setIsEditMode(false);
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  };

  // 전도인 선택
  const handleSelectPublisher = (pub: Publisher) => {
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
    setRemarks([...remarks, { type: '원격봉사', hours: '', etc: '' }]);
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
      const trimmed = searchQuery.trim();
      if (!trimmed) {
        setErrorMsg('전도인 이름을 입력해주세요.');
        nameInputRef.current?.focus();
        return;
      }

      // 1. 공백 제거 후 정확한 일치 검사
      const exactMatches = publishers.filter(p => p.name.trim() === trimmed);
      if (exactMatches.length === 1) {
        targetPublisher = exactMatches[0];
        setSelectedPublisher(exactMatches[0]);
      } else if (exactMatches.length > 1) {
        setErrorMsg('동일한 이름의 전도인이 여러 명 있습니다. 아래 목록에서 본인의 소속 집단을 선택해주세요.');
        setShowDropdown(true);
        return;
      } else {
        // 공백 무시 검색 (예: '홍 길동' -> '홍길동')
        const noSpaceTrimmed = trimmed.replace(/\s+/g, '');
        const fuzzyMatches = publishers.filter(p => p.name.replace(/\s+/g, '') === noSpaceTrimmed);
        if (fuzzyMatches.length === 1) {
          targetPublisher = fuzzyMatches[0];
          setSelectedPublisher(fuzzyMatches[0]);
        } else {
          setErrorMsg(`'${trimmed}' 전도인 명단을 찾을 수 없습니다. 등록된 성명을 올바르게 입력해주세요.`);
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
      setErrorMsg('정규 파이오니아(RP)는 봉사 시간을 입력해주세요.');
      return;
    }

    // RP, SP, FM이 아닌데 시간 보고를 할 경우 AP 체크가 안된 상태에서 보고를 제출하려고 할 때 확인 모달 노출
    const isFulltimePioneer = ['RP', 'SP', 'FM'].includes(targetPublisher.pioneer_status || '');
    if (!isFulltimePioneer && participated && numHours > 0 && !isAuxiliaryPioneer) {
      setPendingPublisher(targetPublisher);
      setShowApConfirmModal(true);
      return;
    }

    await doSubmit(targetPublisher, isAuxiliaryPioneer);
  };

  // 실제 보고서 저장 및 제출 실행
  const doSubmit = async (targetPublisher: Publisher, finalIsAuxiliaryPioneer: boolean) => {
    const numHours = parseFloat(hours) || 0;
    const numStudies = parseInt(bibleStudies) || 0;

    setLoading(true);
    try {
      const validRemarks = remarks
        .filter(r => r.hours && parseFloat(r.hours) > 0)
        .map(r => ({
          type: r.type,
          hours: r.hours,
          etc: r.etc ? r.etc.trim() : ''
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

      // 폼 리셋 (관리자 모드일 경우 다음 전도인 입력을 위해 성명도 초기화)
      setHours('');
      setBibleStudies('');
      setIsAuxiliaryPioneer(false);
      setRemarks([]);
      setIsEditMode(false);
      setExistingReport(null);
      if (!isStandalone || manager) {
        setSelectedPublisher(null);
        setSearchQuery('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || '보고서 제출 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setShowApConfirmModal(false);
      setPendingPublisher(null);
    }
  };

  // 전도인 검색 필터
  const filteredPublishers = publishers.filter(p =>
    p.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

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
              onClick={() => {
                setIsEditMode(false);
                setHours('');
                setBibleStudies('');
                setRemarks([]);
              }}
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

        <form onSubmit={handleSubmit}>
          {/* 한 행에 '이름'과 '월' 나란히 표시 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px',
            gap: 12,
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
                  className="form-input"
                  placeholder={isStandalone ? "이름을 입력하세요" : "전도인 이름 입력 또는 목록 선택"}
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    setErrorMsg(null);
                    const trimmed = val.trim();

                    if (!trimmed) {
                      setSelectedPublisher(null);
                      setShowDropdown(false);
                      return;
                    }

                    const exactMatches = publishers.filter(p => p.name.trim() === trimmed);
                    if (exactMatches.length === 1) {
                      // 정확히 1명 일치 시 관리자/공개 모드 불문 즉시 자동 확인
                      handleSelectPublisher(exactMatches[0]);
                      setShowDropdown(false);
                    } else if (exactMatches.length > 1) {
                      // 동명이인인 경우에만 집단 구분을 선택하도록 드롭다운 노출
                      setSelectedPublisher(null);
                      setShowDropdown(true);
                    } else {
                      if (selectedPublisher && selectedPublisher.name.trim() !== trimmed) {
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
                      const exactMatches = publishers.filter(p => p.name.trim() === trimmed);
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
                  onFocus={() => {
                    if (!isStandalone) {
                      setShowDropdown(true);
                    }
                  }}
                  onBlur={() => {
                    // 딜레이를 주어 드롭다운 항목 클릭 허용
                    setTimeout(() => {
                      setShowDropdown(false);
                      const trimmed = searchQuery.trim();
                      if (!selectedPublisher && trimmed) {
                        const exactMatches = publishers.filter(p => p.name.trim() === trimmed);
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
                    gap: 4,
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}>
                    <UserCheck size={15} />
                    <span>확인됨</span>
                  </div>
                )}
              </div>

              {/* Auto-suggest dropdown: 관리자 모드이거나 동명이인 선택일 때만 조건부 표시 */}
              {showDropdown && (
                !isStandalone ? (
                  /* 관리자 모드: 전체/검색된 전도인 목록 표시 */
                  filteredPublishers.length > 0 && (
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
                      maxHeight: 220,
                      overflowY: 'auto',
                      marginTop: 4
                    }}>
                      {filteredPublishers.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectPublisher(p)}
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
                  )
                ) : (
                  /* 공개 전도인 모드: 오직 동명이인(동일한 이름의 복수 전도인)일 때만 집단 구분을 위해 표시 */
                  publishers.filter(p => p.name === searchQuery.trim()).length > 1 && (
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
                      maxHeight: 200,
                      overflowY: 'auto',
                      marginTop: 4
                    }}>
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
                          onClick={() => handleSelectPublisher(p)}
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
                    </div>
                  )
                )
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
                style={{ fontWeight: 700, padding: '10px 12px' }}
              >
                {SERVICE_MONTHS.map((m) => {
                  const closed = !!monthStatuses[m];
                  return (
                    <option key={m} value={m}>
                      {m} {closed ? '(마감)' : ''}
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
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    min="0"
                    max="99"
                    value={bibleStudies}
                    onChange={(e) => setBibleStudies(e.target.value)}
                    disabled={isClosed}
                    style={{ fontSize: '1.05rem', fontWeight: 700 }}
                  />
                </div>

                {/* 봉사 시간 */}
                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={16} color="var(--primary)" />
                    <span>봉사 시간</span>
                    {selectedPublisher?.pioneer_status === 'RP' && (
                      <span style={{ color: 'var(--accent-rose)' }}>* (RP 필수)</span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="300"
                    className="form-input"
                    placeholder="0"
                    value={hours}
                    onChange={(e) => {
                      setHours(e.target.value);
                    }}
                    disabled={isClosed}
                    style={{ fontSize: '1.05rem', fontWeight: 700 }}
                  />
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
                    원격 봉사, LDC 봉사, 파이오니아 학교 등 인정 시간이 있는 경우 추가해 주세요.
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
                          style={{ width: '38%' }}
                        >
                          {REMARK_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.5"
                          className="form-input"
                          placeholder="인정 시간"
                          value={r.hours}
                          onChange={(e) => handleRemarkChange(idx, 'hours', e.target.value)}
                          disabled={isClosed}
                          style={{ width: '28%' }}
                        />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="메모/내용 (선택)"
                          value={r.etc || ''}
                          onChange={(e) => handleRemarkChange(idx, 'etc', e.target.value)}
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
                onClick={handleLoadExistingReport}
                className="btn-primary"
                style={{ padding: '12px', justifyContent: 'center', fontWeight: 700 }}
              >
                ✏️ 이전 내용 불러와서 수정하기
              </button>
              <button
                type="button"
                onClick={handleDismissExistingAlert}
                className="btn-secondary"
                style={{ padding: '10px', justifyContent: 'center' }}
              >
                새로 입력하여 덮어쓰기
              </button>
              <button
                type="button"
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-faint)' }}>
                <span>접수 일시</span>
                <span>{submittedReceipt.time}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={() => setSubmittedReceipt(null)}
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
              onClick={() => setShowApConfirmModal(false)}
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
                봉사 시간을 입력하셨으나 <strong>'보조 파이오니아'</strong> 항목이 체크되어 있지 않습니다.<br />
                이번 달에 <strong>보조 파이오니아</strong>로 봉사하셨습니까?
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setIsAuxiliaryPioneer(true);
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
                  doSubmit(pendingPublisher, false);
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
                <span>아니오 (일반 시간으로 제출)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowApConfirmModal(false);
                  setPendingPublisher(null);
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
                양식으로 돌아가서 직접 수정하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
