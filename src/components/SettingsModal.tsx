import React, { useState, useEffect, useRef } from 'react';
import { X, Database, CheckCircle2, AlertCircle, Copy, Check, RefreshCw, Layers, Building2, Plus, Calendar, FolderArchive, Download, Upload, Trash2 } from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  testSupabaseConnection
} from '../services/supabase';
import { ServiceYear } from '../types/database';
import {
  getServiceYears,
  setCurrentServiceYear,
  createServiceYear,
  deleteServiceYear,
  normalizeServiceYearName,
  getAllServiceYearReports,
  importMonthlyReports
} from '../services/ministryService';

interface SettingsModalProps {
  onClose: () => void;
  onConfigSaved: () => void;
  currentYear: ServiceYear;
  onServiceYearChanged?: (newYear: ServiceYear) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onConfigSaved,
  currentYear,
  onServiceYearChanged,
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  const [serviceYears, setServiceYears] = useState<ServiceYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState(currentYear.id);

  const [congregationName, setCongregationName] = useState(() => {
    return localStorage.getItem('ministry_congregation_name') || '춘천남부 회중';
  });

  const [showCreateYear, setShowCreateYear] = useState(false);
  const [newYearInput, setNewYearInput] = useState('2027');
  const [makeNewYearCurrent, setMakeNewYearCurrent] = useState(true);
  const [creatingYear, setCreatingYear] = useState(false);

  // 보고서 백업 및 복원 상태
  const [reportImportStatus, setReportImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [importingReports, setImportingReports] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync selectedYearId when currentYear changes
  useEffect(() => {
    setSelectedYearId(currentYear.id);
  }, [currentYear.id]);

  useEffect(() => {
    const cfg = getStoredSupabaseConfig();
    setSupabaseUrl(cfg.url);
    setAnonKey(cfg.anonKey);

    getServiceYears().then(years => {
      setServiceYears(years);
      const curr = years.find(y => y.is_current);
      if (curr) setSelectedYearId(curr.id);
      else if (years.length > 0) {
        const highest = Math.max(...years.map(y => parseInt(y.year_name, 10) || 2026));
        setNewYearInput(String(highest + 1));
      }
    });
  }, []);

  const handleSaveCongregationName = () => {
    const trimmed = congregationName.trim() || '춘천남부 회중';
    localStorage.setItem('ministry_congregation_name', trimmed);
    setCongregationName(trimmed);
    window.dispatchEvent(new CustomEvent('congregation_name_changed', { detail: trimmed }));
    alert(`회중명이 '${trimmed}'(으)로 저장되었습니다.`);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(supabaseUrl, anonKey);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || '테스트 실패' });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = () => {
    const trimmed = congregationName.trim() || '춘천남부 회중';
    localStorage.setItem('ministry_congregation_name', trimmed);
    window.dispatchEvent(new CustomEvent('congregation_name_changed', { detail: trimmed }));

    saveStoredSupabaseConfig(supabaseUrl, anonKey);
    onConfigSaved();
    alert('설정이 저장되었습니다!');
    onClose();
  };

  const handleCreateServiceYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearInput.trim()) {
      alert('생성할 봉사연도를 입력해주세요 (예: 2027).');
      return;
    }
    setCreatingYear(true);
    try {
      const created = await createServiceYear(newYearInput.trim(), makeNewYearCurrent);
      alert(`${created.year_name} 봉사연도가 성공적으로 생성되었습니다!`);
      const updatedYears = await getServiceYears();
      setServiceYears(updatedYears);
      setNewYearInput('');
      setShowCreateYear(false);
      if (makeNewYearCurrent && onServiceYearChanged) {
        onServiceYearChanged(created);
        onClose();
      }
    } catch (err: any) {
      alert('봉사연도 생성 실패: ' + (err.message || '오류'));
    } finally {
      setCreatingYear(false);
    }
  };

  const handleDeleteServiceYear = async (yearId: string) => {
    const target = serviceYears.find(y => y.id === yearId);
    if (!target) return;

    if (serviceYears.length <= 1) {
      alert('시스템에 최소 1개 이상의 봉사연도가 유지되어야 하므로 삭제할 수 없습니다.');
      return;
    }

    const isCurrent = target.id === currentYear.id || target.is_current;
    const confirmMsg = isCurrent
      ? `'${target.year_name} 봉사연도'는 현재 활성(사용 중인) 봉사연도입니다.\n\n정말 삭제하시겠습니까?\n\n※ 주의: 해당 연도의 모든 월별 보고서와 마감 기록이 영구 삭제되며, 남아있는 다른 최신 봉사연도가 활성 연도로 자동 전환됩니다.`
      : `'${target.year_name} 봉사연도'를 정말 삭제하시겠습니까?\n\n※ 주의: 해당 연도의 모든 월별 보고서와 마감 기록이 함께 영구 삭제됩니다.`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      const res = await deleteServiceYear(yearId);
      alert(`'${target.year_name} 봉사연도'가 성공적으로 삭제되었습니다.`);

      const updatedYears = await getServiceYears();
      setServiceYears(updatedYears);

      if (res.newCurrentYear && onServiceYearChanged) {
        setSelectedYearId(res.newCurrentYear.id);
        onServiceYearChanged(res.newCurrentYear);
      } else {
        const nextSelected = updatedYears.find(y => y.id === currentYear.id)?.id || updatedYears[0]?.id || '';
        setSelectedYearId(nextSelected);
        onConfigSaved();
      }
    } catch (err: any) {
      alert('봉사연도 삭제 실패: ' + (err.message || '오류'));
    }
  };

  const handleCopySchemaPath = () => {
    navigator.clipboard.writeText('supabase/schema.sql');
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  // JSON 백업 파일 내보내기
  const handleExportJsonBackup = async (allYears: boolean = false) => {
    try {
      const exportList = await getAllServiceYearReports(allYears ? undefined : currentYear.id);
      if (exportList.length === 0) {
        alert('내보낼 보고서 데이터가 없습니다.');
        return;
      }
      const dataStr = JSON.stringify({
        serviceYear: currentYear.year_name,
        isAllYears: allYears,
        exportedAt: new Date().toISOString(),
        totalCount: exportList.length,
        reports: exportList
      }, null, 2);

      const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = allYears
        ? `봉사보고서_전체연도_백업_${new Date().toISOString().slice(0, 10)}.json`
        : `봉사보고서_${currentYear.year_name}봉사연도_백업_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('보고서 백업 파일 생성 실패: ' + (err.message || '오류'));
    }
  };

  // JSON 백업 파일 가져오기 (복원/병합)
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setImportingReports(true);
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const reportsArray = Array.isArray(parsed) ? parsed : (parsed.reports || []);

        if (!Array.isArray(reportsArray) || reportsArray.length === 0) {
          throw new Error('유효한 보고서 데이터(.json)를 찾을 수 없습니다.');
        }

        const result = await importMonthlyReports(reportsArray, currentYear.id);
        setReportImportStatus({
          success: true,
          message: `성공적으로 복원되었습니다! (신규 ${result.added}건 추가, 기존 ${result.updated}건 최신화, 총 ${reportsArray.length}건 처리 완료)`
        });
        onConfigSaved();
      } catch (err: any) {
        setReportImportStatus({
          success: false,
          message: '보고서 가져오기 실패: ' + (err.message || '파일 형식이 올바르지 않습니다.')
        });
      } finally {
        setImportingReports(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-gradient)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Database size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>회중 및 시스템 환경 설정</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                회중 정보, 데이터베이스 연결 및 활성 봉사연도를 관리합니다.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* Section 0: Congregation Name Configuration */}
        <div style={{
          background: 'rgba(0,0,0,0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: 20
        }}>
          <h4 style={{ fontSize: '0.98rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 size={16} color="var(--primary-600)" />
            회중 정보 설정
          </h4>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            </label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="text"
                className="form-input"
                placeholder="예: 춘천남부 회중"
                value={congregationName}
                onChange={(e) => setCongregationName(e.target.value)}
                style={{ flex: 1, fontWeight: 600 }}
              />
              <button
                type="button"
                onClick={handleSaveCongregationName}
                className="btn-primary"
                style={{ flexShrink: 0, fontSize: '0.85rem' }}
              >
                회중명 저장
              </button>
            </div>
          </div>
        </div>

        {/* Section 1: Supabase Configuration */}
        <div style={{
          background: 'rgba(0,0,0,0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
          marginBottom: 20
        }}>
          <h4 style={{ fontSize: '1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Database size={16} color="var(--primary-600)" />
            데이터베이스 연결 정보
          </h4>

          <div className="form-group">
            <label className="form-label">Project URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://your-project.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Anon / Public API Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
            />
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div style={{
              background: testResult.success ? 'var(--accent-emerald-subtle)' : 'rgba(244, 63, 94, 0.12)',
              border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              color: testResult.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{testResult.message}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !supabaseUrl || !anonKey}
              className="btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              <RefreshCw size={13} className={testing ? 'animate-spin' : ''} />
              <span>{testing ? '연결 확인 중...' : '테스트'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveConfig}
              className="btn-primary"
              style={{ fontSize: '0.85rem' }}
            >
              설정 저장 및 적용
            </button>
          </div>
        </div>

        {/* Section 2: SQL Schema Helper */}
        <div style={{
          background: 'var(--primary-50)',
          border: '1px solid var(--primary-200)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--primary-700)' }}>
              Supabase SQL
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--primary-600)' }}>
              `supabase/schema.sql` 파일을 복사하여 Supabase 대시보드 SQL Editor에 실행하세요.
            </div>
          </div>
          <button
            onClick={handleCopySchemaPath}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem', flexShrink: 0 }}
          >
            {copiedSchema ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedSchema ? '경로 복사됨' : '파일 경로 복사'}</span>
          </button>
        </div>

        {/* Section 3: Service Year Management (봉사연도 관리 및 삭제) */}
        <div style={{
          background: 'rgba(0,0,0,0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
          marginBottom: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <h4 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                <Calendar size={16} color="var(--primary-600)" />
                봉사연도 관리 및 삭제
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                활성 봉사연도를 전환하거나, 신규 봉사연도를 생성하고 불필요한 봉사연도를 삭제할 수 있습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateYear(!showCreateYear)}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '6px 12px', gap: 4 }}
            >
              <Plus size={14} />
              <span>신규 생성</span>
            </button>
          </div>

          {/* New Year Creator Form */}
          {showCreateYear && (
            <form onSubmit={handleCreateServiceYear} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--primary-200)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: 16,
              boxShadow: 'var(--shadow-xs)'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary-700)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={15} />
                새로운 봉사연도 신규 생성
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <input
                  type="number"
                  className="form-input"
                  min="2020"
                  max="2099"
                  placeholder="2027"
                  value={newYearInput}
                  onChange={(e) => setNewYearInput(e.target.value)}
                  style={{ fontWeight: 800, textAlign: 'center' }}
                  required
                />
                <div style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>
                  <strong>{newYearInput || '????'} 봉사연도</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={makeNewYearCurrent}
                    onChange={(e) => setMakeNewYearCurrent(e.target.checked)}
                  />
                  <span>생성 후 즉시 활성 연도로 전환</span>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateYear(false)}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={creatingYear || !newYearInput}
                    className="btn-primary"
                    style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                  >
                    {creatingYear ? '생성 중...' : '봉사연도 생성 및 시작'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 등록된 봉사연도 목록 및 삭제 리스트 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {serviceYears.map(y => {
              const isCurrent = y.id === currentYear.id || y.is_current;
              return (
                <div
                  key={y.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: isCurrent ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
                    border: isCurrent ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                      {y.year_name} 봉사연도
                    </span>
                    {isCurrent && (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: 'var(--primary)',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: 12,
                        whiteSpace: 'nowrap'
                      }}>
                        활성
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await setCurrentServiceYear(y.id);
                            alert(`'${y.year_name} 봉사연도'로 활성 연도가 변경되었습니다.`);
                            onServiceYearChanged?.({ ...y, is_current: true });
                            const updated = await getServiceYears();
                            setServiceYears(updated);
                            setSelectedYearId(y.id);
                          } catch (err: any) {
                            alert('활성 연도 변경 실패: ' + (err.message || '오류'));
                          }
                        }}
                        className="btn-secondary"
                        style={{ fontSize: '0.76rem', padding: '4px 10px', height: 28 }}
                        title="이 봉사연도를 활성 연도로 전환합니다"
                      >
                        활성화
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteServiceYear(y.id)}
                      disabled={serviceYears.length <= 1}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(244, 63, 94, 0.35)',
                        color: 'var(--accent-rose, #f43f5e)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '4px 8px',
                        height: 28,
                        cursor: serviceYears.length <= 1 ? 'not-allowed' : 'pointer',
                        opacity: serviceYears.length <= 1 ? 0.35 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.76rem',
                        fontWeight: 600,
                      }}
                      title={serviceYears.length <= 1 ? '최소 1개 이상의 봉사연도가 유지되어야 합니다' : `'${y.year_name} 봉사연도' 및 관련 데이터 삭제`}
                    >
                      <Trash2 size={13} />
                      <span>삭제</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Report Data Backup & Restore */}
        <div style={{
          background: 'rgba(0,0,0,0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
          marginBottom: 20
        }}>
          <h4 style={{ fontSize: '1rem', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
            <FolderArchive size={16} color="var(--primary-600)" />
            데이터 백업 및 복원
          </h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
            월별 봉사보고 데이터를 JSON 파일로 백업하거나, 백업한 파일로 복원할 수 있습니다.
          </p>

          {/* Status Alert */}
          {reportImportStatus && (
            <div style={{
              background: reportImportStatus.success ? 'var(--accent-emerald-subtle)' : 'rgba(244, 63, 94, 0.12)',
              border: `1px solid ${reportImportStatus.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              color: reportImportStatus.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.84rem',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              {reportImportStatus.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{reportImportStatus.message}</span>
            </div>
          )}

          {/* Backup Buttons */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: 12
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleExportJsonBackup(false)}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px', gap: 5 }}
              >
                <Download size={13} />
                <span>현재 {currentYear.year_name} 봉사연도 백업</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportJsonBackup(true)}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px', gap: 5 }}
              >
                <Download size={13} />
                <span>전체 누적 연도 백업</span>
              </button>
            </div>
          </div>

          {/* Restore Button */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px'
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileImport}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => {
                setReportImportStatus(null);
                fileInputRef.current?.click();
              }}
              disabled={importingReports}
              className="btn-primary"
              style={{ fontSize: '0.82rem', padding: '6px 14px', gap: 6 }}
            >
              <Upload size={14} />
              <span>{importingReports ? '복원 처리 중...' : '백업 파일 선택하여 복원'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
