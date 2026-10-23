import {
  Subject,
  Question,
  ExamPackage,
  ExamSession,
  ExamAttempt,
  StudentAnswer,
  User,
  SchoolSettings,
  AuditLog,
  IncidentReport,
} from '../types';
import {
  INITIAL_SCHOOL_SETTINGS,
  INITIAL_SUBJECTS,
  INITIAL_QUESTIONS,
  INITIAL_EXAM_PACKAGES,
  INITIAL_STAFF_USERS,
  generateDefaultSessions,
  generateDefaultStudents,
} from './seedData';

const STORAGE_KEYS = {
  SETTINGS: 'anbk_settings_v1',
  SUBJECTS: 'anbk_subjects_v1',
  QUESTIONS: 'anbk_questions_v1',
  PACKAGES: 'anbk_packages_v1',
  SESSIONS: 'anbk_sessions_v1',
  STUDENTS: 'anbk_students_v1',
  STAFF: 'anbk_staff_v1',
  ATTEMPTS: 'anbk_attempts_v1',
  AUDIT_LOGS: 'anbk_audit_logs_v1',
  INCIDENTS: 'anbk_incidents_v1',
  CURRENT_USER: 'anbk_current_user_v1',
};

// Seed initial storage if not exists
export function initializeStorage(): void {
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SCHOOL_SETTINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUBJECTS)) {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.QUESTIONS)) {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PACKAGES)) {
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(INITIAL_EXAM_PACKAGES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(generateDefaultSessions()));
  } else {
    try {
      const existingSessions: ExamSession[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
      const hasMultiRoom = existingSessions.some(s => s.id.includes('-r2') || s.id.includes('-r3'));
      if (!hasMultiRoom) {
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(generateDefaultSessions()));
      }
    } catch {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(generateDefaultSessions()));
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(generateDefaultStudents()));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STAFF)) {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF_USERS));
  } else {
    // Migration: ensure new teacher users, proctors and their room settings exist
    try {
      const existingStaff: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF) || '[]');
      let updated = false;
      INITIAL_STAFF_USERS.forEach(initUser => {
        const found = existingStaff.find(s => s.username === initUser.username);
        if (!found) {
          existingStaff.push(initUser);
          updated = true;
        } else {
          if (initUser.role === 'proktor' && !found.assignedRoom) {
            found.assignedRoom = initUser.assignedRoom;
            found.assignedSessionIds = initUser.assignedSessionIds;
            updated = true;
          }
          if (initUser.role === 'guru' && !found.teacherType) {
            found.teacherType = initUser.teacherType || 'pembuat_soal';
            found.assignedSubjectId = found.assignedSubjectId || initUser.assignedSubjectId;
            found.assignedClasses = found.assignedClasses || initUser.assignedClasses;
            updated = true;
          }
        }
      });
      if (updated) {
        localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(existingStaff));
      }
    } catch {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF_USERS));
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTEMPTS)) {
    // Generate initial sample completed attempt for demonstration
    const initialAttempts: ExamAttempt[] = [
      {
        id: 'att-demo-1',
        examSessionId: 'sesi-h1-s1',
        examPackageId: 'pkg-simulasi-lengkap',
        studentId: 'std-2',
        studentName: 'Aditya Saputra',
        studentNumber: 'P09-01-002',
        studentClass: '9A',
        status: 'SUBMITTED',
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        finishedAt: new Date(Date.now() - 600000).toISOString(),
        deadline: new Date(Date.now() + 1800000).toISOString(),
        answers: {
          'q-bind-01': {
            questionId: 'q-bind-01',
            selectedOptionId: 'opt-b',
            isDoubtful: false,
            savedAt: new Date().toISOString(),
            score: 2,
          },
          'q-bind-02': {
            questionId: 'q-bind-02',
            selectedOptionIds: ['opt-c1', 'opt-c2', 'opt-c4'],
            isDoubtful: false,
            savedAt: new Date().toISOString(),
            score: 3,
          },
          'q-mat-01': {
            questionId: 'q-mat-01',
            trueFalseAnswers: { 'tf-1': true, 'tf-2': true, 'tf-3': false, 'tf-4': false },
            isDoubtful: false,
            savedAt: new Date().toISOString(),
            score: 3,
          },
          'q-ipa-01': {
            questionId: 'q-ipa-01',
            matchingAnswers: {
              'm-1': 'Rhizopus oryzae',
              'm-2': 'Lactobacillus bulgaricus',
              'm-3': 'Acetobacter xylinum',
              'm-4': 'Saccharomyces cerevisiae',
            },
            isDoubtful: false,
            savedAt: new Date().toISOString(),
            score: 3,
          },
          'q-mat-02': {
            questionId: 'q-mat-02',
            shortAnswerText: '1540',
            isDoubtful: false,
            savedAt: new Date().toISOString(),
            score: 2,
          },
          'q-inf-01': {
            questionId: 'q-inf-01',
            selectedOptionId: 'inf-b',
            isDoubtful: false,
            savedAt: new Date().toISOString(),
            score: 2,
          },
          'q-pkn-01': {
            questionId: 'q-pkn-01',
            selectedOptionIds: ['pkn-1', 'pkn-3', 'pkn-4'],
            isDoubtful: false,
            savedAt: new Date().toISOString(),
            score: 3,
          },
          'q-ai-01': {
            questionId: 'q-ai-01',
            essayText: 'Risiko pertama adalah terjadinya plagiarisme dan penurunan integritas akademik siswa. Risiko kedua adalah penyebaran fakta palsu karena adanya fenomena halusinasi AI yang belum dicek silang. Tiga prinsip etis yang harus diterapkan: 1. Melakukan verifikasi silang terhadap sumber primer terpercaya (buku teks, jurnal ilmiah). 2. Memberikan atribusi/sitasi yang jujur bahwa AI digunakan untuk brainstorming. 3. Menjadikan AI sebagai mitra asisten diskusi, bukan sebagai penulis tugas secara instan.',
            isDoubtful: false,
            savedAt: new Date().toISOString(),
            score: 9,
            gradedBy: 'Drs. Hendro Wibisono',
            essayFeedback: 'Analisis kritis sangat mendalam dan mencantumkan 3 prinsip etika aplikatif secara tepat.',
          },
        },
        questionOrder: [
          'q-bind-01',
          'q-bind-02',
          'q-mat-01',
          'q-ipa-01',
          'q-mat-02',
          'q-inf-01',
          'q-pkn-01',
          'q-ai-01',
        ],
        totalScore: 27,
        maxScore: 28,
        isPassed: true,
        lastSyncAt: new Date().toISOString(),
        violationCount: 0,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(initialAttempts));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
    const initialLogs: AuditLog[] = [
      {
        id: 'log-1',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        userId: 'usr-admin',
        userName: 'Siti Rahmawati, S.Pd.',
        userRole: 'admin',
        action: 'Inisialisasi sistem CBT & verifikasi 78 sesi ujian',
        category: 'CONFIG',
        details: 'Sinkronisasi konfigurasi 13 hari 6 sesi ujian tingkat SMP berhasil',
      },
      {
        id: 'log-2',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        userId: 'usr-proktor-1',
        userName: 'Rahmat Hidayat, S.Kom',
        userRole: 'proktor',
        action: 'Membuka Sesi 1 Hari Ke-1',
        category: 'PROCTOR',
        details: 'Menerbitkan Token Mulai SMP100 di Lab Komputer 1',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialLogs));
  }
}

// Settings
export function getSchoolSettings(): SchoolSettings {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || JSON.stringify(INITIAL_SCHOOL_SETTINGS));
}

export function saveSchoolSettings(settings: SchoolSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  addAuditLog('usr-admin', 'Administrator', 'admin', 'Memperbarui Pengaturan Sekolah', 'CONFIG', `Nama sekolah: ${settings.schoolName}`);
}

// Subjects
export function getSubjects(): Subject[] {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS) || '[]');
}

export function saveSubject(subject: Subject): void {
  const list = getSubjects();
  const idx = list.findIndex(s => s.id === subject.id);
  if (idx >= 0) {
    list[idx] = subject;
  } else {
    list.push(subject);
  }
  localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(list));
}

export function deleteSubject(subjectId: string): void {
  const list = getSubjects().filter(s => s.id !== subjectId);
  localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(list));
}

// Questions
export function getQuestions(): Question[] {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.QUESTIONS) || '[]');
}

export function saveQuestion(question: Question): void {
  const list = getQuestions();
  const idx = list.findIndex(q => q.id === question.id);
  if (idx >= 0) {
    list[idx] = question;
  } else {
    list.push(question);
  }
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(list));
}

export function deleteQuestion(questionId: string): void {
  const list = getQuestions().filter(q => q.id !== questionId);
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(list));
}

// Exam Packages
export function getExamPackages(): ExamPackage[] {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.PACKAGES) || '[]');
}

export function saveExamPackage(pkg: ExamPackage): void {
  const list = getExamPackages();
  const idx = list.findIndex(p => p.id === pkg.id);
  if (idx >= 0) {
    list[idx] = pkg;
  } else {
    list.push(pkg);
  }
  localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(list));
}

export function deleteExamPackage(id: string): void {
  const list = getExamPackages().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(list));
}

// Exam Sessions
export function getExamSessions(): ExamSession[] {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
}

export function getExamSessionById(sessionId: string): ExamSession | undefined {
  return getExamSessions().find(s => s.id === sessionId);
}

// Find session matching start token (case-insensitive) across all rooms
export function findSessionByToken(token: string): ExamSession | undefined {
  const clean = (token || '').trim().toUpperCase();
  if (!clean) return undefined;
  const sessions = getExamSessions();
  return sessions.find(s => s.startToken && s.startToken.toUpperCase() === clean);
}

export function saveExamSession(session: ExamSession): void {
  const list = getExamSessions();
  const idx = list.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    list[idx] = session;
  } else {
    list.push(session);
  }
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(list));
}

// Students & Users
export function getStudents(): User[] {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
}

export function saveStudents(students: User[]): void {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
}

export function getStaffUsers(): User[] {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF) || '[]');
}

export function saveStaffUsers(staff: User[]): void {
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
}

export function saveStaffUser(user: User): void {
  const staff = getStaffUsers();
  const idx = staff.findIndex(s => s.id === user.id);
  if (idx >= 0) {
    staff[idx] = user;
  } else {
    staff.push(user);
  }
  saveStaffUsers(staff);
}

export function getAllUsers(): User[] {
  return [...getStaffUsers(), ...getStudents()];
}

export function findUserByCredentials(username: string, password?: string): User | undefined {
  const allUsers = getAllUsers();
  // Standard matching for students by username (Nomor Peserta or NISN)
  const user = allUsers.find(
    u => u.username.toLowerCase() === username.trim().toLowerCase() ||
         (u.nomorPeserta && u.nomorPeserta.toLowerCase() === username.trim().toLowerCase()) ||
         (u.nisn && u.nisn === username.trim())
  );
  return user;
}

// Exam Attempts
export function getExamAttempts(): ExamAttempt[] {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTEMPTS) || '[]');
}

export function getExamAttempt(studentId: string, sessionId: string): ExamAttempt | undefined {
  return getExamAttempts().find(
    a => a.studentId === studentId && a.examSessionId === sessionId
  );
}

export function getOrCreateExamAttempt(
  student: User,
  session: ExamSession,
  pkg: ExamPackage
): ExamAttempt {
  const attempts = getExamAttempts();
  const existing = attempts.find(
    a => a.studentId === student.id && a.examSessionId === session.id
  );

  if (existing) {
    return existing;
  }

  // Shuffle question order if package requested
  let order = [...pkg.questionIds];
  if (pkg.randomizeQuestions) {
    // Fisher-Yates shuffle
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }

  const now = new Date();
  const durationMs = session.durationMinutes * 60 * 1000;
  const deadline = new Date(now.getTime() + durationMs).toISOString();

  const newAttempt: ExamAttempt = {
    id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    examSessionId: session.id,
    examPackageId: pkg.id,
    studentId: student.id,
    studentName: student.name,
    studentNumber: student.nomorPeserta || student.username,
    studentClass: student.rombel || student.kelas || '9A',
    roomName: session.roomName,
    status: 'IN_PROGRESS',
    startedAt: now.toISOString(),
    deadline: deadline,
    answers: {},
    questionOrder: order,
    lastSyncAt: now.toISOString(),
    violationCount: 0,
  };

  attempts.push(newAttempt);
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));

  addAuditLog(
    student.id,
    student.name,
    'siswa',
    'Memulai Pengerjaan Ujian',
    'EXAM',
    `Sesi: ${session.id}, Paket: ${pkg.name}, Deadline: ${newAttempt.deadline}`
  );

  return newAttempt;
}

export function saveStudentAnswer(
  attemptId: string,
  answer: StudentAnswer
): { success: boolean; attempt: ExamAttempt | null } {
  const attempts = getExamAttempts();
  const idx = attempts.findIndex(a => a.id === attemptId);
  if (idx < 0) return { success: false, attempt: null };

  const attempt = attempts[idx];
  
  // Guard against submitted / closed attempts
  if (attempt.status === 'SUBMITTED' || attempt.status === 'AUTO_SUBMITTED') {
    return { success: false, attempt };
  }

  // Check deadline
  const now = new Date().getTime();
  const deadlineTime = new Date(attempt.deadline).getTime();
  if (now > deadlineTime) {
    attempt.status = 'AUTO_SUBMITTED';
    attempt.finishedAt = new Date().toISOString();
    calculateAttemptScore(attempt);
    attempts[idx] = attempt;
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
    return { success: false, attempt };
  }

  attempt.answers[answer.questionId] = {
    ...answer,
    savedAt: new Date().toISOString(),
  };
  attempt.lastSyncAt = new Date().toISOString();

  attempts[idx] = attempt;
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
  return { success: true, attempt };
}

export function recordViolation(attemptId: string): number {
  const attempts = getExamAttempts();
  const idx = attempts.findIndex(a => a.id === attemptId);
  if (idx < 0) return 0;

  attempts[idx].violationCount = (attempts[idx].violationCount || 0) + 1;
  const count = attempts[idx].violationCount;
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));

  addAuditLog(
    attempts[idx].studentId,
    attempts[idx].studentName,
    'siswa',
    'Peringatan Berpindah Tab/Jendela',
    'EXAM',
    `Pelanggaran ke-${count} pada attempt ${attemptId}`
  );

  return count;
}

// Calculate score for objective and complex questions
export function calculateAttemptScore(attempt: ExamAttempt): void {
  const questions = getQuestions();
  const pkg = getExamPackages().find(p => p.id === attempt.examPackageId);
  
  let totalScore = 0;
  let maxScore = 0;

  for (const qId of attempt.questionOrder) {
    const question = questions.find(q => q.id === qId);
    if (!question) continue;

    const answer = attempt.answers[qId];
    maxScore += question.weight;

    if (!answer) continue;

    let scoreForQuestion = 0;

    switch (question.type) {
      case 'pilihan_ganda': {
        if (answer.selectedOptionId && answer.selectedOptionId === question.correctOptionId) {
          scoreForQuestion = question.weight;
        }
        break;
      }
      case 'pilihan_ganda_kompleks': {
        const correct = question.correctOptionIds || [];
        const selected = answer.selectedOptionIds || [];
        if (correct.length > 0) {
          // Check if exactly match or partial credit
          const correctPicks = selected.filter(id => correct.includes(id)).length;
          const wrongPicks = selected.filter(id => !correct.includes(id)).length;
          
          if (wrongPicks === 0 && correctPicks === correct.length) {
            scoreForQuestion = question.weight;
          } else if (pkg?.partialCreditForComplex && correctPicks > wrongPicks) {
            // Partial credit formula: (correctPicks - wrongPicks) / totalCorrect * weight
            const ratio = Math.max(0, (correctPicks - wrongPicks) / correct.length);
            scoreForQuestion = Number((ratio * question.weight).toFixed(1));
          }
        }
        break;
      }
      case 'benar_salah': {
        const items = question.trueFalseItems || [];
        if (items.length > 0 && answer.trueFalseAnswers) {
          let correctCount = 0;
          items.forEach(it => {
            if (answer.trueFalseAnswers?.[it.id] === it.correctAnswer) {
              correctCount++;
            }
          });
          scoreForQuestion = Number(((correctCount / items.length) * question.weight).toFixed(1));
        }
        break;
      }
      case 'menjodohkan': {
        const pairs = question.matchingPairs || [];
        if (pairs.length > 0 && answer.matchingAnswers) {
          let matchedCount = 0;
          pairs.forEach(p => {
            if (answer.matchingAnswers?.[p.id] === p.response) {
              matchedCount++;
            }
          });
          scoreForQuestion = Number(((matchedCount / pairs.length) * question.weight).toFixed(1));
        }
        break;
      }
      case 'isian_singkat': {
        const userText = (answer.shortAnswerText || '').trim().toLowerCase();
        const acceptable = (question.correctShortAnswer || []).map(s => s.trim().toLowerCase());
        if (acceptable.includes(userText)) {
          scoreForQuestion = question.weight;
        }
        break;
      }
      case 'uraian': {
        // Teacher grades manual. Retain existing grade if present
        scoreForQuestion = answer.score !== undefined ? answer.score : 0;
        break;
      }
    }

    answer.score = scoreForQuestion;
    totalScore += scoreForQuestion;
  }

  attempt.totalScore = Number(totalScore.toFixed(1));
  attempt.maxScore = maxScore;
  const kkm = pkg?.kkm || 75;
  // Normalized to 0-100 scale for passed condition
  const scaledScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  attempt.isPassed = scaledScore >= kkm;
}

export function finalizeAttempt(
  attemptId: string,
  isAuto = false
): ExamAttempt | null {
  const attempts = getExamAttempts();
  const idx = attempts.findIndex(a => a.id === attemptId);
  if (idx < 0) return null;

  const attempt = attempts[idx];
  attempt.status = isAuto ? 'AUTO_SUBMITTED' : 'SUBMITTED';
  attempt.finishedAt = new Date().toISOString();
  calculateAttemptScore(attempt);

  attempts[idx] = attempt;
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));

  addAuditLog(
    attempt.studentId,
    attempt.studentName,
    'siswa',
    isAuto ? 'Ujian Selesai Otomatis (Waktu Habis)' : 'Siswa Mengirimkan Ujian (Final Submit)',
    'EXAM',
    `Attempt: ${attemptId}, Total Skor: ${attempt.totalScore}/${attempt.maxScore}`
  );

  return attempt;
}

// Teacher manual grading for essay
export function gradeEssayAnswer(
  attemptId: string,
  questionId: string,
  score: number,
  feedback: string,
  teacherName: string
): ExamAttempt | null {
  const attempts = getExamAttempts();
  const idx = attempts.findIndex(a => a.id === attemptId);
  if (idx < 0) return null;

  const attempt = attempts[idx];
  if (attempt.answers[questionId]) {
    attempt.answers[questionId].score = score;
    attempt.answers[questionId].gradedBy = teacherName;
    attempt.answers[questionId].essayFeedback = feedback;
    attempt.answers[questionId].isAutoGraded = false;
  }

  calculateAttemptScore(attempt);
  attempts[idx] = attempt;
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));

  addAuditLog(
    'usr-guru-1',
    teacherName,
    'guru',
    'Penilaian Manual Soal Uraian',
    'GRADING',
    `Attempt: ${attemptId}, Soal: ${questionId}, Nilai: ${score}`
  );

  return attempt;
}

// Evaluates essay text against answer key & keywords (Google Forms quiz grading style)
export function evaluateEssayAnswerKey(
  studentText: string,
  keyAnswer?: string,
  keywords?: string[],
  maxScore: number = 10
): {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  matchPercentage: number;
  feedback: string;
} {
  const cleanStudent = (studentText || '').toLowerCase().trim();

  if (!cleanStudent) {
    return {
      score: 0,
      matchedKeywords: [],
      missingKeywords: keywords || [],
      matchPercentage: 0,
      feedback: 'Siswa tidak mengisi teks jawaban pada butir uraian ini.',
    };
  }

  let targetKeywords = keywords && keywords.length > 0 ? [...keywords] : [];

  // If no explicit keywords, extract key terms from model answer key
  if (targetKeywords.length === 0 && keyAnswer) {
    const stopwords = new Set([
      'yang', 'untuk', 'pada', 'dengan', 'dan', 'atau', 'dari', 'dalam', 'adalah',
      'yaitu', 'karena', 'oleh', 'atas', 'saat', 'agar', 'jika', 'maka', 'bisa',
      'dapat', 'akan', 'telah', 'sudah', 'secara', 'harus', 'sebagai', 'serta'
    ]);
    const words = keyAnswer
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 4 && !stopwords.has(w));
    targetKeywords = Array.from(new Set(words)).slice(0, 6);
  }

  if (targetKeywords.length === 0) {
    // If no keywords or model key, provide fair base score
    return {
      score: maxScore > 0 ? Math.round(maxScore * 0.7) : 0,
      matchedKeywords: [],
      missingKeywords: [],
      matchPercentage: 70,
      feedback: 'Jawaban terisi (Peninjauan rubrik mandiri guru).',
    };
  }

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of targetKeywords) {
    const cleanKw = kw.toLowerCase().trim();
    if (cleanKw && cleanStudent.includes(cleanKw)) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  const matchRatio = targetKeywords.length > 0 ? matchedKeywords.length / targetKeywords.length : 0;
  const matchPercentage = Math.round(matchRatio * 100);
  const calculatedScore = Number((matchRatio * maxScore).toFixed(1));

  let feedback = `Kunci Jawaban Google Form: ${matchedKeywords.length}/${targetKeywords.length} kata kunci teridentifikasi (${matchPercentage}%).`;
  if (matchedKeywords.length > 0) {
    feedback += ` Kunci cocok: [${matchedKeywords.join(', ')}].`;
  }
  if (missingKeywords.length > 0) {
    feedback += ` Belum teridentifikasi: [${missingKeywords.join(', ')}].`;
  }

  return {
    score: calculatedScore,
    matchedKeywords,
    missingKeywords,
    matchPercentage,
    feedback,
  };
}

// Auto-grade single essay answer with Google Forms answer key
export function autoGradeEssayAnswer(
  attemptId: string,
  questionId: string,
  teacherName: string = 'Sistem Kunci Jawaban Google Form'
): ExamAttempt | null {
  const attempts = getExamAttempts();
  const idx = attempts.findIndex(a => a.id === attemptId);
  if (idx < 0) return null;

  const attempt = attempts[idx];
  const question = getQuestions().find(q => q.id === questionId);
  if (!question || !attempt.answers[questionId]) return null;

  const ans = attempt.answers[questionId];
  const maxScore = question.essayRubric?.maxScore || question.weight || 10;
  const evalResult = evaluateEssayAnswerKey(
    ans.essayText || '',
    question.essayKeyAnswer,
    question.essayKeywords,
    maxScore
  );

  ans.score = evalResult.score;
  ans.gradedBy = teacherName;
  ans.essayFeedback = evalResult.feedback;
  ans.isAutoGraded = true;
  ans.matchedKeywords = evalResult.matchedKeywords;

  calculateAttemptScore(attempt);
  attempts[idx] = attempt;
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));

  addAuditLog(
    'usr-guru-1',
    teacherName,
    'guru',
    'Penilaian Otomatis Kunci Jawaban Uraian (Google Form)',
    'GRADING',
    `Attempt: ${attemptId}, Soal: ${questionId}, Nilai: ${evalResult.score}/${maxScore} (${evalResult.matchPercentage}%)`
  );

  return attempt;
}

// Auto-grade all pending student essays matching answer keys
export function autoGradeAllPendingEssays(teacherName: string = 'Sistem Kunci Jawaban Google Form'): number {
  const attempts = getExamAttempts();
  const questions = getQuestions();
  let gradedCount = 0;

  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    if (attempt.status !== 'SUBMITTED' && attempt.status !== 'AUTO_SUBMITTED') continue;

    let attemptChanged = false;
    for (const qId of attempt.questionOrder) {
      const q = questions.find(item => item.id === qId);
      if (q && q.type === 'uraian') {
        const ans = attempt.answers[qId];
        if (ans && ans.gradedBy === undefined) {
          const maxScore = q.essayRubric?.maxScore || q.weight || 10;
          const evalResult = evaluateEssayAnswerKey(
            ans.essayText || '',
            q.essayKeyAnswer,
            q.essayKeywords,
            maxScore
          );
          ans.score = evalResult.score;
          ans.gradedBy = teacherName;
          ans.essayFeedback = evalResult.feedback;
          ans.isAutoGraded = true;
          ans.matchedKeywords = evalResult.matchedKeywords;
          attemptChanged = true;
          gradedCount++;
        }
      }
    }

    if (attemptChanged) {
      calculateAttemptScore(attempt);
    }
  }

  if (gradedCount > 0) {
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
    addAuditLog(
      'usr-guru-1',
      teacherName,
      'guru',
      'Penilaian Massal Kunci Jawaban Uraian (Google Form)',
      'GRADING',
      `Berhasil menilai otomatis ${gradedCount} jawaban uraian siswa berdasarkan kunci jawaban`
    );
  }

  return gradedCount;
}

// Proctor Session Actions
export function resetStudentSession(sessionId: string, studentId: string, proctorName: string): boolean {
  const attempts = getExamAttempts();
  const idx = attempts.findIndex(
    a => a.examSessionId === sessionId && a.studentId === studentId
  );
  if (idx >= 0) {
    // If student was stuck in progress or disconnect, reset to allow continuation
    const attempt = attempts[idx];
    if (attempt.status !== 'SUBMITTED') {
      attempt.status = 'IN_PROGRESS';
      attempt.lastSyncAt = new Date().toISOString();
      attempts[idx] = attempt;
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
    }
  }

  addAuditLog(
    'proktor',
    proctorName,
    'proktor',
    'Reset Login Peserta Ujian',
    'PROCTOR',
    `Sesi: ${sessionId}, Siswa: ${studentId}`
  );

  return true;
}

export function refreshSessionStartToken(sessionId: string, proctorName: string): string {
  const sessions = getExamSessions();
  const idx = sessions.findIndex(s => s.id === sessionId);
  if (idx < 0) return '';

  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let newToken = '';
  for (let i = 0; i < 6; i++) {
    newToken += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  sessions[idx].startToken = newToken;
  sessions[idx].startTokenExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

  addAuditLog(
    'proktor',
    proctorName,
    'proktor',
    'Rilis / Refresh Token Mulai Ujian',
    'TOKEN',
    `Sesi: ${sessionId}, Token Baru: ${newToken}`
  );

  return newToken;
}

export function generateSessionSubmitToken(sessionId: string, proctorName: string): string {
  const sessions = getExamSessions();
  const idx = sessions.findIndex(s => s.id === sessionId);
  if (idx < 0) return '';

  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let submitToken = 'FIN';
  for (let i = 0; i < 3; i++) {
    submitToken += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  sessions[idx].submitToken = submitToken;
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

  addAuditLog(
    'proktor',
    proctorName,
    'proktor',
    'Menerbitkan Token Submit / Penyelesaian',
    'TOKEN',
    `Sesi: ${sessionId}, Token Submit: ${submitToken}`
  );

  return submitToken;
}

// Audit Logs
export function getAuditLogs(): AuditLog[] {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
}

export function addAuditLog(
  userId: string,
  userName: string,
  userRole: AuditLog['userRole'],
  action: string,
  category: AuditLog['category'],
  details: string
): void {
  const logs = getAuditLogs();
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    userRole,
    action,
    category,
    details,
  };
  logs.unshift(newLog); // prepend
  if (logs.length > 500) logs.pop(); // keep recent 500
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
}

// Incident Reports (Berita Acara)
export function getIncidents(): IncidentReport[] {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.INCIDENTS) || '[]');
}

export function addIncident(incident: Omit<IncidentReport, 'id' | 'timestamp'>): void {
  const incidents = getIncidents();
  const newIncident: IncidentReport = {
    ...incident,
    id: `inc-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  incidents.unshift(newIncident);
  localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(incidents));

  addAuditLog(
    incident.proctorId,
    incident.proctorName,
    'proktor',
    `Catat Insiden Ujian: ${incident.incidentType}`,
    'PROCTOR',
    `Sesi: ${incident.sessionId}. Catatan: ${incident.notes}`
  );
}

// Reset everything to factory demo state
export function resetFactoryData(): void {
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
  localStorage.removeItem(STORAGE_KEYS.QUESTIONS);
  localStorage.removeItem(STORAGE_KEYS.PACKAGES);
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.STUDENTS);
  localStorage.removeItem(STORAGE_KEYS.STAFF);
  localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
  localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
  localStorage.removeItem(STORAGE_KEYS.INCIDENTS);
  initializeStorage();
}
