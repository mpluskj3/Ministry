import React, { useState } from 'react';
import { X, Copy, Check, UserX, MessageSquare, Phone, FileEdit, Building2, Filter } from 'lucide-react';
import { Publisher, ServiceMonth } from '../types/database';

export interface GroupProgressItem {
  groupId: string;
  groupName: string;
  total: number;
  reported: number;
  rate: number;
}

interface UnreportedListModalProps {
  month: ServiceMonth;
  unreportedList: Publisher[];
  groupStatsList?: GroupProgressItem[];
  onClose: () => void;
  onSelectPublisherToReport?: (pub: Publisher) => void;
}

export const UnreportedListModal: React.FC<UnreportedListModalProps> = ({
  month,
  unreportedList,
  groupStatsList,
  onClose,
  onSelectPublisherToReport,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  // 카카오톡/문자 안내 독려 메시지 생성 (작성 링크 포함)
  const generateReminderMessage = () => {
    const listToRemind = selectedGroupFilter === 'all' 
      ? unreportedList 
      : unreportedList.filter(p => p.group_name === selectedGroupFilter);
    const names = listToRemind.map(p => p.name).join(', ');
    const submitUrl = `${window.location.origin}${window.location.pathname}?mode=submit`;

    return `[봉사 보고 안내]
안녕하세요. ${month} 야외 봉사 보고 기간입니다.
현재까지 보고가 확인되지 않은 형제자매들(${names})께서는 번거로우시더라도 아래 링크를 통해 오늘 중으로 봉사 보고서를 제출해주시기 바랍니다.

🔗 보고서 작성 링크:
${submitUrl}

감사합니다!`;
  };

  const handleCopyMessage = () => {
    const text = generateReminderMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const displayList = selectedGroupFilter === 'all'
    ? unreportedList
    : unreportedList.filter(p => p.group_name === selectedGroupFilter);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 740, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(244, 63, 94, 0.12)',
              color: 'var(--accent-rose)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserX size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800 }}>{month} 보고 현황 및 미보고자 명단</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                총 {unreportedList.length}명이 아직 보고를 제출하지 않았습니다. (이름을 클릭하여 바로 보고서 작성 가능)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', paddingRight: 4, flex: 1 }}>
          {/* 1. 집단별 보고 달성률 (Group Progress Cards) */}
          {groupStatsList && groupStatsList.length > 0 && (
            <div style={{
              background: 'var(--bg-card-subtle, #f8fafc)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 800, fontSize: '0.92rem', color: 'var(--title-color, #1e3a8a)' }}>
                  <Building2 size={17} color="var(--primary)" />
                  <span>집단별 보고 달성률</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {groupStatsList.length}개 집단
                  </span>
                  {selectedGroupFilter !== 'all' && (
                    <button
                      onClick={() => setSelectedGroupFilter('all')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      전체 보기
                    </button>
                  )}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 10
              }}>
                {groupStatsList.map(gs => {
                  const isSelected = selectedGroupFilter === gs.groupName;
                  const groupUnreportedCount = unreportedList.filter(p => p.group_name === gs.groupName).length;
                  return (
                    <div 
                      key={gs.groupId}
                      onClick={() => setSelectedGroupFilter(prev => prev === gs.groupName ? 'all' : gs.groupName)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'var(--primary-light, #eff6ff)' : '#ffffff',
                        border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 2px 8px rgba(99, 102, 241, 0.15)' : 'none'
                      }}
                      title={`클릭하여 ${gs.groupName} 집단 미보고자만 필터링 (미보고 ${groupUnreportedCount}명)`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{gs.groupName} 집단</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <strong style={{ color: gs.rate >= 100 ? 'var(--accent-emerald)' : 'var(--text-main)' }}>{gs.reported}</strong> / {gs.total}명
                          {' '}
                          <span style={{ fontWeight: 700, color: gs.rate >= 100 ? 'var(--accent-emerald)' : 'var(--primary)' }}>({gs.rate}%)</span>
                        </span>
                      </div>
                      <div className="progress-track" style={{ height: 6, borderRadius: 3, background: '#e2e8f0' }}>
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${Math.min(gs.rate, 100)}%`,
                            height: '100%',
                            borderRadius: 3,
                            background: gs.rate >= 100 ? 'var(--accent-emerald)' : 'var(--primary)' 
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Action Card: Copy Reminder Message with Submit Link */}
          <div style={{
            background: 'var(--primary-50, #eff6ff)',
            border: '1px solid var(--primary-200, #bfdbfe)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-700, #1d4ed8)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={16} />
                <span>카카오톡/문자 독려 메시지 복사 (작성 링크 포함)</span>
                {selectedGroupFilter !== 'all' && (
                  <span className="badge" style={{ fontSize: '0.72rem', background: 'var(--primary)', color: '#fff' }}>
                    {selectedGroupFilter} 집단
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--primary-600, #2563eb)', marginTop: 2 }}>
                미보고자 명단과 함께 전도인 보고서 작성 링크가 자동으로 포함되어 복사됩니다.
              </div>
            </div>
            <button
              onClick={handleCopyMessage}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.84rem', flexShrink: 0, gap: 6 }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? '문구 + 링크 복사됨!' : '문구 & 링크 복사'}</span>
            </button>
          </div>

          {/* 3. List of Unreported Publishers */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h4 style={{ fontSize: '0.94rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserX size={16} color="var(--accent-rose)" />
              <span>
                {selectedGroupFilter === 'all' ? '전체 미보고자' : `${selectedGroupFilter} 집단 미보고자`} ({displayList.length}명)
              </span>
            </h4>
            {selectedGroupFilter !== 'all' && (
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                필터 해제: 집단 카드 재클릭 또는 '전체 보기'
              </span>
            )}
          </div>

          {displayList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--accent-emerald)', background: 'var(--bg-card-subtle, #f8fafc)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
              <h4 style={{ margin: 0, fontWeight: 800 }}>
                {selectedGroupFilter === 'all' ? '모든 전도인이 보고를 완료했습니다!' : `${selectedGroupFilter} 집단은 전원 보고를 완료했습니다!`}
              </h4>
            </div>
          ) : (
            <div className="data-table-container" style={{ maxHeight: 320, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>소속 집단</th>
                    <th>직책</th>
                    <th>구분</th>
                    <th>연락처</th>
                    <th style={{ textAlign: 'center' }}>보고서 작성</th>
                  </tr>
                </thead>
                <tbody>
                  {displayList.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {onSelectPublisherToReport ? (
                        <button
                          onClick={() => {
                            onClose();
                            onSelectPublisherToReport(p);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            margin: 0,
                            cursor: 'pointer',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            fontSize: '0.92rem',
                            textAlign: 'left'
                          }}
                          className="name-link-btn"
                          title={`${p.name} 님의 ${month} 봉사 보고서 작성하기`}
                        >
                          {p.name}
                        </button>
                      ) : (
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(0,0,0,0.05)' }}>
                        {p.group_name}
                      </span>
                    </td>
                    <td>{(p.position === '봉사의 종' ? '봉종' : p.position) || '일반'}</td>
                    <td>
                      {p.pioneer_status !== '일반' && p.pioneer_status !== 'AP' ? (
                        <span className={`badge badge-${p.pioneer_status?.toLowerCase()}`}>
                          {p.pioneer_status}
                        </span>
                      ) : (
                        '일반'
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {p.phone ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={13} /> {p.phone}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {onSelectPublisherToReport && (
                        <button
                          onClick={() => {
                            onClose();
                            onSelectPublisherToReport(p);
                          }}
                          className="btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', gap: 4 }}
                          title={`${p.name} 님의 봉사 보고서 작성`}
                        >
                          <FileEdit size={12} />
                          <span>보고 작성</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} className="btn-secondary">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
