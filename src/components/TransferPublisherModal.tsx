import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Building2,
  Calendar,
  Sparkles,
  Info,
  ChevronRight,
  ArrowRight,
  History,
  FileSpreadsheet
} from 'lucide-react';
import {
  Group,
  Publisher,
  ServiceYear,
  ServiceMonth,
  SERVICE_MONTHS,
  Gender,
  Hope,
  Position,
  PioneerStatus
} from '../types/database';
import { parseS21Pdf, ParsedS21CardData } from '../services/pdfService';
import { saveTransferredPublisher, MONTH_ORDER, getServiceYears } from '../services/ministryService';
import { DateInput } from './DateInput';

interface TransferPublisherModalProps {
  currentYear: ServiceYear;
  groups: Group[];
  publishers?: Publisher[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TransferPublisherModal: React.FC<TransferPublisherModalProps> = ({
  currentYear,
  groups,
  publishers = [],
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  // 0. 기존 전도인 선택 및 자동 대입 상태
  const [selectedExistingPublisherId, setSelectedExistingPublisherId] = useState<string>('');
  const [autoLoadedMsg, setAutoLoadedMsg] = useState<string>('');

  // 1. 파일 상태 및 미리보기 (당해 연도)
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState<boolean>(false);
  const [parsing, setParsing] = useState<boolean>(false);
  const [parseMessage, setParseMessage] = useState<string>('');

  // 2. 전입 설정
  const todayStr = new Date().toISOString().slice(0, 10);
  const [transferDate, setTransferDate] = useState<string>(todayStr); // 전입 일자
  const [transferMonth, setTransferMonth] = useState<ServiceMonth>('11월'); // 첫 보고 대상 월
  const [prevCongregationName, setPrevCongregationName] = useState<string>(''); // 이전 회중명
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '');

  // 3. 전도인 인적사항
  const [name, setName] = useState<string>('');
  const [gender, setGender] = useState<Gender>('남');
  const [birthDate, setBirthDate] = useState<string>('');
  const [baptismDate, setBaptismDate] = useState<string>('');
  const [hope, setHope] = useState<Hope>('다른 양');
  const [position, setPosition] = useState<Position>('일반');
  const [pioneerStatus, setPioneerStatus] = useState<PioneerStatus>('일반');
  const [phone, setPhone] = useState<string>('');
  const [emergencyPhone, setEmergencyPhone] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [familyHead, setFamilyHead] = useState<string>('');
  const [specialNotes, setSpecialNotes] = useState<string>('');

  // 4. 12개월(9월~8월) 보고 기록 (당해 연도)
  const [monthlyRecords, setMonthlyRecords] = useState<Array<{
    month: ServiceMonth;
    participated: boolean;
    hours: number;
    bibleStudies: number;
    isAuxiliaryPioneer: boolean;
    remarks: string;
  }>>(() =>
    SERVICE_MONTHS.map(m => ({
      month: m,
      participated: false,
      hours: 0,
      bibleStudies: 0,
      isAuxiliaryPioneer: false,
      remarks: '',
    }))
  );

  // 5. 전년도 봉사기록 상태
  const [availableYears, setAvailableYears] = useState<ServiceYear[]>([]);
  const [includePrevYear, setIncludePrevYear] = useState<boolean>(false);
  const [selectedPrevYearId, setSelectedPrevYearId] = useState<string>('');
  const [prevYearFile, setPrevYearFile] = useState<File | null>(null);
  const [prevYearPreviewUrl, setPrevYearPreviewUrl] = useState<string | null>(null);
  const [prevYearIsPdf, setPrevYearIsPdf] = useState<boolean>(false);
  const [prevYearParsing, setPrevYearParsing] = useState<boolean>(false);
  const [prevYearParseMsg, setPrevYearParseMsg] = useState<string>('');

  const [prevYearRecords, setPrevYearRecords] = useState<Array<{
    month: ServiceMonth;
    participated: boolean;
    hours: number;
    bibleStudies: number;
    isAuxiliaryPioneer: boolean;
    remarks: string;
  }>>(() =>
    SERVICE_MONTHS.map(m => ({
      month: m,
      participated: false,
      hours: 0,
      bibleStudies: 0,
      isAuxiliaryPioneer: false,
      remarks: '',
    }))
  );

  // 테이블 탭 전환: 'current' (당해 연도) | 'prev' (전년도)
  const [activeRecordsTab, setActiveRecordsTab] = useState<'current' | 'prev'>('current');

  const [saving, setSaving] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevFileInputRef = useRef<HTMLInputElement>(null);

  // 기존 등록된 전도인 데이터 자동 대입 함수
  const applyExistingPublisher = (pub: Publisher) => {
    setSelectedExistingPublisherId(pub.id);
    setName(pub.name);
    if (pub.group_id) setSelectedGroupId(pub.group_id);
    if (pub.gender) setGender(pub.gender);
    if (pub.birth_date) setBirthDate(pub.birth_date);
    if (pub.baptism_date) setBaptismDate(pub.baptism_date);
    if (pub.hope) setHope(pub.hope);
    if (pub.position) setPosition(pub.position);
    if (pub.pioneer_status) {
      const pStatus = pub.pioneer_status === 'RP' ? 'RP' : (pub.pioneer_status === 'SP' ? 'SP' : (pub.pioneer_status === 'FM' ? 'FM' : '일반'));
      setPioneerStatus(pStatus as PioneerStatus);
    }
    if (pub.phone) setPhone(pub.phone);
    if (pub.emergency_phone) setEmergencyPhone(pub.emergency_phone);
    if (pub.relationship) setRelationship(pub.relationship);
    if (pub.address) setAddress(pub.address);
    if (pub.family_head) setFamilyHead(pub.family_head);
    if (pub.special_notes) setSpecialNotes(pub.special_notes);
    if (pub.transfer_date) setTransferDate(pub.transfer_date);
    if (pub.transfer_month) setTransferMonth(pub.transfer_month);
    if (pub.prev_congregation) setPrevCongregationName(pub.prev_congregation);

    setAutoLoadedMsg(`✓ 기존 등록된 '${pub.name}' 전도인의 인적사항을 불러왔습니다.`);
  };

  // 성명 입력 시 기존 전도인 명단에서 자동 조회 및 대입
  const handleNameChange = (inputVal: string) => {
    setName(inputVal);
    const clean = inputVal.trim();
    if (!clean) {
      setSelectedExistingPublisherId('');
      setAutoLoadedMsg('');
      return;
    }
    const matched = publishers.find(p => p.name === clean);
    if (matched) {
      applyExistingPublisher(matched);
    } else {
      setSelectedExistingPublisherId('');
      setAutoLoadedMsg('');
    }
  };

  // 기존 전도인 드롭다운 선택 핸들러
  const handleExistingSelect = (pubId: string) => {
    if (!pubId) {
      setSelectedExistingPublisherId('');
      setAutoLoadedMsg('');
      return;
    }
    const matched = publishers.find(p => p.id === pubId);
    if (matched) {
      applyExistingPublisher(matched);
    }
  };

  // 전체 봉사연도 목록 로드
  useEffect(() => {
    getServiceYears().then(years => {
      setAvailableYears(years);
      // 현재 연도 외의 이전 연도 중 가장 최근 연도를 기본 전년도로 설정
      const pastYears = years.filter(y => y.id !== currentYear.id);
      if (pastYears.length > 0) {
        setSelectedPrevYearId(pastYears[0].id);
      }
    });
  }, [currentYear.id]);

  // 당해 연도 파일 선택 처리 (PDF 또는 사진)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    const isPdfFile = selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf');
    setIsPdf(isPdfFile);

    if (!isPdfFile) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    if (isPdfFile) {
      setParsing(true);
      setParseMessage('PDF 카드 양식 데이터를 분석 중입니다...');
      try {
        const buffer = await selected.arrayBuffer();
        const parsed = await parseS21Pdf(new Uint8Array(buffer));

        if (parsed.name) setName(parsed.name);
        if (parsed.birthDate) setBirthDate(parsed.birthDate);
        if (parsed.baptismDate) setBaptismDate(parsed.baptismDate);
        if (parsed.gender) setGender(parsed.gender);
        if (parsed.hope) setHope(parsed.hope);
        if (parsed.position) setPosition(parsed.position);
        if (parsed.pioneerStatus) setPioneerStatus(parsed.pioneerStatus);

        if (parsed.monthlyRecords && parsed.monthlyRecords.length > 0) {
          setMonthlyRecords(parsed.monthlyRecords);
          const hasRecordMonths = parsed.monthlyRecords.filter(r => r.participated || r.hours > 0);
          setParseMessage(`✓ PDF 카드에서 ${parsed.name || '전도인'}의 인적사항 및 ${hasRecordMonths.length}개월 봉사 보고 기록을 성공적으로 추출했습니다!`);
        } else {
          setParseMessage(`✓ 인적사항을 추출했습니다.`);
        }
      } catch (err: any) {
        console.warn('PDF 파싱 오류:', err);
        setParseMessage('⚠️ PDF 자동 추출 중 일부 항목을 읽지 못했습니다. 아래 폼에서 내용을 확인해주세요.');
      } finally {
        setParsing(false);
      }
    } else {
      setParseMessage('사진이 로드되었습니다. 좌측 사진을 확인하시며 필요한 항목을 검토해주세요.');
    }
  };

  // 전년도 파일 선택 처리 (PDF 또는 사진)
  const handlePrevYearFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setPrevYearFile(selected);
    const isPdfFile = selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf');
    setPrevYearIsPdf(isPdfFile);

    if (!isPdfFile) {
      const url = URL.createObjectURL(selected);
      setPrevYearPreviewUrl(url);
    } else {
      setPrevYearPreviewUrl(null);
    }

    if (isPdfFile) {
      setPrevYearParsing(true);
      setPrevYearParseMsg('전년도 PDF 카드 데이터를 분석 중입니다...');
      try {
        const buffer = await selected.arrayBuffer();
        const parsed = await parseS21Pdf(new Uint8Array(buffer));

        if (parsed.monthlyRecords && parsed.monthlyRecords.length > 0) {
          setPrevYearRecords(parsed.monthlyRecords);
          const hasRecordMonths = parsed.monthlyRecords.filter(r => r.participated || r.hours > 0);
          setPrevYearParseMsg(`✓ 전년도 카드에서 ${hasRecordMonths.length}개월 봉사 기록을 성공적으로 추출했습니다!`);
          setActiveRecordsTab('prev');
        } else {
          setPrevYearParseMsg(`✓ 전년도 카드를 읽었습니다.`);
        }
      } catch (err: any) {
        console.warn('전년도 PDF 파싱 오류:', err);
        setPrevYearParseMsg('⚠️ 전년도 PDF 자동 추출 중 일부 항목을 읽지 못했습니다. 수동으로 확인해주세요.');
      } finally {
        setPrevYearParsing(false);
      }
    } else {
      setPrevYearParseMsg('전년도 카드 사진이 로드되었습니다.');
      setActiveRecordsTab('prev');
    }
  };

  // 월별 입력값 수정 핸들러 (당해 연도)
  const handleRecordChange = (
    month: ServiceMonth,
    field: 'participated' | 'hours' | 'bibleStudies' | 'isAuxiliaryPioneer' | 'remarks',
    value: any
  ) => {
    setMonthlyRecords(prev =>
      prev.map(r => {
        if (r.month !== month) return r;
        const updated = { ...r, [field]: value };
        if (field === 'hours' && Number(value) > 0) {
          updated.participated = true;
        }
        return updated;
      })
    );
  };

  // 월별 입력값 수정 핸들러 (전년도)
  const handlePrevRecordChange = (
    month: ServiceMonth,
    field: 'participated' | 'hours' | 'bibleStudies' | 'isAuxiliaryPioneer' | 'remarks',
    value: any
  ) => {
    setPrevYearRecords(prev =>
      prev.map(r => {
        if (r.month !== month) return r;
        const updated = { ...r, [field]: value };
        if (field === 'hours' && Number(value) > 0) {
          updated.participated = true;
        }
        return updated;
      })
    );
  };

  // 저장 처리
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('전도인 성명을 입력해주세요.');
      return;
    }
    if (!selectedGroupId) {
      alert('배정할 봉사 집단을 선택해주세요.');
      return;
    }

    setSaving(true);
    try {
      const res = await saveTransferredPublisher({
        publisherId: selectedExistingPublisherId || undefined,
        serviceYearId: currentYear.id,
        name: name.trim(),
        groupId: selectedGroupId,
        gender,
        birthDate,
        baptismDate,
        hope,
        position,
        pioneerStatus,
        phone,
        emergencyPhone,
        relationship,
        address,
        familyHead,
        specialNotes,
        transferDate: transferDate.trim() || todayStr,
        transferMonth,
        prevCongregationName: prevCongregationName.trim(),
        monthlyRecords,
        prevYearServiceYearId: includePrevYear ? selectedPrevYearId : undefined,
        prevYearRecords: includePrevYear ? prevYearRecords : undefined,
      });

      const prevYearName = availableYears.find(y => y.id === selectedPrevYearId)?.year_name;
      alert(
        `전입 등록이 완료되었습니다.\n\n` +
        `• 전도인: ${res.publisher.name}\n` +
        `• 배정 집단: ${groups.find(g => g.id === selectedGroupId)?.name || '미배정'}\n` +
        `• 전입 월: ${transferMonth} (전입일자: ${transferDate.trim() || todayStr})\n` +
        (prevCongregationName.trim() ? `• 이전 회중: ${prevCongregationName.trim()}\n` : '') +
        `• 저장된 보고서: 총 ${res.savedCount}건 ${includePrevYear ? `(전년도 ${prevYearName || ''} 포함)` : ''}`
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      alert('전입 전도인 저장 실패: ' + (err.message || '오류가 발생했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const transferOrder = MONTH_ORDER[transferMonth] || 1;
  const currentPrevYearName = availableYears.find(y => y.id === selectedPrevYearId)?.year_name || '전년도';

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '1080px',
          width: '96vw',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* 모달 헤더 */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                전입(이사) 전도인 등록 & S-21 카드 가져오기
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                이전 회중의 전도인 기록 카드(S-21) PDF 또는 사진을 넣으면 당해 연도 및 전년도 기록까지 자동 등록됩니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ border: 'none', background: 'transparent' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 모달 본문 */}
        <form
          onSubmit={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* 1. 파일 업로드 섹션 (당해 연도 및 전년도) */}
          <div style={{ display: 'grid', gridTemplateColumns: includePrevYear ? '1fr 1fr' : '1fr', gap: 12 }}>
            {/* 당해 연도 카드 파일 */}
            <div
              style={{
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                textAlign: 'center',
                background: 'var(--bg-hover)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {isPdf ? <FileText size={20} /> : <Upload size={20} />}
                </div>
                <div style={{ textAlign: 'left', minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file ? file.name : `당해 연도 S-21 카드 (${currentYear.year_name}연도) PDF / 사진`}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {file
                      ? `선택됨 (${(file.size / 1024).toFixed(1)} KB) - 클릭하여 변경`
                      : '공식 S-21 PDF는 12개월 모든 기록과 인적사항이 0.1초 만에 자동 추출됩니다.'}
                  </div>
                </div>
              </div>
              {parseMessage && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: parseMessage.startsWith('✓') ? 'var(--primary)' : 'var(--text-muted)',
                  }}
                >
                  {parseMessage}
                </div>
              )}
            </div>

            {/* 전년도 카드 파일 (토글 활성화 시) */}
            {includePrevYear && (
              <div
                style={{
                  border: '2px dashed rgba(147, 51, 234, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  textAlign: 'center',
                  background: 'rgba(147, 51, 234, 0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => prevFileInputRef.current?.click()}
              >
                <input
                  ref={prevFileInputRef}
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={handlePrevYearFileChange}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: 'rgba(147, 51, 234, 0.12)',
                      color: '#9333ea',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <History size={20} />
                  </div>
                  <div style={{ textAlign: 'left', minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#9333ea', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {prevYearFile ? prevYearFile.name : `전년도 S-21 카드 (${currentPrevYearName}연도) PDF / 사진`}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {prevYearFile
                        ? `선택됨 (${(prevYearFile.size / 1024).toFixed(1)} KB) - 클릭하여 변경`
                        : '전년도 PDF 카드를 넣으면 전년도 12개월 실적이 자동으로 채워집니다.'}
                    </div>
                  </div>
                </div>
                {prevYearParseMsg && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: prevYearParseMsg.startsWith('✓') ? '#9333ea' : 'var(--text-muted)',
                    }}
                  >
                    {prevYearParseMsg}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 사진 미리보기 (이미지 업로드 시) */}
          {(previewUrl || prevYearPreviewUrl) && (
            <div style={{ display: 'grid', gridTemplateColumns: (previewUrl && prevYearPreviewUrl) ? '1fr 1fr' : '1fr', gap: 10 }}>
              {previewUrl && (
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 10, background: 'var(--bg-surface)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
                    📷 당해 연도 S-21 카드 사진 미리보기
                  </div>
                  <img src={previewUrl} alt="당해연도 카드 사진" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '4px', objectFit: 'contain' }} />
                </div>
              )}
              {prevYearPreviewUrl && (
                <div style={{ border: '1px solid rgba(147, 51, 234, 0.3)', borderRadius: 'var(--radius-md)', padding: 10, background: 'var(--bg-surface)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.76rem', color: '#9333ea', marginBottom: 4, fontWeight: 600 }}>
                    📷 전년도 S-21 카드 사진 미리보기
                  </div>
                  <img src={prevYearPreviewUrl} alt="전년도 카드 사진" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '4px', objectFit: 'contain' }} />
                </div>
              )}
            </div>
          )}

          {/* 2. 전입 설정 */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontWeight: 700, fontSize: '0.88rem' }}>
                <Building2 size={16} />
                <span>전입 설정</span>
              </div>

              {/* 전년도 실적 추가 토글 체크박스 */}
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: includePrevYear ? '#9333ea' : 'var(--text-muted)',
                  background: includePrevYear ? 'rgba(147, 51, 234, 0.1)' : 'var(--bg-hover)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${includePrevYear ? 'rgba(147, 51, 234, 0.3)' : 'var(--border)'}`,
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={includePrevYear}
                  onChange={e => setIncludePrevYear(e.target.checked)}
                />
                <History size={14} />
                <span>전년도(과거 연도) 봉사 기록도 함께 등록</span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {/* 전입 일자 */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  전입 일자 <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <DateInput
                  value={transferDate}
                  onChange={setTransferDate}
                  placeholder="예: 20261120"
                />
              </div>

              {/* 전입 월 */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  전입 월 <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <select
                  className="form-select"
                  value={transferMonth}
                  onChange={e => setTransferMonth(e.target.value as ServiceMonth)}
                  style={{ fontWeight: 600 }}
                >
                  {SERVICE_MONTHS.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">이전 소속 회중명</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 서울서초 회중"
                  value={prevCongregationName}
                  onChange={e => setPrevCongregationName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  배정할 봉사 집단 <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <select
                  className="form-select"
                  value={selectedGroupId}
                  onChange={e => setSelectedGroupId(e.target.value)}
                  style={{ fontWeight: 600 }}
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 전년도 봉사연도 선택기 (전년도 포함 시 표시) */}
              {includePrevYear && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#9333ea' }}>
                    등록할 전년도 봉사연도
                  </label>
                  <select
                    className="form-select"
                    value={selectedPrevYearId}
                    onChange={e => setSelectedPrevYearId(e.target.value)}
                    style={{ fontWeight: 600, borderColor: 'rgba(147, 51, 234, 0.4)' }}
                  >
                    {availableYears.filter(y => y.id !== currentYear.id).map(y => (
                      <option key={y.id} value={y.id}>
                        {y.year_name} 봉사연도
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 3. 기본 인적사항 섹션 */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>
                1. 전도인 기본 인적사항
              </div>

              {/* 기존 등록 전도인 자동 불러오기 선택 드롭다운 */}
              {publishers && publishers.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>이미 등록된 전도인:</span>
                  <select
                    className="form-select"
                    style={{ padding: '3px 8px', fontSize: '0.78rem', minWidth: 170, borderColor: selectedExistingPublisherId ? 'var(--primary)' : undefined }}
                    value={selectedExistingPublisherId}
                    onChange={e => handleExistingSelect(e.target.value)}
                  >
                    <option value="">-- 기존 전도인 선택 불러오기 --</option>
                    {publishers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.group_name || '미배정'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 자동 대입 안내 배너 */}
            {autoLoadedMsg && (
              <div
                style={{
                  marginBottom: 10,
                  padding: '6px 10px',
                  borderRadius: 4,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                {autoLoadedMsg}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 10 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  성명 <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="홍길동"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">성별</label>
                <select
                  className="form-select"
                  value={gender}
                  onChange={e => setGender(e.target.value as Gender)}
                >
                  <option value="남">남</option>
                  <option value="여">여</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">구별</label>
                <select
                  className="form-select"
                  value={hope}
                  onChange={e => setHope(e.target.value as Hope)}
                >
                  <option value="다른 양">다른 양</option>
                  <option value="기름부음받은 자">기름부음받은 자</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">직책</label>
                <select
                  className="form-select"
                  value={position}
                  onChange={e => setPosition(e.target.value as Position)}
                >
                  <option value="일반">일반</option>
                  <option value="장로">장로</option>
                  <option value="봉사의 종">봉사의 종</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">파이오니아 구분</label>
                <select
                  className="form-select"
                  value={pioneerStatus}
                  onChange={e => setPioneerStatus(e.target.value as PioneerStatus)}
                >
                  <option value="일반">일반 전도인</option>
                  <option value="RP">RP (정규 파이오니아)</option>
                  <option value="SP">SP (특별 파이오니아)</option>
                  <option value="FM">FM (선교인)</option>
                </select>
              </div>
            </div>

            {/* 생년월일 & 침례일자 (스마트 DateInput 적용) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">생년월일</label>
                <DateInput
                  value={birthDate}
                  onChange={setBirthDate}
                  placeholder="예: 19921204"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">침례일자 (선택)</label>
                <DateInput
                  value={baptismDate}
                  onChange={setBaptismDate}
                  placeholder="예: 20100615"
                />
              </div>
            </div>

            {/* 비상연락처 및 주소 (선택) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">전화번호</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">주소</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="도로명 주소"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">비고</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="특이사항"
                  value={specialNotes}
                  onChange={e => setSpecialNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 4. 12개월 봉사 기록 테이블 (당해 연도 vs 전년도 탭 스위처) */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  2. 봉사연도 12개월 봉사 기록
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                  (전입 이전 월은 타회중 실적으로 자동 태깅됩니다)
                </span>
              </div>

              {/* 연도 탭 스위처 */}
              {includePrevYear && (
                <div style={{ display: 'flex', gap: 4, background: 'var(--bg-hover)', padding: 3, borderRadius: 'var(--radius-sm)' }}>
                  <button
                    type="button"
                    onClick={() => setActiveRecordsTab('current')}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      fontWeight: activeRecordsTab === 'current' ? 700 : 500,
                      border: 'none',
                      borderRadius: 4,
                      background: activeRecordsTab === 'current' ? 'var(--bg-surface)' : 'transparent',
                      color: activeRecordsTab === 'current' ? 'var(--primary)' : 'var(--text-muted)',
                      boxShadow: activeRecordsTab === 'current' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    당해 연도 ({currentYear.year_name})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRecordsTab('prev')}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      fontWeight: activeRecordsTab === 'prev' ? 700 : 500,
                      border: 'none',
                      borderRadius: 4,
                      background: activeRecordsTab === 'prev' ? 'var(--bg-surface)' : 'transparent',
                      color: activeRecordsTab === 'prev' ? '#9333ea' : 'var(--text-muted)',
                      boxShadow: activeRecordsTab === 'prev' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    전년도 ({currentPrevYearName})
                  </button>
                </div>
              )}
            </div>

            {/* 당해 연도 테이블 */}
            {activeRecordsTab === 'current' && (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ fontSize: '0.8rem', width: '100%', minWidth: 650 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 65, textAlign: 'center' }}>월</th>
                      <th style={{ width: 110, textAlign: 'center' }}>상태 구분</th>
                      <th style={{ width: 60, textAlign: 'center' }}>참여(Y)</th>
                      <th style={{ width: 80, textAlign: 'center' }}>시간(h)</th>
                      <th style={{ width: 70, textAlign: 'center' }}>연구(건)</th>
                      <th style={{ width: 65, textAlign: 'center' }}>보조(AP)</th>
                      <th style={{ minWidth: 140 }}>비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyRecords.map(rec => {
                      const isTransferredMonth = (MONTH_ORDER[rec.month] || 0) < transferOrder;
                      const isFirstMonth = rec.month === transferMonth;
                      return (
                        <tr
                          key={rec.month}
                          style={{
                            background: isTransferredMonth ? 'rgba(245, 158, 11, 0.04)' : (isFirstMonth ? 'rgba(59, 130, 246, 0.05)' : undefined),
                          }}
                        >
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{rec.month}</td>
                          <td style={{ textAlign: 'center' }}>
                            {isTransferredMonth ? (
                              <span
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontSize: '0.7rem',
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  color: '#d97706',
                                  fontWeight: 700,
                                }}
                              >
                                타회중 실적
                              </span>
                            ) : isFirstMonth ? (
                              <span
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontSize: '0.7rem',
                                  background: 'rgba(59, 130, 246, 0.18)',
                                  color: 'var(--primary)',
                                  fontWeight: 700,
                                }}
                              >
                                ★ 전입 첫 보고
                              </span>
                            ) : (
                              <span
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontSize: '0.7rem',
                                  background: 'rgba(59, 130, 246, 0.1)',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                우리 회중
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={rec.participated}
                              onChange={e => handleRecordChange(rec.month, 'participated', e.target.checked)}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              className="form-input"
                              style={{ padding: '3px 6px', fontSize: '0.8rem', textAlign: 'center' }}
                              value={rec.hours || 0}
                              min={0}
                              step={0.5}
                              onChange={e => handleRecordChange(rec.month, 'hours', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              className="form-input"
                              style={{ padding: '3px 6px', fontSize: '0.8rem', textAlign: 'center' }}
                              value={rec.bibleStudies || 0}
                              min={0}
                              onChange={e => handleRecordChange(rec.month, 'bibleStudies', parseInt(e.target.value, 10) || 0)}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={rec.isAuxiliaryPioneer}
                              onChange={e => handleRecordChange(rec.month, 'isAuxiliaryPioneer', e.target.checked)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-input"
                              style={{ padding: '3px 6px', fontSize: '0.8rem' }}
                              placeholder={isTransferredMonth ? '예: 타회중 실적' : isFirstMonth ? `자동 반영: ${transferDate} 전입` : '비고 입력'}
                              value={rec.remarks || ''}
                              onChange={e => handleRecordChange(rec.month, 'remarks', e.target.value)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 전년도 테이블 */}
            {activeRecordsTab === 'prev' && includePrevYear && (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ fontSize: '0.76rem', color: '#9333ea', marginBottom: 8, fontWeight: 600 }}>
                  🕒 {currentPrevYearName} 봉사연도 12개월 과거 실적 (타회중 보관 자료로 등록됩니다)
                </div>
                <table className="table" style={{ fontSize: '0.8rem', width: '100%', minWidth: 650 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 65, textAlign: 'center' }}>월</th>
                      <th style={{ width: 110, textAlign: 'center' }}>구분</th>
                      <th style={{ width: 60, textAlign: 'center' }}>참여(Y)</th>
                      <th style={{ width: 80, textAlign: 'center' }}>시간(h)</th>
                      <th style={{ width: 70, textAlign: 'center' }}>연구(건)</th>
                      <th style={{ width: 65, textAlign: 'center' }}>보조(AP)</th>
                      <th style={{ minWidth: 140 }}>비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prevYearRecords.map(rec => (
                      <tr key={rec.month} style={{ background: 'rgba(147, 51, 234, 0.03)' }}>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{rec.month}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: '0.7rem',
                              background: 'rgba(147, 51, 234, 0.15)',
                              color: '#9333ea',
                              fontWeight: 700,
                            }}
                          >
                            전년도 실적
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={rec.participated}
                            onChange={e => handlePrevRecordChange(rec.month, 'participated', e.target.checked)}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: '3px 6px', fontSize: '0.8rem', textAlign: 'center' }}
                            value={rec.hours || 0}
                            min={0}
                            step={0.5}
                            onChange={e => handlePrevRecordChange(rec.month, 'hours', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: '3px 6px', fontSize: '0.8rem', textAlign: 'center' }}
                            value={rec.bibleStudies || 0}
                            min={0}
                            onChange={e => handlePrevRecordChange(rec.month, 'bibleStudies', parseInt(e.target.value, 10) || 0)}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={rec.isAuxiliaryPioneer}
                            onChange={e => handlePrevRecordChange(rec.month, 'isAuxiliaryPioneer', e.target.checked)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '3px 6px', fontSize: '0.8rem' }}
                            placeholder="예: 전년도 봉사실적"
                            value={rec.remarks || ''}
                            onChange={e => handlePrevRecordChange(rec.month, 'remarks', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 모달 하단 액션 버튼 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
              paddingTop: 10,
              borderTop: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={saving}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{ gap: 6, minWidth: 150, justifyContent: 'center' }}
            >
              {saving ? '저장 및 마감 보존 동기화 중...' : '전입 전도인 & 실적 저장 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
