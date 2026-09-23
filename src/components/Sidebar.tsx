import React from 'react';
import {
  LayoutDashboard,
  FileEdit,
  Users,
  Settings,
  LogOut,
  LogIn,
  Database,
  CalendarClock,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  ShieldCheck,
  Building2,
  Phone,
  ExternalLink,
  Pin,
  RotateCcw,
  X
} from 'lucide-react';
import { Manager, ServiceYear } from '../types/database';

interface SidebarProps {
  activeTab: 'dashboard' | 'report' | 'publishers' | 'groups';
  setActiveTab: (tab: 'dashboard' | 'report' | 'publishers' | 'groups') => void;
  currentYear: ServiceYear;
  manager: Manager | null;
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
  onOpenSettings: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  selectedGroupId: string;
  onSelectGroup: (groupId: string) => void;
  groups: Array<{ id: string; name: string }>;
  congregationName?: string;
  onGoToReportPage?: () => void;
  serviceYears?: ServiceYear[];
  systemDefaultYear?: ServiceYear | null;
  onSelectViewYear?: (year: ServiceYear) => void;
  onFixDefaultYear?: (yearId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentYear,
  manager,
  theme,
  toggleTheme,
  onOpenSettings,
  onOpenLogin,
  onLogout,
  isOpenMobile,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  selectedGroupId,
  onSelectGroup,
  groups,
  congregationName,
  onGoToReportPage,
  serviceYears = [],
  systemDefaultYear,
  onSelectViewYear,
  onFixDefaultYear,
}) => {
  const isSuperAdmin = manager?.role === 'super';
  const canAccessGroups = manager?.role === 'super' || manager?.role === 'congregation';

  type TabType = 'dashboard' | 'report' | 'publishers' | 'groups';
  const navItems: Array<{ id: TabType; label: string; icon: any }> = [
    { id: 'dashboard', label: '봉사보고 분석', icon: LayoutDashboard },
    { id: 'report', label: '야외 봉사 보고 제출', icon: FileEdit },
    { id: 'publishers', label: '전도인 명단 관리', icon: Users },
    ...(canAccessGroups ? [{ id: 'groups' as TabType, label: '집단 및 관리자 설정', icon: Building2 }] : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 85,
          }}
        />
      )}

      <aside className={`dashboard-sidebar ${isOpenMobile ? 'open' : ''} ${isCollapsed ? 'desktop-collapsed' : ''}`}>
        {/* Brand Header */}
        <div style={{
          padding: '20px 18px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 3px 10px rgba(79, 70, 229, 0.35)'
            }}>
              <CalendarClock size={15} style={{ opacity: 0.85 }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                title={congregationName || '춘천남부 회중'}
              >
                {congregationName || '춘천남부 회중'}
              </div>

              {/* 봉사연도 전환기: 집단감독자/보조자/최고관리자 누구나 연도를 변경하여 조회 가능 */}
              <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                <select
                  value={currentYear.id}
                  onChange={(e) => {
                    const found = serviceYears.find(y => y.id === e.target.value);
                    if (found && onSelectViewYear) {
                      onSelectViewYear(found);
                    }
                  }}
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '2px 5px',
                    borderRadius: 'var(--radius-sm)',
                    border: (systemDefaultYear && currentYear.id !== systemDefaultYear.id) ? '1px solid #f97316' : '1px solid var(--border-color)',
                    background: (systemDefaultYear && currentYear.id !== systemDefaultYear.id) 
                      ? 'rgba(249, 115, 22, 0.15)' 
                      : (theme === 'dark' ? '#1f273d' : '#f1f5f9'),
                    color: (systemDefaultYear && currentYear.id !== systemDefaultYear.id) 
                      ? '#ea580c' 
                      : (theme === 'dark' ? '#f9fafb' : '#0f172a'),
                    colorScheme: theme === 'dark' ? 'dark' : 'light',
                    cursor: 'pointer',
                    outline: 'none',
                    maxWidth: 120
                  }}
                  title="조회할 봉사연도를 선택하세요 (과거 및 다른 연도 보고서/전도인 카드 열람)"
                >
                  {(serviceYears.length > 0 ? serviceYears : [currentYear]).map(y => (
                    <option 
                      key={y.id} 
                      value={y.id}
                      style={{
                        backgroundColor: theme === 'dark' ? '#192033' : '#ffffff',
                        color: theme === 'dark' ? '#f9fafb' : '#111827'
                      }}
                    >
                      {y.year_name}연도 {systemDefaultYear?.id === y.id ? '(활성)' : ''}
                    </option>
                  ))}
                </select>

                {/* 현재 연도가 시스템 기본 연도와 다를 때 액션 버튼 */}
                {systemDefaultYear && currentYear.id !== systemDefaultYear.id && (
                  isSuperAdmin ? (
                    <button
                      type="button"
                      onClick={() => onFixDefaultYear?.(currentYear.id)}
                      style={{
                        padding: '2px 6px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        background: '#6366f1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2,
                        lineHeight: 1.2
                      }}
                      title="이 봉사연도를 전체 시스템의 공식 기본 활성 연도로 고정 저장합니다 (최고관리자 전용)"
                    >
                      <Pin size={10} /> 기본고정
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => systemDefaultYear && onSelectViewYear?.(systemDefaultYear)}
                      style={{
                        padding: '2px 5px',
                        fontSize: '0.66rem',
                        fontWeight: 600,
                        background: 'rgba(0,0,0,0.05)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 4,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2,
                        lineHeight: 1.2
                      }}
                      title="시스템 기본 봉사연도로 돌아가기"
                    >
                      <RotateCcw size={9} /> 복귀
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Hide/Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* PC Collapse Button */}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="btn-secondary desktop-collapse-btn"
                style={{
                  width: 32,
                  height: 32,
                  padding: 0,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
                title="좌측 메뉴 숨기기 (넓게 보기)"
                aria-label="좌측 메뉴 숨기기"
              >
                <PanelLeftClose size={15} style={{ opacity: 0.6 }} />
              </button>
            )}

            {/* Mobile Close Button */}
            {isOpenMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="btn-secondary"
                style={{
                  width: 30,
                  height: 30,
                  padding: 0,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
                title="메뉴 닫기"
                aria-label="메뉴 닫기"
              >
                <X size={15} style={{ opacity: 0.6 }} />
              </button>
            )}
          </div>
        </div>

        {/* Main Navigation List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-faint)',
            padding: '0 8px 8px 8px'
          }}>
            봉사 보고 관리
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onCloseMobile();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: isActive ? 'var(--primary-light)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon size={15} style={{ opacity: isActive ? 0.9 : 0.6, flexShrink: 0, transition: 'opacity 0.15s ease' }} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={12} style={{ opacity: 0.6 }} />}
                </button>
              );
            })}
          </nav>

          {/* Quick Group Filters Section */}
          <div style={{ marginTop: 28 }}>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-faint)',
              padding: '0 8px 8px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>봉사 집단</span>
              <Building2 size={13} style={{ opacity: 0.6 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(!manager || manager.role === 'super' || manager.role === 'congregation') ? (
                <>
                  <button
                    onClick={() => {
                      onSelectGroup('all');
                      setActiveTab('dashboard');
                      onCloseMobile();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: selectedGroupId === 'all' ? 'rgba(0,0,0,0.04)' : 'transparent',
                      color: selectedGroupId === 'all' ? 'var(--text-main)' : 'var(--text-muted)',
                      fontSize: '0.84rem',
                      fontWeight: selectedGroupId === 'all' ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span>전체 회중 집계</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>전체</span>
                  </button>

                  {groups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        onSelectGroup(g.id);
                        setActiveTab('dashboard');
                        onCloseMobile();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: selectedGroupId === g.id ? 'rgba(0,0,0,0.04)' : 'transparent',
                        color: selectedGroupId === g.id ? 'var(--primary)' : 'var(--text-muted)',
                        fontSize: '0.84rem',
                        fontWeight: selectedGroupId === g.id ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span>{g.name}</span>
                      <span className="badge" style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'rgba(0,0,0,0.04)' }}>
                        집단
                      </span>
                    </button>
                  ))}
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontSize: '0.86rem',
                  fontWeight: 700
                }}>
                  <span>📌 {manager.group_name || groups.find(g => g.id === selectedGroupId)?.name} 집단</span>
                  <span className="badge badge-group" style={{ fontSize: '0.7rem' }}>소속</span>
                </div>
              )}
            </div>
          </div>

          {/* Settings Section (최고관리자 전용) */}
          {isSuperAdmin && (
            <div style={{ marginTop: 28 }}>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-faint)',
                padding: '0 8px 8px 8px'
              }}>
                설정 & 데이터
              </div>

              <button
                onClick={onOpenSettings}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Settings size={15} style={{ opacity: 0.6, flexShrink: 0 }} />
                <span>설정 & Supabase 연동</span>
              </button>
            </div>
          )}
        </div>

        {/* User Profile & Footer */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {manager ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0,0,0,0.02)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="user-avatar" style={{ background: 'var(--primary)', color: '#fff' }}>
                  {manager.name.slice(0, 1)}
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    {manager.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {manager.role === 'super' ? '최고관리자' : manager.role === 'congregation' ? '회중관리자 (서기)' : `${manager.group_name || '집단'} 감독자`}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="로그아웃"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-rose)',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                <LogOut size={15} style={{ opacity: 0.65 }} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="btn-primary"
              style={{ width: '100%', padding: '9px 12px', fontSize: '0.85rem' }}
            >
              <LogIn size={15} style={{ opacity: 0.75 }} />
              <span>관리자 로그인</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
