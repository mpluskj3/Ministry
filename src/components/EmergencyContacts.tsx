import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Phone,
  MapPin,
  Users,
  Search,
  Plus,
  Edit3,
  Trash2,
  Download,
  Printer,
  Check,
  X,
  AlertCircle,
  Building2,
  PhoneCall,
  MessageSquare,
  Copy,
  HeartPulse,
  Crown,
  Home,
  Info
} from 'lucide-react';
import { EmergencyContact, Group, Publisher, ServiceYear, Position, Gender, Hope, isChildStatus, Manager } from '../types/database';
import {
  getEmergencyContacts,
  getPublishers,
  saveEmergencyContact,
  getGroups,
  deactivatePublisher,
  savePublisher,
  deletePublisher,
  saveGroup
} from '../services/ministryService';
import { PublisherCardModal } from './PublisherCardModal';

// 가족 묶음 구분을 위한 감각적이고 조화로운 파스텔 배경 색상 및 테두리 팔레트
export const FAMILY_PALETTES = [
  { bg: 'rgba(59, 130, 246, 0.08)', border: '#3b82f6', text: '#1d4ed8', badgeBg: '#dbeafe', label: '블루' },
  { bg: 'rgba(16, 185, 129, 0.08)', border: '#10b981', text: '#047857', badgeBg: '#d1fae5', label: '에메랄드' },
  { bg: 'rgba(245, 158, 11, 0.08)', border: '#f59e0b', text: '#b45309', badgeBg: '#fef3c7', label: '앰버' },
  { bg: 'rgba(139, 92, 246, 0.08)', border: '#8b5cf6', text: '#6d28d9', badgeBg: '#ede9fe', label: '퍼플' },
  { bg: 'rgba(244, 63, 94, 0.08)', border: '#f43f5e', text: '#be123c', badgeBg: '#ffe4e6', label: '로즈' },
  { bg: 'rgba(14, 165, 233, 0.08)', border: '#0ea5e9', text: '#0369a1', badgeBg: '#e0f2fe', label: '스카이' },
  { bg: 'rgba(168, 85, 247, 0.08)', border: '#a855f7', text: '#7e22ce', badgeBg: '#f3e8ff', label: '바이올렛' },
  { bg: 'rgba(20, 184, 166, 0.08)', border: '#14b8a6', text: '#0f766e', badgeBg: '#ccfbf1', label: '틸' },
  { bg: 'rgba(234, 88, 12, 0.08)', border: '#ea580c', text: '#c2410c', badgeBg: '#ffedd5', label: '오렌지' },
];

const normalizePosition = (p?: string | null): Position => {
  if (!p) return '전도인';
  if (p.includes('장로')) return '장로';
  if (p.includes('봉종') || p.includes('종')) return '봉종';
  if (p.includes('미침')) return '미침';
  return '전도인';
};

interface EmergencyContactsProps {
  currentYear: ServiceYear;
  manager?: Manager | null;
  isEmbedded?: boolean;
  onDataChanged?: () => void;
}

export const EmergencyContacts: React.FC<EmergencyContactsProps> = ({ currentYear, manager, isEmbedded, onDataChanged }) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [allPublishers, setAllPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const isSuperAdmin = manager?.role === 'super';

  // 집단 관리자인 경우 본인 소속 집단 ID 및 이름 추출
  const myGroupId = manager?.role === 'group'
    ? (manager.group_id || groups.find(g => g.name === manager.group_name)?.id || null)
    : null;
  const myGroupName = manager?.role === 'group'
    ? (manager.group_name || groups.find(g => g.id === manager.group_id)?.name || null)
    : null;

  // 전도인/연락처 수정 권한 확인: 최고관리자는 전체, 집단관리자는 본인 소속 집단 전도인만 수정 가능
  const canEditContact = (c: EmergencyContact) => {
    if (isSuperAdmin) return true;
    if (manager?.role === 'group') {
      if (myGroupId && c.group_id === myGroupId) return true;
      if (myGroupName && (c.group_name === myGroupName || groups.find(g => g.id === c.group_id)?.name === myGroupName)) return true;
      return false;
    }
    return false;
  };

  // 전도인 기록 카드(S-21) 모달
  const [cardModalData, setCardModalData] = useState<{ id: string; name: string } | null>(null);

  // Contact Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Partial<EmergencyContact> | null>(null);

  // 가족 묶음 일괄 지정 모달
  const [familyBatchModalOpen, setFamilyBatchModalOpen] = useState(false);
  const [targetGroupIdForFamily, setTargetGroupIdForFamily] = useState<string>('');
  const [batchFamilyHead, setBatchFamilyHead] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Record<string, boolean>>({}); // publisherId -> boolean

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 모달 배경 드래그 오인 클릭 방지용 ref
  const overlayMouseDownRef = useRef(false);

  // 상단 헤더 액션 포탈 (PublisherManagement 서브탭 우측 연동)
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (isEmbedded) {
      setPortalEl(document.getElementById('emergency-header-actions'));
    }
  }, [isEmbedded]);

  // 집단 관리자 로그인 시 기본적으로 자신의 집단을 기본 필터로 설정 (전체 및 타 집단 선택 가능)
  useEffect(() => {
    if (manager?.role === 'group') {
      const myGroupId = manager.group_id || groups.find(g => g.name === manager.group_name)?.id;
      if (myGroupId) {
        setSelectedGroupFilter(myGroupId);
      }
    }
  }, [manager, groups]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [list, grps, pubs] = await Promise.all([
        getEmergencyContacts(false), // 활동 중인 전도인 중심
        getGroups(),
        getPublishers(true)
      ]);
      setContacts(list);
      setGroups(grps);
      setAllPublishers(pubs);
    } catch (err) {
      console.error('Failed to load emergency contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyText = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Add / Edit Contact
  const handleOpenAdd = () => {
    const defaultGrp = selectedGroupFilter !== 'all'
      ? (groups.find(g => g.id === selectedGroupFilter) || groups[0])
      : groups[0];
    setEditingContact({
      name: '',
      group_id: defaultGrp?.id || '',
      gender: '남',
      position: '',
      rp: '',
      birth_date: '',
      baptism_date: '',
      hope: '다른 양',
      phone: '',
      emergency_phone: '',
      relationship: '',
      family_head: '',
      address: '',
      special_notes: '',
      is_active: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (contact: EmergencyContact) => {
    if (!canEditContact(contact)) {
      alert('자신이 소속된 집단의 전도인 정보만 수정할 수 있습니다.');
      return;
    }
    const linkedPub = allPublishers.find(p => p.id === contact.publisher_id || p.name === contact.name);
    setEditingContact({
      ...contact,
      gender: contact.gender || linkedPub?.gender || '남',
      baptism_date: contact.baptism_date || linkedPub?.baptism_date || '',
      hope: contact.hope || linkedPub?.hope || '다른 양',
      special_notes: contact.special_notes || linkedPub?.special_notes || '',
    });
    setModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContact && !canEditContact(editingContact as EmergencyContact)) {
      alert('자신이 소속된 집단의 전도인 정보만 수정할 수 있습니다.');
      return;
    }
    const cleanName = editingContact?.name?.trim();
    if (!editingContact || !cleanName) {
      alert('이름을 입력해주세요.');
      return;
    }

    try {
      // 기존 전도인 명단에서 동일한 이름이 있으면 publisher_id 자동 연동
      const existingPub = allPublishers.find(p => p.name === cleanName);
      const contactToSave: Partial<EmergencyContact> = {
        ...editingContact,
        name: cleanName,
        publisher_id: editingContact.publisher_id || existingPub?.id
      };

      await saveEmergencyContact(contactToSave);

      setModalOpen(false);
      setEditingContact(null);
      await loadData();
      onDataChanged?.();
      alert('비상연락망 정보가 저장되었습니다.');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('unique_publisher_name') || msg.includes('duplicate key')) {
        alert(`'${cleanName}' 전도인은 이미 데이터베이스에 등록되어 있습니다.\n동명이인의 경우 이름 뒤에 구분 기호(예: ${cleanName}A, ${cleanName}B 등)를 입력해주세요.`);
      } else {
        alert('저장 실패: ' + (err.message || '오류'));
      }
    }
  };

  // 가족 묶음 일괄 지정 모달 열기
  const handleOpenFamilyBatchModal = (groupId?: string) => {
    const gId = myGroupId || groupId || (selectedGroupFilter !== 'all' ? selectedGroupFilter : (groups[0]?.id || ''));
    setTargetGroupIdForFamily(gId);
    setBatchFamilyHead('');
    setSelectedMemberIds({});
    setFamilyBatchModalOpen(true);
  };

  // 가족 묶음 일괄 저장
  const handleSaveFamilyBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manager?.role === 'group' && myGroupId && targetGroupIdForFamily !== myGroupId) {
      alert('자신이 소속된 집단만 가족 묶음을 지정할 수 있습니다.');
      return;
    }
    const cleanHead = batchFamilyHead.trim();
    if (!cleanHead) {
      alert('가족 대표자 이름을 입력하거나 선택해주세요.');
      return;
    }

    try {
      // 1. 세대주 본인 레코드 저장 (family_head만 지정, relationship은 절대 덮어쓰지 않음)
      const headContact = contacts.find(c => c.name.trim() === cleanHead && c.group_id === targetGroupIdForFamily);
      if (headContact && headContact.publisher_id) {
        await savePublisher({
          id: headContact.publisher_id,
          name: headContact.name,
          group_id: headContact.group_id,
          family_head: cleanHead
        });
      }

      // 2. 선택된 가족 구성원들 일괄 저장 (family_head만 cleanHead로 지정, relationship 보존)
      const memberIds = Object.keys(selectedMemberIds).filter(id => selectedMemberIds[id]);
      for (const pubId of memberIds) {
        if (!pubId) continue;
        const targetMember = contacts.find(c => c.publisher_id === pubId || c.id === pubId);
        if (targetMember && targetMember.publisher_id) {
          await savePublisher({
            id: targetMember.publisher_id,
            name: targetMember.name,
            group_id: targetMember.group_id,
            family_head: cleanHead
          });
        }
      }

      setFamilyBatchModalOpen(false);
      setBatchFamilyHead('');
      setSelectedMemberIds({});
      await loadData();
      alert(`'${cleanHead}' 가족 묶음(총 ${memberIds.length + (headContact ? 1 : 0)}명)이 성공적으로 지정 및 저장되었습니다.`);
    } catch (err: any) {
      alert('가족 묶음 저장 실패: ' + (err.message || '오류'));
    }
  };

  // 수정 모달 내에서 삭제 버튼 처리
  const handleDeleteContact = async () => {
    if (!editingContact) return;
    if (!isSuperAdmin) {
      alert('전도인 삭제 및 전출 처리는 최고관리자만 수행할 수 있습니다.');
      return;
    }
    const name = editingContact.name || '해당 전도인';
    const pubId = editingContact.publisher_id;

    if (!pubId) {
      if (window.confirm(`'${name}' 연락처를 삭제하시겠습니까?`)) {
        setModalOpen(false);
        setEditingContact(null);
        await loadData();
      }
      return;
    }

    const action = window.confirm(
      `'${name}' 전도인의 연락처를 삭제하시겠습니까?\n\n` +
      `• [확인]: '전출/무활동 보관함'으로 안전하게 이동하여 비상연락망 및 활동 명단에서 제외 (과거 봉사 보고 및 통계 영구 보존 - 권장)\n` +
      `• [취소]: 완전 영구 삭제 여부 확인으로 이동`
    );

    if (action) {
      const reason = window.prompt(`'${name}' 전도인의 삭제/전출 사유를 입력해주세요:`, '다른 회중으로 이사/전출');
      if (reason !== null) {
        try {
          await deactivatePublisher(pubId, reason || '비상연락망에서 삭제');
          setModalOpen(false);
          setEditingContact(null);
          await loadData();
          alert(`'${name}' 전도인이 전출/무활동 보관함으로 이동되어 비상연락망 및 활동 명단에서 제외되었습니다.`);
        } catch (err: any) {
          alert('삭제 처리 실패: ' + (err.message || '오류'));
        }
      }
    } else {
      const hardDelete = window.confirm(
        `⚠️ 주의: '${name}' 전도인을 데이터베이스에서 '완전 영구 삭제'하시겠습니까?\n\n` +
        `영구 삭제 시 이 전도인의 모든 과거 봉사 보고 및 S-21 기록 카드가 함께 삭제됩니다.\n` +
        `정말로 영구 삭제를 진행하시겠습니까?`
      );
      if (hardDelete) {
        try {
          await deletePublisher(pubId);
          setModalOpen(false);
          setEditingContact(null);
          await loadData();
          alert(`'${name}' 전도인이 데이터베이스에서 영구 삭제되었습니다.`);
        } catch (err: any) {
          alert('영구 삭제 실패: ' + (err.message || '오류'));
        }
      }
    }
  };

  // CSV Export: 이름, 전화, 직책, RP, 주소, 비상연락처, 관계
  const handleExportCsv = () => {
    if (!isSuperAdmin) {
      alert('CSV 다운로드는 최고관리자만 가능합니다.');
      return;
    }
    if (contacts.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }
    const headers = ['이름', '전화', '직책', 'RP', '주소', '비상연락처', '관계'];
    const rows = filteredContacts.map(c => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.position && c.position !== '일반' ? (c.position === '봉사의 종' ? '봉종' : c.position) : '').replace(/"/g, '""')}"`,
      `"${(c.rp || '').replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${(c.emergency_phone || '').replace(/"/g, '""')}"`,
      `"${(c.relationship || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `춘천남부_비상연락망_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter & Group Leadership & Family Grouping Sort
  const { sortedContacts, familyColorMap, familyCountMap, activeGroup } = useMemo(() => {
    const targetFilterGroup = groups.find(g => g.id === selectedGroupFilter);
    const base = contacts.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        (c.phone && c.phone.includes(searchQuery.trim())) ||
        (c.address && c.address.toLowerCase().includes(searchQuery.trim().toLowerCase())) ||
        (c.family_head && c.family_head.toLowerCase().includes(searchQuery.trim().toLowerCase())) ||
        (c.relationship && c.relationship.toLowerCase().includes(searchQuery.trim().toLowerCase())) ||
        (c.special_notes && c.special_notes.toLowerCase().includes(searchQuery.trim().toLowerCase()));
      const matchesGroup = 
        selectedGroupFilter === 'all' || 
        c.group_id === selectedGroupFilter || 
        (targetFilterGroup && c.group_name === targetFilterGroup.name);
      return matchesSearch && matchesGroup;
    });

    const groupMap = new Map<string, Group>();
    groups.forEach(g => groupMap.set(g.id, g));

    // 집단별 가족 수 집계: family_head가 있는 2인 이상 가족
    // key: `${c.group_id}_${c.family_head?.trim()}`
    const familyCount = new Map<string, number>();
    base.forEach(c => {
      const fh = c.family_head?.trim();
      if (fh) {
        const key = `${c.group_id || 'unknown'}_${fh}`;
        familyCount.set(key, (familyCount.get(key) || 0) + 1);
      }
    });

    // 2인 이상인 가족에 고유 팔레트 색상 할당
    const colorMap = new Map<string, typeof FAMILY_PALETTES[0]>();
    let paletteIdx = 0;
    familyCount.forEach((count, key) => {
      if (count >= 2) {
        colorMap.set(key, FAMILY_PALETTES[paletteIdx % FAMILY_PALETTES.length]);
        paletteIdx++;
      }
    });

    const activeGrp = selectedGroupFilter !== 'all' ? (groups.find(g => g.id === selectedGroupFilter) || null) : null;
    const overseerName = activeGrp?.overseer_name?.trim() || '';
    const assistantName = activeGrp?.assistant_overseer_name?.trim() || '';

    // 집단감독자 가족 묶음 식별
    const overseerContact = overseerName ? base.find(c => c.name.trim() === overseerName) : null;
    const overseerFamilyHead = overseerContact?.family_head?.trim() || overseerName;

    // 집단보조자 가족 묶음 식별
    const assistantContact = assistantName ? base.find(c => c.name.trim() === assistantName) : null;
    const assistantFamilyHead = assistantContact?.family_head?.trim() || assistantName;

    const isOverseerFamily = (c: EmergencyContact): boolean => {
      if (!overseerName) return false;
      if (c.name.trim() === overseerName) return true;
      if (c.family_head && (c.family_head.trim() === overseerName || (overseerFamilyHead && c.family_head.trim() === overseerFamilyHead))) return true;
      return false;
    };

    const isAssistantFamily = (c: EmergencyContact): boolean => {
      if (!assistantName) return false;
      if (isOverseerFamily(c)) return false;
      if (c.name.trim() === assistantName) return true;
      if (c.family_head && (c.family_head.trim() === assistantName || (assistantFamilyHead && c.family_head.trim() === assistantFamilyHead))) return true;
      return false;
    };

    // 가족 내부 구성원 정렬: 생년월일 기준 (빠른 생년월일이 앞 -> 남편, 아내, 자녀 순)
    // 생년월일이 없거나 동일할 경우 관계/세대주 기준 보조 정렬
    const compareFamilyMembers = (a: EmergencyContact, b: EmergencyContact): number => {
      // 1. 생년월일 비교 (예: 1968-05-10이 1971-08-20 및 2002-03-15보다 앞서므로 연장자/부모 우선)
      const bA = a.birth_date?.trim() || '';
      const bB = b.birth_date?.trim() || '';
      if (bA && bB && bA !== bB) {
        return bA.localeCompare(bB);
      }
      if (bA && !bB) return -1;
      if (!bA && bB) return 1;

      // 2. 생년월일이 없거나 같을 경우: 세대주/관계(남편/부/세대주 -> 아내/모/배우자 -> 기타 -> 자녀) 기준
      const getRelOrder = (c: EmergencyContact) => {
        const rel = (c.relationship || '').trim();
        const isHead = Boolean(c.family_head?.trim() && c.name.trim() === c.family_head.trim());
        if (isHead || rel.includes('세대주') || rel.includes('본인') || rel.includes('남편') || rel.includes('부')) return 1;
        if (rel.includes('배우자') || rel.includes('아내') || rel.includes('처') || rel.includes('모')) return 2;
        if (rel.includes('자녀') || rel.includes('아들') || rel.includes('딸')) return 4;
        return 3;
      };

      const orderA = getRelOrder(a);
      const orderB = getRelOrder(b);
      if (orderA !== orderB) return orderA - orderB;

      // 3. 이름 가나다순
      return a.name.localeCompare(b.name, 'ko');
    };

    // 정렬 우선순위:
    // 1. 전체 보기('all') 시: 사용자 요청에 따라 이름 항목명 ㄱ-ㄴ-ㄷ 순 정렬
    // 2. 단일 집단 선택 시: 기존 지정 정렬 순서 유지
    //    1순위: 집단감독자 가족 묶음 (감독자 본인 최우선, 그 다음 가족 구성원 생년월일순)
    //    2순위: 집단보조자 가족 묶음 (보조자 본인 최우선, 그 다음 가족 구성원 생년월일순)
    //    3순위: 나머지 전도인/가족 (가족 대표자명 기준 ㄱ-ㄴ-ㄷ 순, 가족 내에서는 생년월일순: 남편, 아내, 자녀)
    const sorted = [...base].sort((a, b) => {
      // 전체 보기('all')일 때는 전도인 이름 가나다(ㄱ-ㄴ-ㄷ)순으로 정렬
      if (selectedGroupFilter === 'all') {
        return a.name.localeCompare(b.name, 'ko');
      }

      // 개별 집단 선택 시 기존 집단별 정렬 규칙 적용
      const aInOverseer = isOverseerFamily(a);
      const bInOverseer = isOverseerFamily(b);
      if (aInOverseer && !bInOverseer) return -1;
      if (!aInOverseer && bInOverseer) return 1;
      if (aInOverseer && bInOverseer) {
        const aIsSelf = a.name.trim() === overseerName;
        const bIsSelf = b.name.trim() === overseerName;
        if (aIsSelf && !bIsSelf) return -1;
        if (!aIsSelf && bIsSelf) return 1;
        return compareFamilyMembers(a, b);
      }

      const aInAssistant = isAssistantFamily(a);
      const bInAssistant = isAssistantFamily(b);
      if (aInAssistant && !bInAssistant) return -1;
      if (!aInAssistant && bInAssistant) return 1;
      if (aInAssistant && bInAssistant) {
        const aIsSelf = a.name.trim() === assistantName;
        const bIsSelf = b.name.trim() === assistantName;
        if (aIsSelf && !bIsSelf) return -1;
        if (!aIsSelf && bIsSelf) return 1;
        return compareFamilyMembers(a, b);
      }

      // 나머지 전도인 및 가족 묶음:
      // 가족 대표자명 (family_head가 있으면 family_head, 없으면 본인 이름)
      const aRepKey = a.family_head?.trim() || a.name.trim();
      const bRepKey = b.family_head?.trim() || b.name.trim();

      if (aRepKey !== bRepKey) {
        return aRepKey.localeCompare(bRepKey, 'ko');
      }

      // 동일 가족 내 정렬: 생년월일 기준 (남편, 아내, 자녀 순)
      return compareFamilyMembers(a, b);
    });

    return {
      sortedContacts: sorted,
      familyColorMap: colorMap,
      familyCountMap: familyCount,
      activeGroup: activeGrp
    };
  }, [contacts, groups, searchQuery, selectedGroupFilter]);

  const filteredContacts = sortedContacts;

  const actionButtons = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <button
        onClick={() => handleOpenFamilyBatchModal()}
        className="btn-secondary"
        style={{ gap: 6, fontSize: '0.84rem' }}
        title="가족 구성원을 가족 대표자 기준으로 묶고 색상으로 구분합니다."
      >
        <Users size={15} color="var(--accent-emerald)" />
        <span>가족 묶음 지정</span>
      </button>

      {isSuperAdmin && (
        <button
          onClick={handleExportCsv}
          className="btn-secondary"
          style={{ gap: 6, fontSize: '0.84rem' }}
        >
          <Download size={14} />
          <span>CSV 저장</span>
        </button>
      )}

      <button
        onClick={() => window.print()}
        className="btn-secondary"
        style={{ gap: 6, fontSize: '0.84rem' }}
      >
        <Printer size={14} />
        <span>인쇄</span>
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: isEmbedded ? '0' : '24px 28px' }}>
      {/* 임베디드 모드일 때 서브탭 바의 우측 컨테이너로 액션 버튼들을 포탈 렌더링 */}
      {isEmbedded && portalEl && createPortal(actionButtons, portalEl)}

      {/* 독립 페이지 모드이거나 포탈 컨테이너가 없는 경우에만 페이지 헤더 표시 */}
      {(!isEmbedded || !portalEl) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isEmbedded ? 'flex-end' : 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: isEmbedded ? 16 : 24
        }}>
          {!isEmbedded && (
            <div className="no-print">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(244, 63, 94, 0.3)'
                }}>
                  <Phone size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                    회중 비상연락망
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '2px 0 0 0' }}>
                    비상사태 및 재해 시 신속한 확인을 위한 전도인 비상연락망, 가족 대표자 및 거주지 주소 관리
                  </p>
                </div>
              </div>
            </div>
          )}

          {actionButtons}
        </div>
      )}

      {/* Group & Search Filter Card (인쇄 시 숨김) */}
      <div className="nfox-card no-print" style={{ padding: '16px 18px', marginBottom: 16 }}>
        {/* 1. 집단 필터 버튼 목록 (모바일 3열 2줄 정렬) */}
        <div className="group-filter-grid" style={{ marginBottom: 12 }}>
          <button
            onClick={() => setSelectedGroupFilter('all')}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: selectedGroupFilter === 'all' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              background: selectedGroupFilter === 'all' ? 'var(--primary)' : 'var(--bg-card)',
              color: selectedGroupFilter === 'all' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            전체 ({contacts.length}명)
          </button>
          {groups.map(g => {
            const isMyGroup = manager?.role === 'group' && (g.id === manager.group_id || g.name === manager.group_name);
            const countInGroup = contacts.filter(c => c.group_id === g.id || c.group_name === g.name).length;
            return (
              <button
                key={g.id}
                onClick={() => setSelectedGroupFilter(g.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedGroupFilter === g.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: selectedGroupFilter === g.id ? 'var(--primary)' : 'var(--bg-card)',
                  color: selectedGroupFilter === g.id ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span>{g.name}</span>
                {isMyGroup && (
                  <span style={{
                    fontSize: '0.66rem',
                    padding: '1px 4px',
                    borderRadius: 3,
                    background: selectedGroupFilter === g.id ? 'rgba(255,255,255,0.25)' : 'var(--primary-light)',
                    color: selectedGroupFilter === g.id ? '#fff' : 'var(--primary)',
                    fontWeight: 700
                  }}>
                    내 집단
                  </span>
                )}
                <span style={{ opacity: 0.75, fontSize: '0.74rem' }}>({countInGroup})</span>
              </button>
            );
          })}
        </div>

        {/* 2. 하단 컨트롤 바: 검색창 + 감독자/보조자 범례 (줄바꿈 및 정렬 방지) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 12
        }}>
          {/* Search Box: 반응형 확장 */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            <input
              type="text"
              placeholder="이름, 연락처, 주소, 비고 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{
                width: '100%',
                paddingLeft: 34,
                paddingRight: 12,
                paddingTop: 7,
                paddingBottom: 7,
                fontSize: '0.84rem',
                borderRadius: 'var(--radius-full)'
              }}
            />
          </div>

          {/* 감독자/보조자 ● 범례 안내 (가로 정렬 고정, 글자 줄바꿈 방지) */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            padding: '6px 14px',
            background: 'var(--bg-app)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
              <span style={{ color: '#2563eb', fontSize: '0.9rem', lineHeight: 1 }}>●</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>감독자</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
              <span style={{ color: '#10b981', fontSize: '0.9rem', lineHeight: 1 }}>●</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>보조자</span>
            </span>
          </div>
        </div>
      </div>

      {/* 헤더: 집단명, 총 인원 (인쇄일 삭제 및 깔끔한 좌우 정렬) */}
      <div className="emergency-print-header" style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid var(--border-color)', paddingBottom: 6 }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              회중 비상연락망 <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>({selectedGroupFilter === 'all' ? '전체' : (groups.find(g => g.id === selectedGroupFilter)?.name ? `${groups.find(g => g.id === selectedGroupFilter)?.name} 집단` : '선택 집단')})</span>
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              비상사태 및 재해시 비상연락망, 가족 대표자 및 주소 관리
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0, paddingLeft: 8 }}>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>총 {filteredContacts.length}명</span>
          </div>
        </div>
      </div>

      {/* Contacts Table: 이름, 전화, 직책, RP, 주소, 비상연락처, 관계 */}
      <div className="nfox-card emergency-table-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-container sticky-container">
          <table className="data-table data-table-sticky emergency-contacts-table" style={{ minWidth: 1040 }}>
            <thead>
              <tr>
                <th style={{ width: 110, minWidth: 110 }}>
                  이름 {selectedGroupFilter === 'all' && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }} className="no-print">(ㄱㄴ순)</span>}
                </th>
                <th style={{ width: 140, minWidth: 140 }}>전화</th>
                <th style={{ width: 85, minWidth: 85 }}>직책</th>
                <th style={{ width: 65, minWidth: 65, textAlign: 'center' }}>RP</th>
                <th style={{ minWidth: 260 }}>주소</th>
                <th style={{ width: 140, minWidth: 140 }}>비상연락처</th>
                <th style={{ width: 100, minWidth: 100 }}>관계</th>
                <th className="no-print" style={{ width: 80, minWidth: 80, textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    등록된 연락처가 없습니다. '시트 명단 동기화' 또는 '연락처 추가'를 눌러 등록하세요.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((c, idx) => {
                  const grp = groups.find(g => g.id === c.group_id);
                  const isOverseer = Boolean(grp?.overseer_name && grp.overseer_name.trim() === c.name.trim());
                  const isAssistant = Boolean(grp?.assistant_overseer_name && grp.assistant_overseer_name.trim() === c.name.trim());

                  // 가족 그룹 키 및 팔레트 확인
                  const familyHead = c.family_head?.trim();
                  const familyKey = `${c.group_id || 'unknown'}_${familyHead || ''}`;
                  const familyColor = familyHead ? familyColorMap.get(familyKey) : null;
                  const isFamilyHead = Boolean(familyHead && c.name.trim() === familyHead);

                  // 가족 묶음 지정 하이라이트 (셀 배경색과 왼쪽 테두리 악센트)
                  let rowBg = 'transparent';
                  let borderLeftStyle = '4px solid transparent';
                  if (familyColor) {
                    rowBg = familyColor.bg;
                    borderLeftStyle = `4px solid ${familyColor.border}`;
                  }

                  return (
                    <React.Fragment key={c.id}>
                      <tr
                        style={{
                          backgroundColor: rowBg,
                          borderLeft: borderLeftStyle,
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        {/* 1. 이름 (첫 열 고정, 가족 하이라이트 배경색 이름 열까지 유지) */}
                        <td style={{
                          minWidth: 110,
                          backgroundColor: rowBg !== 'transparent' ? rowBg : undefined
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const pubId = c.publisher_id || c.id;
                                setCardModalData({ id: pubId, name: c.name });
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                fontWeight: 700,
                                color: 'var(--primary)',
                                fontSize: '0.92rem',
                                textAlign: 'left',
                                whiteSpace: 'nowrap'
                              }}
                              className="name-link-btn"
                              title={`${c.name}${isOverseer ? ' (집단 감독자)' : (isAssistant ? ' (보조 감독자)' : '')} 전도인 기록 카드(S-21) 열기`}
                            >
                              {c.name}
                            </button>
                            {/* 감독자: 파란색 ● / 보조자: 초록색 ● 표시 */}
                            {isOverseer && (
                              <span
                                style={{
                                  color: '#2563eb',
                                  fontSize: '0.8rem',
                                  lineHeight: 1,
                                  cursor: 'help',
                                  marginLeft: 1
                                }}
                                title="집단 감독자"
                              >
                                ●
                              </span>
                            )}
                            {isAssistant && (
                              <span
                                style={{
                                  color: '#10b981',
                                  fontSize: '0.8rem',
                                  lineHeight: 1,
                                  cursor: 'help',
                                  marginLeft: 1
                                }}
                                title="보조 감독자"
                              >
                                ●
                              </span>
                            )}
                            {selectedGroupFilter === 'all' && (
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '1px 5px',
                                borderRadius: 4,
                                background: 'var(--bg-main)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-muted)',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}>
                                {grp ? `${grp.name}집단` : '미지정'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. 전화 */}
                        <td>
                          {c.phone ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <a
                                href={`tel:${c.phone.replace(/[^0-9]/g, '')}`}
                                style={{ textDecoration: 'none', color: 'var(--text-color)', fontWeight: 600 }}
                                title="전화 걸기"
                              >
                                {c.phone}
                              </a>
                              <button
                                onClick={() => handleCopyText(c.phone!, c.id + '_p')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-faint)' }}
                                title="전화번호 복사"
                              >
                                {copiedId === c.id + '_p' ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-faint)' }}>-</span>
                          )}
                        </td>

                        {/* 3. 직책 */}
                        <td>
                          {c.position && c.position !== '일반' ? (
                            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                              {c.position === '봉사의 종' ? '봉종' : c.position}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-faint)' }}>-</span>
                          )}
                        </td>

                        {/* 4. RP */}
                        <td style={{ textAlign: 'center' }}>
                          {c.rp === 'RP' ? (
                            <span className="badge badge-rp" style={{ fontSize: '0.72rem' }}>
                              RP
                            </span>
                          ) : c.rp === 'SP' ? (
                            <span className="badge badge-rp" style={{ fontSize: '0.72rem' }}>
                              SP
                            </span>
                          ) : c.rp === 'FM' ? (
                            <span className="badge badge-rp" style={{ fontSize: '0.72rem' }}>
                              FM
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-faint)' }}>-</span>
                          )}
                        </td>

                        {/* 5. 주소 */}
                        <td>
                          {c.address ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: 280, fontSize: '0.85rem' }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {c.address}
                              </span>
                              <button
                                onClick={() => handleCopyText(c.address!, c.id + '_addr')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-faint)' }}
                                title="주소 복사"
                              >
                                {copiedId === c.id + '_addr' ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-faint)' }}>-</span>
                          )}
                        </td>

                        {/* 6. 비상연락처 */}
                        <td>
                          {c.emergency_phone ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-rose)' }}>
                              <a
                                href={`tel:${c.emergency_phone.replace(/[^0-9]/g, '')}`}
                                style={{ textDecoration: 'none', color: 'var(--accent-rose)', fontWeight: 600 }}
                                title="비상전화 걸기"
                              >
                                {c.emergency_phone}
                              </a>
                              <button
                                onClick={() => handleCopyText(c.emergency_phone!, c.id + '_ep')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-faint)' }}
                                title="비상연락처 복사"
                              >
                                {copiedId === c.id + '_ep' ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-faint)' }}>-</span>
                          )}
                        </td>

                        {/* 7. 비상연락처와의 관계 */}
                        <td>
                          {c.relationship ? (
                            <span style={{ fontSize: '0.86rem', color: 'var(--text-color)', fontWeight: 500 }}>
                              {c.relationship}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-faint)' }}>-</span>
                          )}
                        </td>

                        {/* 관리 (인쇄 시 숨김) */}
                        <td className="no-print" style={{ textAlign: 'center' }}>
                          {canEditContact(c) ? (
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.78rem', gap: 4 }}
                            >
                              <Edit3 size={13} /> 수정
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>-</span>
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 연락처 추가/수정 모달: 이름, 전화, 직책, RP, 주소, 비상연락처, 관계 */}
      {/* ------------------------------------------------------------- */}
      {modalOpen && editingContact && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            overlayMouseDownRef.current = e.target === e.currentTarget;
          }}
          onClick={(e) => {
            if (overlayMouseDownRef.current && e.target === e.currentTarget) {
              setModalOpen(false);
            }
            overlayMouseDownRef.current = false;
          }}
        >
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {editingContact.publisher_id ? '비상연락망 정보 수정' : '신규 비상연락처 추가'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSaveContact}
              onKeyDown={(e) => {
                // 한글 조합 및 input 엔터 시 자동 submit으로 팝업 닫힘 방지
                if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                  e.preventDefault();
                }
              }}
            >
              {/* === 상단: 기본 인적사항 === */}
              <div style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 14px',
                marginBottom: 12
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  기본 인적사항
                </div>

                {/* 1. 이름 & 소속 집단 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
                    <label className="form-label" style={{ whiteSpace: 'nowrap' }}>
                      이름 <span style={{ color: 'var(--accent-rose)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="성명 입력"
                      value={editingContact.name || ''}
                      onChange={e => setEditingContact({ ...editingContact, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
                    <label className="form-label" style={{ whiteSpace: 'nowrap' }}>소속 집단</label>
                    <select
                      className="form-select"
                      value={editingContact.group_id || ''}
                      disabled={manager?.role === 'group'}
                      onChange={e => setEditingContact({ ...editingContact, group_id: e.target.value })}
                    >
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name} 집단</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. 성별 & 직책 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
                    <label className="form-label" style={{ whiteSpace: 'nowrap' }}>성별</label>
                    <select
                      className="form-select"
                      value={editingContact.gender || '남'}
                      onChange={e => setEditingContact({ ...editingContact, gender: e.target.value as Gender })}
                    >
                      <option value="남">남</option>
                      <option value="여">여</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
                    <label className="form-label" style={{ whiteSpace: 'nowrap' }}>직책</label>
                    <select
                      className="form-select"
                      disabled={editingContact.is_child || isChildStatus(editingContact.rp)}
                      value={(editingContact.is_child || isChildStatus(editingContact.rp)) ? '' : (editingContact.position === '장로' || editingContact.position === '봉종' ? editingContact.position : (editingContact.position === '봉사의 종' ? '봉종' : ''))}
                      onChange={e => setEditingContact({ ...editingContact, position: e.target.value })}
                    >
                      <option value="">(선택 안 함)</option>
                      <option value="장로">장로</option>
                      <option value="봉종">봉종</option>
                    </select>
                  </div>
                </div>

                {/* 3. 구분 & 구별 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
                    <label className="form-label" style={{ whiteSpace: 'nowrap' }}>구분</label>
                    <select
                      className="form-select"
                      value={
                        editingContact.is_child || isChildStatus(editingContact.rp)
                          ? '자녀'
                          : (['RP', 'SP', 'FM'].includes(editingContact.rp || '') ? editingContact.rp : '')
                      }
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '자녀') {
                          setEditingContact({
                            ...editingContact,
                            rp: '자녀',
                            position: '',
                            is_child: true,
                            special_notes: ((editingContact.special_notes || '') + ' [자녀]').trim()
                          });
                        } else {
                          const cleanNotes = (editingContact.special_notes || '').replace(/\[자녀\]/g, '').trim();
                          setEditingContact({
                            ...editingContact,
                            rp: val,
                            is_child: false,
                            special_notes: cleanNotes
                          });
                        }
                      }}
                    >
                      <option value="">(선택 안 함)</option>
                      <option value="RP">RP (정규 파이오니아)</option>
                      <option value="SP">SP (특별 파이오니아)</option>
                      <option value="FM">FM (선교인)</option>
                      <option value="자녀">자녀</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
                    <label className="form-label" style={{ whiteSpace: 'nowrap' }}>구별</label>
                    <select
                      className="form-select"
                      value={editingContact.hope || '다른 양'}
                      onChange={e => setEditingContact({ ...editingContact, hope: e.target.value as Hope })}
                    >
                      <option value="다른 양">다른 양</option>
                      <option value="기름부음받은 자">기름부음받은 자</option>
                    </select>
                  </div>
                </div>

                {(editingContact.is_child || isChildStatus(editingContact.rp)) && (
                  <div style={{
                    marginTop: -2,
                    marginBottom: 10,
                    padding: '7px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    color: '#d97706',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <Info size={14} style={{ flexShrink: 0 }} />
                    <span><strong>미침례 어린 자녀:</strong> 활동 전도인 명단과 봉사 통계에서 제외되며, <strong>비상연락망</strong>에만 보호자와 함께 등록되어 표시됩니다.</span>
                  </div>
                )}

                {/* 4. 생년월일 & 침례일자 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
                    <label className="form-label" style={{ whiteSpace: 'nowrap' }}>생년월일</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editingContact.birth_date || ''}
                      onChange={e => setEditingContact({ ...editingContact, birth_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
                    <label className="form-label" style={{ whiteSpace: 'nowrap' }}>
                      침례일자 <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>(선택)</span>
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={editingContact.baptism_date || ''}
                      onChange={e => setEditingContact({ ...editingContact, baptism_date: e.target.value })}
                    />
                  </div>
                </div>

                {/* 5. 비고 */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">비고</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="예: 농아인, 맹인 등"
                    value={editingContact.special_notes || ''}
                    onChange={e => setEditingContact({ ...editingContact, special_notes: e.target.value })}
                  />
                </div>
              </div>

              {/* === 하단: 비상연락망 정보 (전화번호, 가족 대표자, 주소, 비상연락처, 관계) === */}
              <div style={{
                background: 'rgba(244, 63, 94, 0.03)',
                border: '1px solid rgba(244, 63, 94, 0.18)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 14px',
                marginBottom: 12
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f43f5e', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  비상연락망 정보
                  <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>(비상연락망 항목)</span>
                </div>

                {/* 1. 전화번호 & 가족 대표자 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
                    <label className="form-label" style={{ whiteSpace: 'nowrap' }}>전화번호</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="010-0000-0000"
                      value={editingContact.phone || ''}
                      onChange={e => setEditingContact({ ...editingContact, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>가족 대표자</label>
                      {editingContact.family_head ? (
                        <button
                          type="button"
                          onClick={() => setEditingContact({ ...editingContact, family_head: '' })}
                          style={{
                            background: 'none',
                            color: 'var(--accent-rose)',
                            border: 'none',
                            padding: 0,
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          해제
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (editingContact.name) {
                              setEditingContact({
                                ...editingContact,
                                family_head: editingContact.name.trim()
                              });
                            }
                          }}
                          style={{
                            background: 'var(--primary)',
                            color: '#fff',
                            border: 'none',
                            padding: '1px 6px',
                            borderRadius: 3,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          본인 지정
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      list="family-head-options"
                      className="form-input"
                      placeholder="가족 대표자 성명"
                      value={editingContact.family_head || ''}
                      onChange={e => setEditingContact({ ...editingContact, family_head: e.target.value })}
                    />
                    <datalist id="family-head-options">
                      {contacts
                        .filter(c => c.group_id === editingContact.group_id && c.name)
                        .map(c => (
                          <option key={c.id} value={c.name} />
                        ))}
                    </datalist>
                  </div>
                </div>

                {/* 2. 주소 */}
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label">주소</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="예: 강원도 춘천시 ..."
                    value={editingContact.address || ''}
                    onChange={e => setEditingContact({ ...editingContact, address: e.target.value })}
                  />
                </div>

                {/* 3. 비상연락처 & 관계 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
                    <label className="form-label" style={{ whiteSpace: 'nowrap' }}>비상연락처 (보호자)</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="010-0000-0000"
                      value={editingContact.emergency_phone || ''}
                      onChange={e => setEditingContact({ ...editingContact, emergency_phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
                    <label className="form-label" style={{ whiteSpace: 'nowrap' }}>이름, 관계</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="예: 홍길동, 부친"
                      value={editingContact.relationship || ''}
                      onChange={e => setEditingContact({ ...editingContact, relationship: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                marginTop: 18
              }}>
                {editingContact?.publisher_id && isSuperAdmin ? (
                  <button
                    type="button"
                    onClick={handleDeleteContact}
                    style={{
                      background: 'rgba(244, 63, 94, 0.1)',
                      color: 'var(--accent-rose)',
                      border: '1px solid rgba(244, 63, 94, 0.25)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    <Trash2 size={14} /> <span>전도인 삭제</span>
                  </button>
                ) : <div />}
                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'nowrap' }}>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.84rem', whiteSpace: 'nowrap' }}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ padding: '8px 18px', fontSize: '0.84rem', gap: 5, whiteSpace: 'nowrap' }}
                  >
                    <Check size={16} /> <span>저장</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ------------------------------------------------------------- */}
      {/* 가족 묶음 일괄 지정 모달 */}
      {/* ------------------------------------------------------------- */}
      {familyBatchModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            overlayMouseDownRef.current = e.target === e.currentTarget;
          }}
          onClick={(e) => {
            if (overlayMouseDownRef.current && e.target === e.currentTarget) {
              setFamilyBatchModalOpen(false);
            }
            overlayMouseDownRef.current = false;
          }}
        >
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: 'var(--accent-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                    가족 묶음 지정 및 셀 색상 구분
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    한 가족으로 묶으면 비상연락망에서 고유 파스텔 배경색과 배지로 함께 모여 표시됩니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFamilyBatchModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveFamilyBatch}>
              {/* 집단 선택 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>소속 집단</label>
                  <select
                    className="form-select"
                    value={targetGroupIdForFamily}
                    disabled={manager?.role === 'group'}
                    onChange={(e) => {
                      setTargetGroupIdForFamily(e.target.value);
                      setSelectedMemberIds({});
                    }}
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name} 집단</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    가족 대표자 이름 <span style={{ color: 'var(--accent-rose)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="이름을 입력해 주세요"
                      value={batchFamilyHead}
                      onChange={(e) => setBatchFamilyHead(e.target.value)}
                      required
                    />
                    <select
                      className="form-select"
                      style={{ width: 110 }}
                      onChange={(e) => {
                        if (e.target.value) setBatchFamilyHead(e.target.value);
                      }}
                      value=""
                    >
                      <option value="">추천 선택</option>
                      {contacts
                        .filter(c => c.group_id === targetGroupIdForFamily)
                        .map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 가족 구성원 선택 (가족 대표 아래로 묶기) */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  <span>해당 집단 전도인 중 가족 구성원 선택:</span>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    선택된 구성원: {Object.values(selectedMemberIds).filter(Boolean).length}명
                  </span>
                </label>

                <div style={{
                  maxHeight: 280,
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  background: 'var(--bg-main)'
                }}>
                  {contacts
                    .filter(c => c.group_id === targetGroupIdForFamily)
                    .map(c => {
                      const isSelected = Boolean(selectedMemberIds[c.id]);
                      const isSameAsHead = batchFamilyHead.trim() && c.name.trim() === batchFamilyHead.trim();

                      return (
                        <div
                          key={c.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderBottom: '1px solid var(--border-color)',
                            background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                            borderRadius: 4,
                            marginBottom: 2
                          }}
                        >
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                setSelectedMemberIds({
                                  ...selectedMemberIds,
                                  [c.id]: e.target.checked
                                });
                              }}
                            />
                            <span style={{ fontWeight: isSelected ? 700 : 500, fontSize: '0.88rem' }}>
                              {c.name}
                            </span>
                            {c.position && (
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                ({c.position === '봉사의 종' ? '봉종' : c.position})
                              </span>
                            )}
                            {c.rp && <span style={{ fontSize: '0.72rem', color: 'var(--primary)' }}>[{c.rp}]</span>}
                            {isSameAsHead && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700, marginLeft: 6 }}>
                                [세대주 본인]
                              </span>
                            )}
                            {c.family_head && !isSameAsHead && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginLeft: 'auto', marginRight: 10 }}>
                                현재 세대주: {c.family_head}
                              </span>
                            )}
                          </label>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div style={{
                background: 'var(--bg-main)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: 20
              }}>
                🎨 <strong>색상 표시 안내</strong>: 같은 세대주로 묶인 가족 구성원(2인 이상)은 비상연락망에서 <strong>동일한 파스텔 배경색과 고유 테두리선</strong>이 적용되어 연속으로 모여서 표시됩니다.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setFamilyBatchModalOpen(false)} className="btn-secondary">
                  취소
                </button>
                <button type="submit" className="btn-primary" style={{ gap: 6 }}>
                  <Check size={16} /> 가족 묶음 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* S-21 전도인 기록 카드 모달 */}
      {cardModalData && (
        <PublisherCardModal
          serviceYear={currentYear}
          publisherId={cardModalData.id}
          publisherName={cardModalData.name}
          onClose={() => setCardModalData(null)}
        />
      )}
    </div>
  );
};
