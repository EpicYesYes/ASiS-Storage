
import { Student, BehaviorType, StudentRecord } from './types';
import { HOUSES, CLASS_NAMES, GRADES } from './constants';

const boyFirstNames = ['Adam Harith', 'Muhammad Danish', 'Ahmad Zaki', 'Ariff Budiman', 'Chong Wei', 'Muthu', 'Lee Kah', 'Aiman', 'Syed Muzaffar'];
const boyLastNames = ['Ali', 'Abdullah', 'Tan', 'Subramaniam', 'Ibrahim', 'Nasir', 'Hashim', 'Ariffin'];
const separators = ['bin', 'a/l', 'anak'];

export const generateMockData = (count: number) => {
  const timestamp = Date.now();
  const students: Student[] = Array.from({ length: count }, (_, i) => {
    const fName = boyFirstNames[Math.floor(Math.random() * boyFirstNames.length)];
    const lName = boyLastNames[Math.floor(Math.random() * boyLastNames.length)];
    const sep = separators[Math.floor(Math.random() * separators.length)];
    
    const randomChoice = Math.random();
    let lastName = lName;
    if (randomChoice > 0.5) lastName = `${sep} ${lName}`;

    const grade = GRADES[Math.floor(Math.random() * GRADES.length)];
    const className = CLASS_NAMES[Math.floor(Math.random() * CLASS_NAMES.length)];
    const id = `std-${timestamp}-${i}-${Math.floor(Math.random() * 10000)}`;

    return {
      id,
      firstName: fName,
      lastName,
      grade,
      classGroup: `${grade} ${className}`,
      house: HOUSES[Math.floor(Math.random() * HOUSES.length)],
      avatar: `https://picsum.photos/seed/${id}/200/200`
    };
  });

  const records: StudentRecord[] = [];
  students.forEach(s => {
    const recordCount = Math.floor(Math.random() * 3);
    for(let j = 0; j < recordCount; j++) {
      const isMerit = Math.random() > 0.4;
      records.push({
        id: `rec-${s.id}-${j}-${Math.floor(Math.random() * 1000)}`,
        studentId: s.id,
        teacherId: 'admin-1',
        teacherName: 'Admin Sistem',
        type: isMerit ? BehaviorType.MERIT : BehaviorType.DEMERIT,
        reason: isMerit ? 'Menunjukkan sahsiah terpuji' : 'Melanggar peraturan sekolah',
        points: isMerit ? 5 : -5,
        timestamp: Date.now() - Math.floor(Math.random() * 100000000)
      });
    }
  });

  return { students, records };
};
