import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ReportForm } from './components/ReportForm';
import { PublisherManagement } from './components/PublisherManagement';
import { GroupManagerSettings } from './components/GroupManagerSettings';
import { EmergencyContacts } from './components/EmergencyContacts';
import { LoginModal } from './components/LoginModal';
import { SettingsModal } from './components/SettingsModal';
import { AdminAuthGate } from './components/AdminAuthGate';
import { AccessDenied } from './components/AccessDenied';
import { Manager, ServiceYear, Group, getCurrentDateServiceMonth } from './types/database';
import { getCurrentServiceYear, getServiceYears, setCurrentServiceYear, getGroups, getUnreportedMembers, authenticateManager } from './services/ministryService';
import { getSupabaseClient } from './services/supabase';
import { CalendarClock, Sun, Moon, LogIn, ShieldCheck, Menu, PanelLeftOpen } from 'lucide-react';


function checkIsManagerMode(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  // 1. /manager 경로 확인 (/manager, /manager/)
  if (path === '/manager' || path === '/manager/' || path.endsWith('/manager') || path.endsWith('/manager/')) {
    return true;
  }
  // 2. 쿼리스트링 (?page=manager 또는 ?manager)
  if (search.includes('page=manager') || search.includes('?manager') || search.includes('&manager')) {
    return true;
  }
  // 3. 해시 (#manager, #/manager)
  if (hash === '#manager' || hash === '#/manager' || hash.includes('/manager')) {
    return true;
  }
  // 4. Google OAuth 로그인 리디렉션 처리 중인지 확인
  // (로그인 시작 시 sessionStorage에 기록된 플래그가 있고, OAuth 콜백 파라미터가 포함된 경우)
  try {
    const isOAuthLogin = sessionStorage.getItem('ministry_oauth_manager_login') === '1';
    if (isOAuthLogin && (hash.includes('access_token') || hash.includes('refresh_token') || search.includes('code=') || search.includes('error='))) {
      return true;
    }
  } catch {}

  // ⚠️ 더 이상 localStorage의 관리자 세션 유무로 관리자 모드를 자동 판정하지 않습니다.
  // URL이 명시적으로 /manager 또는 ?page=manager일 때만 관리자 모드로 진입합니다.
  return false;
}

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report' | 'publishers' | 'groups'>('dashboard');
  const [reportFormKey, setReportFormKey] = useState<number>(0);

  const handleSelectTab = (tab: 'dashboard' | 'report' | 'publishers' | 'groups') => {
    if (tab === 'report') {
      setReportFormKey(k => k + 1);
    }
    setActiveTab(tab);
  };

  const [currentYear, setCurrentYear] = useState<ServiceYear | null>(null);
  const [systemDefaultYear, setSystemDefaultYear] = useState<ServiceYear | null>(null);
  const [serviceYears, setServiceYears] = useState<ServiceYear[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
    const saved = localStorage.getItem('ministry_manager_session');
    if (saved) {
      try {
        const mgr = JSON.parse(saved);
        if (mgr.role === 'group' && (mgr.group_id || mgr.group_name)) {
          return mgr.group_id || 'all';
        }
      } catch {}
    }
    return 'all';
  });
  const [loading, setLoading] = useState(true);
  const [unreportedCount, setUnreportedCount] = useState<number>(0);

  // 기본 페이지는 전도인 야외 봉사 보고 접수처이며, manager URL이 감지될 때만 관리자 모드로 전환
  const [isManagerMode, setIsManagerMode] = useState<boolean>(() => checkIsManagerMode());

  // URL 변경 감지 (뒤로가기/앞으로가기)
  useEffect(() => {
    const handleLocationChange = () => {
      setIsManagerMode(checkIsManagerMode());
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // 회중명 상태 관리
  const [congregationName, setCongregationName] = useState(() => {
    return localStorage.getItem('ministry_congregation_name') || '춘천남부 회중';
  });

  // Mobile Sidebar Drawer Toggle
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Desktop Sidebar Collapse (Hide) State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('ministry_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('ministry_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('ministry_theme') as 'light' | 'dark') || 'light';
  });

  // Manager Auth State
  const [manager, setManager] = useState<Manager | null>(() => {
    const saved = localStorage.getItem('ministry_manager_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.name?.startsWith('최고관리자(') || parsed?.email?.toLowerCase().includes('mpluskj3')) {
          localStorage.removeItem('ministry_manager_session');
          return null;
        }
        if (parsed?.name === '최고관리자(서기)') {
          parsed.name = '최고관리자';
          localStorage.setItem('ministry_manager_session', JSON.stringify(parsed));
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  // 집단 관리자 로그인 시 본인 집단으로 강제 고정
  useEffect(() => {
    if (manager?.role === 'group') {
      const targetGroupId = manager.group_id || groups.find(g => g.name === manager.group_name)?.id;
      if (targetGroupId && selectedGroupId !== targetGroupId) {
        setSelectedGroupId(targetGroupId);
      }
    }
  }, [manager, groups, selectedGroupId]);

  // Modals
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [blockedUserEmail, setBlockedUserEmail] = useState<string | null>(() => {
    return sessionStorage.getItem('ministry_blocked_email') || null;
  });

  const handleLoginSuccess = (mgr: Manager) => {
    setBlockedUserEmail(null);
    sessionStorage.removeItem('ministry_blocked_email');
    setManager(mgr);
    localStorage.setItem('ministry_manager_session', JSON.stringify(mgr));
    if (mgr.role === 'group') {
      const gId = mgr.group_id || groups.find(g => g.name === mgr.group_name)?.id;
      if (gId) {
        setSelectedGroupId(gId);
      }
    }
    setActiveTab('dashboard');
    setIsManagerMode(true);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('page', 'manager');
      // Supabase access_token 해시 제거 및 깔끔한 URL 유지
      window.history.replaceState({}, '', url.pathname + url.search);
    } catch {}
    // OAuth 로그인 플래그 정리
    try { sessionStorage.removeItem('ministry_oauth_manager_login'); } catch {}
  };

  const handleGoToReportPageFromBlocked = () => {
    setBlockedUserEmail(null);
    sessionStorage.removeItem('ministry_blocked_email');
    setIsManagerMode(false);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('page');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    } catch {}
  };

  // Supabase Google OAuth 세션 감지 및 관리자 계정 대조 승인
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // 세션 사용자 인증 공통 처리 함수
    const processSessionUser = async (userEmail: string) => {
      try {
        const mgr = await authenticateManager(userEmail);
        if (mgr) {
          setBlockedUserEmail(null);
          sessionStorage.removeItem('ministry_blocked_email');
          setIsManagerMode(true);
          handleLoginSuccess(mgr);
          setAuthErrorMessage(null);
        } else {
          // 미등록 구글 계정: 즉시 강제 로그아웃 및 세션 전면 파기 + 차단 안내 화면 활성화
          localStorage.removeItem('ministry_manager_session');
          try { sessionStorage.removeItem('ministry_oauth_manager_login'); } catch {}
          setManager(null);
          setIsManagerMode(true);
          await supabase.auth.signOut();
          setBlockedUserEmail(userEmail);
          sessionStorage.setItem('ministry_blocked_email', userEmail);
          setAuthErrorMessage('계정 권한이 없습니다. 관리자에게 문의하세요');
        }
      } catch (err: any) {
        console.error('[Auth Error]', err);
      }
    };

    // 1. 초기 세션(OAuth 리디렉션 직후) 감지
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        processSessionUser(session.user.email);
      }
    });

    // 2. Auth 상태 변경 이벤트 리스너 (INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED 등)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.email && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
        processSessionUser(session.user.email);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Apply Theme Attribute & Color Scheme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme === 'dark' ? 'only dark' : 'only light';
    localStorage.setItem('ministry_theme', theme);
  }, [theme]);

  // Listen for Congregation Name Changes
  useEffect(() => {
    const handleCongregationChange = (e: any) => {
      if (e?.detail) {
        setCongregationName(e.detail);
      } else {
        setCongregationName(localStorage.getItem('ministry_congregation_name') || '춘천남부 회중');
      }
    };
    window.addEventListener('congregation_name_changed', handleCongregationChange);
    window.addEventListener('storage', handleCongregationChange);
    return () => {
      window.removeEventListener('congregation_name_changed', handleCongregationChange);
      window.removeEventListener('storage', handleCongregationChange);
    };
  }, []);

  // Update Page Title
  useEffect(() => {
    if (!isManagerMode) {
      document.title = congregationName ? `${congregationName} - 봉사보고` : '봉사보고';
    } else {
      document.title = congregationName ? `${congregationName} - 봉사보고 관리` : '봉사보고 관리';
    }
  }, [congregationName, isManagerMode]);

  // Initial Data Load
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [sy, allYears, grps] = await Promise.all([
          getCurrentServiceYear(),
          getServiceYears(),
          getGroups()
        ]);
        setCurrentYear(sy);
        setSystemDefaultYear(sy);
        setServiceYears(allYears);
        setGroups(grps);

        // 이달의 미보고자 수 조회 (보고 대상 월 기준, 예: 9월 16일 -> 8월)
        const currentServiceMonth = getCurrentDateServiceMonth(sy.year_name);
        const unrep = await getUnreportedMembers(sy.id, currentServiceMonth);
        setUnreportedCount(unrep.length);
      } catch (err) {
        console.error('Failed to load initial app data:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };


  // 최고관리자 및 회중관리자 전용 탭 보호 (권한이 없으면 대시보드로 자동 전환)
  useEffect(() => {
    if (activeTab === 'groups' && manager?.role !== 'super' && manager?.role !== 'congregation') {
      setActiveTab('dashboard');
    }
  }, [activeTab, manager]);

  const handleLogout = async () => {
    setManager(null);
    localStorage.removeItem('ministry_manager_session');
    setSelectedGroupId('all');
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
  };

  const goToManager = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', 'manager');
    window.history.pushState({}, '', url.toString());
    setIsManagerMode(true);
  };

  const goToReport = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('page');
    url.searchParams.delete('manager');
    url.searchParams.delete('mode');
    url.searchParams.delete('view');
    url.hash = '';
    if (url.pathname.includes('/manager')) {
      url.pathname = url.pathname.replace(/\/manager\/?$/, '') || '/';
    }
    window.history.pushState({}, '', url.toString());
    setIsManagerMode(false);
  };

  // 모든 관리자(집단감독자, 보조자 등)가 봉사연도를 변경하여 내용을 조회할 수 있는 핸들러
  const handleSelectViewYear = async (newYear: ServiceYear) => {
    setCurrentYear(newYear);
    try {
      const currentServiceMonth = getCurrentDateServiceMonth(newYear.year_name);
      const unrep = await getUnreportedMembers(newYear.id, currentServiceMonth);
      setUnreportedCount(unrep.length);
    } catch (e) {
      console.error('Failed to update service year stats for view:', e);
    }
  };

  // 최고관리자만 수행 가능한 시스템 기본 봉사연도 영구 고정 핸들러
  const handleFixCurrentYearAsDefault = async (yearId: string) => {
    if (manager?.role !== 'super') {
      alert('봉사연도 설정 고정은 최고관리자만 변경할 수 있습니다.');
      return;
    }
    try {
      await setCurrentServiceYear(yearId);
      const updatedYears = await getServiceYears();
      setServiceYears(updatedYears);
      const matched = updatedYears.find(y => y.id === yearId);
      if (matched) {
        setSystemDefaultYear(matched);
        setCurrentYear(matched);
        alert(`공식 기본 봉사연도가 '${matched.year_name} 봉사연도'로 고정 설정되었습니다.`);
      }
    } catch (err: any) {
      alert('기본 봉사연도 고정 실패: ' + (err.message || '오류'));
    }
  };

  const handleServiceYearChanged = async (newYear: ServiceYear) => {
    setCurrentYear(newYear);
    setSystemDefaultYear(newYear);
    try {
      const updatedYears = await getServiceYears();
      setServiceYears(updatedYears);
      const currentServiceMonth = getCurrentDateServiceMonth(newYear.year_name);
      const unrep = await getUnreportedMembers(newYear.id, currentServiceMonth);
      setUnreportedCount(unrep.length);
    } catch (e) {
      console.error('Failed to update service year stats:', e);
    }
  };

  if (loading || !currentYear) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        background: 'var(--bg-app)'
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', fontWeight: 600 }}>
          봉사 보고 시스템을 불러오는 중입니다...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (blockedUserEmail) {
    return (
      <AccessDenied
        email={blockedUserEmail}
        congregationName={congregationName}
        theme={theme}
        toggleTheme={toggleTheme}
        onGoToReportPage={handleGoToReportPageFromBlocked}
      />
    );
  }

  // -------------------------------------------------------------
  // [기본 index: 전도인 야외 봉사 보고 제출 사이트]
  // -------------------------------------------------------------
  if (!isManagerMode) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
        {/* Simple Standalone Header */}
        <header style={{
          width: '100%',
          padding: '24px 16px 0 16px',
        }}>
          <div style={{
            maxWidth: 640,
            margin: '0 auto',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'default', userSelect: 'none' }}
            >
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
              }}>
                <CalendarClock size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                  {congregationName ? `${congregationName} - 봉사보고` : '봉사보고'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={toggleTheme}
                className="btn-secondary"
                title="테마 전환"
                style={{ padding: 8, borderRadius: 'var(--radius-full)' }}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>
          </div>
        </header>

        {/* S-4 Report Form View */}
        <main style={{ flex: 1, padding: '16px 16px 32px 16px' }}>
          <ReportForm
            currentYear={currentYear}
            isStandalone={true}
          />
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // [관리자 모드: 로그인 인증 보호 게이트]
  // 로그인이 안 된 경우 대시보드를 절대 보여주지 않고 Google 로그인 승인 화면만 표시
  // -------------------------------------------------------------
  if (isManagerMode && !manager) {
    return (
      <AdminAuthGate
        congregationName={congregationName}
        currentYear={currentYear}
        theme={theme}
        toggleTheme={toggleTheme}
        onLoginSuccess={handleLoginSuccess}
        onGoToReportPage={goToReport}
        authErrorMessage={authErrorMessage}
      />
    );
  }

  // -------------------------------------------------------------
  // [관리자 대시보드 레이아웃: 승인된 관리자만 접근 가능]
  // -------------------------------------------------------------
  return (
    <div className="dashboard-layout">
      {/* Floating Menu Button (글자 없이 아이콘만 표시, 사이드바 숨김 시 또는 모바일에서 화면 좌측 상단 플로팅) */}
      <button
        type="button"
        onClick={() => {
          if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
            setMobileSidebarOpen(true);
          } else {
            setIsSidebarCollapsed(false);
            localStorage.setItem('ministry_sidebar_collapsed', 'false');
          }
        }}
        className={`floating-btn floating-btn-menu ${!isSidebarCollapsed ? 'hide-on-pc-open' : ''}`}
        title="메뉴 열기"
        aria-label="메뉴 열기"
      >
        <Menu size={15} />
      </button>

      {/* Floating Theme (Dark Mode) Button (화면 우측 상단 상시 플로팅) */}
      <button
        type="button"
        onClick={toggleTheme}
        className="floating-btn floating-btn-theme"
        title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        aria-label="테마 전환"
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Left Sidebar (Nickelfox Style) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        currentYear={currentYear}
        manager={manager}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        selectedGroupId={selectedGroupId}
        onSelectGroup={(gid) => {
          if (manager?.role === 'group') return;
          setSelectedGroupId(gid);
        }}
        groups={groups}
        congregationName={congregationName}
        onGoToReportPage={goToReport}
        serviceYears={serviceYears}
        systemDefaultYear={systemDefaultYear}
        onSelectViewYear={handleSelectViewYear}
        onFixDefaultYear={handleFixCurrentYearAsDefault}
      />

      {/* Main Content Viewport */}
      <div className={`dashboard-main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Tab Views */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {activeTab === 'dashboard' && (
            <Dashboard
              currentYear={currentYear}
              manager={manager}
              selectedGroupId={selectedGroupId}
              onSelectGroup={(gid) => {
                if (manager?.role === 'group') return;
                setSelectedGroupId(gid);
              }}
            />
          )}

          {activeTab === 'report' && (
            <div style={{ padding: '24px 20px' }}>
              <ReportForm
                key={`manager-report-${reportFormKey}`}
                currentYear={currentYear}
                onSuccessNavigate={() => setActiveTab('dashboard')}
                manager={manager}
              />
            </div>
          )}

          {activeTab === 'publishers' && (
            <PublisherManagement
              currentYear={currentYear}
              manager={manager}
              initialSubTab="active"
            />
          )}

          {activeTab === 'groups' && (manager?.role === 'super' || manager?.role === 'congregation') && (
            <GroupManagerSettings
              currentManager={manager}
              onManagerUpdated={(updated) => {
                if (manager?.id === updated.id) {
                  setManager(updated);
                  localStorage.setItem('ministry_manager_session', JSON.stringify(updated));
                }
              }}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {loginModalOpen && (
        <LoginModal
          onClose={() => setLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {settingsModalOpen && manager?.role === 'super' && (
        <SettingsModal
          currentYear={currentYear}
          onClose={() => setSettingsModalOpen(false)}
          onConfigSaved={async () => {
            try {
              const updatedYears = await getServiceYears();
              setServiceYears(updatedYears);
            } catch (e) {
              console.error('Failed to reload service years:', e);
            }
          }}
          onServiceYearChanged={handleServiceYearChanged}
        />
      )}
    </div>
  );
}

export default App;
