
export enum BehaviorType {
  MERIT = 'MERIT',
  DEMERIT = 'DEMERIT'
}

export enum MeritCategory {
  AKADEMIK = 'AKADEMIK',
  KOKURIKULUM = 'KOKURIKULUM',
  SAHSIAH = 'SAHSIAH',
  TIGAK = '3K'
}

// Student record interface for individual merit/demerit entries
export interface StudentRecord {
  id: string;
  studentId: string;
  teacherId: string;
  teacherName: string;
  type: BehaviorType;
  category?: MeritCategory | string;
  reason: string;
  points: number;
  timestamp: number;
}

// Student interface updated with optional records and totalPoints to fix missing property errors
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: number;
  classGroup: string;
  house: string;
  avatar: string;
  records?: StudentRecord[];
  totalPoints?: number;
}

// Teacher profile updated with optional fields used in AccountPage
export interface TeacherProfile {
  id: string;
  name: string;
  roles: string[];
  email: string;
  staffId: string;
  avatar: string;
  subjects: string[];
  isAdmin: boolean;
  password?: string;
  department?: string;
  meritsGiven?: number;
  demeritsGiven?: number;
}

// Missing BehaviorReason interface used in constants.tsx
export interface BehaviorReason {
  id: string;
  label: string;
  points: number;
  type: BehaviorType;
  category?: MeritCategory | string;
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

export type View = 'dashboard' | 'students' | 'student-detail' | 'admin' | 'account' | 'cases';
