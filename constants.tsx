
import { BehaviorType, BehaviorReason, MeritCategory } from './types';

export const GRADES = [1, 2, 3, 4, 5]; // Tingkatan 1 hingga 5
export const HOUSES = ['Temenggong', 'Syahbandar', 'Laksamana', 'Bendahara'];
export const HOUSE_COLORS: Record<string, string> = {
  'Temenggong': '#10b981', // Hijau
  'Syahbandar': '#f59e0b', // Kuning
  'Laksamana': '#ef4444',  // Merah
  'Bendahara': '#3b82f6'   // Biru
};

export const HOUSE_INITIAL_POINTS: Record<string, { merits: number; demerits: number }> = {
  'Temenggong': { merits: 0, demerits: 0 },
  'Syahbandar': { merits: 0, demerits: 0 },
  'Laksamana': { merits: 0, demerits: 0 },
  'Bendahara': { merits: 0, demerits: 0 }
};

export const MERIT_CATEGORY_COLORS: Record<string, string> = {
  [MeritCategory.AKADEMIK]: '#6366f1',    // Indigo
  [MeritCategory.KOKURIKULUM]: '#f59e0b', // Amber
  [MeritCategory.SAHSIAH]: '#10b981',     // Emerald
  [MeritCategory.TIGAK]: '#0d9488',       // Teal
  'DEMERIT': '#ef4444'                    // Rose/Red
};

export const INITIAL_BATCH_COLORS: Record<number, string> = {
  1: '#6366f1', // Indigo
  2: '#8b5cf6', // Violet
  3: '#ec4899', // Merah Jambu
  4: '#f97316', // Jingga
  5: '#a855f7'  // Ungu
};

export const CLASS_NAMES = ['Amanah', 'Bestari', 'Cita', 'Dinamik'];

export const NAME_SEPARATORS = [
  { value: 'bin', label: 'bin' },
  { value: 'a/l', label: 'a/l' },
  { value: 'anak', label: 'anak' },
  { value: '', label: 'Tiada (None)' }
];

export interface BehaviorReasonWithKey extends Omit<BehaviorReason, 'label'> {
  labelKey: string;
}

export const COMMON_REASONS: BehaviorReasonWithKey[] = [
  // AKADEMIK
  { id: 'm1', labelKey: 'reason_m1', points: 5, type: BehaviorType.MERIT, category: MeritCategory.AKADEMIK },
  { id: 'm4', labelKey: 'reason_m4', points: 10, type: BehaviorType.MERIT, category: MeritCategory.AKADEMIK },
  { id: 'm9', labelKey: 'reason_m9', points: 3, type: BehaviorType.MERIT, category: MeritCategory.AKADEMIK },
  
  // KOKURIKULUM
  { id: 'm3', labelKey: 'reason_m3', points: 5, type: BehaviorType.MERIT, category: MeritCategory.KOKURIKULUM },
  { id: 'm10', labelKey: 'reason_m10', points: 15, type: BehaviorType.MERIT, category: MeritCategory.KOKURIKULUM },
  { id: 'm11', labelKey: 'reason_m11', points: 8, type: BehaviorType.MERIT, category: MeritCategory.KOKURIKULUM },

  // SAHSIAH
  { id: 'm2', labelKey: 'reason_m2', points: 5, type: BehaviorType.MERIT, category: MeritCategory.SAHSIAH },
  { id: 'm12', labelKey: 'reason_m12', points: 10, type: BehaviorType.MERIT, category: MeritCategory.SAHSIAH },
  { id: 'm13', labelKey: 'reason_m13', points: 5, type: BehaviorType.MERIT, category: MeritCategory.SAHSIAH },

  // 3K
  { id: 'm14', labelKey: 'reason_m14', points: 5, type: BehaviorType.MERIT, category: MeritCategory.TIGAK },
  { id: 'm15', labelKey: 'reason_m15', points: 3, type: BehaviorType.MERIT, category: MeritCategory.TIGAK },
  { id: 'm16', labelKey: 'reason_m16', points: 7, type: BehaviorType.MERIT, category: MeritCategory.TIGAK },

  // DEMERITS
  { id: 'd1', labelKey: 'reason_d1', points: -5, type: BehaviorType.DEMERIT },
  { id: 'd2', labelKey: 'reason_d2', points: -2, type: BehaviorType.DEMERIT },
  { id: 'd3', labelKey: 'reason_d3', points: -3, type: BehaviorType.DEMERIT },
  { id: 'd4', labelKey: 'reason_d4', points: -10, type: BehaviorType.DEMERIT },
];

export const TEACHER_ROLES = [
  'Penyelaras Tingkatan 1',
  'Penyelaras Tingkatan 2',
  'Penyelaras Tingkatan 3',
  'Penyelaras Tingkatan 4',
  'Penyelaras Tingkatan 5',
  'Ketua Guru Rumah',
  'Guru Kelas',
  'Penolong Kanan Pentadbiran',
  'Penolong Kanan Hal Ehwal Murid',
  'Pengetua'
];

export const SUBJECT_CATEGORIES = {
  'Bahasa': [
    'Bahasa Melayu', 'Bahasa Inggeris', 'Bahasa Arab', 
    'Bahasa Cina', 'Bahasa Jerman', 'Bahasa Korea'
  ],
  'Sains & Matematik': [
    'Matematik', 'Sains', 'Biologi', 'Kimia', 'Fizik'
  ],
  'Kemanusiaan': [
    'Sejarah', 'Pendidikan Islam', 'Pendidikan Moral', 
    'Geografi', 'Pendidikan Seni Visual', 'Pendidikan Muzik'
  ],
  'Teknik & Vokasional': [
    'Matematik Tambahan', 'Reka Bentuk & Teknologi', 'Asas Sains Komputer'
  ]
};

export const formatShortName = (firstName: string, lastName: string) => {
  const fullName = `${firstName} ${lastName}`.trim();
  const separators = [
    /\s+bin\s+/i, 
    /\s+binti\s+/i, 
    /\s+bt\s+/i, 
    /\s+a\/l\s+/i, 
    /\s+a\/p\s+/i, 
    /\s+anak\s+/i
  ];

  for (const sep of separators) {
    const match = fullName.match(sep);
    if (match && match.index !== undefined) {
      return fullName.substring(0, match.index).trim();
    }
  }

  const parts = fullName.split(' ');
  if (parts.length > 2) {
    return `${parts[0]} ${parts[1]}`;
  }

  return fullName;
};
