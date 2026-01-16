
import { Student, BehaviorType } from './types';
import { HOUSES, CLASS_NAMES, GRADES } from './constants';

const boyFirstNames = [
  'Muhammad Danish', 'Ahmad Zaki', 'Amirul Hakim', 'Adam Harith', 
  'Chong Wei', 'Muthu', 'Ariff Budiman', 'Wan Syahmi', 
  'Nik Haikal', 'Mohd Redzuan', 'Suresh', 'Lee Kah', 
  'Hafizuddin', 'Badrul Amin', 'Zulhelmi', 'Fayadh', 
  'Irfan', 'Aiman', 'Syed Muzaffar', 'Khairul'
];

const separators = ['bin', 'a/l', 'anak'];

const boyLastNames = [
  'Ali', 'Abdullah', 'Tan', 'Subramaniam', 'Ibrahim', 
  'Mansor', 'Yusof', 'Lim', 'Bakri', 'Nasir', 
  'Low', 'Hashim', 'Zainal', 'Abdullah', 'Sidek', 'Ariffin'
];

export const generateMockStudents = (count: number): Student[] => {
  return Array.from({ length: count }, (_, i) => {
    const fName = boyFirstNames[Math.floor(Math.random() * boyFirstNames.length)];
    const lName = boyLastNames[Math.floor(Math.random() * boyLastNames.length)];
    const sep = separators[Math.floor(Math.random() * separators.length)];
    
    // Malaysian naming variety
    let firstName = fName;
    let lastName = '';
    
    const randomChoice = Math.random();
    if (randomChoice > 0.4) {
      // 60% standard Malaysian (First Name + bin/al/anak + Last Name)
      lastName = `${sep} ${lName}`;
    } else if (randomChoice > 0.15) {
      // 25% double first name style
      lastName = boyLastNames[Math.floor(Math.random() * boyLastNames.length)];
    } else {
      // 15% Single name or other ethnic styles
      lastName = lName;
    }
    
    const grade = GRADES[Math.floor(Math.random() * GRADES.length)];
    const className = CLASS_NAMES[Math.floor(Math.random() * CLASS_NAMES.length)];
    const classGroup = `${grade} ${className}`;
    const house = HOUSES[Math.floor(Math.random() * HOUSES.length)];
    const id = `std-${Date.now()}-${i}`;
    
    const records = Array.from({ length: Math.floor(Math.random() * 5) }, (_, rIdx) => {
      const isMerit = Math.random() > 0.4;
      const type = isMerit ? BehaviorType.MERIT : BehaviorType.DEMERIT;
      const points = isMerit ? 5 : -5;
      
      return {
        id: `${id}-rec-${rIdx}`,
        type,
        reason: isMerit ? 'Menunjukkan sahsiah terpuji' : 'Melanggar peraturan sekolah',
        points,
        timestamp: Date.now() - Math.floor(Math.random() * 100000000),
        teacherName: 'Admin Sistem'
      };
    });

    const totalPoints = records.reduce((acc, curr) => acc + curr.points, 100);

    return {
      id,
      firstName,
      lastName,
      grade,
      classGroup,
      house,
      totalPoints,
      avatar: `https://picsum.photos/seed/${id}/200/200`,
      records
    };
  });
};
