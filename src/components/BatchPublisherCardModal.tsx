import React, { useState, useEffect } from 'react';
import { X, Printer, Download, CheckCircle2, AlertCircle, RefreshCw, FileText, Archive, Layers } from 'lucide-react';
import { ServiceYear, YearlyPublisherRecord } from '../types/database';
import { getYearlyPublisherRecordsBatch } from '../services/ministryService';
import { generateMergedPublisherCardsPdf, generateIndividualPublisherCardsZip, printPdfBlob, downloadPdfBlob, downloadBlob } from '../services/pdfService';

interface BatchPublisherCardModalProps {
  serviceYear: ServiceYear;
  publishers: Array<{ id: string; name: string }>;
  onClose: () => void;
}

export const BatchPublisherCardModal: React.FC<BatchPublisherCardModalProps> = ({
  serviceYear,
  publishers,
  onClose,
}) => {
  const [stage, setStage] = useState<'fetching' | 'generating' | 'ready' | 'error'>('fetching');
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: publishers.length });
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [cachedRecords, setCachedRecords] = useState<YearlyPublisherRecord[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const startBatchProcess = async () => {
    try {
      setErrorMsg(null);
      setStage('fetching');
      setProgress({ current: 0, total: publishers.length });

      // 1. 전도인 12개월 연간 기록 일괄 집계
      const publisherIds = publishers.map(p => p.id);
      const records = await getYearlyPublisherRecordsBatch(serviceYear.id, publisherIds);
      setCachedRecords(records);

      // 2. 통합 다중 페이지 PDF 생성
      setStage('generating');
      const bytes = await generateMergedPublisherCardsPdf(
        records,
        serviceYear.year_name,
        (current, total) => setProgress({ current, total })
      );

      setPdfBytes(bytes);
      setStage('ready');
    } catch (err: any) {
      console.error('일괄 전도인 카드 생성 실패:', err);
      setErrorMsg(err.message || '전도인 카드를 일괄 생성하는 중 오류가 발생했습니다.');
      setStage('error');
    }
  };

  useEffect(() => {
    startBatchProcess();
  }, [serviceYear.id]);

  const handlePrintAgain = async () => {
    if (!pdfBytes) return;
    setIsPrinting(true);
    try {
      await printPdfBlob(pdfBytes);
    } catch (err: any) {
      alert('인쇄 호출 실패: ' + (err.message || '오류'));
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadMergedPdf = () => {
    if (!pdfBytes) return;
    const fileName = `전도인기록카드(S-21)_${serviceYear.year_name}연도_${publishers.length}명_통합본.pdf`;
    downloadPdfBlob(pdfBytes, fileName);
  };

  const handleDownloadZip = async () => {
    if (!cachedRecords) return;
    setIsZipping(true);
    try {
      const zipBlob = await generateIndividualPublisherCardsZip(
        cachedRecords,
        serviceYear.year_name,
        (current, total) => setProgress({ current, total })
      );
      const zipFileName = `전도인기록카드(S-21)_${serviceYear.year_name}연도_개별파일모음_${publishers.length}명.zip`;
      downloadBlob(zipBlob, zipFileName);
    } catch (err: any) {
      alert('개별 PDF 압축 파일 생성 실패: ' + (err.message || '오류'));
    } finally {
      setIsZipping(false);
    }
  };

  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 10px rgba(79, 70, 229, 0.35)'
            }}>
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>
                전도인 기록 카드(S-21) PDF 일괄 생성
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {serviceYear.year_name} 봉사연도 • 총 {publishers.length}명 대상
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px 0' }}>
          {stage === 'fetching' && (
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: '3px solid var(--border-color)',
                borderTopColor: 'var(--primary)',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px auto'
              }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>
                전도인 12개월 봉사기록 데이터를 수집하는 중...
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                총 {publishers.length}명의 보고서 데이터를 취합하고 있습니다.
              </div>
            </div>
          )}

          {stage === 'generating' && (
            <div style={{ padding: '20px 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: '0.86rem', fontWeight: 600 }}>
                <span>S-21 양식 PDF 파일 생성 중...</span>
                <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{progress.current} / {progress.total}명 ({percent}%)</span>
              </div>
              
              {/* Progress Bar */}
              <div style={{
                height: 10,
                background: 'rgba(0,0,0,0.06)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
                marginBottom: 16
              }}>
                <div style={{
                  height: '100%',
                  width: `${percent}%`,
                  background: 'linear-gradient(90deg, #6366f1, #3b82f6)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.2s ease'
                }} />
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                각 전도인의 공식 S-21 기록 양식을 작성하여 고화질 PDF 문서로 구성하고 있습니다.
              </div>
            </div>
          )}

          {stage === 'ready' && (
            <div style={{ textAlign: 'center', padding: '16px 10px' }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--accent-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto'
              }}>
                <CheckCircle2 size={30} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: 6 }}>
                {publishers.length}명의 전도인 카드 PDF 준비 완료!
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                원하시는 저장 방식을 선택하여 PDF 파일을 다운로드하세요.
              </p>

              {/* Action Buttons: 2가지 다운로드 방식 (통합본 / 개별파일 압축) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <button
                  type="button"
                  onClick={handleDownloadMergedPdf}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '16px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                  title="모든 전도인의 카드가 하나로 이어진 단일 PDF 파일로 다운로드합니다"
                >
                  <Layers size={24} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>통합 PDF 다운로드</div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: 2 }}>1개 파일에 연속 페이지로 저장</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={isZipping}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '16px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                  title="각 전도인별로 개별 PDF 파일을 생성하여 ZIP 압축 파일로 다운로드합니다"
                >
                  <Archive size={24} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      {isZipping ? 'ZIP 압축 중...' : '이름별 개별 PDF (ZIP)'}
                    </div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: 2 }}>각 이름별 파일 분리 압축 저장</div>
                  </div>
                </button>
              </div>

            </div>
          )}

          {stage === 'error' && (
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(244, 63, 94, 0.12)',
                color: 'var(--accent-rose)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <AlertCircle size={30} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--accent-rose)', marginBottom: 8 }}>
                인쇄 문서 생성 실패
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                {errorMsg}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={startBatchProcess}
                  className="btn-primary"
                  style={{ gap: 6 }}
                >
                  <RefreshCw size={15} />
                  <span>다시 시도</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {stage === 'ready' && (
              <button
                type="button"
                onClick={handlePrintAgain}
                disabled={isPrinting}
                className="btn-secondary"
                style={{ padding: '7px 10px', color: 'var(--text-muted)' }}
                title="종이 인쇄"
              >
                <Printer size={16} />
              </button>
            )}
          </div>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
