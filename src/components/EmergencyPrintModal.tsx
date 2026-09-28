import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  Eye,
  Settings,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import {
  EmergencyCoverData,
  EmergencyCoverOfficer,
  DEFAULT_EMERGENCY_COVER_DATA,
  EMERGENCY_COVER_STORAGE_KEY
} from '../types/emergency';
import { Group, EmergencyContact } from '../types/database';
import { EmergencyCoverPage } from './EmergencyCoverPage';

interface EmergencyPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  contacts: EmergencyContact[];
  currentGroupFilter: string; // 'all' or group.id
  onPrint: (options: {
    includeCover: boolean;
    printMode: 'all_groups_paginated' | 'current_view';
    coverData: EmergencyCoverData;
  }) => void;
}

export const EmergencyPrintModal: React.FC<EmergencyPrintModalProps> = ({
  isOpen,
  onClose,
  groups,
  contacts,
  currentGroupFilter,
  onPrint
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [includeCover, setIncludeCover] = useState<boolean>(true);
  const [printMode, setPrintMode] = useState<'all_groups_paginated' | 'current_view'>('all_groups_paginated');
  const [coverData, setCoverData] = useState<EmergencyCoverData>(DEFAULT_EMERGENCY_COVER_DATA);
  const [saveToast, setSaveToast] = useState(false);

  // 로컬 스토리지에서 기존 설정 불러오기
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(EMERGENCY_COVER_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setCoverData({
            ...DEFAULT_EMERGENCY_COVER_DATA,
            ...parsed
          });
        } else {
          // 저장된 게 없으면 시스템 설정의 회중명과 현재 집단 정보로 초기화
          const savedCongName = localStorage.getItem('ministry_congregation_name');
          if (savedCongName) {
            setCoverData(prev => ({ ...prev, congregationName: savedCongName }));
          }
        }
      } catch (err) {
        console.error('Failed to parse emergency cover data:', err);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 집단 정보 및 전도인 명단에서 집단감독자 목록 자동 동기화
  const handleAutoFillOverseers = () => {
    if (!groups || groups.length === 0) {
      alert('등록된 집단 정보가 없습니다.');
      return;
    }

    const newGroupOverseers: EmergencyCoverOfficer[] = groups.map((g, idx) => {
      const overseerName = g.overseer_name?.trim() || '';
      // 전도인 목록에서 감독자의 전화번호 찾기
      const foundContact = overseerName ? contacts.find(c => c.name.trim() === overseerName) : null;
      const phone = foundContact?.phone || '';

      return {
        id: `go-${g.id || idx}`,
        role: `${g.name}집단감독자`,
        name: overseerName,
        phone: phone
      };
    });

    setCoverData(prev => ({
      ...prev,
      groupOverseers: newGroupOverseers
    }));

    alert('현재 등록된 집단 및 전도인 정보에서 감독자 명단을 성공적으로 불러왔습니다.');
  };

  // 저장 함수
  const handleSaveData = (silent = false) => {
    try {
      localStorage.setItem(EMERGENCY_COVER_STORAGE_KEY, JSON.stringify(coverData));
      if (!silent) {
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save cover data:', err);
      if (!silent) alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 인쇄 실행
  const handleConfirmPrint = () => {
    handleSaveData(true);
    onPrint({
      includeCover,
      printMode,
      coverData
    });
  };

  // 봉사위원회 항목 변경
  const updateServiceCommittee = (idx: number, field: keyof EmergencyCoverOfficer, value: string) => {
    setCoverData(prev => {
      const list = [...prev.serviceCommittee];
      list[idx] = { ...list[idx], [field]: value };
      return { ...prev, serviceCommittee: list };
    });
  };

  const addServiceCommittee = () => {
    setCoverData(prev => ({
      ...prev,
      serviceCommittee: [
        ...prev.serviceCommittee,
        { id: `sc-${Date.now()}`, role: '', name: '', phone: '' }
      ]
    }));
  };

  const removeServiceCommittee = (idx: number) => {
    setCoverData(prev => ({
      ...prev,
      serviceCommittee: prev.serviceCommittee.filter((_, i) => i !== idx)
    }));
  };

  // 집단감독자 항목 변경
  const updateGroupOverseer = (idx: number, field: keyof EmergencyCoverOfficer, value: string) => {
    setCoverData(prev => {
      const list = [...prev.groupOverseers];
      list[idx] = { ...list[idx], [field]: value };
      return { ...prev, groupOverseers: list };
    });
  };

  const addGroupOverseer = () => {
    setCoverData(prev => ({
      ...prev,
      groupOverseers: [
        ...prev.groupOverseers,
        { id: `go-${Date.now()}`, role: '', name: '', phone: '' }
      ]
    }));
  };

  const removeGroupOverseer = (idx: number) => {
    setCoverData(prev => ({
      ...prev,
      groupOverseers: prev.groupOverseers.filter((_, i) => i !== idx)
    }));
  };

  const currentGroupName = currentGroupFilter === 'all'
    ? '전체 전도인'
    : (groups.find(g => g.id === currentGroupFilter)?.name ? `${groups.find(g => g.id === currentGroupFilter)?.name} 집단` : '선택 집단');

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: activeTab === 'preview' ? '860px' : '820px',
          maxHeight: '92vh',
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: 'var(--radius-lg, 14px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--border-color, #e2e8f0)'
        }}
      >
        {/* 모달 상단 헤더 */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-main, #f8fafc)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Printer size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                비상연락망 인쇄 및 첫페이지 설정
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                인쇄 시 첫 페이지(총괄 표지)에 들어갈 회중 및 주요 감독자 연락처를 입력하고 인쇄합니다.
              </p>
            </div>
          </div>

          {/* 탭 전환 및 닫기 버튼 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', background: 'var(--border-subtle, #e2e8f0)', padding: 3, borderRadius: 8 }}>
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'form' ? '#ffffff' : 'transparent',
                  color: activeTab === 'form' ? 'var(--primary, #2563eb)' : 'var(--text-muted, #64748b)',
                  boxShadow: activeTab === 'form' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <Settings size={13} />
                <span>항목 입력/설정</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'preview' ? '#ffffff' : 'transparent',
                  color: activeTab === 'preview' ? 'var(--primary, #2563eb)' : 'var(--text-muted, #64748b)',
                  boxShadow: activeTab === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <Eye size={13} />
                <span>첫페이지 미리보기</span>
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, #64748b)',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4
              }}
              title="닫기"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 모달 본문 스크롤 영역 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeTab === 'preview' ? (
            /* 미리보기 탭 */
            <div>
              <div
                style={{
                  marginBottom: 16,
                  padding: '10px 14px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  borderRadius: 8,
                  fontSize: '0.82rem',
                  color: 'var(--primary, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Info size={16} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
                  <span>
                    첫 페이지(총괄 표지)로 단독 인쇄되는 화면입니다. <strong>A4 가로(Landscape)</strong> 모드로 자동 설정되어 출력됩니다.
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'var(--primary, #2563eb)', color: '#fff', whiteSpace: 'nowrap' }}>
                    A4 가로 모드
                  </span>
                </div>
              </div>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '30px 20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}
              >
                <EmergencyCoverPage data={coverData} isPrintView={false} />
              </div>
            </div>
          ) : (
            /* 입력/설정 탭 */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* 인쇄 범위 및 옵션 설정 카드 */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-main, #f8fafc)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: 10
                }}
              >
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                  🖨️ 인쇄 방식 및 옵션
                </h4>

                {/* 첫 페이지 포함 체크박스 */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: 'var(--text-main, #0f172a)',
                    marginBottom: 14
                  }}
                >
                  <input
                    type="checkbox"
                    checked={includeCover}
                    onChange={(e) => setIncludeCover(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary, #2563eb)' }}
                  />
                  <span>첫페이지(총괄 표지 - 순회감독자, 봉사위원회, 집단감독자) 포함하여 인쇄</span>
                </label>

                {/* 인쇄 모드 라디오 버튼 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 6 }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      fontSize: '0.84rem',
                      color: 'var(--text-main, #0f172a)'
                    }}
                  >
                    <input
                      type="radio"
                      name="print_mode"
                      checked={printMode === 'all_groups_paginated'}
                      onChange={() => setPrintMode('all_groups_paginated')}
                      style={{ cursor: 'pointer', accentColor: 'var(--primary, #2563eb)' }}
                    />
                    <span style={{ fontWeight: printMode === 'all_groups_paginated' ? 700 : 500 }}>
                      전체 집단별 연속 인쇄 <span style={{ color: 'var(--primary, #2563eb)', fontWeight: 600 }}>(권장: 표지 + 5개 집단 각각 1장씩 분할 출력)</span>
                    </span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      fontSize: '0.84rem',
                      color: 'var(--text-main, #0f172a)'
                    }}
                  >
                    <input
                      type="radio"
                      name="print_mode"
                      checked={printMode === 'current_view'}
                      onChange={() => setPrintMode('current_view')}
                      style={{ cursor: 'pointer', accentColor: 'var(--primary, #2563eb)' }}
                    />
                    <span style={{ fontWeight: printMode === 'current_view' ? 700 : 500 }}>
                      현재 선택된 화면만 인쇄 ({currentGroupName})
                    </span>
                  </label>
                </div>
              </div>

              {/* 회중명 및 순회구 섹션 */}
              <div
                style={{
                  padding: '16px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: 10,
                  opacity: includeCover ? 1 : 0.5,
                  pointerEvents: includeCover ? 'auto' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                    🏢 회중 및 순회구 정보
                  </h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', marginBottom: 4 }}>
                      회중명
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={coverData.congregationName}
                      onChange={(e) => setCoverData(prev => ({ ...prev, congregationName: e.target.value }))}
                      placeholder="예: 강원 춘천 남부 회중"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', marginBottom: 4 }}>
                      순회구 명칭 (첫번째 헤더)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={coverData.circuitName}
                      onChange={(e) => setCoverData(prev => ({ ...prev, circuitName: e.target.value }))}
                      placeholder="예: 강원1순회구"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                {/* 순회감독자 정보 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 2fr', gap: 10, marginTop: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', marginBottom: 4 }}>
                      직책명
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={coverData.circuitOverseerRole}
                      onChange={(e) => setCoverData(prev => ({ ...prev, circuitOverseerRole: e.target.value }))}
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', marginBottom: 4 }}>
                      순회감독자 성명
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={coverData.circuitOverseerName}
                      onChange={(e) => setCoverData(prev => ({ ...prev, circuitOverseerName: e.target.value }))}
                      placeholder="예: 최윤호"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', marginBottom: 4 }}>
                      전화번호
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={coverData.circuitOverseerPhone}
                      onChange={(e) => setCoverData(prev => ({ ...prev, circuitOverseerPhone: e.target.value }))}
                      placeholder="예: 010-7271-8789"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* 회중 봉사위원회 (조정자, 서기, 봉사감독자) */}
              <div
                style={{
                  padding: '16px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: 10,
                  opacity: includeCover ? 1 : 0.5,
                  pointerEvents: includeCover ? 'auto' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                      👥 회중 봉사위원회 (주요 직책)
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                      두 번째 표에 출력되는 조정자, 서기, 봉사감독자 연락처
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addServiceCommittee}
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.78rem', gap: 4 }}
                  >
                    <Plus size={13} />
                    <span>직책 추가</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {coverData.serviceCommittee.map((item, idx) => (
                    <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 2fr 36px', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="직책 (예: 조정자)"
                        value={item.role}
                        onChange={(e) => updateServiceCommittee(idx, 'role', e.target.value)}
                        style={{ fontSize: '0.84rem' }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="성명"
                        value={item.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateServiceCommittee(idx, 'name', val);
                          // 전도인 목록에 이름이 있으면 전화번호 자동 완성 제안
                          const found = contacts.find(c => c.name.trim() === val.trim());
                          if (found && found.phone && !item.phone) {
                            updateServiceCommittee(idx, 'phone', found.phone);
                          }
                        }}
                        style={{ fontSize: '0.84rem' }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="전화번호 (예: 010-1234-5678)"
                        value={item.phone}
                        onChange={(e) => updateServiceCommittee(idx, 'phone', e.target.value)}
                        style={{ fontSize: '0.84rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeServiceCommittee(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-rose, #f43f5e)',
                          cursor: 'pointer',
                          padding: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 집단감독자 목록 (운교, 효자, 석사, 현대, 수어 등) */}
              <div
                style={{
                  padding: '16px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: 10,
                  opacity: includeCover ? 1 : 0.5,
                  pointerEvents: includeCover ? 'auto' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                      🏛️ 집단감독자 목록
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                      세 번째 표에 출력되는 각 집단별 감독자 연락처
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={handleAutoFillOverseers}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.78rem', gap: 4, color: 'var(--primary, #2563eb)' }}
                      title="등록된 집단 목록 및 전도인 데이터에서 감독자명과 연락처를 자동으로 불러옵니다."
                    >
                      <RotateCcw size={12} />
                      <span>집단 정보에서 자동 불러오기</span>
                    </button>
                    <button
                      type="button"
                      onClick={addGroupOverseer}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.78rem', gap: 4 }}
                    >
                      <Plus size={13} />
                      <span>감독자 추가</span>
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {coverData.groupOverseers.map((item, idx) => (
                    <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 2fr 36px', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="직책 (예: 운교집단감독자)"
                        value={item.role}
                        onChange={(e) => updateGroupOverseer(idx, 'role', e.target.value)}
                        style={{ fontSize: '0.84rem' }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="성명"
                        value={item.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateGroupOverseer(idx, 'name', val);
                          const found = contacts.find(c => c.name.trim() === val.trim());
                          if (found && found.phone && !item.phone) {
                            updateGroupOverseer(idx, 'phone', found.phone);
                          }
                        }}
                        style={{ fontSize: '0.84rem' }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="전화번호 (예: 010-1234-5678)"
                        value={item.phone}
                        onChange={(e) => updateGroupOverseer(idx, 'phone', e.target.value)}
                        style={{ fontSize: '0.84rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeGroupOverseer(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-rose, #f43f5e)',
                          cursor: 'pointer',
                          padding: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 모달 하단 액션 버튼 */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-main, #f8fafc)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => handleSaveData(false)}
              className="btn-secondary"
              style={{ fontSize: '0.84rem', gap: 6 }}
            >
              <Check size={14} color="var(--accent-emerald, #10b981)" />
              <span>설정 저장</span>
            </button>
            {saveToast && (
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald, #10b981)', fontWeight: 600 }}>
                ✓ 설정이 안전하게 저장되었습니다!
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ fontSize: '0.84rem' }}
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleConfirmPrint}
              className="btn-primary"
              style={{
                fontSize: '0.88rem',
                gap: 6,
                padding: '8px 18px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
              }}
            >
              <Printer size={15} />
              <span>인쇄하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
