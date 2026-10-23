export type Role = 'super_admin' | 'admin' | 'guru' | 'proktor' | 'siswa';

export type QuestionType = 
  | 'pilihan_ganda' 
  | 'pilihan_ganda_kompleks' 
  | 'benar_salah' 
  | 'menjodohkan' 
  | 'isian_singkat' 
  | 'uraian';

export type DifficultyLevel = 'mudah' | 'sedang' | 'sukar';

export type ExamAttemptStatus = 
  | 'DRAFT' 
  | 'SCHEDULED' 
  | 'WAITING_TOKEN' 
  | 'READY' 
  | 'IN_PROGRESS' 
  | 'SUBMITTED' 
  | 'AUTO_SUBMITTED' 
  | 'EXPIRED' 
  | 'CANCELLED';

export type StudentStatus = 'belum_login' | 'mengerjakan' | 'ragu_ragu' | 'terputus' | 'selesai';

export type TeacherType = 'pembuat_soal' | 'guru_biasa';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  email?: string;
  avatar?: string;
  nomorPeserta?: string;
  nisn?: string;
  kelas?: string;
  rombel?: string;
  sekolah?: string;
  subjectIds?: string[]; // For teachers (assigned subject IDs)
  assignedSubjectId?: string; // Primary assigned subject ID set by Admin
  assignedClasses?: string[]; // Specific classes taught by teacher, e.g. ['9A', '9B']
  teacherType?: TeacherType; // 'pembuat_soal' (bisa input soal & paket) vs 'guru_biasa' (hanya unduh nilai kelas)
  assignedSessionIds?: string[]; // For proctors
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  description: string;
  targetClasses: string[]; // ['7', '8', '9']
  isActive: boolean;
  defaultDurationMinutes: number;
  kkm: number;
}

export interface MatchingPair {
  id: string;
  premise: string;
  response: string;
}

export interface TrueFalseItem {
  id: string;
  statement: string;
  correctAnswer: boolean;
}

export interface QuestionOption {
  id: string;
  text: string;
  image?: string;
}

export interface Question {
  id: string;
  code: string;
  subjectId: string;
  kelas: string; // '7' | '8' | '9'
  topic: string;
  competency: string;
  difficulty: DifficultyLevel;
  type: QuestionType;
  stimulus?: {
    type: 'text' | 'image' | 'table' | 'formula';
    title?: string;
    content: string;
  };
  prompt: string;
  image?: string;
  options?: QuestionOption[]; // For pilihan_ganda & kompleks
  correctOptionId?: string; // For pilihan_ganda (server-only in real prod)
  correctOptionIds?: string[]; // For pilihan_ganda_kompleks
  trueFalseItems?: TrueFalseItem[]; // For benar_salah
  matchingPairs?: MatchingPair[]; // For menjodohkan
  correctShortAnswer?: string[]; // Array of acceptable answers
  essayRubric?: {
    maxScore: number;
    guidelines: string;
  };
  essayKeyAnswer?: string; // Model Kunci Jawaban Uraian (Google Form style)
  essayKeywords?: string[]; // Kata kunci penting untuk penilaian otomatis
  weight: number;
  isActive: boolean;
  createdAt: string;
}

export interface ExamPackage {
  id: string;
  code: string;
  name: string;
  subjectId: string;
  kelas: string;
  durationMinutes: number;
  questionIds: string[];
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  partialCreditForComplex: boolean;
  kkm: number;
  totalWeight: number;
  createdAt: string;
}

export interface ExamSession {
  id: string;
  sessionNumber: number; // 1 to 6
  dayNumber: number; // 1 to 13
  date: string; // YYYY-MM-DD
  startTime: string; // '07:30'
  endTime: string; // '09:30'
  durationMinutes: number;
  subjectId: string;
  examPackageId: string;
  classes: string[]; // e.g. ['9A', '9B', '9C']
  roomName: string;
  maxCapacity: number; // max 120
  proctorId: string;
  proctorName: string;
  status: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'SUSPENDED';
  startToken: string;
  startTokenExpiry?: string;
  submitToken?: string;
  isSubmitTokenRequired: boolean;
  minSubmitMinutes: number; // default 45 mins
}

export interface StudentAnswer {
  questionId: string;
  selectedOptionId?: string; // pilihan_ganda
  selectedOptionIds?: string[]; // pilihan_ganda_kompleks
  trueFalseAnswers?: Record<string, boolean>; // itemId -> boolean
  matchingAnswers?: Record<string, string>; // premiseId -> responseId/text
  shortAnswerText?: string;
  essayText?: string;
  isDoubtful: boolean; // "Ragu-ragu"
  savedAt: string;
  score?: number; // Calculated score
  gradedBy?: string; // Teacher who graded essay
  essayFeedback?: string;
  isAutoGraded?: boolean; // Evaluated via Google Forms answer key
  matchedKeywords?: string[]; // Detected keywords from answer key
}

export interface ExamAttempt {
  id: string;
  examSessionId: string;
  examPackageId: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  studentClass: string;
  status: ExamAttemptStatus;
  startedAt?: string;
  finishedAt?: string;
  deadline: string;
  answers: Record<string, StudentAnswer>;
  questionOrder: string[]; // Shuffled question ID order preserved for consistency
  optionOrders?: Record<string, string[]>; // questionId -> shuffled optionIds
  totalScore?: number;
  maxScore?: number;
  isPassed?: boolean;
  lastSyncAt: string;
  violationCount: number; // Tab switch or fullscreen exit count
  ipAddress?: string;
}

export interface SchoolSettings {
  schoolName: string;
  npsn: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  address: string;
  headmasterName: string;
  headmasterNip: string;
  logoText: string;
  primaryColor: string; // e.g. '#1e40af'
  requireSubmitToken: boolean;
  minSubmitTimeMinutes: number; // default 45
  preventTabSwitch: boolean;
  maxViolationsAllowed: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  category: 'AUTH' | 'TOKEN' | 'EXAM' | 'PROCTOR' | 'GRADING' | 'CONFIG';
  details: string;
  ipAddress?: string;
}

export interface IncidentReport {
  id: string;
  sessionId: string;
  timestamp: string;
  proctorId: string;
  proctorName: string;
  studentId?: string;
  studentName?: string;
  incidentType: 'LISTRIK_PADAM' | 'JARINGAN_PUTUS' | 'GANTI_KOMPUTER' | 'KECURANGAN' | 'LAINNYA';
  notes: string;
  actionTaken: string;
}
