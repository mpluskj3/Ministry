export interface EmergencyCoverOfficer {
  id: string;
  role: string;
  name: string;
  phone: string;
}

export interface EmergencyCoverData {
  congregationName: string;
  circuitName: string;
  circuitOverseerRole: string;
  circuitOverseerName: string;
  circuitOverseerPhone: string;
  serviceCommittee: EmergencyCoverOfficer[];
  groupOverseers: EmergencyCoverOfficer[];
}

export const DEFAULT_EMERGENCY_COVER_DATA: EmergencyCoverData = {
  congregationName: '강원 춘천 남부 회중',
  circuitName: '강원1순회구',
  circuitOverseerRole: '순회감독자',
  circuitOverseerName: '최윤호',
  circuitOverseerPhone: '010-7271-8789',
  serviceCommittee: [
    { id: 'sc-1', role: '조정자', name: '신범선', phone: '010-2909-1935' },
    { id: 'sc-2', role: '서기', name: '전재관', phone: '010-5739-5458' },
    { id: 'sc-3', role: '봉사감독자', name: '이경진', phone: '010-9023-7429' }
  ],
  groupOverseers: [
    { id: 'go-1', role: '운교집단감독자', name: '김상만', phone: '010-2480-3655' },
    { id: 'go-2', role: '효자집단감독자', name: '강석찬', phone: '010-8741-2693' },
    { id: 'go-3', role: '석사집단감독자', name: '전진혁', phone: '010-9246-7920' },
    { id: 'go-4', role: '현대집단감독자', name: '김희웅', phone: '010-8526-4877' },
    { id: 'go-5', role: '수어집단감독자', name: '문경주', phone: '010-5882-0305' }
  ]
};

export const EMERGENCY_COVER_STORAGE_KEY = 'ministry_emergency_cover_data';
