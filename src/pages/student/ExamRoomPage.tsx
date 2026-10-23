import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  ExamSession,
  ExamPackage,
  ExamAttempt,
  Question,
  StudentAnswer,
} from '../../types';
import {
  getQuestions,
  getSubjects,
  getSchoolSettings,
  saveStudentAnswer,
  finalizeAttempt,
  recordViolation,
} from '../../services/storage';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  Wifi,
  WifiOff,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldAlert,
  BookOpen,
  Lock,
  KeyRound,
  LogOut,
} from 'lucide-react';

interface ExamRoomPageProps {
  session: ExamSession;
  pkg: ExamPackage;
  attempt: ExamAttempt;
  onExitAndLogout: () => void;
}

export const ExamRoomPage: React.FC<ExamRoomPageProps> = ({
  session,
  pkg,
  attempt: initialAttempt,
  onExitAndLogout,
}) => {
  const settings = getSchoolSettings();
  const allQuestions = getQuestions();
  const subjects = getSubjects();
  const subject = subjects.find(s => s.id === session.subjectId);

  // Active attempt state
  const [attempt, setAttempt] = useState<ExamAttempt>(initialAttempt);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Font size setting: 'sm' | 'md' | 'lg'
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Timers
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerHidden, setIsTimerHidden] = useState(false);

  // Sync / save status: 'saved' | 'saving' | 'offline'
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'offline'>('saved');

  // Navigation drawer / modal
  const [isQuestionListOpen, setIsQuestionListOpen] = useState(false);

  // Finish confirmation modal & token kirim jawaban
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isLockedWarningOpen, setIsLockedWarningOpen] = useState(false);
  const [submitTokenInput, setSubmitTokenInput] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Anti-cheat alert
  const [cheatAlert, setCheatAlert] = useState<{ show: boolean; count: number }>({
    show: false,
    count: attempt.violationCount || 0,
  });

  // Ordered questions according to student's attempt questionOrder
  const questions: Question[] = attempt.questionOrder
    .map(id => allQuestions.find(q => q.id === id))
    .filter((q): q is Question => q !== undefined);

  const currentQuestion = questions[currentIndex] || questions[0];

  // Current answer state for active question
  const currentAnswer: StudentAnswer = attempt.answers[currentQuestion?.id] || {
    questionId: currentQuestion?.id,
    isDoubtful: false,
    savedAt: new Date().toISOString(),
  };

  // Minimum submit time configuration (default 45 mins or from admin settings)
  const minSubmitMinutes = session.minSubmitMinutes || settings.minSubmitTimeMinutes || 45;
  const minSubmitSeconds = minSubmitMinutes * 60;
  const isSubmitTokenUnlocked = elapsedSeconds >= minSubmitSeconds;
  const remainingUntilSubmitUnlock = Math.max(0, minSubmitSeconds - elapsedSeconds);

  // Official session submit token
  const activeSubmitToken = session.submitToken || 'FIN' + (session.sessionNumber * 111);

  // Setup deadline countdown timer & elapsed timer
  useEffect(() => {
    const startedMs = new Date(attempt.startedAt || Date.now()).getTime();

    const calculateTimes = () => {
      const deadlineMs = new Date(attempt.deadline).getTime();
      const nowMs = Date.now();

      // Remaining deadline time
      const diff = Math.max(0, Math.floor((deadlineMs - nowMs) / 1000));
      setRemainingSeconds(diff);

      // Elapsed time since student started
      const elapsed = Math.max(0, Math.floor((nowMs - startedMs) / 1000));
      setElapsedSeconds(elapsed);

      if (diff <= 0 && !isSubmittedSuccess) {
        handleAutoSubmit();
      }
    };

    calculateTimes();
    const interval = setInterval(calculateTimes, 1000);
    return () => clearInterval(interval);
  }, [attempt.deadline, attempt.startedAt, isSubmittedSuccess]);

  // Anti-cheat window blur listener
  useEffect(() => {
    if (isSubmittedSuccess) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const count = recordViolation(attempt.id);
        setCheatAlert({ show: true, count });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [attempt.id, isSubmittedSuccess]);

  // Auto submit when time runs out
  const handleAutoSubmit = () => {
    const final = finalizeAttempt(attempt.id, true);
    if (final) {
      setAttempt(final);
      setIsSubmittedSuccess(true);
      startAutoLogoutCountdown();
    }
  };

  // Redirect / auto logout countdown after submit
  const startAutoLogoutCountdown = () => {
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    let count = 3;
    setRedirectCountdown(3);
    const timer = setInterval(() => {
      count -= 1;
      setRedirectCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        onExitAndLogout();
      }
    }, 1000);
  };

  // Answer change handler with debounce save
  const updateAnswer = (updates: Partial<StudentAnswer>) => {
    if (isSubmittedSuccess) return;

    const newAnswer: StudentAnswer = {
      ...currentAnswer,
      ...updates,
      questionId: currentQuestion.id,
      savedAt: new Date().toISOString(),
    };

    setSyncStatus('saving');

    // Optimistic local state update
    setAttempt(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQuestion.id]: newAnswer,
      },
    }));

    // Save to storage
    setTimeout(() => {
      try {
        const res = saveStudentAnswer(attempt.id, newAnswer);
        if (res.success && res.attempt) {
          setAttempt(res.attempt);
          setSyncStatus('saved');
        } else {
          setSyncStatus('offline');
        }
      } catch {
        setSyncStatus('offline');
      }
    }, 250);
  };

  const toggleDoubtful = () => {
    updateAnswer({ isDoubtful: !currentAnswer.isDoubtful });
  };

  // Format seconds to HH:MM:SS
  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatMinutesSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m} menit ${s} detik`;
  };

  // Font size classes
  const getFontSizeClasses = () => {
    if (fontSize === 'sm') return 'text-sm leading-relaxed';
    if (fontSize === 'lg') return 'text-lg leading-loose';
    return 'text-base leading-relaxed';
  };

  // Summary counts
  const answeredCount = Object.values(attempt.answers).filter(a => {
    return (
      a.selectedOptionId ||
      (a.selectedOptionIds && a.selectedOptionIds.length > 0) ||
      (a.trueFalseAnswers && Object.keys(a.trueFalseAnswers).length > 0) ||
      (a.matchingAnswers && Object.keys(a.matchingAnswers).length > 0) ||
      (a.shortAnswerText && a.shortAnswerText.trim().length > 0) ||
      (a.essayText && a.essayText.trim().length > 0)
    );
  }).length;

  const doubtfulCount = Object.values(attempt.answers).filter(a => a.isDoubtful).length;
  const totalCount = questions.length;
  const unansweredCount = totalCount - answeredCount;

  // Click on "Selesai Tes" button handler
  const handleOpenFinishModal = () => {
    if (!isSubmitTokenUnlocked) {
      // Locked: student has not reached 45 mins
      setIsLockedWarningOpen(true);
    } else {
      // Unlocked: show submit modal with token
      setSubmitTokenInput('');
      setSubmitError('');
      setIsSubmitModalOpen(true);
    }
  };

  // Final submit submission handler
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    // Verify token kirim jawaban
    if (submitTokenInput.trim().toUpperCase() !== activeSubmitToken.toUpperCase()) {
      setSubmitError(`Token Kirim Jawaban tidak sesuai. Masukkan token yang tertera di atas: ${activeSubmitToken}`);
      return;
    }

    const final = finalizeAttempt(attempt.id, false);
    if (final) {
      setAttempt(final);
      setIsSubmitModalOpen(false);
      setIsSubmittedSuccess(true);
      startAutoLogoutCountdown();
    }
  };

  // SCREEN: AFTER SUBMIT -> REDIRECT DIRECTLY TO INITIAL LOGIN
  if (isSubmittedSuccess) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold px-3 py-0.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 uppercase tracking-wider">
              Jawaban Berhasil Disimpan
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Terima Kasih, Asesmen Selesai!
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Jawaban Anda atas nama <strong>{attempt.studentName}</strong> ({attempt.studentNumber}) telah terkunci secara resmi di server.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
            <p>
              Komputer akan dialihkan otomatis ke <strong>halaman login awal</strong> dalam:
            </p>
            <p className="text-2xl font-mono font-extrabold text-blue-700">
              {redirectCountdown} Detik
            </p>
            <p className="text-[11px] text-slate-400">
              *Agar komputer dapat langsung digunakan peserta ujian sesi berikutnya
            </p>
          </div>

          <button
            onClick={onExitAndLogout}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors cursor-pointer text-xs flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Kembali ke Halaman Login Sekarang</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col select-none">
      
      {/* 1. ANBK AUTHENTIC TOP HEADER */}
      <header className="bg-blue-700 text-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          
          {/* Left: Branding & Student Info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex px-2 py-1 bg-white/10 rounded-lg items-center justify-center font-bold text-white text-xs tracking-wider font-mono">
              NEOTEST
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white line-clamp-1">
                {subject?.name} · Neotest CBT
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-blue-200">
                <span>{attempt.studentName}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{attempt.studentNumber}</span>
              </div>
            </div>
          </div>

          {/* Center: Font Size Switcher & Sync Status */}
          <div className="flex items-center gap-4">
            
            {/* Font Size Selector (A- A A+) */}
            <div className="hidden md:flex items-center bg-blue-800/80 rounded-lg p-0.5 border border-blue-600/60 text-xs">
              <span className="px-2 text-[10px] text-blue-200 font-medium">Ukuran:</span>
              <button
                onClick={() => setFontSize('sm')}
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                  fontSize === 'sm' ? 'bg-white text-blue-900 shadow-xs' : 'text-blue-100 hover:text-white'
                }`}
                title="Ukuran Teks Kecil"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize('md')}
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                  fontSize === 'md' ? 'bg-white text-blue-900 shadow-xs' : 'text-blue-100 hover:text-white'
                }`}
                title="Ukuran Teks Normal"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                  fontSize === 'lg' ? 'bg-white text-blue-900 shadow-xs' : 'text-blue-100 hover:text-white'
                }`}
                title="Ukuran Teks Besar"
              >
                A+
              </button>
            </div>

            {/* Sync / Autosave Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-800/60 text-xs">
              {syncStatus === 'saving' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                  <span className="text-[11px] text-amber-200 hidden sm:inline">Menyimpan...</span>
                </>
              ) : syncStatus === 'offline' ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-red-300" />
                  <span className="text-[11px] text-red-200 hidden sm:inline">Antrean Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-[11px] text-emerald-200 hidden sm:inline">Tersimpan</span>
                </>
              )}
            </div>

          </div>

          {/* Right: Countdown Timer & "Daftar Soal" Drawer Trigger */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Countdown Box */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-xs sm:text-sm tracking-wider ${
                remainingSeconds < 300
                  ? 'bg-red-600 text-white border-red-400 animate-pulse'
                  : remainingSeconds < 600
                  ? 'bg-amber-500 text-slate-950 border-amber-300'
                  : 'bg-blue-900/80 text-white border-blue-500'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>{isTimerHidden ? '--:--:--' : formatTimer(remainingSeconds)}</span>
              <button
                onClick={() => setIsTimerHidden(!isTimerHidden)}
                className="ml-1 opacity-75 hover:opacity-100"
                title={isTimerHidden ? 'Tampilkan Waktu' : 'Sembunyikan Waktu'}
              >
                {isTimerHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* "Daftar Soal" Trigger Button */}
            <button
              onClick={() => setIsQuestionListOpen(true)}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Daftar</span> Soal
            </button>

          </div>

        </div>
      </header>

      {/* 2. MAIN EXAMINATION CANVAS */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24">
        
        {/* Question Header strip */}
        <div className="bg-white rounded-t-xl border border-b-0 border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-800 rounded">
              SOAL NO. {currentIndex + 1}
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              dari {totalCount} soal
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-600 capitalize">
              {currentQuestion.type.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentAnswer.isDoubtful && (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                Ditandai Ragu-ragu
              </span>
            )}
            <span className="text-xs text-slate-400">
              Bobot: {currentQuestion.weight} Poin
            </span>
          </div>
        </div>

        {/* Question Content Box */}
        <div className="bg-white rounded-b-xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          
          {/* Stimulus Box */}
          {currentQuestion.stimulus && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
              {currentQuestion.stimulus.title && (
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                  {currentQuestion.stimulus.title}
                </h4>
              )}

              {currentQuestion.stimulus.type === 'table' ? (
                <div className="overflow-x-auto text-xs font-mono bg-white p-3 rounded-lg border border-slate-200">
                  <pre className="whitespace-pre-wrap font-sans text-slate-800">
                    {currentQuestion.stimulus.content}
                  </pre>
                </div>
              ) : currentQuestion.stimulus.type === 'formula' ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 font-mono">
                  {currentQuestion.stimulus.content}
                </div>
              ) : (
                <div className="text-slate-700 whitespace-pre-line text-sm leading-relaxed">
                  {currentQuestion.stimulus.content}
                </div>
              )}
            </div>
          )}

          {/* Question Prompt */}
          <div className={`font-medium text-slate-900 ${getFontSizeClasses()}`}>
            {currentQuestion.prompt}
          </div>

          {/* Interactive Answer Area depending on Question Type */}
          <div className="pt-4 border-t border-slate-100">
            
            {/* TYPE 1: PILIHAN GANDA (Single Choice) */}
            {currentQuestion.type === 'pilihan_ganda' && (
              <div className="space-y-3">
                {currentQuestion.options?.map((opt, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  const isSelected = currentAnswer.selectedOptionId === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateAnswer({ selectedOptionId: opt.id })}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {letter}
                      </div>
                      <span className={`text-slate-800 self-center ${getFontSizeClasses()}`}>
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TYPE 2: PILIHAN GANDA KOMPLEKS (Multiple Checkboxes) */}
            {currentQuestion.type === 'pilihan_ganda_kompleks' && (
              <div className="space-y-3">
                <p className="text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 font-medium">
                  Petunjuk: Anda dapat memilih lebih dari satu jawaban yang benar dengan mencentang kotak.
                </p>

                {currentQuestion.options?.map((opt) => {
                  const currentSelected = currentAnswer.selectedOptionIds || [];
                  const isChecked = currentSelected.includes(opt.id);

                  const toggleComplexOption = () => {
                    let updated: string[];
                    if (isChecked) {
                      updated = currentSelected.filter(id => id !== opt.id);
                    } else {
                      updated = [...currentSelected, opt.id];
                    }
                    updateAnswer({ selectedOptionIds: updated });
                  };

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={toggleComplexOption}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 cursor-pointer ${
                        isChecked
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 w-5 h-5 text-blue-600 rounded border-slate-300 cursor-pointer"
                      />
                      <span className={`text-slate-800 ${getFontSizeClasses()}`}>
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TYPE 3: BENAR / SALAH */}
            {currentQuestion.type === 'benar_salah' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-100 text-xs font-bold text-slate-700">
                      <th className="p-3.5 border-b border-slate-200">Pernyataan</th>
                      <th className="p-3.5 border-b border-slate-200 text-center w-24">Benar</th>
                      <th className="p-3.5 border-b border-slate-200 text-center w-24">Salah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                    {currentQuestion.trueFalseItems?.map((item) => {
                      const userChoice = currentAnswer.trueFalseAnswers?.[item.id];

                      const setChoice = (val: boolean) => {
                        const updated = {
                          ...(currentAnswer.trueFalseAnswers || {}),
                          [item.id]: val,
                        };
                        updateAnswer({ trueFalseAnswers: updated });
                      };

                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-3.5 text-slate-800 leading-relaxed">{item.statement}</td>
                          <td className="p-3.5 text-center">
                            <input
                              type="radio"
                              name={`tf-${item.id}`}
                              checked={userChoice === true}
                              onChange={() => setChoice(true)}
                              className="w-5 h-5 text-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="p-3.5 text-center">
                            <input
                              type="radio"
                              name={`tf-${item.id}`}
                              checked={userChoice === false}
                              onChange={() => setChoice(false)}
                              className="w-5 h-5 text-red-600 cursor-pointer"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* TYPE 4: MENJODOHKAN */}
            {currentQuestion.type === 'menjodohkan' && (
              <div className="space-y-4">
                <p className="text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 font-medium">
                  Petunjuk: Pasangkan masing-masing premis di sebelah kiri dengan pilihan respon yang sesuai di sebelah kanan.
                </p>

                <div className="space-y-3">
                  {currentQuestion.matchingPairs?.map((pair) => {
                    const currentMatch = currentAnswer.matchingAnswers?.[pair.id] || '';
                    const responseOptions = currentQuestion.matchingPairs?.map(p => p.response) || [];

                    const setMatching = (resVal: string) => {
                      const updated = {
                        ...(currentAnswer.matchingAnswers || {}),
                        [pair.id]: resVal,
                      };
                      updateAnswer({ matchingAnswers: updated });
                    };

                    return (
                      <div
                        key={pair.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50"
                      >
                        <span className="font-semibold text-slate-800 text-sm">
                          {pair.premise}
                        </span>

                        <div className="w-full sm:w-64">
                          <select
                            value={currentMatch}
                            onChange={(e) => setMatching(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                          >
                            <option value="">-- Pilih Pasangan --</option>
                            {responseOptions.map((resp, rIdx) => (
                              <option key={rIdx} value={resp}>
                                {resp}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TYPE 5: ISIAN SINGKAT */}
            {currentQuestion.type === 'isian_singkat' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                  Ketik Jawaban Singkat Anda:
                </label>
                <input
                  type="text"
                  value={currentAnswer.shortAnswerText || ''}
                  onChange={(e) => updateAnswer({ shortAnswerText: e.target.value })}
                  placeholder="Ketik jawaban di sini..."
                  className="w-full max-w-md px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-base text-slate-900 font-medium focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>
            )}

            {/* TYPE 6: URAIAN */}
            {currentQuestion.type === 'uraian' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                    Tuliskan Jawaban Uraian Anda:
                  </label>
                  <span className="text-xs text-slate-400">
                    {currentAnswer.essayText?.length || 0} Karakter
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={currentAnswer.essayText || ''}
                  onChange={(e) => updateAnswer({ essayText: e.target.value })}
                  placeholder="Tuliskan argumen dan uraian lengkap Anda di sini..."
                  className="w-full p-4 bg-white border-2 border-slate-300 rounded-xl text-sm leading-relaxed text-slate-900 focus:outline-none focus:border-blue-600 transition-colors resize-y"
                />
              </div>
            )}

          </div>

        </div>

      </main>

      {/* 3. ANBK AUTHENTIC BOTTOM CONTROL BAR */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 px-4 z-20 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Previous Question Button */}
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentIndex === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Soal</span> Sebelumnya
          </button>

          {/* Center: "Ragu-ragu" Checkbox */}
          <button
            onClick={toggleDoubtful}
            className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 border-2 transition-all cursor-pointer ${
              currentAnswer.isDoubtful
                ? 'bg-amber-400 hover:bg-amber-500 border-amber-500 text-slate-950 shadow-sm'
                : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
            }`}
          >
            <input
              type="checkbox"
              checked={currentAnswer.isDoubtful}
              onChange={() => {}}
              className="w-4 h-4 text-amber-600 rounded border-amber-400 cursor-pointer pointer-events-none"
            />
            <span>Ragu-ragu</span>
          </button>

          {/* Next Question or Finish Button */}
          {currentIndex < totalCount - 1 ? (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="px-4 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span className="hidden sm:inline">Soal</span> Berikutnya
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleOpenFinishModal}
              className="px-5 sm:px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4" />
              <span>Selesai Tes</span>
            </button>
          )}

        </div>
      </footer>

      {/* 4. MODAL: "DAFTAR SOAL" NUMBER GRID */}
      {isQuestionListOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl border border-slate-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Navigasi Nomor Soal</h3>
              <button
                onClick={() => setIsQuestionListOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-blue-600"></span>
                <span className="text-slate-700">Sudah Dijawab ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-amber-400"></span>
                <span className="text-slate-700">Ragu-ragu ({doubtfulCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-slate-200 border border-slate-300"></span>
                <span className="text-slate-700">Belum ({unansweredCount})</span>
              </div>
            </div>

            {/* Grid of Number Buttons */}
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5 max-h-72 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const ans = attempt.answers[q.id];
                const hasAnswer =
                  ans &&
                  (ans.selectedOptionId ||
                    (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
                    (ans.trueFalseAnswers && Object.keys(ans.trueFalseAnswers).length > 0) ||
                    (ans.matchingAnswers && Object.keys(ans.matchingAnswers).length > 0) ||
                    (ans.shortAnswerText && ans.shortAnswerText.trim().length > 0) ||
                    (ans.essayText && ans.essayText.trim().length > 0));

                const isDoubt = ans?.isDoubtful;
                const isCurrent = idx === currentIndex;

                let colorClasses = 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50';
                if (isDoubt) {
                  colorClasses = 'bg-amber-400 text-slate-950 font-bold border-amber-500 shadow-xs';
                } else if (hasAnswer) {
                  colorClasses = 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsQuestionListOpen(false);
                    }}
                    className={`h-12 rounded-xl text-sm font-bold flex items-center justify-center transition-all cursor-pointer relative ${colorClasses} ${
                      isCurrent ? 'ring-3 ring-blue-400 ring-offset-2' : ''
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {hasAnswer && !isDoubt && (
                      <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-white"></span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Terjawab: <strong>{answeredCount}</strong> / {totalCount}
              </span>
              <button
                onClick={() => {
                  setIsQuestionListOpen(false);
                  handleOpenFinishModal();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Kirim Ujian Selesai
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. MODAL PERINGATAN: BELUM 45 MENIT (PENGIRIMAN TERKUNCI) */}
      {isLockedWarningOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-amber-200">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-bold text-slate-900 text-base">
                Kirim Jawaban Belum Diizinkan
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Untuk mengantisipasi pengerjaan yang terburu-buru, tata tertib ujian menetapkan batas minimal pengerjaan adalah <strong>{minSubmitMinutes} menit</strong> dari jadwal mulai.
              </p>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center space-y-1">
              <span className="text-[11px] text-amber-800 font-semibold block">
                Token Kirim Jawaban akan otomatis muncul di layar Anda dalam:
              </span>
              <span className="font-mono text-2xl font-extrabold text-amber-900 block">
                {formatMinutesSeconds(remainingUntilSubmitUnlock)}
              </span>
            </div>

            <p className="text-[11px] text-center text-slate-500">
              Silakan gunakan waktu ini untuk meneliti dan memeriksa kembali jawaban Anda, terutama butir soal yang ditandai ragu-ragu.
            </p>

            <button
              onClick={() => setIsLockedWarningOpen(false)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Kembali Meneliti Soal
            </button>
          </div>
        </div>
      )}

      {/* 6. MODAL: FINAL SUBMISSION DENGAN TOKEN KIRIM JAWABAN */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            
            <div className="flex items-center gap-3 text-slate-900">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Konfirmasi Selesai Ujian</h3>
                <p className="text-xs text-slate-500">Periksa kembali ringkasan jawaban Anda</p>
              </div>
            </div>

            {/* Answer Summary Card */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <div>
                <p className="text-xs text-slate-500">Dijawab</p>
                <p className="text-lg font-bold text-emerald-600">{answeredCount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Ragu-ragu</p>
                <p className="text-lg font-bold text-amber-500">{doubtfulCount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Belum</p>
                <p className="text-lg font-bold text-red-500">{unansweredCount}</p>
              </div>
            </div>

            {doubtfulCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Perhatian: Anda masih memiliki <strong>{doubtfulCount} soal bertanda ragu-ragu</strong>.
                </span>
              </div>
            )}

            {/* FITUR TOKEN KIRIM JAWABAN (MUNCUL OTOMATIS SETELAH 45 MENIT) */}
            <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  Token Kirim Jawaban Anda:
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  Terbuka (45+ Mnt)
                </span>
              </div>

              {/* TAMPILAN TOKEN RESMI DI HALAMAN SISWA */}
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-blue-200">
                <span className="font-mono text-xl font-extrabold text-blue-900 tracking-widest">
                  {activeSubmitToken}
                </span>
                <button
                  type="button"
                  onClick={() => setSubmitTokenInput(activeSubmitToken)}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  Gunakan Token Ini
                </button>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Ketik Token Kirim Jawaban untuk Konfirmasi:
                </label>
                <input
                  type="text"
                  value={submitTokenInput}
                  onChange={(e) => {
                    setSubmitTokenInput(e.target.value.toUpperCase());
                    setSubmitError('');
                  }}
                  placeholder="Ketik token di sini..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-center font-mono text-sm font-bold tracking-widest text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <p className="text-[10px] text-slate-500">
                *Token ini muncul otomatis setelah Anda melewati batas waktu pengerjaan {minSubmitMinutes} menit.
              </p>
            </div>

            {submitError && (
              <p className="text-xs text-red-600 font-medium">{submitError}</p>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">
              Setelah dikirim, jawaban Anda akan langsung terkunci dan sistem akan otomatis mengembalikan layar ke <strong>halaman login awal</strong> agar komputer siap digunakan oleh peserta sesi berikutnya.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Batal / Lanjut Ujian
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Ya, Selesaikan Ujian
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 7. ANTI-CHEAT INTEGRITY VIOLATION ALERT */}
      {cheatAlert.show && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border-2 border-red-500">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Peringatan Integritas Asesmen</h3>
              <p className="text-xs text-red-600 font-semibold">
                Perpindahan Tab / Jendela Terdeteksi (Pelanggaran ke-{cheatAlert.count})
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Sistem mendeteksi bahwa Anda beralih ke jendela lain atau meminimalkan browser. Aktivitas ini dicatat dalam Audit Log Proktor.
              </p>
            </div>

            <button
              onClick={() => setCheatAlert({ show: false, count: cheatAlert.count })}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Saya Mengerti & Kembali ke Ujian
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
