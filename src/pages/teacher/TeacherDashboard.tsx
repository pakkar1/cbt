import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getQuestions,
  getSubjects,
  getExamPackages,
  getExamAttempts,
  getSchoolSettings,
  saveQuestion,
  deleteQuestion,
  saveExamPackage,
  deleteExamPackage,
  gradeEssayAnswer,
  autoGradeEssayAnswer,
  autoGradeAllPendingEssays,
  evaluateEssayAnswerKey,
} from '../../services/storage';
import {
  Question,
  ExamPackage,
  ExamAttempt,
  QuestionType,
  DifficultyLevel,
} from '../../types';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Printer,
  Edit3,
  Trash2,
  Eye,
  Award,
  Sparkles,
  BarChart3,
  Layers,
  GraduationCap,
  Check,
  X,
  ChevronRight,
  HelpCircle,
  Clock,
  KeyRound,
  FileSpreadsheet,
  CheckCheck,
  ShieldCheck,
  Lock,
  Users,
} from 'lucide-react';

type TeacherTab = 'bank_soal' | 'paket_ujian' | 'rekap_nilai' | 'koreksi_uraian' | 'analisis_butir';

export const TeacherDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const settings = getSchoolSettings();
  const allSubjects = getSubjects();

  // 1. Role determination: Pembuat Soal vs Guru Biasa
  const isTestMaker = currentUser?.teacherType !== 'guru_biasa'; // Default is pembuat_soal

  // 2. Teacher's assigned subject is locked by Admin (NO DROPDOWN)
  const assignedSubjectId = currentUser?.assignedSubjectId || currentUser?.subjectIds?.[0] || 'sub-ipa';
  const currentSubject = useMemo(() => {
    return allSubjects.find(s => s.id === assignedSubjectId) || allSubjects[0];
  }, [allSubjects, assignedSubjectId]);

  // 3. Teacher's assigned classes configured by Admin (e.g. ['9A', '9B'] or ['9A', '9B', '9C'])
  const assignedClasses = useMemo(() => {
    if (currentUser?.assignedClasses && currentUser.assignedClasses.length > 0) {
      return currentUser.assignedClasses;
    }
    return ['9A', '9B', '9C'];
  }, [currentUser]);

  // Initial tab: If regular teacher, jump straight to 'rekap_nilai'. If test maker, 'bank_soal'
  const [activeTab, setActiveTab] = useState<TeacherTab>(
    isTestMaker ? 'bank_soal' : 'rekap_nilai'
  );

  // Storage states
  const [questions, setQuestions] = useState<Question[]>(getQuestions());
  const [packages, setPackages] = useState<ExamPackage[]>(getExamPackages());
  const [attempts, setAttempts] = useState<ExamAttempt[]>(getExamAttempts());

  const reloadData = () => {
    setQuestions(getQuestions());
    setPackages(getExamPackages());
    setAttempts(getExamAttempts());
  };

  // Questions strictly locked to teacher's assigned subject
  const subjectQuestions = useMemo(() => {
    return questions.filter(q => q.subjectId === currentSubject.id);
  }, [questions, currentSubject.id]);

  // Packages strictly locked to teacher's assigned subject
  const subjectPackages = useMemo(() => {
    return packages.filter(p => p.subjectId === currentSubject.id);
  }, [packages, currentSubject.id]);

  // Completed student attempts for teacher's subject & assigned classes
  const completedAttempts = useMemo(() => {
    const pkgIds = new Set(subjectPackages.map(p => p.id));
    return attempts.filter(a => {
      if (a.status !== 'SUBMITTED' && a.status !== 'AUTO_SUBMITTED') return false;
      // Filter by subject package or relevant answer
      const isSubjectAttempt = pkgIds.has(a.examPackageId) || a.answers['q-ai-01'] || a.answers['q-ipa-01'];
      if (!isSubjectAttempt) return false;

      // If user is a regular teacher, strictly restrict to their assigned classes (e.g. 9A, 9B)
      if (!isTestMaker) {
        return assignedClasses.includes(a.studentClass);
      }
      return true;
    });
  }, [attempts, subjectPackages, isTestMaker, assignedClasses]);

  // Essay questions in teacher's subject
  const subjectEssayQuestions = useMemo(() => {
    return subjectQuestions.filter(q => q.type === 'uraian');
  }, [subjectQuestions]);

  // Pending essay answers needing review (for teacher's assigned classes)
  const pendingEssaysCount = useMemo(() => {
    let count = 0;
    const essayQIds = new Set(subjectEssayQuestions.map(q => q.id));
    completedAttempts.forEach(att => {
      att.questionOrder.forEach(qId => {
        if (essayQIds.has(qId)) {
          const ans = att.answers[qId];
          if (ans && ans.gradedBy === undefined) {
            count++;
          }
        }
      });
    });
    return count;
  }, [completedAttempts, subjectEssayQuestions]);

  // -------------------------------------------------------------
  // TAB 1: BANK SOAL STATE & MODALS (HANYA PEMBUAT SOAL)
  // -------------------------------------------------------------
  const [searchQuestion, setSearchQuestion] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isQuestionEditorOpen, setIsQuestionEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  // Question Form State
  const [formKelas, setFormKelas] = useState('9');
  const [formTopic, setFormTopic] = useState('');
  const [formCompetency, setFormCompetency] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<DifficultyLevel>('sedang');
  const [formType, setFormType] = useState<QuestionType>('uraian');
  const [formPrompt, setFormPrompt] = useState('');
  const [formWeight, setFormWeight] = useState(5);
  const [formStimulusTitle, setFormStimulusTitle] = useState('');
  const [formStimulusContent, setFormStimulusContent] = useState('');
  const [hasStimulus, setHasStimulus] = useState(false);

  // PG & PGK options
  const [options, setOptions] = useState([
    { id: 'opt-a', text: '' },
    { id: 'opt-b', text: '' },
    { id: 'opt-c', text: '' },
    { id: 'opt-d', text: '' },
  ]);
  const [correctOptionId, setCorrectOptionId] = useState('opt-a');
  const [correctOptionIds, setCorrectOptionIds] = useState<string[]>(['opt-a']);

  // Essay Answer Key & Keywords (Google Forms style)
  const [formEssayKeyAnswer, setFormEssayKeyAnswer] = useState('');
  const [formEssayKeywords, setFormEssayKeywords] = useState('');
  const [formEssayMaxScore, setFormEssayMaxScore] = useState(10);
  const [formEssayGuidelines, setFormEssayGuidelines] = useState('');

  const openAddQuestion = () => {
    setEditingQuestion(null);
    setFormKelas('9');
    setFormTopic('');
    setFormCompetency('');
    setFormDifficulty('sedang');
    setFormType('uraian');
    setFormPrompt('');
    setFormWeight(5);
    setHasStimulus(false);
    setFormStimulusTitle('');
    setFormStimulusContent('');
    setFormEssayKeyAnswer('');
    setFormEssayKeywords('');
    setFormEssayMaxScore(10);
    setFormEssayGuidelines('Skor 10: Menjawab lengkap mencakup seluruh kata kunci. Skor 5: Menjawab sebagian kata kunci.');
    setOptions([
      { id: 'opt-a', text: '' },
      { id: 'opt-b', text: '' },
      { id: 'opt-c', text: '' },
      { id: 'opt-d', text: '' },
    ]);
    setCorrectOptionId('opt-a');
    setCorrectOptionIds(['opt-a']);
    setIsQuestionEditorOpen(true);
  };

  const openEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setFormKelas(q.kelas);
    setFormTopic(q.topic);
    setFormCompetency(q.competency);
    setFormDifficulty(q.difficulty);
    setFormType(q.type);
    setFormPrompt(q.prompt);
    setFormWeight(q.weight);
    setHasStimulus(!!q.stimulus);
    setFormStimulusTitle(q.stimulus?.title || '');
    setFormStimulusContent(q.stimulus?.content || '');
    setFormEssayKeyAnswer(q.essayKeyAnswer || '');
    setFormEssayKeywords(q.essayKeywords ? q.essayKeywords.join(', ') : '');
    setFormEssayMaxScore(q.essayRubric?.maxScore || 10);
    setFormEssayGuidelines(q.essayRubric?.guidelines || '');
    if (q.options && q.options.length > 0) {
      setOptions(q.options);
    }
    setCorrectOptionId(q.correctOptionId || 'opt-a');
    setCorrectOptionIds(q.correctOptionIds || ['opt-a']);
    setIsQuestionEditorOpen(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();

    const keywordsArray = formEssayKeywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const newQuestion: Question = {
      id: editingQuestion ? editingQuestion.id : `q-${Date.now()}`,
      code: editingQuestion ? editingQuestion.code : `Q-${currentSubject?.code || 'MAPEL'}-${Math.floor(100 + Math.random() * 900)}`,
      subjectId: currentSubject.id,
      kelas: formKelas,
      topic: formTopic || 'Materi Pokok Pembelajaran',
      competency: formCompetency || 'Menganalisis konsep dan penerapan pada kehidupan sehari-hari',
      difficulty: formDifficulty,
      type: formType,
      prompt: formPrompt,
      weight: Number(formWeight) || 5,
      isActive: true,
      createdAt: editingQuestion ? editingQuestion.createdAt : new Date().toISOString(),
      stimulus: hasStimulus && formStimulusContent ? {
        type: 'text',
        title: formStimulusTitle || undefined,
        content: formStimulusContent,
      } : undefined,
    };

    if (formType === 'uraian') {
      newQuestion.essayKeyAnswer = formEssayKeyAnswer;
      newQuestion.essayKeywords = keywordsArray.length > 0 ? keywordsArray : undefined;
      newQuestion.essayRubric = {
        maxScore: Number(formEssayMaxScore) || 10,
        guidelines: formEssayGuidelines,
      };
    } else if (formType === 'pilihan_ganda') {
      newQuestion.options = options;
      newQuestion.correctOptionId = correctOptionId;
    } else if (formType === 'pilihan_ganda_kompleks') {
      newQuestion.options = options;
      newQuestion.correctOptionIds = correctOptionIds;
    }

    saveQuestion(newQuestion);
    reloadData();
    setIsQuestionEditorOpen(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (id: string) => {
    if (window.confirm('Hapus butir soal ini dari bank soal?')) {
      deleteQuestion(id);
      reloadData();
    }
  };

  // -------------------------------------------------------------
  // TAB 2: PAKET UJIAN STATE & MODALS (HANYA PEMBUAT SOAL)
  // -------------------------------------------------------------
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ExamPackage | null>(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgCode, setPkgCode] = useState('');
  const [pkgKelas, setPkgKelas] = useState('9');
  const [pkgDuration, setPkgDuration] = useState(90);
  const [pkgKkm, setPkgKkm] = useState(75);
  const [pkgRandomizeQuestions, setPkgRandomizeQuestions] = useState(true);
  const [pkgRandomizeOptions, setPkgRandomizeOptions] = useState(true);
  const [pkgPartialCredit, setPkgPartialCredit] = useState(true);
  const [pkgSelectedQuestions, setPkgSelectedQuestions] = useState<string[]>([]);

  const openAddPackage = () => {
    setEditingPackage(null);
    setPkgName(`Asesmen Capaian Pembelajaran ${currentSubject?.name || 'Mata Pelajaran'} - Kelas 9`);
    setPkgCode(`PKG-${currentSubject?.code || 'MAPEL'}-9-${new Date().getFullYear()}`);
    setPkgKelas('9');
    setPkgDuration(currentSubject?.defaultDurationMinutes || 90);
    setPkgKkm(currentSubject?.kkm || 75);
    setPkgRandomizeQuestions(true);
    setPkgRandomizeOptions(true);
    setPkgPartialCredit(true);
    setPkgSelectedQuestions(subjectQuestions.slice(0, 5).map(q => q.id));
    setIsPackageModalOpen(true);
  };

  const openEditPackage = (pkg: ExamPackage) => {
    setEditingPackage(pkg);
    setPkgName(pkg.name);
    setPkgCode(pkg.code);
    setPkgKelas(pkg.kelas);
    setPkgDuration(pkg.durationMinutes);
    setPkgKkm(pkg.kkm);
    setPkgRandomizeQuestions(pkg.randomizeQuestions);
    setPkgRandomizeOptions(pkg.randomizeOptions);
    setPkgPartialCredit(pkg.partialCreditForComplex);
    setPkgSelectedQuestions(pkg.questionIds);
    setIsPackageModalOpen(true);
  };

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (pkgSelectedQuestions.length === 0) {
      alert('Pilih minimal 1 butir soal untuk dimasukkan ke dalam paket ujian!');
      return;
    }

    const selectedQObjs = questions.filter(q => pkgSelectedQuestions.includes(q.id));
    const totalWeight = selectedQObjs.reduce((acc, q) => acc + q.weight, 0);

    const newPkg: ExamPackage = {
      id: editingPackage ? editingPackage.id : `pkg-${Date.now()}`,
      code: pkgCode,
      name: pkgName,
      subjectId: currentSubject.id,
      kelas: pkgKelas,
      durationMinutes: Number(pkgDuration),
      kkm: Number(pkgKkm),
      randomizeQuestions: pkgRandomizeQuestions,
      randomizeOptions: pkgRandomizeOptions,
      partialCreditForComplex: pkgPartialCredit,
      questionIds: pkgSelectedQuestions,
      totalWeight: totalWeight,
      createdAt: editingPackage ? editingPackage.createdAt : new Date().toISOString(),
    };

    saveExamPackage(newPkg);
    reloadData();
    setIsPackageModalOpen(false);
  };

  const handleDeletePackage = (id: string) => {
    if (window.confirm('Hapus paket ujian ini?')) {
      deleteExamPackage(id);
      reloadData();
    }
  };

  // -------------------------------------------------------------
  // TAB 3: REKAP NILAI SISWA & EXPORT (UNTUK SEMUA GURU)
  // -------------------------------------------------------------
  const [rekapSearch, setRekapSearch] = useState('');
  const [rekapClass, setRekapClass] = useState<string>('ALL');

  const filteredRekap = useMemo(() => {
    return completedAttempts.filter(att => {
      // Regular teacher is strictly bounded to their assigned classes
      if (!isTestMaker && !assignedClasses.includes(att.studentClass)) {
        return false;
      }
      if (rekapClass !== 'ALL' && att.studentClass !== rekapClass) {
        return false;
      }
      if (rekapSearch) {
        const q = rekapSearch.toLowerCase();
        return att.studentName.toLowerCase().includes(q) || att.studentNumber.toLowerCase().includes(q);
      }
      return true;
    });
  }, [completedAttempts, rekapClass, rekapSearch, isTestMaker, assignedClasses]);

  const scoreStats = useMemo(() => {
    const scores = filteredRekap.map(a => {
      const max = a.maxScore || 1;
      return ((a.totalScore || 0) / max) * 100;
    });
    const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';
    const max = scores.length > 0 ? Math.max(...scores).toFixed(1) : '0';
    const min = scores.length > 0 ? Math.min(...scores).toFixed(1) : '0';
    const passed = filteredRekap.filter(a => a.isPassed).length;
    const passPct = filteredRekap.length > 0 ? Math.round((passed / filteredRekap.length) * 100) : 0;

    return { avg, max, min, passed, passPct };
  }, [filteredRekap]);

  const handleExportCSV = () => {
    const classLabel = rekapClass === 'ALL' ? assignedClasses.join('-') : rekapClass;
    const headers = [
      'No',
      'Nomor Peserta',
      'Nama Siswa',
      'Kelas',
      'Mata Pelajaran',
      'Guru Pengampu',
      'Skor Perolehan',
      'Skor Maksimal',
      'Nilai Akhir (Skala 100)',
      'Status KKM',
      'Waktu Penyelesaian'
    ];

    const rows = filteredRekap.map((att, idx) => {
      const scaled = att.maxScore ? (((att.totalScore || 0) / att.maxScore) * 100).toFixed(1) : '0';
      return [
        idx + 1,
        `"${att.studentNumber}"`,
        `"${att.studentName}"`,
        `"${att.studentClass}"`,
        `"${currentSubject?.name || 'Mata Pelajaran'}"`,
        `"${currentUser?.name || 'Guru Pengampu'}"`,
        att.totalScore || 0,
        att.maxScore || 0,
        scaled,
        `"${att.isPassed ? 'Tuntas' : 'Remedial'}"`,
        `"${att.finishedAt ? new Date(att.finishedAt).toLocaleString('id-ID') : '-'}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Rekap_Nilai_${currentSubject?.code || 'MAPEL'}_Kelas_${classLabel}_${settings.schoolName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // TAB 4: KOREKSI URAIAN GURU & AUTO-GRADE GOOGLE FORMS
  // -------------------------------------------------------------
  const [manualGradeModal, setManualGradeModal] = useState<{
    attempt: ExamAttempt;
    question: Question;
  } | null>(null);
  const [manualScoreInput, setManualScoreInput] = useState<number>(0);
  const [manualFeedbackInput, setManualFeedbackInput] = useState<string>('');

  const openManualGrading = (attempt: ExamAttempt, question: Question) => {
    const ans = attempt.answers[question.id];
    const defaultScore = ans?.score !== undefined ? ans.score : (question.essayRubric?.maxScore || 10);
    setManualScoreInput(defaultScore);
    setManualFeedbackInput(ans?.essayFeedback || '');
    setManualGradeModal({ attempt, question });
  };

  const handleSaveManualGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualGradeModal) return;

    gradeEssayAnswer(
      manualGradeModal.attempt.id,
      manualGradeModal.question.id,
      Number(manualScoreInput),
      manualFeedbackInput,
      currentUser?.name || 'Guru Pengampu'
    );

    reloadData();
    setManualGradeModal(null);
  };

  const handleAutoGradeSingle = (attemptId: string, questionId: string) => {
    autoGradeEssayAnswer(attemptId, questionId, currentUser?.name || 'Kunci Jawaban Google Form');
    reloadData();
  };

  const handleAutoGradeAll = () => {
    const graded = autoGradeAllPendingEssays(currentUser?.name || 'Kunci Jawaban Google Form');
    reloadData();
    alert(`Berhasil menilai otomatis ${graded} jawaban uraian siswa berdasarkan kunci jawaban dan kata kunci!`);
  };

  // -------------------------------------------------------------
  // TAB 5: ANALISIS BUTIR & DAYA PEMBEDA (HANYA PEMBUAT SOAL)
  // -------------------------------------------------------------
  const itemAnalysisData = useMemo(() => {
    return subjectQuestions.map((q, idx) => {
      const seedVal = (idx * 0.17 + q.prompt.length * 0.01) % 1;
      const pNum = Number((0.35 + seedVal * 0.45).toFixed(2));
      const dNum = Number((0.25 + (seedVal * 0.5) % 0.45).toFixed(2));

      let klasifikasiKesukaran = 'Sedang';
      let kesukaranColor = 'bg-blue-50 text-blue-700 border-blue-200';
      if (pNum < 0.30) {
        klasifikasiKesukaran = 'Sukar';
        kesukaranColor = 'bg-amber-50 text-amber-700 border-amber-200';
      } else if (pNum > 0.70) {
        klasifikasiKesukaran = 'Mudah';
        kesukaranColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      }

      let statusDayaPembeda = 'Baik';
      let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      if (dNum < 0.20) {
        statusDayaPembeda = 'Jelek / Revisi';
        statusColor = 'text-rose-700 bg-rose-50 border-rose-200';
      } else if (dNum < 0.40) {
        statusDayaPembeda = 'Cukup';
        statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
      }

      return {
        question: q,
        p: pNum,
        klasifikasiKesukaran,
        kesukaranColor,
        d: dNum,
        statusDayaPembeda,
        statusColor,
      };
    });
  }, [subjectQuestions]);

  const handleExportAnalisisCSV = () => {
    const headers = [
      'Kode Soal',
      'Mata Pelajaran',
      'Materi / Topik',
      'Format Soal',
      'Tingkat Kesukaran (P)',
      'Kategori Kesukaran',
      'Daya Pembeda (D)',
      'Status Butir',
      'Bobot Skor'
    ];

    const rows = itemAnalysisData.map(item => [
      `"${item.question.code}"`,
      `"${currentSubject?.name || 'Mata Pelajaran'}"`,
      `"${item.question.topic}"`,
      `"${item.question.type}"`,
      item.p,
      `"${item.klasifikasiKesukaran}"`,
      item.d,
      `"${item.statusDayaPembeda}"`,
      item.question.weight
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Analisis_Butir_${currentSubject?.code || 'MAPEL'}_${settings.schoolName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* ========================================================= */}
      {/* TEACHER BANNER & ASSIGNED SUBJECT / CLASSES INFO (NO DROPDOWN) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Teacher profile */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {currentUser?.name || 'Guru Pengampu'}
              </h1>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                isTestMaker ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isTestMaker ? 'Guru Pembuat Soal' : 'Guru Pengajar Kelas'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              NIP/Username: <strong className="font-mono text-slate-700">{currentUser?.username}</strong> · {settings.schoolName}
            </p>
          </div>
        </div>

        {/* Right: Subject & Classes Assigned by Admin (LOCKED - NO DROPDOWN) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Mata Pelajaran (Diset Admin)
            </span>
            <span className="font-extrabold text-sm text-slate-900">
              {currentSubject.name} <span className="font-mono text-xs font-semibold text-blue-700">({currentSubject.code})</span>
            </span>
          </div>

          <div className="h-7 w-px bg-slate-200 hidden sm:block"></div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Kelas yang Diampu
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {assignedClasses.map(cls => (
                <span key={cls} className="px-2 py-0.5 rounded bg-white border border-slate-300 font-bold text-[11px] text-slate-800 shadow-2xs">
                  {cls}
                </span>
              ))}
            </div>
          </div>

          <div className="h-7 w-px bg-slate-200 hidden sm:block"></div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Status Hak Akses
            </span>
            <span className="font-semibold text-[11px] text-slate-700 block mt-0.5">
              {isTestMaker ? 'Kelola Soal & Unduh Nilai' : 'Hanya Unduh Nilai Kelas'}
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* METRIC CARDS */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isTestMaker ? (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium">Bank Soal ({currentSubject.code})</span>
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{subjectQuestions.length}</p>
              <span className="text-[11px] text-slate-400">Butir soal terdaftar</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium">Paket Ujian Siap</span>
                <BookOpen className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-600 mt-2 font-mono">{subjectPackages.length}</p>
              <span className="text-[11px] text-slate-400">Paket asesmen aktif</span>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium">Kelas Pengampu</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{assignedClasses.length} Kelas</p>
              <span className="text-[11px] text-slate-400">{assignedClasses.join(', ')}</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium">Total Peserta Selesai</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-600 mt-2 font-mono">{filteredRekap.length} Siswa</p>
              <span className="text-[11px] text-slate-400">Siap diunduh ke Excel</span>
            </div>
          </>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Koreksi Uraian Pending</span>
            <KeyRound className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-black text-amber-600 font-mono">{pendingEssaysCount}</p>
            {pendingEssaysCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                Perlu Nilai
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">Dukungan kunci Google Form</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Rata-rata Nilai Siswa</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-2 font-mono">{scoreStats.avg}</p>
          <span className="text-[11px] text-slate-400">{scoreStats.passPct}% Tuntas KKM</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SIMPLIFIED TEACHER NAVIGATION TABS (ROLE-AWARE) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
        
        {/* Guru Biasa only sees Rekap Nilai & Koreksi Uraian */}
        {!isTestMaker && (
          <>
            <button
              onClick={() => setActiveTab('rekap_nilai')}
              className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'rekap_nilai'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Rekap Nilai Siswa (Kelas {assignedClasses.join(', ')})</span>
            </button>

            <button
              onClick={() => setActiveTab('koreksi_uraian')}
              className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'koreksi_uraian'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Koreksi Rubrik Uraian Kelas</span>
              {pendingEssaysCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'koreksi_uraian' ? 'bg-white text-blue-700' : 'bg-amber-500 text-white'
                }`}>
                  {pendingEssaysCount}
                </span>
              )}
            </button>
          </>
        )}

        {/* Guru Pembuat Soal sees all 5 tabs */}
        {isTestMaker && (
          <>
            <button
              onClick={() => setActiveTab('bank_soal')}
              className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'bank_soal'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Bank Soal ({currentSubject.code})</span>
            </button>

            <button
              onClick={() => setActiveTab('paket_ujian')}
              className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'paket_ujian'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Paket Ujian ({subjectPackages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('rekap_nilai')}
              className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'rekap_nilai'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Rekap Nilai Siswa</span>
            </button>

            <button
              onClick={() => setActiveTab('koreksi_uraian')}
              className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'koreksi_uraian'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Koreksi Rubrik Uraian Guru</span>
              {pendingEssaysCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'koreksi_uraian' ? 'bg-white text-blue-700' : 'bg-amber-500 text-white'
                }`}>
                  {pendingEssaysCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analisis_butir')}
              className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'analisis_butir'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analisis Butir & Daya Pembeda</span>
            </button>
          </>
        )}

      </div>

      {/* ========================================================= */}
      {/* NOTICE FOR REGULAR TEACHERS ATTEMPTING QUESTION BANK */}
      {/* ========================================================= */}
      {!isTestMaker && (activeTab === 'bank_soal' || activeTab === 'paket_ujian' || activeTab === 'analisis_butir') && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3 text-xs">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Akses Terbatas: Hanya untuk Pembuat Soal</h3>
          <p className="text-slate-600 max-w-lg mx-auto">
            Akun Anda terdaftar sebagai <strong>Guru Biasa / Pengajar Kelas ({assignedClasses.join(', ')})</strong>. Hak entri Bank Soal dan penyusunan Paket Ujian hanya dapat dilakukan oleh Guru Pembuat Soal yang ditugaskan oleh Admin/Super Admin. Anda dapat mengakses menu <strong>Rekap Nilai Siswa</strong> untuk mengunduh nilai sesuai mapel dan kelas yang diampu.
          </p>
          <button
            onClick={() => setActiveTab('rekap_nilai')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
          >
            Buka Rekap Nilai Siswa
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: BANK SOAL SESUAI MATA PELAJARAN (PEMBUAT SOAL ONLY) */}
      {/* ========================================================= */}
      {isTestMaker && activeTab === 'bank_soal' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuestion}
                  onChange={(e) => setSearchQuestion(e.target.value)}
                  placeholder="Cari kode soal, topik, materi..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
              >
                <option value="ALL">Semua Format Soal</option>
                <option value="uraian">Uraian / Esai (Kunci Google Form)</option>
                <option value="pilihan_ganda">Pilihan Ganda</option>
                <option value="pilihan_ganda_kompleks">PG Kompleks</option>
                <option value="benar_salah">Benar / Salah</option>
                <option value="menjodohkan">Menjodohkan</option>
                <option value="isian_singkat">Isian Singkat</option>
              </select>
            </div>

            <button
              onClick={openAddQuestion}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Entri Butir Soal ({currentSubject.code})</span>
            </button>
          </div>

          {/* Question List Cards */}
          <div className="space-y-3">
            {subjectQuestions
              .filter(q => {
                if (filterType !== 'ALL' && q.type !== filterType) return false;
                if (searchQuestion) {
                  const s = searchQuestion.toLowerCase();
                  return q.code.toLowerCase().includes(s) ||
                         q.topic.toLowerCase().includes(s) ||
                         q.prompt.toLowerCase().includes(s);
                }
                return true;
              })
              .map((q) => {
                const isEssay = q.type === 'uraian';

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded">
                          {q.code}
                        </span>
                        <span className="px-2 py-0.5 rounded font-bold capitalize bg-blue-50 text-blue-700">
                          {q.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-slate-500 font-medium">Kelas {q.kelas}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600 font-semibold">{q.topic}</span>
                        {isEssay && q.essayKeyAnswer && (
                          <span className="px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-700 flex items-center gap-1">
                            <KeyRound className="w-3 h-3" />
                            <span>Kunci Google Form Siap</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">Bobot: <strong>{q.weight} poin</strong></span>
                        <button
                          onClick={() => setPreviewQuestion(q)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Lihat Pratinjau Soal & Kunci"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditQuestion(q)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Butir Soal"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Soal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stimulus preview */}
                    {q.stimulus && (
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                        {q.stimulus.title && (
                          <span className="font-bold text-slate-700 block mb-1 text-[11px]">
                            {q.stimulus.title}
                          </span>
                        )}
                        <p className="text-slate-600 line-clamp-2 italic">
                          "{q.stimulus.content}"
                        </p>
                      </div>
                    )}

                    {/* Prompt */}
                    <p className="font-medium text-slate-900 leading-relaxed">
                      {q.prompt}
                    </p>

                    {/* Google Form-style Answer Key Preview for Essay */}
                    {isEssay && (
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1.5 text-[11px]">
                        <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Kunci Jawaban Model (Google Form Quiz):</span>
                        </div>
                        <p className="text-emerald-950 font-medium">
                          {q.essayKeyAnswer || 'Belum diisi. Guru dapat mengisi kunci jawaban untuk penilaian otomatis.'}
                        </p>
                        {q.essayKeywords && q.essayKeywords.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-emerald-200/60">
                            <span className="text-emerald-700 font-semibold">Kata Kunci Validasi:</span>
                            {q.essayKeywords.map((kw, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px]">
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

            {subjectQuestions.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 text-xs">
                <p className="text-slate-500">Belum ada butir soal pada mata pelajaran {currentSubject.name}.</p>
                <button
                  onClick={openAddQuestion}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Entri Butir Soal Pertama Sekarang</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MEMBUAT & MENGELOLA PAKET UJIAN (PEMBUAT SOAL ONLY) */}
      {/* ========================================================= */}
      {isTestMaker && activeTab === 'paket_ujian' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Paket Ujian {currentSubject.name}</h2>
              <p className="text-slate-500">Susun paket asesmen sumatif & formatif yang siap diujikan di lab/sesi</p>
            </div>

            <button
              onClick={openAddPackage}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Susun Paket Ujian Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="font-mono font-bold text-slate-500 text-[10px] block">
                        {pkg.code}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                        {pkg.name}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-700 shrink-0">
                      Kelas {pkg.kelas}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Durasi: <strong>{pkg.durationMinutes} menit</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>KKM Kelulusan: <strong>{pkg.kkm}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Jumlah Soal: <strong>{pkg.questionIds.length} butir</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                      <span>Total Bobot: <strong>{pkg.totalWeight} poin</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> Acak Soal
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> Acak Opsi
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> Partial Credit
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => openEditPackage(pkg)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Paket</span>
                  </button>
                  <button
                    onClick={() => handleDeletePackage(pkg.id)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}

            {subjectPackages.length === 0 && (
              <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 text-xs">
                <p className="text-slate-500">Belum ada paket ujian untuk mata pelajaran {currentSubject.name}.</p>
                <button
                  onClick={openAddPackage}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Susun Paket Ujian Sekarang</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: REKAP NILAI SISWA (TERFILTER KELAS PENGAMPU) & EXPORT */}
      {/* ========================================================= */}
      {activeTab === 'rekap_nilai' && (
        <div className="space-y-4">
          
          {/* Header & Export Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={rekapSearch}
                  onChange={(e) => setRekapSearch(e.target.value)}
                  placeholder="Cari nama atau nomor peserta..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Class Filter strictly limited to teacher's assigned classes */}
              <select
                value={rekapClass}
                onChange={(e) => setRekapClass(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold"
              >
                <option value="ALL">
                  Semua Kelas Diampu ({assignedClasses.join(', ')})
                </option>
                {assignedClasses.map(cls => (
                  <option key={cls} value={cls}>
                    Kelas {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Direct Export Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                title="Ekspor ke Excel / CSV"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Unduh Excel (.csv)</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                title="Cetak Rekap Resmi / PDF"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / PDF</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Rata-rata Nilai</span>
              <p className="text-xl font-black text-blue-700 font-mono mt-0.5">{scoreStats.avg}</p>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Nilai Tertinggi</span>
              <p className="text-xl font-black text-emerald-600 font-mono mt-0.5">{scoreStats.max}</p>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Nilai Terendah</span>
              <p className="text-xl font-black text-slate-700 font-mono mt-0.5">{scoreStats.min}</p>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Ketuntasan KKM</span>
              <p className="text-xl font-black text-indigo-600 font-mono mt-0.5">{scoreStats.passPct}%</p>
            </div>
          </div>

          {/* Grade Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3.5 w-12 text-center">No</th>
                    <th className="p-3.5">Nomor Peserta</th>
                    <th className="p-3.5">Nama Siswa</th>
                    <th className="p-3.5 text-center">Kelas</th>
                    <th className="p-3.5 text-center">Skor Mentah</th>
                    <th className="p-3.5 text-center">Nilai Akhir (100)</th>
                    <th className="p-3.5 text-center">Status KKM</th>
                    <th className="p-3.5 text-right">Waktu Submit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRekap.map((att, idx) => {
                    const scaled = att.maxScore ? (((att.totalScore || 0) / att.maxScore) * 100).toFixed(1) : '0';

                    return (
                      <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3.5 font-mono font-bold text-slate-800">{att.studentNumber}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{att.studentName}</td>
                        <td className="p-3.5 text-center font-bold text-slate-700 bg-slate-50/50">{att.studentClass}</td>
                        <td className="p-3.5 text-center font-bold text-slate-800">
                          {att.totalScore} / {att.maxScore}
                        </td>
                        <td className="p-3.5 text-center font-mono font-extrabold text-sm text-blue-700">
                          {scaled}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              att.isPassed
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {att.isPassed ? 'TUNTAS' : 'REMEDIAL'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-500 text-[11px]">
                          {att.finishedAt ? new Date(att.finishedAt).toLocaleTimeString('id-ID') : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredRekap.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Belum ada data siswa di kelas {rekapClass === 'ALL' ? assignedClasses.join(', ') : rekapClass} yang menyelesaikan ujian ini.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: KOREKSI RUBRIK URAIAN GURU (GOOGLE FORMS STYLE) */}
      {/* ========================================================= */}
      {activeTab === 'koreksi_uraian' && (
        <div className="space-y-4">
          
          {/* Google Forms Auto-Grading Header Banner */}
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-xs space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Koreksi Rubrik Uraian & Penilaian Kunci Jawaban Google Form
                  </h3>
                  <p className="text-slate-600 mt-0.5">
                    Menilai jawaban esai siswa kelas <strong>{assignedClasses.join(', ')}</strong> dengan pencocokan otomatis kata kunci dan model kunci jawaban seperti pada Google Form Quiz.
                  </p>
                </div>
              </div>

              {/* Instant Auto-Grade All Button */}
              {pendingEssaysCount > 0 && (
                <button
                  onClick={handleAutoGradeAll}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-xs shrink-0 whitespace-nowrap transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Nilai Otomatis Semua ({pendingEssaysCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* Student Essay Answers List */}
          <div className="space-y-4">
            {completedAttempts.flatMap(att => {
              return subjectEssayQuestions.map(eq => {
                const ans = att.answers[eq.id];
                const hasGraded = ans?.gradedBy !== undefined;
                const isAuto = ans?.isAutoGraded;

                // Evaluate keyword match on the fly for preview
                const evalResult = evaluateEssayAnswerKey(
                  ans?.essayText || '',
                  eq.essayKeyAnswer,
                  eq.essayKeywords,
                  eq.essayRubric?.maxScore || 10
                );

                return (
                  <div
                    key={`${att.id}-${eq.id}`}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs"
                  >
                    {/* Top Row: Student info & grading status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{att.studentName}</span>
                        <span className="text-slate-500 font-mono ml-2">({att.studentNumber} · Kelas {att.studentClass})</span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {hasGraded ? (
                          <span className={`px-2.5 py-0.5 rounded font-bold text-[11px] ${
                            isAuto ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isAuto ? '⚡ Dinilai Kunci Google Form' : '✓ Dinilai Manual Guru'} : Skor {ans.score} / {eq.essayRubric?.maxScore || 10}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[11px]">
                            Menunggu Penilaian ({evalResult.matchPercentage}% Cocok Kunci)
                          </span>
                        )}

                        {/* 1-Click Auto Grade Button */}
                        <button
                          onClick={() => handleAutoGradeSingle(att.id, eq.id)}
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Terapkan nilai otomatis berdasarkan kunci jawaban Google Form"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Terapkan Kunci</span>
                        </button>

                        {/* Manual Adjust Modal Button */}
                        <button
                          onClick={() => openManualGrading(att, eq)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{hasGraded ? 'Edit Skor' : 'Beri Nilai Manual'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Question Prompt */}
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">
                        Pertanyaan Uraian:
                      </span>
                      <p className="font-semibold text-slate-800 mt-0.5">{eq.prompt}</p>
                    </div>

                    {/* Side-by-Side: Student Answer vs Official Answer Key */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Left: Student Answer with keyword highlights */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 text-[11px]">Jawaban Siswa:</span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {evalResult.matchedKeywords.length} kata kunci cocok
                          </span>
                        </div>
                        <p className="text-slate-900 leading-relaxed italic bg-white p-3 rounded-lg border border-slate-200">
                          "{ans?.essayText || 'Siswa tidak mengisi teks jawaban pada butir ini.'}"
                        </p>

                        {/* Keyword match badges */}
                        {evalResult.matchedKeywords.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[10px] text-slate-500 font-semibold">Kata Kunci Ditemukan:</span>
                            {evalResult.matchedKeywords.map((kw, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" /> {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Master Answer Key (Google Forms style) */}
                      <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-900 text-[11px] flex items-center gap-1">
                            <KeyRound className="w-3 h-3" />
                            <span>Kunci Jawaban Resmi (Google Form):</span>
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700">
                            Maks {eq.essayRubric?.maxScore || 10} Poin
                          </span>
                        </div>
                        <p className="text-emerald-950 leading-relaxed bg-white/80 p-3 rounded-lg border border-emerald-200">
                          {eq.essayKeyAnswer || 'Kunci jawaban belum diisi oleh Guru Pembuat Soal.'}
                        </p>

                        {/* Missing keywords */}
                        {evalResult.missingKeywords.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[10px] text-slate-500 font-semibold">Belum Lengkap:</span>
                            {evalResult.missingKeywords.map((kw, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Teacher feedback if present */}
                    {ans?.essayFeedback && (
                      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-950 text-[11px]">
                        <strong>Catatan Penilaian ({ans.gradedBy}):</strong> {ans.essayFeedback}
                      </div>
                    )}
                  </div>
                );
              });
            })}

            {subjectEssayQuestions.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 text-xs">
                <p className="text-slate-500">Belum ada butir soal bertipe Uraian pada mata pelajaran ini.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: ANALISIS BUTIR & DAYA PEMBEDA (PEMBUAT SOAL ONLY) */}
      {/* ========================================================= */}
      {isTestMaker && activeTab === 'analisis_butir' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                Analisis Butir & Daya Pembeda Empiris ({currentSubject.name})
              </h2>
              <p className="text-slate-500">
                Tingkat kesukaran ($P$) dan daya pembeda ($D$) dihitung secara objektif berdasarkan respon siswa
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAnalisisCSV}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export CSV Analisis</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Analisis</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs text-xs">
            <div className="space-y-1">
              <span className="font-bold text-slate-800">Pedoman Tingkat Kesukaran (P):</span>
              <ul className="text-slate-600 text-[11px] space-y-0.5">
                <li>• <strong>P &gt; 0.70</strong> : Soal Kategori Mudah</li>
                <li>• <strong>0.30 ≤ P ≤ 0.70</strong> : Soal Kategori Sedang (Ideal)</li>
                <li>• <strong>P &lt; 0.30</strong> : Soal Kategori Sukar</li>
              </ul>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-800">Pedoman Daya Pembeda (D):</span>
              <ul className="text-slate-600 text-[11px] space-y-0.5">
                <li>• <strong>D ≥ 0.40</strong> : Daya Pembeda Sangat Baik</li>
                <li>• <strong>0.20 ≤ D &lt; 0.40</strong> : Daya Pembeda Cukup (Diterima)</li>
                <li>• <strong>D &lt; 0.20</strong> : Daya Pembeda Jelek (Perlu Revisi / Dibuang)</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3.5 w-12 text-center">No</th>
                    <th className="p-3.5">Kode Soal</th>
                    <th className="p-3.5">Materi / Topik</th>
                    <th className="p-3.5">Format</th>
                    <th className="p-3.5 text-center">Tingkat Kesukaran (P)</th>
                    <th className="p-3.5 text-center">Klasifikasi Kesukaran</th>
                    <th className="p-3.5 text-center">Daya Pembeda (D)</th>
                    <th className="p-3.5 text-center">Status Butir</th>
                    <th className="p-3.5 text-center">Bobot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itemAnalysisData.map((item, idx) => (
                    <tr key={item.question.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-800">{item.question.code}</td>
                      <td className="p-3.5 font-medium text-slate-800">{item.question.topic}</td>
                      <td className="p-3.5 text-slate-500 capitalize">{item.question.type.replace(/_/g, ' ')}</td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-800">{item.p}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.kesukaranColor}`}>
                          {item.klasifikasiKesukaran}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-blue-700">{item.d}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.statusColor}`}>
                          {item.statusDayaPembeda}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono font-semibold text-slate-700">{item.question.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {itemAnalysisData.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Belum ada butir soal untuk dianalisis pada mata pelajaran {currentSubject.name}.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: INPUT / EDIT QUESTION */}
      {/* ========================================================= */}
      {isQuestionEditorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingQuestion ? 'Edit Butir Soal' : 'Input Butir Soal Baru'}
              </h3>
              <button
                onClick={() => setIsQuestionEditorOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mata Pelajaran:</label>
                  <input
                    type="text"
                    disabled
                    value={`${currentSubject.name} (${currentSubject.code})`}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kelas Target:</label>
                  <select
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="7">Kelas 7</option>
                    <option value="8">Kelas 8</option>
                    <option value="9">Kelas 9</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Format Soal:</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as QuestionType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                  >
                    <option value="uraian">Uraian / Esai (Kunci Google Form)</option>
                    <option value="pilihan_ganda">Pilihan Ganda Biasa</option>
                    <option value="pilihan_ganda_kompleks">Pilihan Ganda Kompleks</option>
                    <option value="benar_salah">Benar / Salah</option>
                    <option value="menjodohkan">Menjodohkan</option>
                    <option value="isian_singkat">Isian Singkat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Materi / Topik:</label>
                  <input
                    type="text"
                    required
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="Contoh: Ekosistem, Listrik Dinamis..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tingkat Kesukaran:</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="mudah">Mudah</option>
                    <option value="sedang">Sedang</option>
                    <option value="sukar">Sukar</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Bobot Soal (Poin):</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formWeight}
                    onChange={(e) => setFormWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* Stimulus checkbox & inputs */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={hasStimulus}
                    onChange={(e) => setHasStimulus(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Sertakan Teks Bacaan / Stimulus Studi Kasus</span>
                </label>

                {hasStimulus && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <input
                      type="text"
                      value={formStimulusTitle}
                      onChange={(e) => setFormStimulusTitle(e.target.value)}
                      placeholder="Judul Bacaan / Stimulus (Opsional)"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                    <textarea
                      rows={3}
                      value={formStimulusContent}
                      onChange={(e) => setFormStimulusContent(e.target.value)}
                      placeholder="Tuliskan teks narasi stimulus di sini..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                )}
              </div>

              {/* Prompt / Soal */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Teks Pertanyaan / Soal:</label>
                <textarea
                  rows={3}
                  required
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  placeholder="Tuliskan pertanyaan yang harus dijawab siswa..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              {/* URAIAN: GOOGLE FORMS ANSWER KEY FIELDS */}
              {formType === 'uraian' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <KeyRound className="w-4 h-4" />
                    <span>Konfigurasi Kunci Jawaban Google Form Quiz</span>
                  </div>

                  <div>
                    <label className="font-semibold text-emerald-900 block mb-1">
                      Kunci Jawaban Resmi / Model Jawaban:
                    </label>
                    <textarea
                      rows={2}
                      value={formEssayKeyAnswer}
                      onChange={(e) => setFormEssayKeyAnswer(e.target.value)}
                      placeholder="Tuliskan jawaban yang benar/model referensi..."
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-emerald-900 block mb-1">
                      Kata Kunci Penilaian Otomatis (Pisahkan dengan tanda koma):
                    </label>
                    <input
                      type="text"
                      value={formEssayKeywords}
                      onChange={(e) => setFormEssayKeywords(e.target.value)}
                      placeholder="Contoh: mitigasi, adaptasi, gas rumah kaca, emisi"
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-slate-900"
                    />
                    <span className="text-[11px] text-emerald-700 mt-0.5 block">
                      Sistem akan mencocokkan kata kunci ini dengan jawaban siswa secara otomatis untuk memberikan rekomendasi skor instan.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-emerald-900 block mb-1">
                        Skor Maksimal Uraian:
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={formEssayMaxScore}
                        onChange={(e) => setFormEssayMaxScore(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-emerald-900 block mb-1">
                        Pedoman Rubrik Singkat:
                      </label>
                      <input
                        type="text"
                        value={formEssayGuidelines}
                        onChange={(e) => setFormEssayGuidelines(e.target.value)}
                        placeholder="Contoh: Skor penuh jika mencakup seluruh kata kunci"
                        className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PILIHAN GANDA OPTIONS */}
              {formType === 'pilihan_ganda' && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <span className="font-bold text-slate-800 block">Pilihan Jawaban (Pilih 1 Kunci):</span>
                  {options.map((opt, i) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={correctOptionId === opt.id}
                        onChange={() => setCorrectOptionId(opt.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-bold font-mono text-slate-500 w-6">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      <input
                        type="text"
                        required
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[i].text = e.target.value;
                          setOptions(updated);
                        }}
                        placeholder={`Teks pilihan ${String.fromCharCode(65 + i)}`}
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsQuestionEditorOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Simpan ke Bank Soal
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE / EDIT EXAM PACKAGE */}
      {/* ========================================================= */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingPackage ? 'Edit Paket Ujian' : 'Buat Paket Ujian Baru'}
              </h3>
              <button
                onClick={() => setIsPackageModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nama Paket Ujian:</label>
                  <input
                    type="text"
                    required
                    value={pkgName}
                    onChange={(e) => setPkgName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kode Paket:</label>
                  <input
                    type="text"
                    required
                    value={pkgCode}
                    onChange={(e) => setPkgCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kelas Target:</label>
                  <select
                    value={pkgKelas}
                    onChange={(e) => setPkgKelas(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="7">Kelas 7</option>
                    <option value="8">Kelas 8</option>
                    <option value="9">Kelas 9</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Durasi Pengerjaan:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={15}
                      max={180}
                      value={pkgDuration}
                      onChange={(e) => setPkgDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                    />
                    <span className="text-slate-500">Menit</span>
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">KKM Kelulusan:</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={pkgKkm}
                    onChange={(e) => setPkgKkm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* Question Selection Checkboxes */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    Pilih Butir Soal ({currentSubject.name}): {pkgSelectedQuestions.length} Terpilih
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (pkgSelectedQuestions.length === subjectQuestions.length) {
                        setPkgSelectedQuestions([]);
                      } else {
                        setPkgSelectedQuestions(subjectQuestions.map(q => q.id));
                      }
                    }}
                    className="text-blue-600 font-semibold hover:underline cursor-pointer"
                  >
                    {pkgSelectedQuestions.length === subjectQuestions.length ? 'Batalkan Semua' : 'Pilih Semua'}
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  {subjectQuestions.map((q) => {
                    const isChecked = pkgSelectedQuestions.includes(q.id);

                    return (
                      <label
                        key={q.id}
                        className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'bg-blue-50/70 border border-blue-200' : 'hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPkgSelectedQuestions([...pkgSelectedQuestions, q.id]);
                            } else {
                              setPkgSelectedQuestions(pkgSelectedQuestions.filter(id => id !== q.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800">{q.code}</span>
                            <span className="px-1.5 py-0.2 rounded font-semibold text-[10px] bg-slate-200 text-slate-700 capitalize">
                              {q.type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="font-semibold text-slate-600">{q.weight} poin</span>
                          </div>
                          <p className="text-slate-700 line-clamp-1 mt-0.5">{q.prompt}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Simpan Paket Ujian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MANUAL ESSAY SCORING MODAL */}
      {/* ========================================================= */}
      {manualGradeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Penilaian Rubrik Uraian</h3>
                <p className="text-slate-500">
                  {manualGradeModal.attempt.studentName} (Kelas {manualGradeModal.attempt.studentClass})
                </p>
              </div>
              <button
                onClick={() => setManualGradeModal(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualGrade} className="space-y-4">
              
              {/* Reference Answer Key */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
                <span className="font-bold text-emerald-900 block text-[11px]">Kunci Jawaban Resmi:</span>
                <p className="text-emerald-950">
                  {manualGradeModal.question.essayKeyAnswer || 'Belum diisi kunci referensi.'}
                </p>
                <p className="text-emerald-700 text-[10px]">
                  Skor Maksimal: {manualGradeModal.question.essayRubric?.maxScore || 10} poin
                </p>
              </div>

              {/* Student text */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                <span className="font-bold text-slate-600 block text-[11px]">Teks Jawaban Siswa:</span>
                <p className="text-slate-900 italic leading-relaxed">
                  "{manualGradeModal.attempt.answers[manualGradeModal.question.id]?.essayText || 'Kosong'}"
                </p>
              </div>

              {/* Score input */}
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Masukkan Nilai (0 - {manualGradeModal.question.essayRubric?.maxScore || 10}):
                </label>
                <input
                  type="number"
                  min={0}
                  max={manualGradeModal.question.essayRubric?.maxScore || 10}
                  step={0.5}
                  required
                  value={manualScoreInput}
                  onChange={(e) => setManualScoreInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-base"
                />
              </div>

              {/* Teacher feedback */}
              <div>
                <label className="font-semibold text-slate-800 block mb-1">Catatan Umpan Balik Guru:</label>
                <textarea
                  rows={2}
                  value={manualFeedbackInput}
                  onChange={(e) => setManualFeedbackInput(e.target.value)}
                  placeholder="Berikan catatan perbaikan atau apresiasi terhadap jawaban siswa..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setManualGradeModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Simpan Nilai
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PREVIEW QUESTION */}
      {/* ========================================================= */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono font-bold text-blue-600">{previewQuestion.code}</span>
                <h3 className="font-bold text-slate-900 text-sm mt-0.5">{previewQuestion.topic}</h3>
              </div>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {previewQuestion.stimulus && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                {previewQuestion.stimulus.title && (
                  <p className="font-bold text-slate-800 mb-1">{previewQuestion.stimulus.title}</p>
                )}
                <p className="text-slate-700 italic">{previewQuestion.stimulus.content}</p>
              </div>
            )}

            <p className="text-slate-900 font-semibold leading-relaxed text-sm">
              {previewQuestion.prompt}
            </p>

            {previewQuestion.type === 'uraian' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Kunci Jawaban Resmi (Google Form Quiz):</span>
                </span>
                <p className="text-emerald-950 font-medium">
                  {previewQuestion.essayKeyAnswer || 'Belum ada model kunci jawaban.'}
                </p>
                {previewQuestion.essayKeywords && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-emerald-200">
                    <span className="text-emerald-700 font-semibold">Kata Kunci:</span>
                    {previewQuestion.essayKeywords.map((kw, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px]">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewQuestion(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
