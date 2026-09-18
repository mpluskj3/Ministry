import React from 'react';
import { ShieldAlert, ArrowLeft, Sun, Moon, LogIn } from 'lucide-react';
import { signInWithGoogleOAuth } from '../services/ministryService';

const GoogleIcon = ({ size = 18 }: { size?: number }) => (
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

interface AccessDeniedProps {
  email: string;
  congregationName: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onGoToReportPage: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  email,
  congregationName,
  theme,
  toggleTheme,
  onGoToReportPage,
}) => {
  const [loading, setLoading] = React.useState(false);

  const handleSwitchAccount = async () => {
    setLoading(true);
    try {
      await signInWithGoogleOAuth();
    } catch (err: any) {
      alert(err.message || '로그인 오류가 발생했습니다.');
      setLoading(false);
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
      {/* Top Controls */}
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

      {/* Main Card Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--bg-card)',
          border: '1px solid rgba(244, 63, 94, 0.35)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 32px',
          boxShadow: '0 20px 40px -15px rgba(244, 63, 94, 0.15), var(--shadow-md)',
          textAlign: 'center'
        }}>
          {/* Danger / Shield Icon */}
          <div style={{
            width: 68,
            height: 68,
            borderRadius: 'var(--radius-full)',
            background: 'rgba(244, 63, 94, 0.12)',
            color: 'var(--accent-rose)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            boxShadow: '0 0 0 8px rgba(244, 63, 94, 0.06)'
          }}>
            <ShieldAlert size={36} />
          </div>

          <div style={{
            display: 'inline-block',
            background: 'rgba(244, 63, 94, 0.15)',
            color: 'var(--accent-rose)',
            fontWeight: 700,
            fontSize: '0.78rem',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            marginBottom: 12,
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            접근 권한 차단됨
          </div>

          <h1 style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            margin: '0 0 10px 0',
            color: 'var(--text-main)',
            letterSpacing: '-0.02em'
          }}>
            계정 권한이 없습니다
          </h1>

          <p style={{
            fontSize: '0.98rem',
            fontWeight: 600,
            color: 'var(--accent-rose)',
            margin: '0 0 24px 0',
            lineHeight: 1.5
          }}>
            계정 권한이 없습니다. 관리자에게 문의하세요
          </p>

          {/* Account Detail Box */}
          <div style={{
            background: 'var(--bg-card-subtle, rgba(0,0,0,0.03))',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            marginBottom: 26,
            textAlign: 'left',
            fontSize: '0.84rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>시도한 구글 계정</span>
              <span style={{ fontWeight: 700, color: 'var(--text-main)', wordBreak: 'break-all' }}>{email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>인증 상태</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-rose)' }}>미등록 관리자 계정</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={handleSwitchAccount}
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.92rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                background: '#4285F4',
                borderColor: '#4285F4'
              }}
            >
              <GoogleIcon size={18} />
              <span>{loading ? '연결 중...' : '다른 Google 계정으로 로그인'}</span>
            </button>

            <button
              onClick={onGoToReportPage}
              className="btn-secondary"
              style={{
                width: '100%',
                padding: '11px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <ArrowLeft size={16} />
              <span>야외 봉사 보고 제출 화면으로 이동</span>
            </button>
          </div>

          <div style={{ marginTop: 24, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            {congregationName} 봉사 관리 시스템
          </div>
        </div>
      </div>
    </div>
  );
};
