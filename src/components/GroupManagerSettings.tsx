import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  ShieldCheck,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Users,
  Layers,
  Mail,
  UserPlus,
  AlertTriangle
} from 'lucide-react';
import { Group, Manager } from '../types/database';
import {
  getGroups,
  saveGroup,
  deleteGroup,
  getManagers,
  saveManager,
  deleteManager,
  getPublishers
} from '../services/ministryService';

const GoogleIcon = ({ size = 16 }: { size?: number }) => (
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

interface GroupManagerSettingsProps {
  currentManager?: Manager | null;
  onManagerUpdated?: (manager: Manager) => void;
}

export const GroupManagerSettings: React.FC<GroupManagerSettingsProps> = ({
  currentManager,
  onManagerUpdated,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'groups' | 'managers'>('groups');
  const [groups, setGroups] = useState<Group[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [publisherCounts, setPublisherCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // 모달 배경 드래그 오인 클릭 방지용 ref
  const overlayMouseDownRef = useRef(false);

  // Group Modal State
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    overseer_name: '',
    assistant_overseer_name: '',
    display_order: 1,
  });

  // Manager Modal State
  const [managerModalOpen, setManagerModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [managerForm, setManagerForm] = useState({
    name: '',
    email: '',
    role: 'group' as 'super' | 'group',
    group_id: '',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [grps, mgrs, pubs] = await Promise.all([
        getGroups(),
        getManagers(),
        getPublishers(true)
      ]);
      setGroups(grps);
      setManagers(mgrs);

      // 집단별 전도인 수 계산
      const counts: Record<string, number> = {};
      pubs.forEach(p => {
        if (p.group_id) {
          counts[p.group_id] = (counts[p.group_id] || 0) + 1;
        }
      });
      setPublisherCounts(counts);
    } catch (err: any) {
      setErrorMsg('데이터를 불러오지 못했습니다: ' + (err.message || '오류'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // -------------------------------------------------------------
  // 집단(Group) 처리
  // -------------------------------------------------------------
  const handleOpenAddGroup = () => {
    setEditingGroup(null);
    setGroupForm({
      name: '',
      overseer_name: '',
      assistant_overseer_name: '',
      display_order: groups.length + 1,
    });
    setGroupModalOpen(true);
  };

  const handleOpenEditGroup = (g: Group) => {
    setEditingGroup(g);
    setGroupForm({
      name: g.name,
      overseer_name: g.overseer_name || '',
      assistant_overseer_name: g.assistant_overseer_name || '',
      display_order: g.display_order,
    });
    setGroupModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name.trim()) {
      alert('집단명을 입력해주세요.');
      return;
    }

    try {
      await saveGroup({
        id: editingGroup?.id,
        name: groupForm.name.trim(),
        overseer_name: groupForm.overseer_name.trim(),
        assistant_overseer_name: groupForm.assistant_overseer_name.trim(),
        display_order: Number(groupForm.display_order) || 1,
      });
      setGroupModalOpen(false);
      showNotification(editingGroup ? '집단 정보가 수정되었습니다.' : '새 집단이 추가되었습니다.');
      await loadData();
    } catch (err: any) {
      alert('집단 저장 실패: ' + (err.message || '오류'));
    }
  };

  const handleDeleteGroup = async (g: Group) => {
    const pubCount = publisherCounts[g.id] || 0;
    const confirmMsg = pubCount > 0
      ? `'${g.name}' 집단에 현재 소속 전도인 ${pubCount}명이 있습니다. 정말 삭제하시겠습니까? (삭제 시 전도인의 소속은 미배정으로 변경됩니다)`
      : `'${g.name}' 집단을 삭제하시겠습니까?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteGroup(g.id);
      showNotification(`'${g.name}' 집단이 삭제되었습니다.`);
      await loadData();
    } catch (err: any) {
      alert('집단 삭제 실패: ' + (err.message || '오류'));
    }
  };

  // -------------------------------------------------------------
  // 관리자(Manager) 처리
  // -------------------------------------------------------------
  const handleOpenAddManager = () => {
    setEditingManager(null);
    setManagerForm({
      name: '',
      email: '',
      role: 'group',
      group_id: groups[0]?.id || '',
    });
    setManagerModalOpen(true);
  };

  const handleOpenEditManager = (m: Manager) => {
    setEditingManager(m);
    setManagerForm({
      name: m.name,
      email: m.email,
      role: m.role,
      group_id: m.group_id || groups[0]?.id || '',
    });
    setManagerModalOpen(true);
  };

  const handleSaveManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerForm.name.trim() || !managerForm.email.trim()) {
      alert('이름과 이메일을 모두 입력해주세요.');
      return;
    }

    try {
      const saved = await saveManager({
        id: editingManager?.id,
        name: managerForm.name.trim(),
        email: managerForm.email.trim().toLowerCase(),
        role: managerForm.role,
        group_id: managerForm.role === 'group' ? managerForm.group_id : null,
      });
      if (onManagerUpdated && currentManager && saved.id === currentManager.id) {
        onManagerUpdated(saved);
      }
      setManagerModalOpen(false);
      showNotification(editingManager ? '관리자 구글 계정 정보가 수정되었습니다.' : '새 관리자가 등록되었습니다.');
      await loadData();
    } catch (err: any) {
      alert('관리자 저장 실패: ' + (err.message || '오류'));
    }
  };

  const handleDeleteManager = async (m: Manager) => {
    if (!window.confirm(`'${m.name} (${m.email})' 관리자를 삭제하시겠습니까?`)) return;

    try {
      await deleteManager(m.id);
      showNotification(`'${m.name}' 관리자가 삭제되었습니다.`);
      await loadData();
    } catch (err: any) {
      alert('관리자 삭제 실패: ' + (err.message || '오류'));
    }
  };

  const totalPublishers = Object.values(publisherCounts).reduce((a, b) => a + b, 0);
  const overseerCount = groups.filter(g => g.overseer_name && g.overseer_name.trim() !== '').length;
  const superAdminCount = managers.filter(m => m.role === 'super').length;
  const groupAdminCount = managers.filter(m => m.role === 'group').length;

  return (
    <div className="group-manager-container" style={{ padding: '24px 20px', maxWidth: 1180, margin: '0 auto', width: '100%' }}>
      {/* Alert Notifications */}
      {successMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--accent-emerald)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.92rem',
          fontWeight: 600,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: 'var(--accent-rose)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.92rem',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 14,
        marginBottom: 24,
        padding: '0 44px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            집단 및 관리자 설정
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '6px 0 0 0' }}>
            회중 봉사 집단 및 관리자 계정을 설정합니다.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-card)',
          padding: 4,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          maxWidth: '100%',
          overflowX: 'auto',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setActiveSubTab('groups')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeSubTab === 'groups' ? 'var(--primary)' : 'transparent',
              color: activeSubTab === 'groups' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            <Building2 size={16} />
            <span>집단명 관리 ({groups.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('managers')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeSubTab === 'managers' ? 'var(--primary)' : 'transparent',
              color: activeSubTab === 'managers' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            <ShieldCheck size={16} />
            <span>관리자 계정 ({managers.length})</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {/* Card 1: 총 봉사 집단 */}
        <div className="nfox-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>총 봉사 집단</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>{groups.length}개 집단</div>
          </div>
        </div>

        {/* Card 2: 총 배정 전도인 */}
        <div className="nfox-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.12)',
            color: 'var(--accent-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>총 소속 전도인</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{totalPublishers}명</div>
          </div>
        </div>

        {/* Card 3: 집단 감독자 선임 */}
        <div className="nfox-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.12)',
            color: 'var(--accent-amber)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>집단 감독자 임명</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {overseerCount}명 <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ {groups.length}개</span>
            </div>
          </div>
        </div>

        {/* Card 4: 관리자 계정 수 */}
        <div className="nfox-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.12)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <UserPlus size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>등록 관리자 계정</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {managers.length}명 <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)' }}>(최고관리자 {superAdminCount}, 집단 {groupAdminCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. 집단명 관리 뷰 */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'groups' && (
        <div className="nfox-card" style={{ padding: '20px clamp(14px, 3vw, 24px)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20
          }}>
            <div style={{ minWidth: 0, flex: '1 1 200px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>봉사 집단 목록</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                봉사 보고서 제출 및 대시보드 집계에 사용되는 회중 정규 봉사 집단입니다.
              </p>
            </div>
            <button
              onClick={handleOpenAddGroup}
              className="btn-primary"
              style={{
                gap: 6,
                fontSize: '0.88rem',
                padding: '8px 16px',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Plus size={16} /> 추가
            </button>
          </div>

          <div className="data-table-container">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: 80, textAlign: 'center' }}>순서</th>
                  <th style={{ width: 220 }}>집단명</th>
                  <th style={{ width: 190 }}>집단 감독자</th>
                  <th style={{ width: 190 }}>보조 감독자</th>
                  <th style={{ width: 150 }}>소속 전도인</th>
                  <th style={{ width: 140, textAlign: 'center' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      등록된 집단이 없습니다. '+ 집단 추가'를 눌러 집단을 등록하세요.
                    </td>
                  </tr>
                ) : (
                  groups.map((g) => (
                    <tr key={g.id}>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--primary-light)',
                          color: 'var(--primary)',
                          fontWeight: 800,
                          fontSize: '0.82rem'
                        }}>
                          #{g.display_order}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                          {g.name.endsWith('집단') ? g.name : `${g.name} 집단`}
                        </div>
                      </td>
                      <td>
                        {g.overseer_name ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                              {g.overseer_name}
                            </span>
                            <span style={{
                              fontSize: '0.72rem',
                              color: 'var(--primary)',
                              background: 'var(--primary-light)',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontWeight: 600
                            }}>
                              감독자
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-faint)', fontSize: '0.88rem' }}>미선임</span>
                        )}
                      </td>
                      <td>
                        {g.assistant_overseer_name ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                              {g.assistant_overseer_name}
                            </span>
                            <span style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)',
                              background: 'rgba(0,0,0,0.05)',
                              padding: '2px 6px',
                              borderRadius: 4
                            }}>
                              보조
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-faint)', fontSize: '0.88rem' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-group" style={{ fontSize: '0.85rem', fontWeight: 700, padding: '4px 10px' }}>
                          <Users size={13} style={{ marginRight: 5 }} />
                          {publisherCounts[g.id] || 0}명
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            onClick={() => handleOpenEditGroup(g)}
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', gap: 4 }}
                            title="집단 수정"
                          >
                            <Edit3 size={13} /> 수정
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(g)}
                            className="btn-secondary"
                            style={{
                              padding: '6px 10px',
                              fontSize: '0.8rem',
                              color: 'var(--accent-rose)',
                              borderColor: 'rgba(244, 63, 94, 0.25)'
                            }}
                            title="집단 삭제"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. 관리자 계정 관리 뷰 (Google 계정 인증 연동) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'managers' && (
        <div className="nfox-card" style={{ padding: '24px 28px' }}>
          {/* Google 계정 로그인 안내 배너 */}
          <div style={{
            background: 'rgba(66, 133, 244, 0.08)',
            border: '1px solid rgba(66, 133, 244, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12
          }}>
            <div style={{ marginTop: 2 }}>
              <GoogleIcon size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: 2 }}>
                Google 계정 기반 관리자 로그인 인증 안내
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                예전 앱과 동일하게, 여기에 등록된 <strong>구글 계정 이메일(Gmail 또는 Google Workspace)</strong>로 관리자 로그인이 확인됩니다.
                기존 임시 이메일(@example.com)을 사용 중인 관리자는 우측 <strong>[수정 / 이메일 변경]</strong>을 눌러 실제 본인의 구글 이메일로 업데이트해 주세요.
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20
          }}>
            <div style={{ minWidth: 0, flex: '1 1 220px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <GoogleIcon size={18} />
                <span>관리자 계정 및 구글 로그인 권한 목록</span>
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                등록된 구글 이메일 주소로 로그인 시 관리자 권한(최고관리자 / 집단관리자)이 부여됩니다.
              </p>
            </div>
            <button
              onClick={handleOpenAddManager}
              className="btn-primary"
              style={{
                gap: 6,
                fontSize: '0.88rem',
                padding: '8px 16px',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <UserPlus size={16} /> 관리자 등록
            </button>
          </div>

          <div className="data-table-container">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: 160 }}>이름</th>
                  <th style={{ width: 250 }}>Google 로그인 이메일</th>
                  <th style={{ width: 170 }}>구글 로그인 확인 상태</th>
                  <th style={{ width: 180 }}>권한 구분</th>
                  <th style={{ width: 160 }}>담당 집단</th>
                  <th style={{ width: 150, textAlign: 'center' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {managers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      등록된 관리자가 없습니다. '+ 관리자 등록'을 눌러 추가하세요.
                    </td>
                  </tr>
                ) : (
                  managers.map((m) => {
                    const isExampleEmail = !m.email || m.email.endsWith('@example.com');
                    return (
                      <tr key={m.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                              {m.name}
                            </span>
                            {currentManager && currentManager.id === m.id && (
                              <span style={{
                                display: 'inline-block',
                                fontSize: '0.68rem',
                                padding: '1px 6px',
                                borderRadius: 4,
                                background: 'var(--primary-light)',
                                color: 'var(--primary)',
                                fontWeight: 700,
                                whiteSpace: 'nowrap'
                              }}>
                                현재 접속
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-main)', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                            <GoogleIcon size={14} />
                            <span style={{ fontWeight: isExampleEmail ? 400 : 700 }}>{m.email}</span>
                          </div>
                        </td>
                        <td>
                          {!isExampleEmail ? (
                            <span className="badge" style={{
                              background: 'rgba(52, 168, 83, 0.12)',
                              color: '#15803d',
                              border: '1px solid rgba(52, 168, 83, 0.25)',
                              gap: 5,
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              padding: '3px 8px'
                            }}>
                              <Check size={12} />
                              <span>구글 계정 확인됨</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenEditManager(m)}
                              className="badge"
                              title="클릭하여 실제 구글 계정 이메일로 업데이트하세요"
                              style={{
                                background: 'rgba(234, 67, 53, 0.1)',
                                color: '#b91c1c',
                                border: '1px solid rgba(234, 67, 53, 0.25)',
                                gap: 5,
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                padding: '3px 8px',
                                cursor: 'pointer'
                              }}
                            >
                              <AlertTriangle size={12} />
                              <span>이메일 업데이트 필요</span>
                            </button>
                          )}
                        </td>
                        <td>
                          {m.role === 'super' ? (
                            <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, padding: '4px 10px' }}>
                              <ShieldCheck size={14} style={{ marginRight: 4 }} />
                              최고관리자
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)', fontWeight: 700, padding: '4px 10px' }}>
                              <Building2 size={14} style={{ marginRight: 4 }} />
                              집단관리자
                            </span>
                          )}
                        </td>
                        <td>
                          {m.role === 'super' ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 600 }}>전체 집단 총괄</span>
                          ) : (
                            <span className="badge badge-group" style={{ padding: '4px 10px', fontSize: '0.85rem' }}>
                              {m.group_name || '미배정'}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              onClick={() => handleOpenEditManager(m)}
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', gap: 4 }}
                              title="구글 로그인 이메일 및 관리자 정보 수정"
                            >
                              <Edit3 size={13} /> {isExampleEmail ? '이메일 등록' : '수정'}
                            </button>
                            <button
                              onClick={() => handleDeleteManager(m)}
                              className="btn-secondary"
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.8rem',
                                color: 'var(--accent-rose)',
                                borderColor: 'rgba(244, 63, 94, 0.25)'
                              }}
                              title="관리자 삭제"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 집단 추가/수정 모달 */}
      {/* ------------------------------------------------------------- */}
      {groupModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            overlayMouseDownRef.current = e.target === e.currentTarget;
          }}
          onClick={(e) => {
            if (overlayMouseDownRef.current && e.target === e.currentTarget) {
              setGroupModalOpen(false);
            }
            overlayMouseDownRef.current = false;
          }}
        >
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Building2 size={20} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  {editingGroup ? '집단 정보 수정' : '새 봉사 집단 추가'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGroupModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSaveGroup}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                  e.preventDefault();
                }
              }}
            >
              <div className="form-group">
                <label className="form-label">
                  집단명 <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 효자, 수어, 석사, 현대, 운교"
                  value={groupForm.name}
                  onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">집단 감독자 이름</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 김충실"
                  value={groupForm.overseer_name}
                  onChange={e => setGroupForm({ ...groupForm, overseer_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">보조 감독자 이름</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 박영성"
                  value={groupForm.assistant_overseer_name}
                  onChange={e => setGroupForm({ ...groupForm, assistant_overseer_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">표시 순서</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="99"
                  value={groupForm.display_order}
                  onChange={e => setGroupForm({ ...groupForm, display_order: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setGroupModalOpen(false)}
                  className="btn-secondary"
                >
                  취소
                </button>
                <button type="submit" className="btn-primary" style={{ gap: 6 }}>
                  <Check size={16} /> 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 관리자 추가/수정 모달 */}
      {/* ------------------------------------------------------------- */}
      {managerModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            overlayMouseDownRef.current = e.target === e.currentTarget;
          }}
          onClick={(e) => {
            if (overlayMouseDownRef.current && e.target === e.currentTarget) {
              setManagerModalOpen(false);
            }
            overlayMouseDownRef.current = false;
          }}
        >
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <GoogleIcon size={20} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  {editingManager ? '관리자 구글 계정 및 정보 수정' : '새 관리자 등록 (구글 계정)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setManagerModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSaveManager}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                  e.preventDefault();
                }
              }}
            >
              <div className="form-group">
                <label className="form-label">
                  관리자 이름 <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 김서기"
                  value={managerForm.name}
                  onChange={e => setManagerForm({ ...managerForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GoogleIcon size={14} />
                  <span>Google 로그인 이메일</span>
                  <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="예: yourname@gmail.com"
                  value={managerForm.email}
                  onChange={e => setManagerForm({ ...managerForm, email: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 5, display: 'block', lineHeight: 1.4 }}>
                  ※ 예전 앱과 같이 관리자 로그인 인증에 사용되는 <strong>실제 구글 계정(Gmail 또는 Google Workspace 이메일)</strong>을 입력하세요.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">권한 구분</label>
                <select
                  className="form-select"
                  value={managerForm.role}
                  onChange={e => setManagerForm({ ...managerForm, role: e.target.value as any })}
                >
                  <option value="super">최고관리자 (전체 집단 및 전도인 관리)</option>
                  <option value="group">집단관리자 (담당 집단 전담 관리)</option>
                </select>
              </div>

              {managerForm.role === 'group' && (
                <div className="form-group">
                  <label className="form-label">
                    담당 집단 선택 <span style={{ color: 'var(--accent-rose)' }}>*</span>
                  </label>
                  <select
                    className="form-select"
                    value={managerForm.group_id}
                    onChange={e => setManagerForm({ ...managerForm, group_id: e.target.value })}
                    required
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} 집단
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setManagerModalOpen(false)}
                  className="btn-secondary"
                >
                  취소
                </button>
                <button type="submit" className="btn-primary" style={{ gap: 6 }}>
                  <Check size={16} /> 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
