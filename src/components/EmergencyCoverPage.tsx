import React from 'react';
import { EmergencyCoverData } from '../types/emergency';

interface EmergencyCoverPageProps {
  data: EmergencyCoverData;
  className?: string;
  isPrintView?: boolean;
}

export const EmergencyCoverPage: React.FC<EmergencyCoverPageProps> = ({
  data,
  className = '',
  isPrintView = false
}) => {
  // 3개 표의 세로 분할선이 수직으로 완벽하게 일치하도록 동일한 colgroup 적용
  const renderColGroup = () => (
    <colgroup>
      <col style={{ width: '34%' }} />
      <col style={{ width: '26%' }} />
      <col style={{ width: '40%' }} />
    </colgroup>
  );

  return (
    <div
      className={`emergency-cover-container ${className}`}
      style={{
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: 700,
        margin: '0 auto',
        padding: isPrintView ? '12mm 20px 8mm 20px' : '24px 20px',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* 1. 상단 제목 (회중명 및 비상연락망) */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1
          style={{
            fontSize: isPrintView ? '1.55rem' : '1.45rem',
            fontWeight: 800,
            margin: '0 0 8px 0',
            color: '#0f172a',
            letterSpacing: '0.04em'
          }}
        >
          {data.congregationName || '강원 춘천 남부 회중'}
        </h1>
        <h2
          style={{
            fontSize: isPrintView ? '1.35rem' : '1.25rem',
            fontWeight: 700,
            margin: 0,
            color: '#1e293b',
            letterSpacing: '0.12em'
          }}
        >
          비상연락망
        </h2>
      </div>

      {/* 2. 순회구 정보 테이블 (하늘색 헤더) */}
      <table
        className="emergency-cover-table"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: 16,
          tableLayout: 'fixed'
        }}
      >
        {renderColGroup()}
        <thead>
          <tr>
            <th
              colSpan={3}
              style={{
                backgroundColor: '#dbeafe',
                border: '1.2px solid #334155',
                padding: '9px 12px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '0.98rem',
                color: '#0f172a',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact'
              }}
            >
              {data.circuitName || '강원1순회구'}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              style={{
                border: '1.2px solid #334155',
                padding: '8px 12px',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '0.92rem',
                color: '#0f172a'
              }}
            >
              {data.circuitOverseerRole || '순회감독자'}
            </td>
            <td
              style={{
                border: '1.2px solid #334155',
                padding: '8px 12px',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '0.92rem',
                color: '#0f172a'
              }}
            >
              {data.circuitOverseerName}
            </td>
            <td
              style={{
                border: '1.2px solid #334155',
                padding: '8px 12px',
                textAlign: 'center',
                fontWeight: 500,
                fontSize: '0.92rem',
                color: '#0f172a',
                letterSpacing: '0.02em'
              }}
            >
              {data.circuitOverseerPhone}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 3. 회중 봉사위원회 (조정자, 서기, 봉사감독자) 테이블 */}
      {data.serviceCommittee && data.serviceCommittee.length > 0 && (
        <table
          className="emergency-cover-table"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: 16,
            tableLayout: 'fixed'
          }}
        >
          {renderColGroup()}
          <tbody>
            {data.serviceCommittee.map((item) => (
              <tr key={item.id}>
                <td
                  style={{
                    border: '1.2px solid #334155',
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    color: '#0f172a'
                  }}
                >
                  {item.role}
                </td>
                <td
                  style={{
                    border: '1.2px solid #334155',
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    color: '#0f172a'
                  }}
                >
                  {item.name}
                </td>
                <td
                  style={{
                    border: '1.2px solid #334155',
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: 500,
                    fontSize: '0.92rem',
                    color: '#0f172a',
                    letterSpacing: '0.02em'
                  }}
                >
                  {item.phone}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 4. 집단감독자 목록 테이블 (운교, 효자, 석사, 현대, 수어 등) */}
      {data.groupOverseers && data.groupOverseers.length > 0 && (
        <table
          className="emergency-cover-table"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed'
          }}
        >
          {renderColGroup()}
          <tbody>
            {data.groupOverseers.map((item) => (
              <tr key={item.id}>
                <td
                  style={{
                    border: '1.2px solid #334155',
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    color: '#0f172a'
                  }}
                >
                  {item.role}
                </td>
                <td
                  style={{
                    border: '1.2px solid #334155',
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    color: '#0f172a'
                  }}
                >
                  {item.name}
                </td>
                <td
                  style={{
                    border: '1.2px solid #334155',
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: 500,
                    fontSize: '0.92rem',
                    color: '#0f172a',
                    letterSpacing: '0.02em'
                  }}
                >
                  {item.phone}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
