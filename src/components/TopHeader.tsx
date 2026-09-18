import React from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  Plus, 
  Database, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { ServiceYear } from '../types/database';
import { getSupabaseClient } from '../services/supabase';

interface TopHeaderProps {
  onToggleMobileSidebar: () => void;
  title: string;
  subtitle?: string;
  currentYear: ServiceYear;
  onOpenNewReport: () => void;
  onOpenSettings: () => void;
  onOpenUnreported?: () => void;
  unreportedCount?: number;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onGoToReportPage?: () => void;
  isSuperAdmin?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleMobileSidebar,
  title,
  subtitle,
  currentYear,
  onOpenNewReport,
  onOpenSettings,
  onOpenUnreported,
  unreportedCount = 0,
  searchQuery,
  onSearchChange,
  onGoToReportPage,
  isSuperAdmin,
}) => {
  const isSupabaseConnected = !!getSupabaseClient();

  return (
    <header style={{
      height: 'var(--header-height)',
      background: 'var(--bg-sidebar)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 80,
      gap: 16
    }}>
      {/* Left: Mobile Toggle & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={onToggleMobileSidebar}
          className="btn-secondary"
          style={{ padding: 8, display: 'inline-flex' }}
          aria-label="메뉴 열기"
        >
          <Menu size={18} />
        </button>

        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Middle: Search Box (if supported) */}
      {onSearchChange !== undefined && (
        <div style={{ position: 'relative', width: 280, display: 'none', minWidth: 200 }} className="header-search">
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
          <input
            type="text"
            placeholder="전도인 검색... (⌘K)"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="form-input"
            style={{
              paddingLeft: 36,
              paddingRight: 12,
              paddingTop: 8,
              paddingBottom: 8,
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)'
            }}
          />
        </div>
      )}

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* 전도인 보고 사이트(메인) 바로가기 버튼 */}
        {onGoToReportPage && (
          <button
            onClick={onGoToReportPage}
            className="btn-secondary"
            title="전도인들이 봉사 보고를 제출하는 메인 사이트로 이동"
            style={{ 
              padding: '7px 12px', 
              fontSize: '0.8rem', 
              fontWeight: 600,
              gap: 6,
              color: 'var(--primary)',
              borderColor: 'rgba(99, 102, 241, 0.3)'
            }}
          >
            <ExternalLink size={14} />
            <span>전도인 보고 사이트</span>
          </button>
        )}

        {/* Service Year Badge */}
        <div 
          className="badge" 
          style={{ 
            background: 'var(--primary-light)', 
            color: 'var(--primary)',
            padding: '6px 12px',
            fontSize: '0.8rem',
            fontWeight: 700
          }}
        >
          <Calendar size={13} />
          <span>{currentYear.year_name} 봉사연도</span>
        </div>

        {/* Supabase Status Pill (최고관리자 전용) */}
        {isSuperAdmin && (
          <button
            onClick={onOpenSettings}
            title="Supabase DB 연동 상태 (클릭 시 설정)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--border-color)',
              background: isSupabaseConnected ? 'var(--accent-emerald-light)' : 'var(--accent-amber-light)',
              color: isSupabaseConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)',
            }}
          >
            <Database size={13} />
            <span>{isSupabaseConnected ? 'Supabase 클라우드' : '로컬 실제 데이터'}</span>
            {isSupabaseConnected ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
          </button>
        )}

        {/* Unreported Bell Alert */}
        {onOpenUnreported && (
          <button
            onClick={onOpenUnreported}
            className="btn-secondary"
            title={`미보고자 확인 (${unreportedCount}명)`}
            style={{ position: 'relative', padding: 8, borderRadius: 'var(--radius-md)' }}
          >
            <Bell size={18} />
            {unreportedCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'var(--accent-rose)',
                color: '#fff',
                fontSize: '0.68rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 4px rgba(244, 63, 94, 0.5)'
              }}>
                {unreportedCount}
              </span>
            )}
          </button>
        )}

        {/* Primary "+ 새 보고서 작성" Button */}
        <button
          onClick={onOpenNewReport}
          className="btn-primary"
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
        >
          <Plus size={16} />
          <span>보고서 작성</span>
        </button>
      </div>

      <style>{`
        @media (min-width: 820px) {
          .header-search {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
};
