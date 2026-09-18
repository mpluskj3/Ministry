import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  FileText, 
  Search, 
  Check, 
  X, 
  Phone, 
  Calendar,
  UserX,
  RotateCcw,
  AlertTriangle,
  MapPin,
  HeartPulse,
  Info,
  Building2,
  Archive,
  Download,
  Upload,
  AlertCircle,
  ExternalLink,
  FileSpreadsheet
} from 'lucide-react';
import { Publisher, Group, ServiceYear, Position, PioneerStatus, Hope, Gender, isChildStatus, Manager } from '../types/database';
import { 
  getPublishers, 
  getGroups, 
  savePublisher, 
  deactivatePublisher,
  restorePublisher,
  deletePublisher,
  getLatestPioneerStatusMap,
  resolveEffectivePioneerStatus
} from '../services/ministryService';

// 만 나이 계산 헬퍼 (생년월일 기준 정확한 만 나이: 만??세)
export const calculateAge = (birthDate?: string | null): string => {
  if (!birthDate) return '-';
  const match = birthDate.match(/(\d{4})\D*(\d{1,2})?\D*(\d{1,2})?/);
  if (!match) return '-';
  const birthYear = parseInt(match[1], 10);
  if (isNaN(birthYear) || birthYear < 1900 || birthYear > 2100) return '-';

  const today = new Date();
  const birthMonth = match[2] ? parseInt(match[2], 10) : 1;
  const birthDay = match[3] ? parseInt(match[3], 10) : 1;

  let age = today.getFullYear() - birthYear;
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--;
  }

  return age >= 0 ? `만${age}세` : '-';
};
import { PublisherCardModal } from './PublisherCardModal';
import { EmergencyContacts } from './EmergencyContacts';

interface PublisherManagementProps {
  currentYear: ServiceYear;
  manager?: Manager | null;
  initialSubTab?: 'active' | 'inactive' | 'emergency';
}

export const PublisherManagement: React.FC<PublisherManagementProps> = ({ currentYear, manager, initialSubTab = 'active' }) => {
  const [allPublishers, setAllPublishers] = useState<Publisher[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const isSuperAdmin = manager?.role === 'super' || (!manager && import.meta.env.DEV);

  // 활성 전도인 vs 전출/무활동 보관함 vs 비상연락망 탭
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'inactive' | 'emergency'>(initialSubTab);

  // 전도인 등록/수정 모달
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPublisher, setEditingPublisher] = useState<Partial<Publisher> | null>(null);

  // 전출/무활동 처리 모달
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [targetPublisher, setTargetPublisher] = useState<Publisher | null>(null);
  const [deactivateReason, setDeactivateReason] = useState('이사/전출');

  // 전도인 기록 카드(S-21) 모달
  const [cardModalData, setCardModalData] = useState<{ id: string; name: string } | null>(null);

  // 최근 봉사 보고서 기반 AP/RP 상태 맵
  const [latestStatusMap, setLatestStatusMap] = useState<Map<string, string>>(new Map());

  // 구글 시트 / 엑셀 표 명단 복사·동기화 모달
  const [sheetSyncModalOpen, setSheetSyncModalOpen] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  // 모달 배경 드래그 오인 클릭 방지용 ref
  const overlayMouseDownRef = useRef(false);


  const handleImportPublishers = async () => {
    if (!isSuperAdmin) {
      alert('시트 명단 복사·가져오기는 최고관리자만 가능합니다.');
      return;
    }

    if (!csvInput.trim()) {
      alert('구글 시트에서 복사한 표 데이터 또는 CSV 내용을 입력해주세요.');
      return;
    }

    try {
      const lines = csvInput.trim().split(/\r?\n/);
      if (lines.length < 1) {
        alert('데이터가 없습니다.');
        return;
      }

      const parseRow = (lineStr: string): string[] => {
        if (lineStr.includes('\t')) {
          return lineStr.split('\t').map(c => c.trim().replace(/^["']|["']$/g, ''));
        }
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < lineStr.length; i++) {
          const char = lineStr[i];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim().replace(/^["']|["']$/g, ''));
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim().replace(/^["']|["']$/g, ''));
        return result;
      };

      const headerLine = parseRow(lines[0]);
      const hasHeader = headerLine.some(h => {
        const clean = h.replace(/\s+/g, '');
        return clean.includes('이름') || clean.includes('성명') || clean.includes('직책') || clean.includes('구분') || clean.includes('생년월일');
      });

      let nameIdx = -1;
      let posIdx = -1;
      let rpIdx = -1;
      let birthIdx = -1;
      let baptIdx = -1;
      let genderIdx = -1;
      let hopeIdx = -1;
      let groupIdx = -1;
      let phoneIdx = -1;
      let emPhoneIdx = -1;
      let relIdx = -1;
      let addrIdx = -1;

      if (hasHeader) {
        nameIdx = headerLine.findIndex(h => {
          const clean = h.replace(/\s+/g, '');
          return clean.includes('이름') || clean.includes('성명');
        });
        posIdx = headerLine.findIndex(h => h.replace(/\s+/g, '').includes('직책'));
        rpIdx = headerLine.findIndex(h => {
          const clean = h.replace(/\s+/g, '').toUpperCase();
          return clean.includes('RP') || clean.includes('구분') || clean.includes('파이오니아');
        });
        birthIdx = headerLine.findIndex(h => {
          const clean = h.replace(/\s+/g, '');
          return clean.includes('생년월일') || clean.includes('출생');
        });
        baptIdx = headerLine.findIndex(h => {
          const clean = h.replace(/\s+/g, '');
          return clean.includes('침례') || clean.includes('침례일자');
        });
        genderIdx = headerLine.findIndex(h => h.replace(/\s+/g, '').includes('성별'));
        hopeIdx = headerLine.findIndex(h => h.replace(/\s+/g, '').includes('희망'));
        groupIdx = headerLine.findIndex(h => {
          const clean = h.replace(/\s+/g, '');
          return clean.includes('집단') || clean.includes('구역');
        });
        emPhoneIdx = headerLine.findIndex(h => {
          const clean = h.replace(/\s+/g, '');
          return clean.includes('비상') || clean.includes('보호자');
        });
        phoneIdx = headerLine.findIndex((h, idx) => {
          const clean = h.replace(/\s+/g, '');
          return idx !== emPhoneIdx && (clean.includes('전화') || clean.includes('연락처') || clean.includes('휴대폰'));
        });
        relIdx = headerLine.findIndex(h => {
          const clean = h.replace(/\s+/g, '');
          return clean.includes('관계') || clean.includes('세대주');
        });
        addrIdx = headerLine.findIndex(h => {
          const clean = h.replace(/\s+/g, '');
          return clean.includes('주소') || clean.includes('거주지');
        });
      }

      if (nameIdx === -1) nameIdx = 0;

      let countAdded = 0;
      let countUpdated = 0;
      const startRow = hasHeader ? 1 : 0;

      for (let i = startRow; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = parseRow(line);
        const name = cols[nameIdx]?.trim();
        if (!name || name === '이름' || name === '성명') continue;

        const rawPos = posIdx !== -1 && cols[posIdx] !== undefined ? cols[posIdx].trim() : '';
        const rawRp = rpIdx !== -1 && cols[rpIdx] !== undefined ? cols[rpIdx].trim() : '';
        const rawBirth = birthIdx !== -1 && cols[birthIdx] !== undefined ? cols[birthIdx].trim() : '';
        const rawBapt = baptIdx !== -1 && cols[baptIdx] !== undefined ? cols[baptIdx].trim() : '';
        const rawGender = genderIdx !== -1 && cols[genderIdx] !== undefined ? cols[genderIdx].trim() : '';
        const rawHope = hopeIdx !== -1 && cols[hopeIdx] !== undefined ? cols[hopeIdx].trim() : '';
        const rawGroup = groupIdx !== -1 && cols[groupIdx] !== undefined ? cols[groupIdx].trim() : '';
        const rawPhone = phoneIdx !== -1 && cols[phoneIdx] !== undefined ? cols[phoneIdx].trim() : '';
        const rawEmPhone = emPhoneIdx !== -1 && cols[emPhoneIdx] !== undefined ? cols[emPhoneIdx].trim() : '';
        const rawRel = relIdx !== -1 && cols[relIdx] !== undefined ? cols[relIdx].trim() : '';
        const rawAddr = addrIdx !== -1 && cols[addrIdx] !== undefined ? cols[addrIdx].trim() : '';

        const matchedGroup = rawGroup ? groups.find(g => g.name === rawGroup || rawGroup.includes(g.name)) : undefined;

        let position: Position | undefined = undefined;
        if (rawPos.includes('장로')) position = '장로';
        else if (rawPos.includes('종') || rawPos.includes('봉종')) position = '봉종';
        else if (rawPos.includes('미침')) position = '미침';
        else if (rawPos.includes('전도인') || rawPos === '일반') position = '일반';

        // 실제 미침례 어린 자녀는 전도인이 아니므로 전도인 명단으로 가져오지 않고 건너뜀 (비상연락망에만 등록/표시)
        // 주의: 가족 관계(rawRel)가 '자녀'인 것은 세대주 기준 가족 호칭일 뿐이므로 제외 조건으로 사용하지 않음
        if (rawRp.includes('자녀') || rawPos.includes('자녀')) {
          continue;
        }

        let pioneer_status: PioneerStatus | undefined = undefined;
        if (rawRp.toUpperCase().includes('RP') || rawRp.includes('정규')) pioneer_status = 'RP';
        else if (rawRp.toUpperCase().includes('SP') || rawRp.includes('특별')) pioneer_status = 'SP';
        else if (rawRp.toUpperCase().includes('FM') || rawRp.includes('선교')) pioneer_status = 'FM';
        else pioneer_status = '일반';

        let gender: Gender | undefined = undefined;
        if (rawGender.includes('남') || rawGender.toUpperCase() === 'M') gender = '남';
        else if (rawGender.includes('여') || rawGender.toUpperCase() === 'F') gender = '여';

        let hope: Hope | undefined = undefined;
        if (rawHope.includes('기름')) hope = '기름부음받은 자';
        else if (rawHope.includes('양')) hope = '다른 양';

        const formatDateStr = (d: string) => {
          if (!d) return undefined;
          const m = d.match(/(\d{4})\D*(\d{1,2})\D*(\d{1,2})/);
          if (m) {
            const y = m[1];
            const mo = m[2].padStart(2, '0');
            const day = m[3].padStart(2, '0');
            return `${y}-${mo}-${day}`;
          }
          return d;
        };

        const existing = allPublishers.find(p => p.name === name);
        if (existing) {
          await savePublisher({
            id: existing.id,
            name,
            group_id: matchedGroup ? matchedGroup.id : existing.group_id,
            position: position !== undefined ? position : existing.position,
            pioneer_status: pioneer_status !== undefined ? pioneer_status : existing.pioneer_status,
            birth_date: formatDateStr(rawBirth) || existing.birth_date,
            baptism_date: formatDateStr(rawBapt) || existing.baptism_date,
            gender: gender !== undefined ? gender : existing.gender,
            hope: hope !== undefined ? hope : existing.hope,
            phone: rawPhone || existing.phone,
            emergency_phone: rawEmPhone || existing.emergency_phone,
            relationship: rawRel || existing.relationship,
            address: rawAddr || existing.address,
            is_active: true
          });
          countUpdated++;
        } else {
          await savePublisher({
            name,
            group_id: matchedGroup ? matchedGroup.id : (groups[0]?.id || null),
            position: position || '일반',
            pioneer_status: pioneer_status || '일반',
            birth_date: formatDateStr(rawBirth) || '',
            baptism_date: formatDateStr(rawBapt) || '',
            gender: gender || '남',
            hope: hope || '다른 양',
            phone: rawPhone,
            emergency_phone: rawEmPhone,
            relationship: rawRel,
            address: rawAddr,
            is_active: true
          });
          countAdded++;
        }
      }

      setImportStatus({
        success: true,
        message: `동기화 완료! 신규 ${countAdded}명 추가, 기존 ${countUpdated}명의 정보가 최신으로 갱신되었습니다.`
      });
      await loadData();
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: '동기화 중 오류가 발생했습니다: ' + (err.message || '오류')
      });
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [pubs, grps, statusMap] = await Promise.all([
        getPublishers(true),
        getGroups(),
        getLatestPioneerStatusMap(currentYear?.id)
      ]);
      setAllPublishers(pubs);
      setGroups(grps);
      setLatestStatusMap(statusMap);
    } catch (err) {
      console.error('Failed to load publishers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSubTab, currentYear?.id]);

  // 비상연락망 등에서 데이터 저장 시 실시간 자동 동기화
  useEffect(() => {
    const handleGlobalUpdate = () => {
      loadData();
    };
    window.addEventListener('ministry_publishers_updated', handleGlobalUpdate);
    return () => {
      window.removeEventListener('ministry_publishers_updated', handleGlobalUpdate);
    };
  }, []);

  // 집단 관리자 로그인 시 기본적으로 자신의 집단을 기본 선택 필터로 지정 (단, 전체 및 타 집단 선택 가능)
  useEffect(() => {
    if (manager?.role === 'group') {
      const myGroupId = manager.group_id || groups.find(g => g.name === manager.group_name)?.id;
      if (myGroupId) {
        setSelectedGroupFilter(myGroupId);
      }
    }
  }, [manager, groups]);

  // 실제 미침례 어린 자녀(이지온 등)는 전도인이 아니므로 전도인 명단에서 제외 (비상연락망에만 등록 및 표시)
  // 비상연락처의 관계(relationship: '자녀')는 가족 대표자 기준 호칭일 뿐이므로 활동 전도인 판단 기준으로 사용하지 않음
  const isChild = (p: Publisher) => 
    isChildStatus(p.pioneer_status) || 
    isChildStatus(p.position) || 
    (p.special_notes && p.special_notes.includes('[자녀]'));
  const activePublishers = allPublishers.filter(p => p.is_active && !isChild(p));
  const inactivePublishers = allPublishers.filter(p => !p.is_active && !isChild(p));

  const handleOpenAdd = () => {
    if (!isSuperAdmin) {
      alert('신규 전도인 등록은 최고관리자만 가능합니다.');
      return;
    }

    const defaultGroupId = (manager?.role === 'group')
      ? (manager.group_id || groups.find(g => g.name === manager.group_name)?.id || groups[0]?.id || '')
      : (groups[0]?.id || '');

    setEditingPublisher({
      name: '',
      group_id: defaultGroupId,
      gender: '남',
      birth_date: '',
      baptism_date: '',
      hope: '다른 양',
      position: '일반',
      pioneer_status: '일반',
      phone: '',
      emergency_phone: '',
      address: '',
      family_head: '',
      relationship: '',
      special_notes: '',
      is_active: true,
    });
    setEditModalOpen(true);
  };

  const handleOpenEdit = (pub: Publisher) => {
    setEditingPublisher({ ...pub });
    setEditModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = editingPublisher?.name?.trim();
    if (!editingPublisher || !cleanName) {
      alert('전도인 이름을 입력해주세요.');
      return;
    }

    // 신규 등록 시 중복 이름 사전 검증
    if (!editingPublisher.id) {
      if (!isSuperAdmin) {
        alert('신규 전도인 등록은 최고관리자만 가능합니다.');
        return;
      }
      const existingActive = allPublishers.find(p => p.is_active && p.name === cleanName);
      if (existingActive) {
        alert(`'${cleanName}' 전도인은 이미 활동 전도인 명단에 등록되어 있습니다.\n(소속: ${existingActive.group_name || '미배정'})\n\n기존 전도인 정보를 수정하시거나, 동명이인인 경우 이름 뒤에 구분 기호(예: ${cleanName}A, ${cleanName}B 등)를 붙여주세요.`);
        return;
      }
      const existingInactive = allPublishers.find(p => !p.is_active && p.name === cleanName);
      if (existingInactive) {
        const restore = window.confirm(`'${cleanName}' 전도인은 현재 '전출/무활동 보관함'에 보관되어 있습니다.\n\n• [확인]: 보관함에서 활동 전도인 명단으로 즉시 복귀(복원)\n• [취소]: 등록 중단`);
        if (restore) {
          await handleRestore(existingInactive);
          setEditModalOpen(false);
          setEditingPublisher(null);
        }
        return;
      }
    } else {
      // 기존 전도인 이름 수정 시 다른 전도인과 이름 중복 검증
      const duplicate = allPublishers.find(p => p.id !== editingPublisher.id && p.name === cleanName);
      if (duplicate) {
        alert(`'${cleanName}' 이름은 다른 전도인이 이미 사용 중입니다.\n동명이인의 경우 이름 뒤에 구분 기호(예: ${cleanName}A, ${cleanName}B 등)를 붙여주세요.`);
        return;
      }
    }

    try {
      await savePublisher({ ...editingPublisher, name: cleanName });
      setEditModalOpen(false);
      setEditingPublisher(null);
      await loadData();
      alert(`'${cleanName}' 전도인 정보가 성공적으로 저장되었습니다.`);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('unique_publisher_name') || msg.includes('duplicate key')) {
        alert(`'${cleanName}' 전도인은 데이터베이스에 이미 등록되어 있습니다.\n동명이인의 경우 이름 뒤에 구분 기호(예: ${cleanName}A, ${cleanName}B 등)를 입력해주세요.`);
      } else {
        alert('저장 실패: ' + (err.message || '오류 발생'));
      }
    }
  };

  // 전출 / 무활동 처리 모달 열기
  const handleOpenDeactivate = (pub: Publisher) => {
    if (!isSuperAdmin) {
      alert('전출 처리는 최고관리자만 수행할 수 있습니다.');
      return;
    }
    setTargetPublisher(pub);
    setDeactivateReason('이사/전출');
    setDeactivateModalOpen(true);
  };

  // 전출 / 무활동 처리 실행 (과거 보고 연계 보존)
  const handleConfirmDeactivate = async () => {
    if (!isSuperAdmin) {
      alert('전출 처리는 최고관리자만 수행할 수 있습니다.');
      return;
    }
    if (!targetPublisher) return;
    try {
      await deactivatePublisher(targetPublisher.id, deactivateReason);
      setDeactivateModalOpen(false);
      setTargetPublisher(null);
      await loadData();
      alert(`'${targetPublisher.name}' 전도인이 전출/무활동 보관함으로 안전하게 이동되었습니다.\n과거 봉사 보고 및 통계 기록은 그대로 유지됩니다.`);
    } catch (err: any) {
      alert('전출 처리 실패: ' + (err.message || '오류'));
    }
  };

  // 회중 복귀 (복원)
  const handleRestore = async (pub: Publisher) => {
    if (!isSuperAdmin) {
      alert('전도인 복원 처리는 최고관리자만 수행할 수 있습니다.');
      return;
    }
    if (!window.confirm(`'${pub.name}' 전도인을 활동 전도인 명단으로 복귀(복원)하시겠습니까?`)) return;
    try {
      await restorePublisher(pub.id);
      await loadData();
      alert(`'${pub.name}' 전도인이 활동 명단으로 복귀되었습니다.`);
    } catch (err: any) {
      alert('복원 실패: ' + (err.message || '오류'));
    }
  };

  // 영구 삭제 (보관함에서만 가능, 데이터베이스 완전 삭제)
  const handlePermanentDelete = async (id: string, name: string) => {
    if (!isSuperAdmin) {
      alert('전도인 영구 삭제는 최고관리자만 수행할 수 있습니다.');
      return;
    }
    if (!window.confirm(`⚠️ 경고: '${name}' 전도인을 영구 삭제하시겠습니까?\n영구 삭제 시 이 전도인의 모든 과거 봉사 보고 및 S-21 기록이 함께 삭제됩니다!`)) return;
    try {
      await deletePublisher(id);
      await loadData();
    } catch (err: any) {
      alert('영구 삭제 실패: ' + (err.message || '오류'));
    }
  };

  // 수정 모달 내에서 삭제 버튼 처리
  const handleDeleteFromEdit = async () => {
    if (!isSuperAdmin) {
      alert('전도인 삭제 및 전출 처리는 최고관리자만 수행할 수 있습니다.');
      return;
    }
    if (!editingPublisher || !editingPublisher.id) return;
    const pub = editingPublisher as Publisher;
    const name = pub.name || '해당 전도인';

    if (pub.is_active === false) {
      // 이미 전출/무활동 보관함에 있는 경우 -> 영구 삭제
      setEditModalOpen(false);
      await handlePermanentDelete(pub.id, name);
      return;
    }

    // 활동 전도인인 경우
    const action = window.confirm(
      `'${name}' 전도인을 삭제하시겠습니까?\n\n` +
      `• [확인]: '전출/무활동 보관함'으로 안전하게 이동 (과거 봉사 보고 및 통계 영구 보존 - 권장)\n` +
      `• [취소]: 완전 영구 삭제 여부 확인으로 이동`
    );

    if (action) {
      setEditModalOpen(false);
      handleOpenDeactivate(pub);
    } else {
      const hardDelete = window.confirm(
        `⚠️ 주의: '${name}' 전도인을 데이터베이스에서 '완전 영구 삭제'하시겠습니까?\n\n` +
        `영구 삭제 시 이 전도인의 모든 과거 봉사 보고 및 S-21 기록 카드가 함께 삭제됩니다.\n` +
        `정말로 영구 삭제를 진행하시겠습니까?`
      );
      if (hardDelete) {
        try {
          setEditModalOpen(false);
          await deletePublisher(pub.id);
          setEditingPublisher(null);
          await loadData();
          alert(`'${name}' 전도인이 데이터베이스에서 영구 삭제되었습니다.`);
        } catch (err: any) {
          alert('영구 삭제 실패: ' + (err.message || '오류'));
        }
      }
    }
  };

  // 필터링 (group_id 및 group_name 이중 매칭으로 안전하게 필터링)
  const currentList = activeSubTab === 'active' ? activePublishers : inactivePublishers;
  const targetFilterGroup = groups.find(g => g.id === selectedGroupFilter);
  const filteredPublishers = currentList.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      (p.phone && p.phone.includes(searchQuery.trim())) ||
      (p.address && p.address.toLowerCase().includes(searchQuery.trim().toLowerCase()));
    const matchesGroup = 
      selectedGroupFilter === 'all' || 
      p.group_id === selectedGroupFilter || 
      (targetFilterGroup && p.group_name === targetFilterGroup.name);
    return matchesSearch && matchesGroup;
  });

  // CSV 내보내기: 이름, 직책, RP, 생년월일, 침례일자, 집단, 성별, 구별, 나이, 비고
  const handleExportCsv = () => {
    if (filteredPublishers.length === 0) {
      alert('내보낼 전도인 데이터가 없습니다.');
      return;
    }
    const headers = ['이름', '직책', 'RP', '생년월일', '침례일자', '집단', '성별', '구별', '나이', '비고'];
    const rows = filteredPublishers.map(p => {
      const effectiveRp = (p.pioneer_status === 'AP' || p.pioneer_status === '일반') ? '' : (p.pioneer_status || '');
      return [
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.position && p.position !== '일반' ? (p.position === '봉사의 종' ? '봉종' : p.position) : '').replace(/"/g, '""')}"`,
        `"${(effectiveRp || '').replace(/"/g, '""')}"`,
        `"${(p.birth_date || '').replace(/"/g, '""')}"`,
        `"${(p.baptism_date || '').replace(/"/g, '""')}"`,
        `"${(p.group_name || '').replace(/"/g, '""')}"`,
        `"${(p.gender || '').replace(/"/g, '""')}"`,
        `"${(p.hope || '다른 양').replace(/"/g, '""')}"`,
        `"${calculateAge(p.birth_date)}"`,
        `"${(activeSubTab === 'inactive' ? (p.deactivated_reason || p.special_notes || '') : (p.special_notes || '')).replace(/"/g, '""')}"`
      ];
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `전도인명단_${activeSubTab === 'active' ? '활동' : '전출보관'}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 28px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24
      }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 4px 0' }}>전도인 명단 관리</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            {activeSubTab === 'emergency'
              ? '비상사태 및 재해 시 신속한 확인을 위한 전도인 비상연락망, 가족 대표자 및 주소 관리'
              : '활동 전도인 인적사항 관리 및 전출/이사 전도인 보관함 (과거 보고 기록 및 통계 영구 연동)'}
          </p>
        </div>

        {activeSubTab === 'active' && isSuperAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => {
                setImportStatus(null);
                setCsvInput('');
                setSheetSyncModalOpen(true);
              }}
              className="btn-secondary"
              style={{ gap: 6 }}
              title="구글 시트나 엑셀 표 데이터를 복사하여 붙여넣으면 전도인 명단을 자동으로 동기화합니다."
            >
              <FileSpreadsheet size={16} />
              <span>시트 명단 복사·가져오기</span>
            </button>
            <button onClick={handleOpenAdd} className="btn-primary" style={{ gap: 6 }}>
              <UserPlus size={16} />
              <span>신규 전도인 등록</span>
            </button>
          </div>
        )}

      </div>

      {/* 3 Sub-Tabs Switcher: 활동 전도인 vs 전출/무활동 보관함 vs 비상연락망 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: 2
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveSubTab('active')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              borderBottom: activeSubTab === 'active' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeSubTab === 'active' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeSubTab === 'active' ? 700 : 500,
              fontSize: '0.92rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={16} />
            <span>활동 전도인 ({activePublishers.length}명)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('inactive')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              borderBottom: activeSubTab === 'inactive' ? '2px solid var(--accent-rose)' : '2px solid transparent',
              color: activeSubTab === 'inactive' ? 'var(--accent-rose)' : 'var(--text-muted)',
              fontWeight: activeSubTab === 'inactive' ? 700 : 500,
              fontSize: '0.92rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Archive size={16} />
            <span>전출 / 무활동 보관함 ({inactivePublishers.length}명)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('emergency')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              borderBottom: activeSubTab === 'emergency' ? '2px solid #f43f5e' : '2px solid transparent',
              color: activeSubTab === 'emergency' ? '#f43f5e' : 'var(--text-muted)',
              fontWeight: activeSubTab === 'emergency' ? 700 : 500,
              fontSize: '0.92rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Phone size={16} />
            <span>비상연락망</span>
          </button>
        </div>

        {/* 비상연락망 탭 선택 시 우측 상단 액션 메뉴 (가족 묶음 지정, CSV 저장, 인쇄) 컨테이너 */}
        {activeSubTab === 'emergency' && (
          <div id="emergency-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingBottom: 4 }} />
        )}
      </div>

      {activeSubTab === 'emergency' ? (
        <EmergencyContacts 
          currentYear={currentYear}
          manager={manager}
          isEmbedded={true}
          onDataChanged={loadData}
        />
      ) : (
        <>
      {/* Filter and Search Bar */}
      <div className="nfox-card" style={{
        padding: '16px 20px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Group Filter Chips: 전체 및 각 집단 필터링 (집단 관리자는 본인 집단 기본 선택 및 '내 집단' 표시) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            집단 필터:
          </span>
          <button
            onClick={() => setSelectedGroupFilter('all')}
            style={{
              padding: '6px 14px',
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
            전체 ({currentList.length})
          </button>
          {groups.map(g => {
            const isMyGroup = manager?.role === 'group' && (g.id === manager.group_id || g.name === manager.group_name);
            const countInGroup = currentList.filter(p => p.group_id === g.id || p.group_name === g.name).length;
            return (
              <button
                key={g.id}
                onClick={() => setSelectedGroupFilter(g.id)}
                style={{
                  padding: '6px 14px',
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
                  gap: 5
                }}
              >
                <span>{g.name}</span>
                {isMyGroup && (
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '1px 5px',
                    borderRadius: 4,
                    background: selectedGroupFilter === g.id ? 'rgba(255,255,255,0.25)' : 'var(--primary-light)',
                    color: selectedGroupFilter === g.id ? '#fff' : 'var(--primary)',
                    fontWeight: 700
                  }}>
                    내 집단
                  </span>
                )}
                <span style={{ opacity: 0.75, fontSize: '0.76rem' }}>({countInGroup})</span>
              </button>
            );
          })}
        </div>

        {/* Search & Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            <input
              type="text"
              placeholder="전도인 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 34, paddingRight: 12, paddingTop: 6, paddingBottom: 6, fontSize: '0.84rem', width: 200, borderRadius: 'var(--radius-full)' }}
            />
          </div>

          <button
            onClick={handleExportCsv}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem', gap: 6 }}
          >
            <Download size={13} />
            <span>엑셀/CSV</span>
          </button>
        </div>
      </div>

      {/* Table Card: 이름, 직책, RP, 생년월일, 침례일자, 집단, 성별, 구별, 나이, 비고 */}
      <div className="nfox-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-container sticky-container">
          <table className="data-table data-table-sticky" style={{ minWidth: 1060 }}>
            <thead>
              <tr>
                <th style={{ width: 110, minWidth: 110 }}>이름</th>
                <th style={{ width: 85, minWidth: 85, textAlign: 'center' }}>직책</th>
                <th style={{ width: 65, minWidth: 65, textAlign: 'center' }}>RP</th>
                <th style={{ width: 105, minWidth: 105 }}>생년월일</th>
                <th style={{ width: 105, minWidth: 105 }}>침례일자</th>
                <th style={{ width: 90, minWidth: 90 }}>집단</th>
                <th style={{ width: 65, minWidth: 65, textAlign: 'center' }}>성별</th>
                <th style={{ width: 95, minWidth: 95 }}>구별</th>
                <th style={{ width: 70, minWidth: 70, textAlign: 'center' }}>나이</th>
                <th style={{ minWidth: 180 }}>비고</th>
                <th style={{ width: 110, minWidth: 110, textAlign: 'center' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredPublishers.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    {activeSubTab === 'active' ? '등록된 활동 전도인이 없습니다.' : '전출/삭제된 전도인이 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredPublishers.map((p) => (
                  <tr key={p.id}>
                    {/* 1. 이름: 클릭 시 S-21 전도인 기록 카드 모달 실행 */}
                    <td style={{ width: 110, minWidth: 110 }}>
                      <button
                        onClick={() => setCardModalData({ id: p.id, name: p.name })}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          margin: 0,
                          cursor: 'pointer',
                          fontWeight: 700,
                          color: 'var(--primary)',
                          fontSize: '0.92rem',
                          textAlign: 'left'
                        }}
                        className="name-link-btn"
                        title={`${p.name} 전도인 기록 카드(S-21) 열기`}
                      >
                        {p.name}
                      </button>
                    </td>

                    {/* 2. 직책 */}
                    <td style={{ textAlign: 'center' }}>
                      {p.position === '장로' ? (
                        <span className="badge badge-elder">장로</span>
                      ) : (p.position === '봉종' || p.position === '봉사의 종') ? (
                        <span className="badge badge-servant">봉종</span>
                      ) : p.position && p.position !== '일반' ? (
                        <span className="badge badge-publisher">{p.position}</span>
                      ) : (
                        <span style={{ color: 'var(--text-faint)' }}>-</span>
                      )}
                    </td>

                    {/* 3. RP */}
                    <td style={{ textAlign: 'center' }}>
                      {(() => {
                        const status = p.pioneer_status;
                        if (status === 'RP') return <span className="badge badge-rp">RP</span>;
                        if (status === 'SP') return <span className="badge badge-rp">SP</span>;
                        if (status === 'FM') return <span className="badge badge-rp">FM</span>;
                        if (isChildStatus(status)) return <span className="badge badge-child">자녀</span>;
                        if (status && status !== '일반' && status !== 'AP') return <span className="badge badge-rp">{status}</span>;
                        return <span style={{ color: 'var(--text-faint)' }}>-</span>;
                      })()}
                    </td>

                    {/* 4. 생년월일 */}
                    <td>
                      <span style={{ fontSize: '0.84rem' }}>{p.birth_date || '-'}</span>
                    </td>

                    {/* 5. 침례일자 */}
                    <td>
                      <span style={{ fontSize: '0.84rem' }}>{p.baptism_date || '-'}</span>
                    </td>

                    {/* 6. 집단 */}
                    <td>
                      <span className="badge badge-group">
                        {p.group_name || '미배정'}
                      </span>
                    </td>

                    {/* 7. 성별 */}
                    <td style={{ textAlign: 'center' }}>
                      {p.gender ? (
                        <span style={{ fontWeight: 600, color: p.gender === '남' ? 'var(--primary)' : 'var(--accent-rose)' }}>
                          {p.gender}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* 8. 구별 */}
                    <td>
                      <span style={{ fontSize: '0.84rem' }}>{p.hope || '다른 양'}</span>
                    </td>

                    {/* 9. 나이 */}
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 600 }}>{calculateAge(p.birth_date)}</span>
                    </td>

                    {/* 10. 비고 */}
                    <td>
                      {activeSubTab === 'inactive' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.12)', color: 'var(--accent-rose)', width: 'fit-content' }}>
                            {p.deactivated_reason || '이사/전출'}
                          </span>
                          {p.deactivated_at && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {new Date(p.deactivated_at).toLocaleDateString('ko-KR')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                          {p.special_notes || '-'}
                        </span>
                      )}
                    </td>

                    {/* 작업 버튼들 */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.78rem', gap: 4 }}
                          title="정보 수정"
                        >
                          <Edit3 size={13} /> 수정
                        </button>

                        {p.is_active ? (
                          isSuperAdmin && (
                            <button
                              onClick={() => handleOpenDeactivate(p)}
                              className="btn-secondary"
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: '0.78rem', 
                                color: 'var(--accent-rose)',
                                borderColor: 'rgba(244, 63, 94, 0.25)',
                                background: 'rgba(244, 63, 94, 0.05)'
                              }}
                              title="전출 / 무활동 처리 (보고 기록 보존)"
                            >
                              <UserX size={13} /> 전출
                            </button>
                          )
                        ) : (
                          <>
                            {isSuperAdmin && (
                              <button
                                onClick={() => handleRestore(p)}
                                className="btn-primary"
                                style={{ 
                                  padding: '4px 8px', 
                                  fontSize: '0.78rem',
                                  background: 'var(--accent-emerald)',
                                  gap: 4
                                }}
                                title="활동 전도인으로 복귀"
                              >
                                <RotateCcw size={13} /> 복원
                              </button>
                            )}
                            {isSuperAdmin && (
                              <button
                                onClick={() => handlePermanentDelete(p.id, p.name)}
                                className="btn-secondary"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.78rem',
                                  color: 'var(--accent-rose)',
                                  borderColor: 'rgba(244, 63, 94, 0.25)',
                                  background: 'rgba(244, 63, 94, 0.05)'
                                }}
                                title="완전 삭제 (복구 불가)"
                              >
                                <Trash2 size={13} /> 삭제
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 전도인 추가/수정 모달 */}
      {/* ------------------------------------------------------------- */}
      {editModalOpen && editingPublisher && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            overlayMouseDownRef.current = e.target === e.currentTarget;
          }}
          onClick={(e) => {
            if (overlayMouseDownRef.current && e.target === e.currentTarget) {
              setEditModalOpen(false);
            }
            overlayMouseDownRef.current = false;
          }}
        >
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {editingPublisher?.id ? '전도인 정보 수정' : '새 전도인 추가'}
              </h3>
              <button type="button" onClick={() => setEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <form
            onSubmit={handleSave}
            onKeyDown={(e) => {
            // 한글 조합 및 input 엔터 시 자동 submit으로 팝업 닫힌 방지
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
              padding: '14px 16px',
              marginBottom: 12
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                기본 인적사항
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">
                    이름 <span style={{ color: 'var(--accent-rose)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="이름을 입력해 주세요"
                    value={editingPublisher.name || ''}
                    onChange={(e) => setEditingPublisher({ ...editingPublisher, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">소속 집단</label>
                  <select
                    className="form-select"
                    value={editingPublisher.group_id || ''}
                    disabled={manager?.role === 'group'}
                    onChange={(e) => setEditingPublisher({ ...editingPublisher, group_id: e.target.value })}
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name} 집단</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">성별</label>
                  <select
                    className="form-select"
                    value={editingPublisher.gender || '남'}
                    onChange={(e) => setEditingPublisher({ ...editingPublisher, gender: e.target.value as Gender })}
                  >
                    <option value="남">남</option>
                    <option value="여">여</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">직책</label>
                  <select
                    className="form-select"
                    disabled={isChildStatus(editingPublisher.pioneer_status)}
                    value={isChildStatus(editingPublisher.pioneer_status) ? '' : (editingPublisher.position === '장로' || editingPublisher.position === '봉종' ? editingPublisher.position : (editingPublisher.position === '봉사의 종' ? '봉종' : ''))}
                    onChange={(e) => setEditingPublisher({ ...editingPublisher, position: (e.target.value || '일반') as Position })}
                  >
                    <option value="">(선택 안 함)</option>
                    <option value="장로">장로</option>
                    <option value="봉종">봉종</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">구분</label>
                  <select
                    className="form-select"
                    value={
                      isChildStatus(editingPublisher.pioneer_status)
                        ? '자녀 (집계 제외)'
                        : (['RP', 'SP', 'FM'].includes(editingPublisher.pioneer_status || '') ? editingPublisher.pioneer_status : '')
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '자녀 (집계 제외)') {
                        setEditingPublisher({
                          ...editingPublisher,
                          pioneer_status: '자녀 (집계 제외)',
                          position: '일반',
                          special_notes: ((editingPublisher.special_notes || '') + ' [자녀]').trim()
                        });
                      } else {
                        const cleanNotes = (editingPublisher.special_notes || '').replace(/\[자녀\]/g, '').trim();
                        setEditingPublisher({
                          ...editingPublisher,
                          pioneer_status: (val || '일반') as PioneerStatus,
                          special_notes: cleanNotes
                        });
                      }
                    }}
                  >
                    <option value="">(선택 안 함)</option>
                    <option value="RP">RP (정규 파이오니아)</option>
                    <option value="SP">SP (특별 파이오니아)</option>
                    <option value="FM">FM (선교인)</option>
                    <option value="자녀 (집계 제외)">자녀</option>
                  </select>
                </div>
              </div>

              {isChildStatus(editingPublisher.pioneer_status) && (
                <div style={{
                  marginTop: -4,
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
                  <span><strong>미침례 어린 자녀(활동 전도인 아님):</strong> 활동 전도인 명단과 봉사 통계에서 제외되며, <strong>비상연락망</strong>에만 등록되어 표시됩니다.</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">생년월일</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editingPublisher.birth_date || ''}
                    onChange={(e) => setEditingPublisher({ ...editingPublisher, birth_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    침례일자 <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>(미침례 시 비워둠)</span>
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={editingPublisher.baptism_date || ''}
                    onChange={(e) => setEditingPublisher({ ...editingPublisher, baptism_date: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">구별</label>
                  <select
                    className="form-select"
                    value={editingPublisher.hope || '다른 양'}
                    onChange={(e) => setEditingPublisher({ ...editingPublisher, hope: e.target.value as Hope })}
                  >
                    <option value="다른 양">다른 양</option>
                    <option value="기름부음받은 자">기름부음받은 자</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">비고</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="예: 농아인, 맹인 등"
                    value={editingPublisher.special_notes || ''}
                    onChange={(e) => setEditingPublisher({ ...editingPublisher, special_notes: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* === 하단: 비상연락망 정보 (전화번호, 주소, 비상연락처, 관계, 가족 대표자) === */}
            <div style={{
              background: 'rgba(244, 63, 94, 0.03)',
              border: '1px solid rgba(244, 63, 94, 0.18)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: 12
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f43f5e', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                비상연락망 정보
                <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>(비상연락망 항목)</span>
              </div>

              {/* 전화번호 & 가족 대표자 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">전화번호</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="010-0000-0000"
                    value={editingPublisher.phone || ''}
                    onChange={(e) => setEditingPublisher({ ...editingPublisher, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">가족 대표자</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="가족 대표자 성명"
                    value={editingPublisher.family_head || ''}
                    onChange={(e) => setEditingPublisher({ ...editingPublisher, family_head: e.target.value })}
                  />
                </div>
              </div>

              {/* 주소 */}
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">주소</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 강원도 춘천시 ..."
                  value={editingPublisher.address || ''}
                  onChange={(e) => setEditingPublisher({ ...editingPublisher, address: e.target.value })}
                />
              </div>

              {/* 비상연락처 & 관계 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">비상연락처 (가족/보호자)</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="010-0000-0000"
                    value={editingPublisher.emergency_phone || ''}
                    onChange={(e) => setEditingPublisher({ ...editingPublisher, emergency_phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">이름, 관계</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="예: 홍길동(배우자), 본인 등"
                    value={editingPublisher.relationship || ''}
                    onChange={(e) => setEditingPublisher({ ...editingPublisher, relationship: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              {editingPublisher?.id && isSuperAdmin && (
                <button
                  type="button"
                  onClick={handleDeleteFromEdit}
                  style={{
                    background: 'rgba(244, 63, 94, 0.1)',
                    color: 'var(--accent-rose)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Trash2 size={15} /> 전도인 삭제
                </button>
              )}
              <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
                <button type="button" onClick={() => setEditModalOpen(false)} className="btn-secondary">
                  취소
                </button>
                <button type="submit" className="btn-primary" style={{ gap: 6 }}>
                  <Check size={16} /> 저장
                </button>
              </div>
            </div>
          </form>
          </div>
        </div>
      )}
      {/* ------------------------------------------------------------- */}
      {/* 전출 / 무활동 처리 모달 */}
      {/* ------------------------------------------------------------- */}
      {deactivateModalOpen && targetPublisher && (
        <div 
          className="modal-overlay" 
          onMouseDown={(e) => {
            overlayMouseDownRef.current = e.target === e.currentTarget;
          }}
          onClick={(e) => {
            if (overlayMouseDownRef.current && e.target === e.currentTarget) {
              setDeactivateModalOpen(false);
            }
            overlayMouseDownRef.current = false;
          }}
        >
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(244, 63, 94, 0.12)',
                color: 'var(--accent-rose)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12
              }}>
                <UserX size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0' }}>
                전도인 전출 및 무활동 처리
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0 }}>
                <strong>{targetPublisher.name}</strong> 전도인을 활동 명단에서 제외합니다.
              </p>
            </div>

            <div style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              fontSize: '0.84rem',
              color: 'var(--text-color)',
              marginBottom: 18,
              lineHeight: 1.5
            }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: 700, color: 'var(--primary)' }}>
                🔒 데이터 안전 보존 안내:
              </p>
              전출 처리하더라도 전도인의 <strong>과거 모든 봉사 보고 내역과 S-21 기록 카드는 영구 보존</strong>되며 집계 통계에 계속 유지됩니다.
              나중에 언제든지 전출 보관함에서 <strong>[회중 복귀]</strong> 버튼을 눌러 다시 활성화할 수 있습니다.
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">전출 / 무활동 사유</label>
              <select
                className="form-select"
                value={deactivateReason}
                onChange={e => setDeactivateReason(e.target.value)}
              >
                <option value="다른 회중으로 이사/전출">다른 회중으로 이사/전출</option>
                <option value="타 지역 이사">타 지역 이사</option>
                <option value="무활동">무활동</option>
                <option value="사망">사망</option>
                <option value="기타">기타 사유</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeactivateModalOpen(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: 10, justifyContent: 'center' }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                className="btn-primary"
                style={{ 
                  flex: 1, 
                  padding: 10, 
                  justifyContent: 'center',
                  background: 'var(--accent-rose)'
                }}
              >
                전출 처리 완료
              </button>
            </div>
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

      {/* 구글 시트 / 엑셀 표 명단 복사·가져오기 동기화 모달 */}
      {sheetSyncModalOpen && isSuperAdmin && (
        <div 
          className="modal-overlay" 
          onMouseDown={(e) => {
            overlayMouseDownRef.current = e.target === e.currentTarget;
          }}
          onClick={(e) => {
            if (overlayMouseDownRef.current && e.target === e.currentTarget) {
              setSheetSyncModalOpen(false);
            }
            overlayMouseDownRef.current = false;
          }}
        >
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                    전도인 명단 구글 시트 / 엑셀 복사·가져오기
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    구글 시트(전체명단 또는 비상연락망)의 표 데이터를 복사하여 붙여넣으면 전도인 명단이 자동으로 동기화됩니다.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSheetSyncModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {importStatus && (
              <div style={{
                background: importStatus.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                border: importStatus.success ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                color: importStatus.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                {importStatus.success ? <Check size={18} /> : <AlertCircle size={18} />}
                <span>{importStatus.message}</span>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ marginBottom: 6 }}>
                구글 시트 또는 엑셀에서 복사한 표 데이터(Ctrl + V) 붙여넣기:
              </label>
              <textarea
                rows={11}
                className="form-input"
                placeholder={`이름\t직책\tRP\t생년월일\t침례일자\t성별\t희망\t집단\t전화\n강석찬\t장로\t\t1966-10-18\t1983-07-23\t남\t다른 양\t효자\t010-1234-5678\n김상만\t봉종\tRP\t1967-02-09\t1986-07-25\t남\t다른 양\t운교\t010-9876-5432`}
                value={csvInput}
                onChange={e => setCsvInput(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.4 }}
              />
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 6, display: 'block' }}>
                💡 <strong>지원 항목</strong>: 이름, 직책(장로/봉종), RP(일반/RP/자녀 등), 생년월일, 침례일자, 성별, 희망, 집단, 전화번호, 주소 등. 표를 복사하여 붙여넣으면 기존 전도인은 최신 정보로 갱신되고 새 전도인은 자동 추가됩니다.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 20, gap: 10 }}>
              <button type="button" onClick={() => setSheetSyncModalOpen(false)} className="btn-secondary">
                닫기
              </button>
              <button type="button" onClick={handleImportPublishers} className="btn-primary" style={{ gap: 6 }}>
                <Check size={16} /> 최신 명단 동기화 적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};