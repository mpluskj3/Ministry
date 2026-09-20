import React from 'react';
import { 
  FileText, 
  LayoutDashboard, 
  Users, 
  Settings, 
  Moon, 
  Sun, 
  LogIn, 
  LogOut, 
  Database,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Manager, ServiceYear } from '../types/database';
import { getSupabaseClient } from '../services/supabase';

interface NavbarProps {
  activeTab: 'report' | 'dashboard' | 'publishers';
  setActiveTab: (tab: 'report' | 'dashboard' | 'publishers') => void;
  currentYear: ServiceYear | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  manager: Manager | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentYear,
  theme,
  toggleTheme,
  manager,
  onOpenLogin,
  onLogout,
  onOpenSettings,
}) => {
  const isSupabaseConnected = !!getSupabaseClient();

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--bg-card)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Brand Logo & Title */}
        <div 
          onClick={() => setActiveTab('report')} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            cursor: 'pointer' 
          }}
        >
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: 'var(--shadow-md)'
          }}>
            <FileText size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                봉사 보고 시스템
              </h1>
              {currentYear && (
                <span className="badge" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)', border: '1px solid var(--primary-200)' }}>
                  {currentYear.year_name} 봉사연도
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Supabase DB 연동 스마트 회중 봉사 보고 플랫폼
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('report')}
            className={`btn-secondary ${activeTab === 'report' ? 'active-tab' : ''}`}
            style={{
              padding: '8px 14px',
              fontSize: '0.88rem',
              borderColor: activeTab === 'report' ? 'var(--primary-500)' : undefined,
              color: activeTab === 'report' ? 'var(--primary-600)' : undefined,
              background: activeTab === 'report' ? 'var(--primary-50)' : undefined,
            }}
          >
            <FileText size={16} />
            <span>보고서 제출</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`btn-secondary ${activeTab === 'dashboard' ? 'active-tab' : ''}`}
            style={{
              padding: '8px 14px',
              fontSize: '0.88rem',
              borderColor: activeTab === 'dashboard' ? 'var(--primary-500)' : undefined,
              color: activeTab === 'dashboard' ? 'var(--primary-600)' : undefined,
              background: activeTab === 'dashboard' ? 'var(--primary-50)' : undefined,
            }}
          >
            <LayoutDashboard size={16} />
            <span>관리자 대시보드</span>
          </button>

          <button
            onClick={() => setActiveTab('publishers')}
            className={`btn-secondary ${activeTab === 'publishers' ? 'active-tab' : ''}`}
            style={{
              padding: '8px 14px',
              fontSize: '0.88rem',
              borderColor: activeTab === 'publishers' ? 'var(--primary-500)' : undefined,
              color: activeTab === 'publishers' ? 'var(--primary-600)' : undefined,
              background: activeTab === 'publishers' ? 'var(--primary-50)' : undefined,
            }}
          >
            <Users size={16} />
            <span>전도인 명단</span>
          </button>
        </nav>

        {/* Action Controls: DB Status, Settings, Theme, Manager Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Supabase Status Pill */}
          <button
            onClick={onOpenSettings}
            title={isSupabaseConnected ? 'Supabase DB 정상 연결됨 (클릭하여 설정)' : '데모/로컬 모드 동작 중 (클릭하여 Supabase 연결)'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--border-subtle)',
              background: isSupabaseConnected ? 'var(--accent-emerald-subtle)' : 'rgba(245, 158, 11, 0.12)',
              color: isSupabaseConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)',
            }}
          >
            <Database size={13} />
            <span>{isSupabaseConnected ? 'Supabase' : '데모 모드'}</span>
            {isSupabaseConnected ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="btn-secondary"
            title="설정 및 DB 연결"
            style={{ padding: 8, borderRadius: 'var(--radius-md)' }}
          >
            <Settings size={18} />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn-secondary"
            title="테마 전환"
            style={{ padding: 8, borderRadius: 'var(--radius-md)' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Manager Login / Info */}
          {manager ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                lineHeight: 1.2
              }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 700 }}>
                  {manager.name}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {manager.role === 'super' ? '최고관리자' : manager.role === 'congregation' ? '회중관리자 (서기)' : (manager.group_name || '집단관리자')}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="btn-secondary"
                title="로그아웃"
                style={{ padding: 8, color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="btn-primary"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <LogIn size={15} />
              <span>관리자 로그인</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
