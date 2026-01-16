
export enum BehaviorType {
  MERIT = 'MERIT',
  DEMERIT = 'DEMERIT'
}

export enum MeritCategory {
  AKADEMIK = 'AKADEMIK',
  KOKURIKULUM = 'KOKURIKULUM',
  SAHSIAH = 'SAHSIAH',
  TIGAK = '3K' // Kebersihan, Kesihatan, Keselamatan
}

export interface StudentRecord {
  id: string;
  type: BehaviorType;
  category?: MeritCategory | string;
  reason: string;
  points: number;
  timestamp: number;
  teacherName: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: number;
  classGroup: string; // e.g., "7A", "10C"
  house: string;
  totalPoints: number;
  avatar: string;
  records: StudentRecord[];
}

export interface BehaviorReason {
  id: string;
  label: string;
  points: number;
  type: BehaviorType;
  category?: MeritCategory;
}

export enum CaseSeverity {
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
  SEVERE = 'SEVERE'
}

export enum CaseStatus {
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  PENDING = 'PENDING'
}

export interface DisciplinaryCase {
  id: string;
  category: string;
  title: string;
  description: string;
  perpetratorIds: string[];
  victimIds: string[];
  date: number;
  location: string;
  decision: string;
  severity: CaseSeverity;
  status: CaseStatus;
  loggedBy: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  roles: string[];
  email: string;
  staffId: string;
  department: string;
  meritsGiven: number;
  demeritsGiven: number;
  avatar: string;
  subjects: string[];
  isAdmin: boolean;
  password?: string;
}

export type View = 'dashboard' | 'students' | 'student-detail' | 'admin' | 'account' | 'cases';
