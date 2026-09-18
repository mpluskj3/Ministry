import React, { useState, useEffect } from 'react';
import { CalendarClock, AlertCircle, Sun, Moon, ArrowLeft } from 'lucide-react';
import { Manager, ServiceYear } from '../types/database';
import { signInWithGoogleOAuth } from '../services/ministryService';

const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

interface AdminAuthGateProps {
  congregationName: string;
  currentYear: ServiceYear;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLoginSuccess: (manager: Manager) => void;
  onGoToReportPage: () => void;
  authErrorMessage?: string | null;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({
  congregationName,
  currentYear,
  theme,
  toggleTheme,
  onGoToReportPage,
  authErrorMessage
}) => {
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(authErrorMessage || null);

  useEffect(() => {
    if (authErrorMessage) {
      setErrorMsg(authErrorMessage);
    }
  }, [authErrorMessage]);

  // Google OAuth 연동 로그인
  const handleGoogleOAuthLogin = async () => {
    setOauthLoading(true);
    setErrorMsg(null);
    try {
      const res = await signInWithGoogleOAuth();
      if (res.error) {
        setErrorMsg(`Google 로그인 안내: ${res.error}`);
        setOauthLoading(false);
      }
      // 성공 시 Supabase OAuth 리디렉션 진행
    } catch (err: any) {
      setErrorMsg(err.message || 'Google 로그인 중 오류가 발생했습니다.');
      setOauthLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-app)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Top Floating Controls */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        zIndex: 10
      }}>
        <button
          type="button"
          onClick={toggleTheme}
          className="btn-secondary"
          title="테마 전환"
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-full)', gap: 6, fontSize: '0.82rem' }}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          <span>{theme === 'dark' ? '라이트 모드' : '다크 모드'}</span>
        </button>
      </div>

      {/* Main Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px 30px',
          boxShadow: 'var(--shadow-md)',
          textAlign: 'center'
        }}>
          {/* Header Icon */}
          <div style={{
            width: 58,
            height: 58,
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 18,
            boxShadow: '0 8px 22px rgba(79, 70, 229, 0.32)'
          }}>
            <CalendarClock size={32} />
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            {congregationName} 관리자 시스템
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '0 0 26px 0' }}>
            {currentYear.year_name} 봉사연도 · 관리자 전용 인증
          </p>

          {/* Error Message */}
          {errorMsg && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.84rem',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              lineHeight: 1.4,
              textAlign: 'left'
            }}>
              <AlertCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Google OAuth Login Button (단일 로그인 방식) */}
          <button
            type="button"
            onClick={handleGoogleOAuthLogin}
            disabled={oauthLoading}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              fontSize: '1rem',
              fontWeight: 700,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-main)',
              color: 'var(--text-color)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              cursor: oauthLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <GoogleIcon size={22} />
            <span>{oauthLoading ? 'Google 로그인 연결 중...' : 'Google 계정으로 로그인'}</span>
          </button>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.4 }}>
            로그인 시 등록된 관리자 명단과 대조하여 권한이 자동으로 승인됩니다.
          </p>

          {/* Back to Public Report Page */}
          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={onGoToReportPage}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <ArrowLeft size={14} />
              <span>전도인 야외 봉사 보고 접수처로 돌아가기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
