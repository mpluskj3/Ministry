import React, { useState, useEffect } from 'react';
import { X, Download, FileText, CheckCircle2, UserCheck, Calendar } from 'lucide-react';
import { YearlyPublisherRecord, ServiceYear } from '../types/database';
import { getYearlyPublisherRecord } from '../services/ministryService';
import { generatePublisherCardPdf, downloadPdfBlob } from '../services/pdfService';

interface PublisherCardModalProps {
  serviceYear: ServiceYear;
  publisherId: string;
  publisherName: string;
  onClose: () => void;
}

export const PublisherCardModal: React.FC<PublisherCardModalProps> = ({
  serviceYear,
  publisherId,
  publisherName,
  onClose,
}) => {
  const [record, setRecord] = useState<YearlyPublisherRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecord() {
      try {
        setLoading(true);
        const data = await getYearlyPublisherRecord(serviceYear.id, publisherId);
        setRecord(data);
      } catch (err: any) {
        setErrorMsg(err.message || '전도인 기록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchRecord();
  }, [serviceYear.id, publisherId]);

  const handleDownloadPdf = async () => {
    if (!record) return;
    try {
      setPdfGenerating(true);
      const pdfBytes = await generatePublisherCardPdf(record, serviceYear.year_name);
      downloadPdfBlob(pdfBytes, `${publisherName}_${serviceYear.year_name}_전도인기록카드(S-21).pdf`);
    } catch (err: any) {
      alert('PDF 생성 실패: ' + (err.message || '오류 발생'));
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-gradient)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.3rem', margin: 0 }}>
                {publisherName} 전도인 기록 카드 (S-21)
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
                {serviceYear.year_name} 봉사연도 12개월 봉사 기록 집계
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleDownloadPdf}
              disabled={pdfGenerating || loading}
              className="btn-primary"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <Download size={15} />
              <span>{pdfGenerating ? 'PDF 생성 중...' : 'S-21 PDF 다운로드'}</span>
            </button>
            <button onClick={onClose} className="btn-secondary" style={{ padding: 6 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            기록 데이터를 집계 중입니다...
          </div>
        ) : errorMsg ? (
          <div style={{ color: 'var(--accent-rose)', padding: 20 }}>{errorMsg}</div>
        ) : record ? (
          <div>
            {/* Publisher Personal Info Summary Card */}
            <div style={{
              background: 'rgba(0,0,0,0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              marginBottom: 20,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              fontSize: '0.88rem'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>생년월일:</span>{' '}
                <strong>{record.userInfo.birthDate || '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>침례일자:</span>{' '}
                <strong>{record.userInfo.baptismDate || '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>성별:</span>{' '}
                <strong>{record.userInfo.gender || '-'}</strong>
              </div>
              <div>
                <strong>{record.userInfo.hope || '다른 양'}</strong>
              </div>
              {(record.userInfo.isElder || record.userInfo.isMinisterialServant) && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>직책:</span>{' '}
                  <strong>{record.userInfo.isElder ? '장로' : '봉사의 종'}</strong>
                </div>
              )}
              {(record.userInfo.isRegularPioneer || record.userInfo.isSpecialPioneer || record.userInfo.isChild) && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>구분:</span>{' '}
                  <strong>
                    {record.userInfo.isRegularPioneer ? '정규 파이오니아' : record.userInfo.isSpecialPioneer ? '특별 파이오니아' : '자녀'}
                  </strong>
                </div>
              )}
            </div>

            {/* 12 Months Summary Table */}
            <div className="data-table-container" style={{ marginBottom: 20 }}>
              {(() => {
                const totalRemarkHours = record.monthlyRecords.reduce((acc, m) => {
                  if (!m.remarks) return acc;
                  const matches = m.remarks.match(/(\d+(?:\.\d+)?)\s*시간/g);
                  if (matches) {
                    matches.forEach(match => {
                      const num = parseFloat(match.replace(/[^0-9.]/g, ''));
                      if (!isNaN(num)) acc += num;
                    });
                  }
                  return acc;
                }, 0);

                return (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>월</th>
                        <th>참여</th>
                        <th>성서 연구</th>
                        <th>봉사 시간</th>
                        <th>비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {record.monthlyRecords.map((m) => (
                        <tr key={m.month}>
                          <td style={{ fontWeight: 600 }}>{m.month}</td>
                          <td>
                            {m.participated ? (
                              <span style={{ color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center' }} title="참여">
                                <CheckCircle2 size={17} />
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-faint)' }}>-</span>
                            )}
                          </td>
                          <td>{m.bibleStudies > 0 ? m.bibleStudies : '-'}</td>
                          <td style={{ fontWeight: m.hours > 0 ? 700 : 400 }}>
                            {m.hours > 0 ? m.hours : '-'}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            {m.remarks || '-'}
                          </td>
                        </tr>
                      ))}
                      {/* Totals Row */}
                      <tr style={{ background: 'var(--primary-50)', fontWeight: 700 }}>
                        <td style={{ color: 'var(--primary-700)' }}>총계</td>
                        <td>{record.totals.activeMonths > 0 ? record.totals.activeMonths : '-'}</td>
                        <td>{record.totals.totalStudies > 0 ? record.totals.totalStudies : '-'}</td>
                        <td style={{ color: 'var(--primary-700)' }}>{record.totals.totalHours > 0 ? record.totals.totalHours : '-'}</td>
                        <td style={{ color: totalRemarkHours > 0 ? 'var(--text-main)' : 'var(--text-faint)' }}>
                          {totalRemarkHours > 0 ? `${totalRemarkHours}시간` : '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button onClick={onClose} className="btn-secondary">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
