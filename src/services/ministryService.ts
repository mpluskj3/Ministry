import { getSupabaseClient } from './supabase';
import {
  ServiceYear,
  Group,
  Publisher,
  MonthlyStatus,
  MonthlyReport,
  Manager,
  MonthlyKpiStats,
  YearlyPublisherRecord,
  ServiceMonth,
  SERVICE_MONTHS,
  EmergencyContact,
  isChildStatus,
  getCurrentDateServiceMonth
} from '../types/database';

import actualData from '../data/actualData.json';

// -------------------------------------------------------------
// 구글 시트에서 가져온 실제 데이터 (5개 집단, 90명 전도인, 1,016건 보고서)
// -------------------------------------------------------------
const INITIAL_GROUPS: Group[] = actualData.groups as Group[];
const INITIAL_SERVICE_YEARS: ServiceYear[] = actualData.serviceYears as ServiceYear[];
const INITIAL_PUBLISHERS: Publisher[] = actualData.publishers as Publisher[];
const INITIAL_REPORTS: MonthlyReport[] = actualData.reports as MonthlyReport[];
const INITIAL_STATUSES = actualData.monthlyStatuses;

const LOCAL_STORAGE_PREFIX = 'ministry_mock_';

function getLocalData<T>(key: string, fallback: T): T {
  const data = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(fallback));
    return fallback;
  }
  try {
    const parsed = JSON.parse(data) as T;
    // 이전 더미 데이터(7명 전도인)가 저장되어 있으면 자동으로 실제 데이터로 갱신
    if (key === 'publishers' && Array.isArray(parsed)) {
      if (parsed.length < 20) {
        localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(fallback));
        return fallback;
      }
      // 최신 시트의 생년월일/침례일자 정보가 누락되었거나 성별이 기본값인 경우 자동 병합
      if (Array.isArray(fallback)) {
        const fallbackMap = new Map((fallback as any[]).map(f => [f.name, f]));
        let needsUpdate = false;
        const updated = parsed.map((p: any) => {
          const fb = fallbackMap.get(p.name);
          // 전도인 고정 직책에서 AP는 존재하지 않으므로 일반으로 정리
          const cleanPioneerStatus = p.pioneer_status === 'AP' ? '일반' : p.pioneer_status;
          if (p.pioneer_status === 'AP') {
            needsUpdate = true;
          }
          if (fb) {
            const birth_date = p.birth_date || fb.birth_date || '';
            const baptism_date = p.baptism_date || fb.baptism_date || '';
            const gender = (p.birth_date && p.gender) ? p.gender : (fb.gender || p.gender || '남');
            const hope = (p.birth_date && p.hope) ? p.hope : (fb.hope || p.hope || '다른 양');
            if (p.birth_date !== birth_date || p.baptism_date !== baptism_date || p.gender !== gender || p.hope !== hope) {
              needsUpdate = true;
            }
            return {
              ...p,
              pioneer_status: cleanPioneerStatus,
              birth_date,
              baptism_date,
              gender,
              hope
            };
          }
          return {
            ...p,
            pioneer_status: cleanPioneerStatus
          };
        });
        if (needsUpdate) {
          localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(updated));
          return updated as unknown as T;
        }
      }
    }
    if (key === 'groups' && Array.isArray(parsed) && parsed.length < 5) {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(fallback));
      return fallback;
    }
    if (key === 'monthly_reports' && Array.isArray(parsed)) {
      let reportNeedsUpdate = false;
      // 시간 기록이 없는 경우 AP로 표시된 잘못된 보고서 정리
      parsed.forEach((r: any) => {
        if (r.pioneer_status === 'AP' && (!r.hours || Number(r.hours) <= 0)) {
          r.pioneer_status = '일반';
          reportNeedsUpdate = true;
        }
      });
      if (parsed.length < 100) {
        localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(fallback));
        return fallback;
      }
      if (Array.isArray(fallback) && parsed.length < fallback.length) {
        const existingKeys = new Set(parsed.map((r: any) => `${r.service_year_id}_${r.publisher_name}_${r.month}`));
        let hasNew = false;
        for (const fb of (fallback as any[])) {
          const k = `${fb.service_year_id}_${fb.publisher_name}_${fb.month}`;
          if (!existingKeys.has(k)) {
            parsed.push(fb);
            existingKeys.add(k);
            hasNew = true;
          }
        }
        if (hasNew || reportNeedsUpdate) {
          localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(parsed));
        }
        return parsed as unknown as T;
      } else if (reportNeedsUpdate) {
        localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(parsed));
        return parsed as unknown as T;
      }
    }
    if (key === 'managers' && Array.isArray(parsed) && Array.isArray(fallback)) {
      const existingEmails = new Set(parsed.map((m: any) => (m.email || '').trim().toLowerCase()));
      let hasNew = false;
      for (const fb of (fallback as any[])) {
        const cleanFbEmail = (fb.email || '').trim().toLowerCase();
        if (cleanFbEmail && !existingEmails.has(cleanFbEmail)) {
          parsed.push(fb);
          existingEmails.add(cleanFbEmail);
          hasNew = true;
        }
      }
      if (hasNew) {
        localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(parsed));
      }
      return parsed as unknown as T;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function setLocalData<T>(key: string, value: T): void {
  localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(value));
}

// -------------------------------------------------------------
// 1. 봉사연도 관련 API
// -------------------------------------------------------------
export function normalizeServiceYearName(name: string): string {
  if (name.includes('-')) {
    const parts = name.split('-');
    return parts[parts.length - 1].trim();
  }
  return name.trim();
}

export async function getServiceYears(): Promise<ServiceYear[]> {
  const supabase = getSupabaseClient();
  let rawYears: ServiceYear[] = [];
  if (supabase) {
    const { data, error } = await supabase
      .from('service_years')
      .select('*')
      .order('year_name', { ascending: false });
    if (!error && data && data.length > 0) {
      rawYears = data as ServiceYear[];
    }
  }
  if (rawYears.length === 0) {
    rawYears = getLocalData<ServiceYear[]>('service_years', INITIAL_SERVICE_YEARS);
  }

  // 중복 및 표기 정규화: '2025-2026' -> '2026' 등 단일 표준화
  const yearMap = new Map<string, ServiceYear>();
  for (const y of rawYears) {
    const norm = normalizeServiceYearName(y.year_name);
    const endY = parseInt(norm, 10);
    const startY = !isNaN(endY) ? endY - 1 : 2025;
    const normalizedYear: ServiceYear = {
      ...y,
      year_name: norm,
      start_date: y.start_date || `${startY}-09-01`,
      end_date: y.end_date || `${endY}-08-31`,
    };
    if (!yearMap.has(norm)) {
      yearMap.set(norm, normalizedYear);
    } else if (normalizedYear.is_current) {
      yearMap.set(norm, { ...yearMap.get(norm)!, is_current: true });
    }
  }

  const result = Array.from(yearMap.values()).sort((a, b) => {
    return (parseInt(b.year_name, 10) || 0) - (parseInt(a.year_name, 10) || 0);
  });

  // 중요: 현재 활성 연도는 단 1개만 존재해야 함.
  // 중복으로 is_current: true가 설정되어 있는 경우, 가장 최신 연도 1개만 true로 유지하고 나머지는 false로 자동 정리
  let foundCurrent = false;
  const staleCurrentIds: string[] = [];
  for (const y of result) {
    if (y.is_current) {
      if (!foundCurrent) {
        foundCurrent = true;
      } else {
        y.is_current = false;
        staleCurrentIds.push(y.id);
      }
    }
  }

  // 만약 활성 연도가 전혀 없다면 가장 최신 연도를 기본 활성화
  if (!foundCurrent && result.length > 0) {
    result[0].is_current = true;
  }

  // DB에 중복된 is_current가 남아있는 경우 백그라운드에서 정리
  if (staleCurrentIds.length > 0) {
    if (supabase) {
      supabase.from('service_years').update({ is_current: false }).in('id', staleCurrentIds).then();
    }
    const localYears = getLocalData<ServiceYear[]>('service_years', []);
    if (localYears.length > 0) {
      const cleaned = localYears.map(ly => staleCurrentIds.includes(ly.id) ? { ...ly, is_current: false } : ly);
      setLocalData('service_years', cleaned);
    }
  }

  return result;
}

export async function getCurrentServiceYear(): Promise<ServiceYear> {
  const years = await getServiceYears();
  const current = years.find(y => y.is_current) || years[0];
  return current;
}

export async function setCurrentServiceYear(yearId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('service_years').update({ is_current: false }).eq('is_current', true);
    await supabase.from('service_years').update({ is_current: true }).eq('id', yearId);
    return;
  }
  const years = getLocalData<ServiceYear[]>('service_years', INITIAL_SERVICE_YEARS);
  const updated = years.map(y => ({ ...y, is_current: y.id === yearId }));
  setLocalData('service_years', updated);
}

export async function createServiceYear(yearNameInput: string, makeCurrent: boolean = true): Promise<ServiceYear> {
  const normYear = normalizeServiceYearName(yearNameInput);
  const endYear = parseInt(normYear, 10);
  if (isNaN(endYear) || endYear < 2000 || endYear > 2100) {
    throw new Error('올바른 봉사연도(예: 2027)를 입력해주세요.');
  }
  const startYear = endYear - 1;
  const startDate = `${startYear}-09-01`;
  const endDate = `${endYear}-08-31`;

  const supabase = getSupabaseClient();
  let createdYear: ServiceYear;

  if (supabase) {
    if (makeCurrent) {
      await supabase.from('service_years').update({ is_current: false }).eq('is_current', true);
    }
    const { data, error } = await supabase
      .from('service_years')
      .insert([{
        year_name: normYear,
        is_current: makeCurrent,
        start_date: startDate,
        end_date: endDate,
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    createdYear = data as ServiceYear;
  } else {
    const existingYears = getLocalData<ServiceYear[]>('service_years', INITIAL_SERVICE_YEARS);
    if (existingYears.some(y => normalizeServiceYearName(y.year_name) === normYear)) {
      throw new Error(`이미 '${normYear} 봉사연도'가 존재합니다.`);
    }
    const newId = `sy-${normYear}`;
    const newYear: ServiceYear = {
      id: newId,
      year_name: normYear,
      is_current: makeCurrent,
      start_date: startDate,
      end_date: endDate,
    };
    const updatedYears = makeCurrent 
      ? existingYears.map(y => ({ ...y, is_current: false })).concat(newYear)
      : existingYears.concat(newYear);
    setLocalData('service_years', updatedYears);
    createdYear = newYear;
  }

  // 신규 연도의 12개월 마감 상태 초기화 (전부 미마감 false)
  const initialStatuses: Record<ServiceMonth, boolean> = {
    '9월': false, '10월': false, '11월': false, '12월': false,
    '1월': false, '2월': false, '3월': false, '4월': false,
    '5월': false, '6월': false, '7월': false, '8월': false,
  };
  setLocalData(`statuses_${createdYear.id}`, initialStatuses);

  return createdYear;
}

// -------------------------------------------------------------
// 2. 집단(Groups) 관련 API
// -------------------------------------------------------------
export async function getGroups(): Promise<Group[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('display_order', { ascending: true });
    if (!error && data) return data as Group[];
  }
  return getLocalData<Group[]>('groups', INITIAL_GROUPS);
}

export async function saveGroup(group: Partial<Group>): Promise<Group> {
  const supabase = getSupabaseClient();
  if (supabase) {
    if (group.id) {
      const { data, error } = await supabase
        .from('groups')
        .update({
          name: group.name,
          overseer_name: group.overseer_name || '',
          assistant_overseer_name: group.assistant_overseer_name || '',
          display_order: group.display_order ?? 0,
        })
        .eq('id', group.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Group;
    } else {
      const { data, error } = await supabase
        .from('groups')
        .insert([{
          name: group.name,
          overseer_name: group.overseer_name || '',
          assistant_overseer_name: group.assistant_overseer_name || '',
          display_order: group.display_order ?? 0,
        }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Group;
    }
  }

  const groups = getLocalData<Group[]>('groups', INITIAL_GROUPS);
  if (group.id) {
    const updated = groups.map(g => (g.id === group.id ? { ...g, ...group } as Group : g));
    setLocalData('groups', updated);
    return updated.find(g => g.id === group.id)!;
  } else {
    const newGroup: Group = {
      id: 'g-' + Date.now(),
      name: group.name || '새 집단',
      overseer_name: group.overseer_name || '',
      assistant_overseer_name: group.assistant_overseer_name || '',
      display_order: group.display_order ?? (groups.length + 1),
    };
    groups.push(newGroup);
    setLocalData('groups', groups);
    return newGroup;
  }
}

export async function deleteGroup(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('groups').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }
  const groups = getLocalData<Group[]>('groups', INITIAL_GROUPS);
  setLocalData('groups', groups.filter(g => g.id !== id));
}

// -------------------------------------------------------------
// 3. 전도인(Publishers) 관련 API
// -------------------------------------------------------------
export async function getPublishers(includeInactive = false): Promise<Publisher[]> {
  const fallbackPublishersMap = new Map(INITIAL_PUBLISHERS.map(p => [p.name, p]));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let query = supabase.from('publishers').select('*, groups(name)').order('name', { ascending: true });
      if (!includeInactive) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (!error && data) {
        const result = data.map((row: any) => {
          const fb = fallbackPublishersMap.get(row.name);

          // 생년월일/성별이 Supabase에 누락된 경우 초기 데이터에서 백그라운드 보강
          const effectiveBirthDate = row.birth_date || fb?.birth_date || '';
          const effectiveBaptismDate = row.baptism_date || fb?.baptism_date || '';
          const effectiveGender = (row.birth_date && row.gender) ? row.gender : (fb?.gender || row.gender || '남');
          const effectiveHope = (row.birth_date && row.hope) ? row.hope : (fb?.hope || row.hope || '다른 양');

          if ((!row.birth_date && effectiveBirthDate) || row.gender !== effectiveGender) {
            supabase.from('publishers').update({
              birth_date: effectiveBirthDate || null,
              baptism_date: effectiveBaptismDate || null,
              gender: effectiveGender,
              hope: effectiveHope
            }).eq('id', row.id).then();
          }

          if (row.pioneer_status === 'AP') {
            supabase.from('publishers').update({ pioneer_status: '일반' }).eq('id', row.id).then();
          }

          const isChild =
            isChildStatus(row.pioneer_status) ||
            (row.special_notes && row.special_notes.includes('[자녀]'));

          const rawStatus = row.pioneer_status === 'AP' ? '일반' : (row.pioneer_status || '일반');
          const effectivePioneerStatus = isChild ? '자녀 (집계 제외)' : rawStatus;

          return {
            ...row,
            pioneer_status: effectivePioneerStatus,
            birth_date: effectiveBirthDate,
            baptism_date: effectiveBaptismDate,
            gender: effectiveGender,
            hope: effectiveHope,
            group_name: row.groups?.name || '미배정',
            phone: row.phone || '',
            emergency_phone: row.emergency_phone || '',
            relationship: row.relationship || '',
            address: row.address || '',
            family_head: row.family_head || '',
            special_notes: row.special_notes || '',
          } as Publisher;
        });
        // Supabase 데이터를 오프라인 fallback 캐시로 보존
        setLocalData('publishers', result);
        return result;
      }
    } catch (e) {
      console.warn('Supabase 조회 실패, 로컬 캐시 사용:', e);
    }
  }

  // 오프라인 fallback: 로컬 캐시 사용
  const localPublishers = getLocalData<Publisher[]>('publishers', INITIAL_PUBLISHERS);
  const groups = getLocalData<Group[]>('groups', INITIAL_GROUPS);
  const groupMap = new Map(groups.map(g => [g.id, g.name]));
  return localPublishers
    .filter(p => includeInactive || p.is_active)
    .map(p => {
      const fb = fallbackPublishersMap.get(p.name);
      const isChild = isChildStatus(p.pioneer_status) || (p.special_notes && p.special_notes.includes('[자녀]'));
      return {
        ...p,
        pioneer_status: isChild ? '자녀 (집계 제외)' : (p.pioneer_status || '일반'),
        birth_date: p.birth_date || fb?.birth_date || '',
        baptism_date: p.baptism_date || fb?.baptism_date || '',
        gender: (p.birth_date && p.gender) ? p.gender : (fb?.gender || p.gender || '남'),
        hope: (p.birth_date && p.hope) ? p.hope : (fb?.hope || p.hope || '다른 양'),
        group_name: p.group_id ? groupMap.get(p.group_id) || '미배정' : '미배정',
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export async function savePublisher(publisher: Partial<Publisher>): Promise<Publisher> {
  const supabase = getSupabaseClient();

  const isChild = isChildStatus(publisher.pioneer_status) || (publisher.special_notes && publisher.special_notes.includes('[자녀]'));
  const normalizedStatus = isChild ? '자녀 (집계 제외)' : (publisher.pioneer_status || '일반');
  publisher.pioneer_status = normalizedStatus;

  // [자녀] 태그를 pioneer_status와 special_notes에 일관 반영
  if (isChild) {
    if (!publisher.special_notes?.includes('[자녀]')) {
      publisher.special_notes = ((publisher.special_notes || '') + ' [자녀]').trim();
    }
  } else if (publisher.special_notes) {
    publisher.special_notes = publisher.special_notes.replace(/\[자녀\]/g, '').trim();
  }

  // 빈 날짜 문자열 → null (Postgres date 컬럼 오류 방지)
  const sanitized: any = { ...publisher };
  if (!sanitized.baptism_date) sanitized.baptism_date = null;
  if (!sanitized.birth_date) sanitized.birth_date = null;

  // publishers 테이블의 실제 스키마 컬럼만 화이트리스트로 추출 (조인 객체 groups, 파생 필드 group_name 등 배제)
  const allowedColumns = [
    'name',
    'group_id',
    'gender',
    'birth_date',
    'baptism_date',
    'hope',
    'position',
    'pioneer_status',
    'phone',
    'emergency_phone',
    'relationship',
    'address',
    'family_head',
    'special_notes',
    'is_active',
    'deactivated_reason',
    'deactivated_at'
  ];

  const dbPayload: any = {};
  for (const col of allowedColumns) {
    if (sanitized[col] !== undefined) {
      dbPayload[col] = sanitized[col];
    }
  }

  if (supabase) {
    try {
      // ID 없는 경우 이름으로 기존 레코드 조회
      let targetId = sanitized.id;
      if (!targetId && sanitized.name?.trim()) {
        const { data: existingByName } = await supabase
          .from('publishers')
          .select('id')
          .eq('name', sanitized.name.trim())
          .maybeSingle();
        if (existingByName?.id) targetId = existingByName.id;
      }

      let savedRow: any;
      if (targetId) {
        const { data, error } = await supabase
          .from('publishers')
          .update(dbPayload)
          .eq('id', targetId)
          .select('*, groups(name)')
          .single();
        if (error) throw error;
        savedRow = data;
      } else {
        const { data, error } = await supabase
          .from('publishers')
          .insert([dbPayload])
          .select('*, groups(name)')
          .single();
        if (error) throw error;
        savedRow = data;
      }

      const savedData: Publisher = {
        ...savedRow,
        pioneer_status: normalizedStatus,
        group_name: savedRow.groups?.name || '미배정',
        phone: savedRow.phone || '',
        emergency_phone: savedRow.emergency_phone || '',
        relationship: savedRow.relationship || '',
        address: savedRow.address || '',
        family_head: savedRow.family_head || '',
        special_notes: savedRow.special_notes || '',
      };

      // 오프라인 캐시 갱신
      const localPublishers = getLocalData<Publisher[]>('publishers', INITIAL_PUBLISHERS);
      const idx = localPublishers.findIndex(p => p.id === savedData.id || p.name === savedData.name);
      if (idx >= 0) localPublishers[idx] = savedData;
      else localPublishers.push(savedData);
      setLocalData('publishers', localPublishers);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ministry_publishers_updated', { detail: savedData }));
      }
      return savedData;
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('unique_publisher_name') || errMsg.includes('duplicate key')) {
        throw new Error(`'${publisher.name}' 전도인은 이미 데이터베이스에 등록되어 있습니다. 동명이인의 경우 이름 뒤에 구분 기호(예: ${publisher.name}A, ${publisher.name}B)를 입력해주세요.`);
      }
      throw new Error('저장 실패: ' + errMsg);
    }
  }

  // Supabase 미연결 시 로컬 스토리지에 임시 저장
  const localPublishers = getLocalData<Publisher[]>('publishers', INITIAL_PUBLISHERS);
  const localTarget: Publisher = {
    ...(localPublishers.find(p => p.id === publisher.id) || {}),
    ...publisher,
    pioneer_status: normalizedStatus,
    id: publisher.id || ('p-' + Date.now()),
    is_active: publisher.is_active !== undefined ? publisher.is_active : true,
  } as Publisher;

  const idx = localPublishers.findIndex(p => p.id === localTarget.id || p.name === localTarget.name);
  if (idx >= 0) localPublishers[idx] = localTarget;
  else localPublishers.push(localTarget);
  setLocalData('publishers', localPublishers);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ministry_publishers_updated', { detail: localTarget }));
  }
  return localTarget;
}

// [일회성 마이그레이션] 로컬 스토리지 데이터를 Supabase에 일괄 업로드
// Supabase 스키마 통합 후 최초 1회 실행하여 기존 로컬 데이터를 Supabase에 반영
export async function migrateLocalToSupabase(
  onProgress?: (current: number, total: number, name: string) => void
): Promise<{ updated: number; failed: number; errors: string[] }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { updated: 0, failed: 0, errors: ['Supabase 연결 없음'] };

  const localPublishers = getLocalData<Publisher[]>('publishers', INITIAL_PUBLISHERS);
  const { data: supabaseRows } = await supabase
    .from('publishers')
    .select('id, name, special_notes, family_head, relationship, emergency_phone, phone, address');

  const supabaseMap = new Map<string, any>();
  (supabaseRows || []).forEach((row: any) => {
    supabaseMap.set(row.id, row);
    supabaseMap.set(row.name, row);
  });

  let updated = 0, failed = 0;
  const errors: string[] = [];
  const total = localPublishers.filter(p => p.id).length;
  let current = 0;

  for (const local of localPublishers) {
    if (!local.id) continue;
    current++;
    onProgress?.(current, total, local.name);
    const row = supabaseMap.get(local.id) || supabaseMap.get(local.name);
    const needsUpdate =
      (local.special_notes && local.special_notes !== (row?.special_notes || '')) ||
      (local.family_head && local.family_head !== (row?.family_head || '')) ||
      (local.relationship && local.relationship !== (row?.relationship || '')) ||
      (local.emergency_phone && local.emergency_phone !== (row?.emergency_phone || '')) ||
      (local.phone && local.phone !== (row?.phone || '')) ||
      (local.address && local.address !== (row?.address || ''));
    if (!needsUpdate) continue;
    const payload: any = {};
    if (local.special_notes) payload.special_notes = local.special_notes;
    if (local.family_head) payload.family_head = local.family_head;
    if (local.relationship) payload.relationship = local.relationship;
    if (local.emergency_phone) payload.emergency_phone = local.emergency_phone;
    if (local.phone) payload.phone = local.phone;
    if (local.address) payload.address = local.address;
    const targetId = local.id || row?.id;
    if (!targetId) { failed++; continue; }
    try {
      const { error } = await supabase.from('publishers').update(payload).eq('id', targetId);
      if (error) { errors.push(`${local.name}: ${error.message}`); failed++; }
      else updated++;
    } catch (e: any) {
      errors.push(`${local.name}: ${e.message}`); failed++;
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ministry_publishers_updated', { detail: null }));
  }
  return { updated, failed, errors };
}

// 전출 및 무활동 처리 (소프트 삭제: 과거 봉사 보고 및 S-21 통계 보존)
export async function deactivatePublisher(id: string, reason = '이사/전출'): Promise<Publisher> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('publishers')
        .update({
          is_active: false,
          deactivated_reason: reason,
          deactivated_at: now
        })
        .eq('id', id)
        .select('*, groups(name)')
        .single();
      if (!error && data) {
        return {
          ...data,
          group_name: data.groups?.name || '미배정',
        } as Publisher;
      }
      throw error;
    } catch (e: any) {
      // deactivated_reason 컬럼이 없을 경우 is_active: false만 업데이트
      await supabase.from('publishers').update({ is_active: false }).eq('id', id);
    }
  }

  const publishers = getLocalData<Publisher[]>('publishers', INITIAL_PUBLISHERS);
  const updated = publishers.map(p => {
    if (p.id === id) {
      return {
        ...p,
        is_active: false,
        deactivated_reason: reason,
        deactivated_at: now
      };
    }
    return p;
  });
  setLocalData('publishers', updated);
  return updated.find(p => p.id === id)!;
}

// 전출/삭제 전도인 회중 복귀 (복원)
export async function restorePublisher(id: string): Promise<Publisher> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('publishers')
        .update({
          is_active: true,
          deactivated_reason: null,
          deactivated_at: null
        })
        .eq('id', id)
        .select('*, groups(name)')
        .single();
      if (!error && data) {
        return {
          ...data,
          group_name: data.groups?.name || '미배정',
        } as Publisher;
      }
      throw error;
    } catch (e) {
      await supabase.from('publishers').update({ is_active: true }).eq('id', id);
    }
  }

  const publishers = getLocalData<Publisher[]>('publishers', INITIAL_PUBLISHERS);
  const updated = publishers.map(p => {
    if (p.id === id) {
      return {
        ...p,
        is_active: true,
        deactivated_reason: undefined,
        deactivated_at: undefined
      };
    }
    return p;
  });
  setLocalData('publishers', updated);
  return updated.find(p => p.id === id)!;
}

export async function deletePublisher(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('publishers').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }
  const publishers = getLocalData<Publisher[]>('publishers', INITIAL_PUBLISHERS);
  setLocalData('publishers', publishers.filter(p => p.id !== id));
}

// -------------------------------------------------------------
// 3.5. 비상연락망(Emergency Contacts) 및 최신 봉사보고 기반 직책 매핑
// -------------------------------------------------------------
export const MONTH_ORDER: Record<string, number> = {
  '9월': 1, '10월': 2, '11월': 3, '12월': 4,
  '1월': 5, '2월': 6, '3월': 7, '4월': 8,
  '5월': 9, '6월': 10, '7월': 11, '8월': 12
};

// 기본 파이오니아 직책과 가장 최근 보고 월의 상태를 조합하여 표시할 유효 직책(RP 또는 AP) 반환
export function resolveEffectivePioneerStatus(
  baseStatus?: string | null,
  latestReportStatus?: string | null
): string {
  // '자녀'인 경우 항상 '자녀 (집계 제외)' 반환 (봉사보고 집계 제외 대상)
  if (isChildStatus(baseStatus)) {
    return '자녀 (집계 제외)';
  }
  // 1. 기본 등록이 정규 파이오니아(RP)이거나 특별 파이오니아(SP)인 경우 상시 직책이므로 우선 적용
  if (baseStatus === 'RP' || baseStatus === 'SP' || baseStatus === 'FM') {
    return baseStatus;
  }
  // 2. 기본이 RP가 아닌 전도인의 경우, 가장 최근 보고에서 AP로 보고한 경우 AP 반환!
  if (latestReportStatus === 'AP') {
    return 'AP';
  }
  // 3. 그 외의 경우 일반
  return baseStatus && baseStatus !== '일반' ? baseStatus : '';
}

// 각 전도인의 가장 최근(최신 보고 월) 보고서 기반 AP/RP 상태 맵 조회
export async function getLatestPioneerStatusMap(serviceYearId?: string): Promise<Map<string, string>> {
  const localReports = getLocalData<MonthlyReport[]>('monthly_reports', INITIAL_REPORTS);
  let allReports: MonthlyReport[] = localReports;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let query = supabase.from('monthly_reports').select('*, publishers(name, pioneer_status)');
      if (serviceYearId) query = query.eq('service_year_id', serviceYearId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const mergedMap = new Map<string, MonthlyReport>();
        localReports.forEach(r => {
          mergedMap.set(`${r.service_year_id}_${r.publisher_id}_${r.month}`, r);
        });
        data.forEach((r: any) => {
          const key = `${r.service_year_id}_${r.publisher_id}_${r.month}`;
          const existing = mergedMap.get(key);
          const remAp = r.remarks?.some((rem: any) => rem.type?.includes('AP') || rem.etc?.includes('AP'));
          mergedMap.set(key, {
            ...existing,
            ...r,
            publisher_name: r.publishers?.name || existing?.publisher_name,
            pioneer_status: r.pioneer_status || existing?.pioneer_status || (remAp ? 'AP' : r.publishers?.pioneer_status || '일반')
          });
        });
        allReports = Array.from(mergedMap.values());
      }
    } catch (err) {
      console.warn('Failed to load monthly reports from Supabase for latest pioneer status:', err);
    }
  }

  // 대상 보고서 필터링 (연도 지정 시)
  const targetReports = serviceYearId
    ? allReports.filter(r => r.service_year_id === serviceYearId)
    : allReports;

  // 최신 월(8월 -> ... -> 9월) 및 제출일시 내림차순 정렬
  const sorted = [...targetReports].sort((a, b) => {
    const diff = (MONTH_ORDER[b.month] || 0) - (MONTH_ORDER[a.month] || 0);
    if (diff !== 0) return diff;
    return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
  });

  const statusMap = new Map<string, string>();

  for (const r of sorted) {
    const keyId = r.publisher_id;
    const keyName = r.publisher_name;
    const hasHours = Number(r.hours || 0) > 0;
    const status = (r.pioneer_status === 'AP' && !hasHours) ? '일반' : (r.pioneer_status || '일반');

    if (keyId && !statusMap.has(keyId)) {
      statusMap.set(keyId, status);
    }
    if (keyName && !statusMap.has(keyName)) {
      statusMap.set(keyName, status);
    }
  }

  return statusMap;
}

export async function getEmergencyContacts(includeInactive = false, serviceYearId?: string): Promise<EmergencyContact[]> {
  const [publishers, latestStatusMap] = await Promise.all([
    getPublishers(includeInactive),
    getLatestPioneerStatusMap(serviceYearId)
  ]);

  return publishers.map(p => {
    const latest = latestStatusMap.get(p.id) || latestStatusMap.get(p.name);
    const effectiveRp = resolveEffectivePioneerStatus(p.pioneer_status, latest);
    // 실제 미침례 어린 자녀(이지온 등)만 자녀로 구분 (비상연락처의 세대주 기준 가족 관계는 직책/RP 상태에 영향 주지 않음)
    const isChild = Boolean(isChildStatus(p.pioneer_status) || isChildStatus(p.position) || (p.special_notes && p.special_notes.includes('[자녀]')));
    return {
      id: 'em-' + p.id,
      publisher_id: p.id,
      name: p.name,
      group_id: p.group_id,
      group_name: p.group_name || '미배정',
      birth_date: p.birth_date || '',
      baptism_date: p.baptism_date || '',
      gender: p.gender || '남',
      hope: p.hope || '다른 양',
      position: isChild ? '' : (p.position && p.position !== '일반' ? p.position : ''),
      rp: isChild ? '자녀' : effectiveRp,
      phone: p.phone || '',
      emergency_phone: p.emergency_phone || '',
      relationship: p.relationship || '',
      address: p.address || '',
      family_head: p.family_head || '',
      special_notes: p.special_notes || '',
      is_active: p.is_active,
      is_child: isChild,
      updated_at: p.created_at,
    };
  });
}

export async function saveEmergencyContact(contact: Partial<EmergencyContact>): Promise<void> {
  const pioneer_status = contact.rp ? (contact.rp.toUpperCase().includes('RP') ? 'RP' : (contact.rp as any)) : undefined;
  
  let targetPubId = contact.publisher_id;
  if (!targetPubId && contact.name?.trim()) {
    const cleanName = contact.name.trim();
    const localPublishers = getLocalData<Publisher[]>('publishers', INITIAL_PUBLISHERS);
    const existing = localPublishers.find(p => p.name === cleanName);
    if (existing) {
      targetPubId = existing.id;
    } else {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data } = await supabase.from('publishers').select('id').eq('name', cleanName).maybeSingle();
        if (data?.id) {
          targetPubId = data.id;
        }
      }
    }
  }

  if (targetPubId) {
    await savePublisher({
      id: targetPubId,
      name: contact.name,
      group_id: contact.group_id,
      birth_date: contact.birth_date,
      baptism_date: contact.baptism_date,
      gender: contact.gender,
      hope: contact.hope,
      position: contact.position as any,
      pioneer_status,
      phone: contact.phone,
      emergency_phone: contact.emergency_phone,
      relationship: contact.relationship,
      address: contact.address,
      family_head: contact.family_head,
      special_notes: contact.special_notes,
    });
  } else {
    // 전도인으로 신규 등록
    await savePublisher({
      name: contact.name,
      group_id: contact.group_id,
      birth_date: contact.birth_date,
      baptism_date: contact.baptism_date,
      gender: contact.gender,
      hope: contact.hope,
      position: contact.position as any,
      pioneer_status,
      phone: contact.phone,
      emergency_phone: contact.emergency_phone,
      relationship: contact.relationship,
      address: contact.address,
      family_head: contact.family_head,
      special_notes: contact.special_notes,
      is_active: true,
    });
  }
}

// -------------------------------------------------------------
// 4. 월별 마감 상태(Monthly Statuses) 관련 API
// -------------------------------------------------------------
export async function getMonthlyStatuses(serviceYearId: string): Promise<Record<ServiceMonth, boolean>> {
  const defaultStatus: Record<ServiceMonth, boolean> = {
    '9월': false, '10월': false, '11월': false, '12월': false,
    '1월': false, '2월': false, '3월': false, '4월': false,
    '5월': false, '6월': false, '7월': false, '8월': false,
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('monthly_statuses')
      .select('month, is_closed')
      .eq('service_year_id', serviceYearId);
    if (!error && data) {
      data.forEach((row: any) => {
        defaultStatus[row.month as ServiceMonth] = !!row.is_closed;
      });
      return defaultStatus;
    }
  }

  const stored = getLocalData<Record<string, Record<ServiceMonth, boolean>>>('monthly_statuses', INITIAL_STATUSES as any);
  return stored[serviceYearId] || defaultStatus;
}

export async function toggleMonthStatus(serviceYearId: string, month: ServiceMonth): Promise<boolean> {
  const currentStatuses = await getMonthlyStatuses(serviceYearId);
  const newClosed = !currentStatuses[month];

  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase
      .from('monthly_statuses')
      .upsert({
        service_year_id: serviceYearId,
        month,
        is_closed: newClosed,
        closed_at: newClosed ? new Date().toISOString() : null,
      }, { onConflict: 'service_year_id,month' });
    if (error) throw new Error(error.message);
    return newClosed;
  }

  const stored = getLocalData<Record<string, Record<ServiceMonth, boolean>>>('monthly_statuses', {});
  if (!stored[serviceYearId]) {
    stored[serviceYearId] = currentStatuses;
  }
  stored[serviceYearId][month] = newClosed;
  setLocalData('monthly_statuses', stored);
  return newClosed;
}

// -------------------------------------------------------------
// 5. 봉사 보고서(Monthly Reports) 제출 및 조회 API
// -------------------------------------------------------------
export async function submitMinistryReport(params: {
  serviceYearId: string;
  publisherName: string;
  month: ServiceMonth;
  participated: boolean;
  bibleStudies: number;
  hours: number;
  remarks: Array<{ type: string; hours: string; etc?: string }>;
  isAuxiliaryPioneer?: boolean;
  isAdminOverride?: boolean;
}): Promise<{ success: boolean; message: string }> {
  // 1. 마감 여부 확인 (관리자 수정 시에는 패스)
  if (!params.isAdminOverride) {
    const statuses = await getMonthlyStatuses(params.serviceYearId);
    if (statuses[params.month]) {
      throw new Error(`${params.month} 보고는 이미 마감되었습니다.`);
    }
  }

  // 2. 전도인 조회 (없으면 자동 등록 또는 에러)
  const publishers = await getPublishers(true);
  const publisher = publishers.find(p => p.name.trim() === params.publisherName.trim());
  if (!publisher) {
    throw new Error(`'${params.publisherName}' 전도인 명단을 찾을 수 없습니다. 관리자에게 문의하세요.`);
  }

  const hasHours = Number(params.hours || 0) > 0;
  const determinedPioneerStatus = (params.isAuxiliaryPioneer && hasHours)
    ? 'AP' 
    : (publisher.pioneer_status === 'RP' ? 'RP' : (publisher.pioneer_status === 'AP' ? '일반' : (publisher.pioneer_status || '일반')));

  const supabase = getSupabaseClient();
  if (supabase) {
    const payload: any = {
      service_year_id: params.serviceYearId,
      publisher_id: publisher.id,
      month: params.month,
      participated: params.participated,
      hours: params.hours,
      bible_studies: params.bibleStudies,
      remarks: params.remarks,
      pioneer_status: determinedPioneerStatus,
      submitted_at: new Date().toISOString(),
    };

    let { error } = await supabase
      .from('monthly_reports')
      .upsert(payload, { onConflict: 'service_year_id,publisher_id,month' });

    // Supabase 테이블에 pioneer_status 컬럼이 아직 없는 경우 에러 방어
    if (error && error.message && error.message.includes('pioneer_status')) {
      delete payload.pioneer_status;
      const res = await supabase
        .from('monthly_reports')
        .upsert(payload, { onConflict: 'service_year_id,publisher_id,month' });
      error = res.error;
    }

    if (error) throw new Error(error.message);

    // 로컬 스토리지 캐시 동기화
    const reports = getLocalData<MonthlyReport[]>('monthly_reports', INITIAL_REPORTS);
    const existingIdx = reports.findIndex(
      r => r.service_year_id === params.serviceYearId && r.publisher_id === publisher.id && r.month === params.month
    );
    const reportData: MonthlyReport = {
      id: existingIdx >= 0 ? reports[existingIdx].id : 'rep-' + Date.now(),
      service_year_id: params.serviceYearId,
      publisher_id: publisher.id,
      publisher_name: publisher.name,
      group_name: publisher.group_name,
      position: publisher.position,
      pioneer_status: determinedPioneerStatus,
      month: params.month,
      participated: params.participated,
      hours: params.hours,
      bible_studies: params.bibleStudies,
      remarks: params.remarks,
      submitted_at: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      reports[existingIdx] = reportData;
    } else {
      reports.push(reportData);
    }
    setLocalData('monthly_reports', reports);

    return { success: true, message: '봉사 보고가 성공적으로 제출되었습니다!' };
  }

  // Local Storage 저장
  const reports = getLocalData<MonthlyReport[]>('monthly_reports', INITIAL_REPORTS);
  const existingIdx = reports.findIndex(
    r => r.service_year_id === params.serviceYearId && r.publisher_id === publisher.id && r.month === params.month
  );

  const reportData: MonthlyReport = {
    id: existingIdx >= 0 ? reports[existingIdx].id : 'rep-' + Date.now(),
    service_year_id: params.serviceYearId,
    publisher_id: publisher.id,
    publisher_name: publisher.name,
    group_name: publisher.group_name,
    position: publisher.position,
    pioneer_status: determinedPioneerStatus,
    month: params.month,
    participated: params.participated,
    hours: params.hours,
    bible_studies: params.bibleStudies,
    remarks: params.remarks,
    submitted_at: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    reports[existingIdx] = reportData;
  } else {
    reports.push(reportData);
  }
  setLocalData('monthly_reports', reports);
  return { success: true, message: '봉사 보고가 성공적으로 등록되었습니다!' };
}

export async function deleteMonthlyReport(reportId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('monthly_reports').delete().eq('id', reportId);
    } catch (err) {
      console.warn('Supabase delete report error:', err);
    }
  }

  const reports = getLocalData<MonthlyReport[]>('monthly_reports', INITIAL_REPORTS);
  const filtered = reports.filter(r => r.id !== reportId);
  setLocalData('monthly_reports', filtered);
  return true;
}

export async function getMonthlyReports(serviceYearId: string, month: ServiceMonth): Promise<MonthlyReport[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('monthly_reports')
      .select('*, publishers(name, position, pioneer_status, groups(name))')
      .eq('service_year_id', serviceYearId)
      .eq('month', month)
      .order('submitted_at', { ascending: false });

    if (!error && data) {
      return data.map((r: any) => {
        const pubStatus = r.publishers?.pioneer_status;
        const isRp = pubStatus === 'RP' || r.pioneer_status === 'RP';
        const hasHours = Number(r.hours || 0) > 0;
        let pStatus = isRp ? 'RP' : (hasHours ? 'AP' : (isChildStatus(r.pioneer_status || pubStatus) ? '자녀 (집계 제외)' : '일반'));
        return {
          ...r,
          publisher_name: r.publishers?.name || r.publisher_name,
          position: r.publishers?.position || r.position,
          pioneer_status: pStatus,
          group_name: r.publishers?.groups?.name || r.group_name || '미배정',
        };
      }) as MonthlyReport[];
    }
  }

  const reports = getLocalData<MonthlyReport[]>('monthly_reports', INITIAL_REPORTS);
  return reports
    .filter(r => r.service_year_id === serviceYearId && r.month === month)
    .map(r => {
      const isRp = r.pioneer_status === 'RP';
      const hasHours = Number(r.hours || 0) > 0;
      const pStatus = isRp ? 'RP' : (hasHours ? 'AP' : (isChildStatus(r.pioneer_status) ? r.pioneer_status : '일반'));
      return { ...r, pioneer_status: pStatus };
    });
}

export async function getAllServiceYearReports(serviceYearId?: string): Promise<MonthlyReport[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      let query = supabase
        .from('monthly_reports')
        .select('*, publishers(name, position, pioneer_status, groups(name))')
        .order('submitted_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (serviceYearId) {
        query = query.eq('service_year_id', serviceYearId);
      }
      const { data, error } = await query;
      if (error || !data || data.length === 0) break;
      allData.push(...data);
      if (data.length < pageSize) break;
      page++;
    }

    if (allData.length > 0) {
      const fetchedReports = allData.map((r: any) => {
        const pubStatus = r.publishers?.pioneer_status;
        const isRp = pubStatus === 'RP' || r.pioneer_status === 'RP';
        const hasHours = Number(r.hours || 0) > 0;
        let pStatus = isRp ? 'RP' : (hasHours ? 'AP' : (isChildStatus(r.pioneer_status || pubStatus) ? '자녀 (집계 제외)' : '일반'));
        return {
          ...r,
          publisher_name: r.publishers?.name || r.publisher_name,
          position: r.publishers?.position || r.position,
          pioneer_status: pStatus,
          group_name: r.publishers?.groups?.name || r.group_name || '미배정',
        };
      }) as MonthlyReport[];

      // 혹시 원격 DB에 1000건 초과 데이터가 미처 마이그레이션되지 않았을 경우를 대비해 누락분 보강
      const existingKeySet = new Set(fetchedReports.map(r => `${r.publisher_name}_${r.month}`));
      const fallbackForYear = INITIAL_REPORTS.filter(r => !serviceYearId || r.service_year_id === serviceYearId);
      for (const fb of fallbackForYear) {
        if (!existingKeySet.has(`${fb.publisher_name}_${fb.month}`)) {
          const isRp = fb.pioneer_status === 'RP';
          const hasHours = Number(fb.hours || 0) > 0;
          fetchedReports.push({
            ...fb,
            pioneer_status: isRp ? 'RP' : (hasHours ? 'AP' : (isChildStatus(fb.pioneer_status) ? fb.pioneer_status : '일반'))
          });
          existingKeySet.add(`${fb.publisher_name}_${fb.month}`);
        }
      }

      return fetchedReports;
    }
  }

  const reports = getLocalData<MonthlyReport[]>('monthly_reports', INITIAL_REPORTS);
  const target = serviceYearId ? reports.filter(r => r.service_year_id === serviceYearId) : reports;
  return target.map(r => {
    const isRp = r.pioneer_status === 'RP';
    const hasHours = Number(r.hours || 0) > 0;
    const pStatus = isRp ? 'RP' : (hasHours ? 'AP' : (isChildStatus(r.pioneer_status) ? r.pioneer_status : '일반'));
    return { ...r, pioneer_status: pStatus };
  });
}

export async function importMonthlyReports(
  importedReports: any[], 
  defaultServiceYearId: string
): Promise<{ added: number; updated: number }> {
  if (!Array.isArray(importedReports) || importedReports.length === 0) {
    throw new Error('가져올 보고서 데이터가 없거나 올바른 배열 형식이 아닙니다.');
  }

  const publishers = await getPublishers(true);
  const nameToPubMap = new Map<string, Publisher>();
  publishers.forEach(p => nameToPubMap.set(p.name, p));

  let added = 0;
  let updated = 0;

  const currentReports = getLocalData<MonthlyReport[]>('monthly_reports', INITIAL_REPORTS);
  const reportMap = new Map<string, MonthlyReport>();
  currentReports.forEach(r => {
    reportMap.set(`${r.service_year_id}_${r.publisher_name}_${r.month}`, r);
  });

  const supabase = getSupabaseClient();

  for (const item of importedReports) {
    const pubName = item.publisher_name || item.name;
    const month = item.month as ServiceMonth;
    const syId = item.service_year_id || defaultServiceYearId;
    if (!pubName || !month || !SERVICE_MONTHS.includes(month)) continue;

    const matchedPub = nameToPubMap.get(pubName);
    const pubId = matchedPub ? matchedPub.id : (item.publisher_id || `pub-temp-${Date.now()}`);

    const key = `${syId}_${pubName}_${month}`;
    const isExisting = reportMap.has(key);

    const reportObj: MonthlyReport = {
      id: isExisting ? reportMap.get(key)!.id : (item.id || `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
      service_year_id: syId,
      publisher_id: pubId,
      publisher_name: pubName,
      group_name: matchedPub?.group_name || item.group_name || '미배정',
      pioneer_status: matchedPub?.pioneer_status || item.pioneer_status || '일반',
      month: month,
      participated: item.participated !== false,
      hours: Number(item.hours) || 0,
      bible_studies: Number(item.bible_studies ?? item.bibleStudies) || 0,
      remarks: item.remarks || [],
      submitted_at: item.submitted_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    reportMap.set(key, reportObj);
    if (isExisting) {
      updated++;
    } else {
      added++;
    }

    if (supabase && matchedPub) {
      try {
        await supabase.from('monthly_reports').upsert({
          service_year_id: syId,
          publisher_id: matchedPub.id,
          month: month,
          participated: reportObj.participated,
          hours: reportObj.hours,
          bible_studies: reportObj.bible_studies,
          remarks: reportObj.remarks,
          submitted_at: reportObj.submitted_at,
          updated_at: reportObj.updated_at,
        }, { onConflict: 'service_year_id,publisher_id,month' });
      } catch (err) {
        console.warn('Supabase upsert report error:', err);
      }
    }
  }

  setLocalData('monthly_reports', Array.from(reportMap.values()));
  return { added, updated };
}

// -------------------------------------------------------------
// 6. 통계 및 집계 (Monthly KPI & Stats)
// -------------------------------------------------------------
export async function getMonthlyKpiStats(serviceYearId: string, month: ServiceMonth, groupId?: string): Promise<MonthlyKpiStats> {
  const [statuses, reports, allGroups] = await Promise.all([
    getMonthlyStatuses(serviceYearId),
    getMonthlyReports(serviceYearId, month),
    getGroups()
  ]);
  const isClosed = !!statuses[month];
  const targetGroup = groupId ? allGroups.find(g => g.id === groupId) : null;

  // 집단 필터링: 전출 여부와 무관하게 보고서에 보관된 집단명 또는 publisher_id 기준으로 온전하게 보존
  const filteredReports = targetGroup
    ? reports.filter(r => r.group_name === targetGroup.name || (r.publisher_id && r.group_name?.includes(targetGroup.name)))
    : reports;

  let totalReporters = 0;
  let totalSubmitted = 0;
  let unsharedCount = 0;
  let totalBibleStudies = 0;
  let totalHours = 0;
  let publisherCount = 0;
  let publisherStudies = 0;
  let rpCount = 0;
  let rpHours = 0;
  let rpStudies = 0;
  let apCount = 0;
  let apHours = 0;
  let apStudies = 0;

  filteredReports.forEach(r => {
    totalSubmitted++;
    if (r.participated) {
      totalReporters++;
      totalBibleStudies += Number(r.bible_studies || 0);
      totalHours += Number(r.hours || 0);

      const isRp = r.pioneer_status === 'RP';
      const hasHours = Number(r.hours || 0) > 0;
      if (isRp) {
        rpCount++;
        rpHours += Number(r.hours || 0);
        rpStudies += Number(r.bible_studies || 0);
      } else if (hasHours) {
        apCount++;
        apHours += Number(r.hours || 0);
        apStudies += Number(r.bible_studies || 0);
      } else if (!isChildStatus(r.pioneer_status)) {
        publisherCount++;
        publisherStudies += Number(r.bible_studies || 0);
      }
    } else {
      if (!isChildStatus(r.pioneer_status)) {
        unsharedCount++;
      }
    }
  });

  let totalPublishers: number;
  let reportRate: number;

  if (isClosed) {
    // 이미 마감된 봉사보고는 전송 완료된 확정 보관 자료이므로, 현재 전도인 명단과 재집계하지 않고
    // 보고서에 등록된 전도인(자녀 제외) 수를 기준으로 100% 마감 상태로 보존합니다.
    totalPublishers = filteredReports.filter(r => !isChildStatus(r.pioneer_status)).length;
    reportRate = 100;
  } else {
    // 마감 전(보고 접수 진행 중)일 때만 현재 활동 중인 전도인 명단을 기준으로 진척도/미보고자 계산
    const allPublishers = await getPublishers(false);
    const targetPublishers = (groupId ? allPublishers.filter(p => p.group_id === groupId) : allPublishers)
      .filter(p => !isChildStatus(p.pioneer_status));
    totalPublishers = Math.max(targetPublishers.length, totalSubmitted);
    reportRate = totalPublishers > 0 ? Math.round((totalSubmitted / totalPublishers) * 100) : 0;
  }

  return {
    totalPublishers,
    totalReporters,
    totalSubmitted,
    unsharedCount,
    reportRate,
    totalBibleStudies,
    totalHours,
    publisherCount,
    publisherStudies,
    rpCount,
    rpHours,
    rpStudies,
    apCount,
    apHours,
    apStudies,
  };
}

// -------------------------------------------------------------
// 7. 미보고자 명단 조회
// -------------------------------------------------------------
export async function getUnreportedMembers(serviceYearId: string, month: ServiceMonth, groupId?: string): Promise<Publisher[]> {
  const statuses = await getMonthlyStatuses(serviceYearId);
  if (statuses[month]) {
    // 이미 마감된 봉사보고는 마감 및 전송 완료된 확정 보관 자료이므로 미보고자가 없음
    return [];
  }

  const allPublishers = await getPublishers(false);
  // '자녀 (집계 제외)'는 봉사보고 집계 및 미보고자 목록에 포함되지 않음
  const targetPublishers = (groupId ? allPublishers.filter(p => p.group_id === groupId) : allPublishers)
    .filter(p => !isChildStatus(p.pioneer_status));
  const reports = await getMonthlyReports(serviceYearId, month);
  const reportedPubIds = new Set(reports.map(r => r.publisher_id));
  const reportedPubNames = new Set(reports.map(r => r.publisher_name));

  return targetPublishers.filter(p => !reportedPubIds.has(p.id) && !reportedPubNames.has(p.name));
}

// 미보고자 일괄 미참여(N) 처리 및 월 최종 마감
export async function batchCloseUnreportedPublishers(
  serviceYearId: string,
  month: ServiceMonth,
  unreportedPublishers: Publisher[]
): Promise<void> {
  const supabase = getSupabaseClient();
  const localReports = getLocalData<MonthlyReport[]>('monthly_reports', INITIAL_REPORTS);
  const now = new Date().toISOString();

  // 미보고자 전원에 대해 참여: false(N), 시간: 0, 연구: 0 보고서 생성
  const newReports: MonthlyReport[] = unreportedPublishers.map((pub, idx) => ({
    id: `rep-auto-${Date.now()}-${idx}`,
    service_year_id: serviceYearId,
    publisher_id: pub.id,
    publisher_name: pub.name,
    group_name: pub.group_name,
    position: pub.position || '일반',
    pioneer_status: pub.pioneer_status === 'RP' ? 'RP' : (pub.pioneer_status || '일반'),
    month,
    participated: false,
    hours: 0,
    bible_studies: 0,
    remarks: [{ type: '마감 시 미참여 처리', hours: '0' }],
    submitted_at: now
  }));

  if (supabase) {
    try {
      const payloads = newReports.map(r => ({
        service_year_id: r.service_year_id,
        publisher_id: r.publisher_id,
        month: r.month,
        participated: false,
        hours: 0,
        bible_studies: 0,
        remarks: r.remarks,
        pioneer_status: r.pioneer_status,
        submitted_at: now
      }));

      await supabase.from('monthly_reports').upsert(payloads, {
        onConflict: 'service_year_id,publisher_id,month'
      });
    } catch (err) {
      console.warn('Supabase 일괄 미참여 보고서 저장 실패, 로컬 스토리지에 보존:', err);
    }
  }

  // 로컬 캐시 업데이트
  const updatedReports = [...localReports];
  newReports.forEach(nr => {
    const existingIdx = updatedReports.findIndex(
      r => r.service_year_id === serviceYearId && r.publisher_id === nr.publisher_id && r.month === month
    );
    if (existingIdx >= 0) {
      updatedReports[existingIdx] = nr;
    } else {
      updatedReports.push(nr);
    }
  });
  setLocalData('monthly_reports', updatedReports);

  // 해당 월 보고 마감 상태 잠금
  await toggleMonthStatus(serviceYearId, month);
}

// -------------------------------------------------------------
// 8. 연간 봉사 기록 카드(S-21 데이터) 산출
// -------------------------------------------------------------
export async function getYearlyPublisherRecord(serviceYearId: string, publisherId: string): Promise<YearlyPublisherRecord> {
  const publishers = await getPublishers(true);
  const publisher = publishers.find(p => p.id === publisherId);
  if (!publisher) throw new Error('전도인을 찾을 수 없습니다.');

  const supabase = getSupabaseClient();
  let allReports: MonthlyReport[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('monthly_reports')
      .select('*')
      .eq('service_year_id', serviceYearId)
      .eq('publisher_id', publisherId);
    if (data) allReports = data as MonthlyReport[];
  } else {
    const reports = getLocalData<MonthlyReport[]>('monthly_reports', INITIAL_REPORTS);
    allReports = reports.filter(r => r.service_year_id === serviceYearId && r.publisher_id === publisherId);
  }

  const reportMap = new Map<ServiceMonth, MonthlyReport>();
  allReports.forEach(r => reportMap.set(r.month, r));

  let totalHours = 0;
  let totalStudies = 0;
  let activeMonths = 0;

  const monthlyRecords = SERVICE_MONTHS.map(month => {
    const rep = reportMap.get(month);
    const participated = !!rep?.participated;
    const hours = Number(rep?.hours || 0);
    const bibleStudies = Number(rep?.bible_studies || 0);

    if (participated) {
      activeMonths++;
      totalHours += hours;
      totalStudies += bibleStudies;
    }

    const remarksStr = (rep?.remarks || [])
      .map(rm => rm.type ? `${rm.type}: ${rm.hours}시간` : '')
      .filter(Boolean)
      .join(', ');

    return {
      month,
      participated,
      bibleStudies,
      hours,
      remarks: remarksStr,
      division: publisher.pioneer_status === '일반' ? '' : publisher.pioneer_status,
    };
  });

  const averageHours = activeMonths > 0 ? Number((totalHours / activeMonths).toFixed(1)) : 0;
  const averageStudies = activeMonths > 0 ? Number((totalStudies / activeMonths).toFixed(1)) : 0;

  return {
    userInfo: {
      name: publisher.name,
      birthDate: publisher.birth_date || '',
      gender: publisher.gender || '',
      baptismDate: publisher.baptism_date || '',
      hope: publisher.hope || '다른 양',
      isElder: publisher.position === '장로',
      isMinisterialServant: publisher.position === '봉사의 종' || publisher.position === '봉종',
      isRegularPioneer: publisher.pioneer_status === 'RP',
      isSpecialPioneer: publisher.pioneer_status === 'SP',
      isMissionary: publisher.pioneer_status === 'FM',
      isChild: isChildStatus(publisher.pioneer_status),
      groupName: publisher.group_name,
    },
    monthlyRecords,
    totals: {
      totalHours,
      totalStudies,
      activeMonths,
      averageHours,
      averageStudies,
    },
  };
}

// -------------------------------------------------------------
// 9. 관리자 목록 및 계정 관리 (Managers CRUD)
// -------------------------------------------------------------
const INITIAL_MANAGERS: Manager[] = [
  { id: 'm-super', email: 'admin@example.com', name: '최고관리자', role: 'super' },
  { id: 'm-super-mplus', email: 'mpluskj@gmail.com', name: '최고관리자', role: 'super' },
  { id: 'm-super-shin', email: 'jjktsjj@gmail.com', name: '신세한', role: 'super' },
  { id: 'm-seoksa-jeon', email: 'jjhkhj0926@gmail.com', name: '전진혁', role: 'group', group_name: '석사' },
  { id: 'm-hyoja-jung', email: 'dughdhk114@gmail.com', name: '정승헌', role: 'group', group_name: '효자' },
  { id: 'm-hyoja', email: 'hyoja@example.com', name: '효자집단 감독자', role: 'group', group_id: 'grp-1', group_name: '효자' },
  { id: 'm-sueo', email: 'sueo@example.com', name: '수어집단 감독자', role: 'group', group_id: 'grp-2', group_name: '수어' },
  { id: 'm-seoksa', email: 'seoksa@example.com', name: '석사집단 감독자', role: 'group', group_id: 'grp-3', group_name: '석사' },
  { id: 'm-hyundai', email: 'hyundai@example.com', name: '현대집단 감독자', role: 'group', group_id: 'grp-4', group_name: '현대' },
  { id: 'm-ungyo', email: 'ungyo@example.com', name: '운교집단 감독자', role: 'group', group_id: 'grp-5', group_name: '운교' },
];

export async function getManagers(): Promise<Manager[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('managers').delete().like('name', '최고관리자(%');
    } catch {}

    const { data, error } = await supabase
      .from('managers')
      .select('*, groups(name)')
      .order('name', { ascending: true });
    if (!error && data) {
      return data
        .filter((row: any) => !row.name?.startsWith('최고관리자('))
        .map((row: any) => ({
          id: row.id,
          email: row.email,
          name: row.name === '최고관리자(서기)' ? '최고관리자' : row.name,
          role: row.role as 'super' | 'group',
          group_id: row.group_id,
          group_name: row.groups?.name || '미배정',
        })) as Manager[];
    }
  }
  const local = getLocalData<Manager[]>('managers', INITIAL_MANAGERS);
  const cleaned = local
    .filter(m => !m.name?.startsWith('최고관리자(') && !m.email?.toLowerCase().includes('mpluskj3'))
    .map(m => m.name === '최고관리자(서기)' ? { ...m, name: '최고관리자' } : m);
  if (cleaned.length !== local.length) {
    setLocalData('managers', cleaned);
  }
  return cleaned;
}

export async function saveManager(manager: Partial<Manager>): Promise<Manager> {
  const supabase = getSupabaseClient();
  const cleanEmail = (manager.email || '').trim().toLowerCase();

  if (supabase) {
    if (manager.id && !manager.id.startsWith('m-')) {
      const { data, error } = await supabase
        .from('managers')
        .update({
          email: cleanEmail,
          name: manager.name,
          role: manager.role,
          group_id: manager.role === 'group' ? manager.group_id : null,
        })
        .eq('id', manager.id)
        .select('*, groups(name)')
        .single();
      if (error) throw new Error(error.message);
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        group_id: data.group_id,
        group_name: data.groups?.name,
      };
    } else {
      const { data, error } = await supabase
        .from('managers')
        .insert([{
          email: cleanEmail,
          name: manager.name,
          role: manager.role,
          group_id: manager.role === 'group' ? manager.group_id : null,
        }])
        .select('*, groups(name)')
        .single();
      if (error) throw new Error(error.message);
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        group_id: data.group_id,
        group_name: data.groups?.name,
      };
    }
  }

  const managers = getLocalData<Manager[]>('managers', INITIAL_MANAGERS);
  const groups = await getGroups();
  const groupMap = new Map(groups.map(g => [g.id, g.name]));

  if (manager.id) {
    const updated = managers.map(m => {
      if (m.id === manager.id) {
        const targetGroupId = manager.role === 'group' ? manager.group_id : null;
        return {
          ...m,
          ...manager,
          email: cleanEmail,
          group_id: targetGroupId,
          group_name: targetGroupId ? groupMap.get(targetGroupId) || '미배정' : undefined
        } as Manager;
      }
      return m;
    });
    setLocalData('managers', updated);
    return updated.find(m => m.id === manager.id)!;
  } else {
    const targetGroupId = manager.role === 'group' ? manager.group_id : null;
    const newMgr: Manager = {
      id: 'mgr-' + Date.now(),
      email: cleanEmail,
      name: manager.name || '새 관리자',
      role: manager.role || 'super',
      group_id: targetGroupId,
      group_name: targetGroupId ? groupMap.get(targetGroupId) : undefined,
    };
    managers.push(newMgr);
    setLocalData('managers', managers);
    return newMgr;
  }
}

export async function deleteManager(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('managers').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }
  const managers = getLocalData<Manager[]>('managers', INITIAL_MANAGERS);
  setLocalData('managers', managers.filter(m => m.id !== id));
}

// -------------------------------------------------------------
// 10. 관리자 인증 확인 (등록된 Google 계정 이메일 대조)
// -------------------------------------------------------------
export async function authenticateManager(email: string): Promise<Manager | null> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null;

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data } = await supabase
      .from('managers')
      .select('*, groups(name)')
      .ilike('email', trimmed)
      .maybeSingle();
    if (data) {
      // 자동 생성되었던 임시 계정은 즉시 DB 삭제 및 차단
      if (data.name?.startsWith('최고관리자(')) {
        try {
          await supabase.from('managers').delete().eq('id', data.id);
        } catch {}
        return null;
      }
      return {
        id: data.id,
        email: data.email,
        name: data.name === '최고관리자(서기)' ? '최고관리자' : data.name,
        role: data.role as 'super' | 'group',
        group_id: data.group_id,
        group_name: data.groups?.name,
      };
    }
  }

  // 로컬 저장소 등록 관리자 목록에서 대조
  const managers = getLocalData<Manager[]>('managers', INITIAL_MANAGERS);
  const validManagers = managers.filter(m => !m.name?.startsWith('최고관리자(') && !m.email?.toLowerCase().includes('mpluskj3'));
  if (validManagers.length !== managers.length) {
    setLocalData('managers', validManagers);
  }

  const found = validManagers.find((m: Manager) => m.email && m.email.trim().toLowerCase() === trimmed);
  if (found) {
    if (found.name === '최고관리자(서기)') {
      found.name = '최고관리자';
      setLocalData('managers', validManagers);
    }
    return found;
  }

  // 초기 데모 편의용 매핑 (admin / admin@example.com)
  if (trimmed === 'admin@example.com' || trimmed === 'admin') {
    const superMgr = validManagers.find((m: Manager) => m.role === 'super');
    if (superMgr) {
      if (superMgr.name === '최고관리자(서기)') {
        superMgr.name = '최고관리자';
        setLocalData('managers', validManagers);
      }
      return superMgr;
    }
    return { id: 'm-super', email: 'admin@example.com', name: '최고관리자', role: 'super' };
  }

  // 등록된 관리자 목록에 없으면 무조건 차단 (null 반환)
  return null;
}

export async function signInWithGoogleOAuth(): Promise<{ error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: 'Supabase 연결 설정이 필요합니다.' };
  }
  // 리디렉션 후 관리자 모드임을 sessionStorage에 기록해 둘고 이동
  try { sessionStorage.setItem('ministry_oauth_manager_login', '1'); } catch {}
  // redirectTo는 항상 ?page=manager 포함
  const origin = window.location.origin;
  const redirectUrl = origin + '/?page=manager';
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });
  if (error) {
    return { error: error.message };
  }
  return {};
}

// -------------------------------------------------------------
// 11. 이전 제출 보고서 확인 (수정 보고 안내용)
// -------------------------------------------------------------
export async function getExistingReport(
  serviceYearId: string,
  publisherId: string,
  month: ServiceMonth
): Promise<MonthlyReport | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data } = await supabase
      .from('monthly_reports')
      .select('*, publishers(name, position, pioneer_status, groups(name))')
      .eq('service_year_id', serviceYearId)
      .eq('publisher_id', publisherId)
      .eq('month', month)
      .maybeSingle();
    if (data) {
      return {
        ...data,
        publisher_name: data.publishers?.name,
        position: data.publishers?.position,
        pioneer_status: data.publishers?.pioneer_status,
        group_name: data.publishers?.groups?.name,
      } as MonthlyReport;
    }
    return null;
  }

  const reports = getLocalData<MonthlyReport[]>('monthly_reports', INITIAL_REPORTS);
  const found = reports.find(
    r => r.service_year_id === serviceYearId && r.publisher_id === publisherId && r.month === month
  );
  return found || null;
}

// -------------------------------------------------------------
// 12. 자동 월 선택 헬퍼 (9월 보고일 경우 9월 1일 이틀 전부터 자동 오픈)
// -------------------------------------------------------------
export function getAutoSelectServiceMonth(
  statuses?: Record<ServiceMonth, boolean>,
  serviceYearName?: string
): ServiceMonth {
  const targetMonthStr = getCurrentDateServiceMonth(serviceYearName);
  
  // 해당 월이 열려 있으면 바로 반환
  if (statuses) {
    if (!statuses[targetMonthStr]) {
      return targetMonthStr;
    }
    // 타겟 월이 마감된 경우, 열려 있는 월 중 가장 최근 월 자동 선택
    const openMonth = SERVICE_MONTHS.slice().reverse().find(m => !statuses[m]);
    if (openMonth) return openMonth;
  }
  
  return targetMonthStr;
}

