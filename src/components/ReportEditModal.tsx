import React, { useState } from 'react';
import { X, Check, Trash2, Plus, AlertCircle, FileEdit, Clock, BookOpen, AlertTriangle } from 'lucide-react';
import { ServiceMonth, ServiceYear, RemarkItem, MonthlyReport } from '../types/database';
import { submitMinistryReport, deleteMonthlyReport } from '../services/ministryService';

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

interface ReportEditModalProps {
  serviceYear: ServiceYear;
  publisher: {
    id: string;
    name: string;
    group_name?: string;
    position?: string;
    pioneer_status?: string;
  };
  month: ServiceMonth;
  existingReport?: MonthlyReport | null;
  onClose: () => void;
  onSaved: () => void;
}

export const ReportEditModal: React.FC<ReportEditModalProps> = ({
  serviceYear,
  publisher,
  month,
  existingReport,
  onClose,
  onSaved,
}) => {
  const isEditing = !!existingReport;

  const [participated, setParticipated] = useState<boolean>(
    existingReport ? existingReport.participated : true
  );
  const [hours, setHours] = useState<string>(
    existingReport && existingReport.hours > 0 ? String(existingReport.hours) : ''
  );
  const [bibleStudies, setBibleStudies] = useState<string>(
    existingReport && existingReport.bible_studies > 0 ? String(existingReport.bible_studies) : ''
  );
  const [isAuxiliaryPioneer, setIsAuxiliaryPioneer] = useState<boolean>(
    existingReport?.pioneer_status === 'AP'
  );
  const [remarks, setRemarks] = useState<RemarkItem[]>(
    existingReport?.remarks ? [...existingReport.remarks] : []
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 비고 추가
  const handleAddRemark = () => {
    setRemarks(prev => [...prev, { type: '기타', hours: '1' }]);
  };

  // 비고 삭제
  const handleRemoveRemark = (idx: number) => {
    setRemarks(prev => prev.filter((_, i) => i !== idx));
  };

  // 비고 필드 변경
  const handleRemarkChange = (idx: number, field: keyof RemarkItem, val: any) => {
    setRemarks(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: String(val) };
      return copy;
    });
  };

  // 저장 처리
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numHours = hours.trim() === '' ? 0 : Number(hours);
    const numStudies = bibleStudies.trim() === '' ? 0 : Number(bibleStudies);

    if (isNaN(numHours) || numHours < 0) {
      setErrorMsg('봉사 시간은 0 이상의 올바른 숫자로 입력해주세요.');
      return;
    }
    if (isNaN(numStudies) || numStudies < 0) {
      setErrorMsg('성서 연구는 0 이상의 올바른 숫자로 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      await submitMinistryReport({
        serviceYearId: serviceYear.id,
        publisherName: publisher.name,
        month,
        participated,
        hours: numHours,
        bibleStudies: numStudies,
        remarks: remarks.map(r => ({ type: r.type, hours: String(r.hours || '1'), etc: r.etc || '' })),
        isAuxiliaryPioneer,
        isAdminOverride: true,
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '보고서 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 삭제 처리
  const handleDelete = async () => {
    if (!existingReport) return;
    if (!confirm(`${publisher.name} 님의 ${month} 봉사 보고서를 완전히 삭제하시겠습니까? (삭제 후 미보고자로 변경됩니다)`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteMonthlyReport(existingReport.id);
      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '보고서 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: isEditing ? 'var(--primary-light)' : 'var(--accent-emerald-light)',
              color: isEditing ? 'var(--primary)' : 'var(--accent-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileEdit size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>
                {publisher.name} {isEditing ? '보고서 수정' : '보고서 작성'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                {serviceYear.year_name} 봉사연도 · {month} 봉사 보고 · {publisher.group_name || '미배정'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div style={{
            background: 'var(--accent-rose-light)',
            color: 'var(--accent-rose)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 16,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* 1. 봉사 참여 여부 */}
          <div style={{
            background: 'var(--bg-app)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: 16
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={participated}
                onChange={(e) => setParticipated(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                  봉사에 참여했음 (참여 여부: {participated ? 'Y' : 'N'})
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  체크를 해제하면 해당 월 '미참여(N)'로 처리됩니다.
                </div>
              </div>
            </label>
          </div>

          {/* 2. 시간 & 성서 연구 (숫자만 입력) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                봉사 시간 (숫자)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="예: 15"
                  value={hours}
                  onChange={(e) => {
                    setHours(e.target.value);
                  }}
                  className="form-input"
                  style={{ paddingRight: 32, fontWeight: 700 }}
                />
                <Clock size={15} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                성서 연구 (숫자)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="예: 1"
                  value={bibleStudies}
                  onChange={(e) => setBibleStudies(e.target.value)}
                  className="form-input"
                  style={{ paddingRight: 32, fontWeight: 700 }}
                />
                <BookOpen size={15} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
              </div>
            </div>
          </div>

          {/* 3. 보조 파이오니아 체크박스 */}
          <div style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: isAuxiliaryPioneer ? 'var(--accent-amber-light)' : 'transparent',
            border: isAuxiliaryPioneer ? '1px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
            transition: 'all 0.15s ease'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={isAuxiliaryPioneer}
                onChange={(e) => setIsAuxiliaryPioneer(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isAuxiliaryPioneer ? 'var(--accent-amber)' : 'var(--text-main)' }}>
                이달에 보조 파이오니아 봉사 참여
              </span>
            </label>
          </div>

          {/* 4. 비고 (특기사항 및 인정 시간) */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                비고 (특기사항 및 인정 시간)
              </label>
              <button
                type="button"
                onClick={handleAddRemark}
                className="btn-secondary"
                style={{ padding: '3px 8px', fontSize: '0.75rem', gap: 4 }}
              >
                <Plus size={13} />
                <span>항목 추가</span>
              </button>
            </div>

            {remarks.length === 0 ? (
              <div style={{
                fontSize: '0.78rem',
                color: 'var(--text-faint)',
                padding: '10px 12px',
                background: 'var(--bg-app)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                등록된 비고 특기사항이 없습니다. (필요 시 항목 추가)
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {remarks.map((rm, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select
                      value={rm.type}
                      onChange={(e) => handleRemarkChange(idx, 'type', e.target.value)}
                      className="form-select"
                      style={{ flex: '1.2', fontSize: '0.82rem', padding: '6px 10px' }}
                    >
                      {REMARK_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: '1' }}>
                      <input
                        type="number"
                        min="1"
                        value={rm.hours}
                        onChange={(e) => handleRemarkChange(idx, 'hours', Number(e.target.value))}
                        className="form-input"
                        placeholder="시간"
                        style={{ fontSize: '0.82rem', padding: '6px 8px', textAlign: 'center' }}
                      />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>시간</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveRemark(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-rose)',
                        cursor: 'pointer',
                        padding: 6
                      }}
                      title="삭제"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
            <div>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-rose)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 8px'
                  }}
                  title="이 보고서를 삭제하여 미보고 상태로 되돌립니다."
                >
                  <Trash2 size={14} />
                  <span>보고서 삭제</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              >
                {loading ? '저장 중...' : isEditing ? '수정 내용 저장' : '보고서 등록'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
