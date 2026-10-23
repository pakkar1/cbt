import React, { useState, useEffect } from 'react';
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
  LayoutGrid,
  Lock,
  KeyRound,
  LogOut,
  Check,
  X,
} from 'lucide-react';

interface ExamRoomPageProps {
  session: ExamSession;
  pkg: ExamPackage;
  attempt: ExamAttempt;
  onExitAndLogout: () => void;
}

const QUESTION_TYPE_LABEL: Record<string, string> = {
  pilihan_ganda: 'Pilihan ganda',
  pilihan_ganda_kompleks: 'Pilihan ganda kompleks',
  benar_salah: 'Benar / salah',
  menjodohkan: 'Menjodohkan',
  isian_singkat: 'Isian singkat',
  uraian: 'Uraian',
};

// Apakah sebuah jawaban sudah terisi (dipakai di hitungan & navigasi nomor)
const hasAnswerValue = (a?: StudentAnswer): boolean =>
  !!a &&
  !!(
    a.selectedOptionId ||
    (a.selectedOptionIds && a.selectedOptionIds.length > 0) ||
    (a.trueFalseAnswers && Object.keys(a.trueFalseAnswers).length > 0) ||
    (a.matchingAnswers && Object.keys(a.matchingAnswers).length > 0) ||
    (a.shortAnswerText && a.shortAnswerText.trim().length > 0) ||
    (a.essayText && a.essayText.trim().length > 0)
  );

// Pembungkus dialog modal
const Modal: React.FC<{
  labelledBy: string;
  accentClass?: string;
  children: React.ReactNode;
}> = ({ labelledBy, accentClass = 'border-slate-200', children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className={`max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border bg-white shadow-xl ${accentClass}`}
    >
      {children}
    </div>
  </div>
);

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-1';

export const ExamRoomPage: React.FC<ExamRoomPageProps> = ({
  session,
  pkg,
  attempt: initialAttempt,
  onExitAndLogout,
}) => {
  const settings = getSchoolSettings();
  const allQuestions = getQuestions();
  const subjects = getSubjects();
  const subject = subjects.find((s) => s.id === session.subjectId);

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
    .map((id) => allQuestions.find((q) => q.id === id))
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
  const activeSubmitToken = session.submitToken || 'FIN' + session.sessionNumber * 111;

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
    setAttempt((prev) => ({
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
  const answeredCount = Object.values(attempt.answers).filter(hasAnswerValue).length;
  const doubtfulCount = Object.values(attempt.answers).filter((a) => a.isDoubtful).length;
  const totalCount = questions.length;
  const unansweredCount = totalCount - answeredCount;

  // Click on "Selesai Tes" button handler
  const handleOpenFinishModal = () => {
    if (!isSubmitTokenUnlocked) {
      // Locked: student has not reached the minimum time
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
      setSubmitError(
        `Token kirim jawaban tidak sesuai. Masukkan token yang tertera di atas: ${activeSubmitToken}`
      );
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
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-7 py-8 text-center shadow-sm">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-semibold text-slate-900">Ujian selesai</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Jawaban atas nama <strong className="font-semibold">{attempt.studentName}</strong> (
            {attempt.studentNumber}) sudah tersimpan dan terkunci di server.
          </p>

          <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-600">Kembali ke halaman login dalam</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-blue-700">
              {Math.max(0, redirectCountdown)} detik
            </p>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Komputer akan siap dipakai peserta sesi berikutnya.
          </p>

          <button
            type="button"
            onClick={onExitAndLogout}
            className={`mt-5 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-700 text-sm font-semibold text-white transition hover:bg-blue-800 ${focusRing}`}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Kembali ke login sekarang</span>
          </button>
        </div>
      </div>
    );
  }

  // Guard: paket tidak memiliki soal yang dapat dimuat
  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-sm rounded-lg border border-amber-200 bg-white px-7 py-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-600" aria-hidden="true" />
          <h1 className="mt-3 text-lg font-semibold text-slate-900">Soal belum tersedia</h1>
          <p className="mt-2 text-sm text-slate-600">
            Naskah soal untuk sesi ini tidak dapat dimuat. Hubungi proktor ruangan.
          </p>
          <button
            type="button"
            onClick={onExitAndLogout}
            className={`mt-5 h-10 w-full cursor-pointer rounded-md bg-blue-700 text-sm font-semibold text-white hover:bg-blue-800 ${focusRing}`}
          >
            Keluar
          </button>
        </div>
      </div>
    );
  }

  const timerClass =
    remainingSeconds < 300
      ? 'bg-red-600 text-white motion-safe:animate-pulse'
      : remainingSeconds < 600
      ? 'bg-amber-400 text-slate-900'
      : 'bg-blue-950/60 text-white';

  // Panel nomor soal (dipakai di sidebar desktop dan modal mobile)
  const renderQuestionPanel = (onPick?: () => void) => (
    <div className="space-y-4">
      <ul className="space-y-1.5 text-sm text-slate-600">
        <li className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-sm bg-blue-700" aria-hidden="true" />
          Sudah dijawab ({answeredCount})
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-sm bg-amber-400" aria-hidden="true" />
          Ragu-ragu ({doubtfulCount})
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-sm border border-slate-300 bg-white" aria-hidden="true" />
          Belum dijawab ({unansweredCount})
        </li>
      </ul>

      <div className="grid max-h-80 grid-cols-5 gap-2 overflow-y-auto p-1">
        {questions.map((q, idx) => {
          const ans = attempt.answers[q.id];
          const answered = hasAnswerValue(ans);
          const doubt = !!ans?.isDoubtful;
          const isCurrent = idx === currentIndex;

          let colorClasses = 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50';
          if (doubt) colorClasses = 'border-amber-500 bg-amber-400 text-slate-900';
          else if (answered) colorClasses = 'border-blue-700 bg-blue-700 text-white';

          return (
            <button
              key={q.id}
              type="button"
              aria-label={`Soal ${idx + 1}, ${doubt ? 'ragu-ragu' : answered ? 'sudah dijawab' : 'belum dijawab'}`}
              aria-current={isCurrent ? 'step' : undefined}
              onClick={() => {
                setCurrentIndex(idx);
                onPick?.();
              }}
              className={`flex h-10 cursor-pointer items-center justify-center rounded-md border text-sm font-semibold transition ${colorClasses} ${
                isCurrent ? 'ring-2 ring-blue-700 ring-offset-2' : ''
              } ${focusRing}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          onPick?.();
          handleOpenFinishModal();
        }}
        className={`flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-blue-700 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 ${focusRing}`}
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        <span>Kirim jawaban</span>
      </button>
    </div>
  );

  const hasStimulus = !!currentQuestion.stimulus;

  return (
    <div className="flex min-h-screen select-none flex-col bg-slate-100">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-30 bg-blue-800 text-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">{subject?.name || 'Asesmen'}</h1>
            <p className="truncate text-xs text-blue-200">
              {attempt.studentName} · <span className="font-mono">{attempt.studentNumber}</span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Ukuran teks */}
            <div
              role="group"
              aria-label="Ukuran teks soal"
              className="hidden items-center rounded-md bg-blue-950/40 p-0.5 md:flex"
            >
              {(
                [
                  ['sm', 'A-', 'Teks kecil'],
                  ['md', 'A', 'Teks normal'],
                  ['lg', 'A+', 'Teks besar'],
                ] as const
              ).map(([key, label, title]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFontSize(key)}
                  aria-pressed={fontSize === key}
                  title={title}
                  className={`h-7 min-w-8 cursor-pointer rounded px-2 text-xs font-semibold transition ${
                    fontSize === key ? 'bg-white text-blue-900' : 'text-blue-100 hover:text-white'
                  } ${focusRing}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Status simpan */}
            <div role="status" className="flex items-center gap-1.5 text-xs">
              {syncStatus === 'saving' ? (
                <>
                  <RefreshCw className="h-4 w-4 text-amber-300 motion-safe:animate-spin" aria-hidden="true" />
                  <span className="hidden text-amber-200 sm:inline">Menyimpan...</span>
                </>
              ) : syncStatus === 'offline' ? (
                <>
                  <WifiOff className="h-4 w-4 text-red-300" aria-hidden="true" />
                  <span className="hidden text-red-200 sm:inline">Antrean offline</span>
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                  <span className="hidden text-emerald-200 sm:inline">Tersimpan</span>
                </>
              )}
            </div>

            {/* Sisa waktu */}
            <div
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-sm font-semibold tabular-nums ${timerClass}`}
            >
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span aria-label="Sisa waktu">{isTimerHidden ? '--:--:--' : formatTimer(remainingSeconds)}</span>
              <button
                type="button"
                onClick={() => setIsTimerHidden(!isTimerHidden)}
                aria-label={isTimerHidden ? 'Tampilkan waktu' : 'Sembunyikan waktu'}
                className={`ml-0.5 cursor-pointer rounded opacity-80 hover:opacity-100 ${focusRing}`}
              >
                {isTimerHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>

            {/* Daftar soal (mobile/tablet) */}
            <button
              type="button"
              onClick={() => setIsQuestionListOpen(true)}
              className={`flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-white px-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 lg:hidden ${focusRing}`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Daftar soal</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===== Area soal ===== */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-5 lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-5">
        <section
          aria-label={`Soal nomor ${currentIndex + 1}`}
          className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          {/* Kepala soal */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-3 sm:px-6">
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Soal {currentIndex + 1}</h2>
              <span className="text-sm text-slate-500">dari {totalCount}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              {currentAnswer.isDoubtful && (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                  Ragu-ragu
                </span>
              )}
              <span>{QUESTION_TYPE_LABEL[currentQuestion.type] || currentQuestion.type.replace(/_/g, ' ')}</span>
              <span className="hidden sm:inline" aria-hidden="true">
                |
              </span>
              <span className="hidden sm:inline">Bobot {currentQuestion.weight} poin</span>
            </div>
          </div>

          {/* Isi soal: stimulus di kiri (layar lebar), pertanyaan di kanan */}
          <div
            className={`gap-6 px-5 py-6 sm:px-6 ${
              hasStimulus ? 'space-y-6 xl:grid xl:grid-cols-2 xl:space-y-0' : ''
            }`}
          >
            {currentQuestion.stimulus && (
              <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-4 xl:max-h-[calc(100vh-15rem)] xl:overflow-y-auto">
                {currentQuestion.stimulus.title && (
                  <h3 className="mb-3 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-900">
                    {currentQuestion.stimulus.title}
                  </h3>
                )}

                {currentQuestion.stimulus.type === 'table' ? (
                  <div className="overflow-x-auto rounded border border-slate-200 bg-white p-3">
                    <pre className={`whitespace-pre-wrap font-sans text-slate-800 ${getFontSizeClasses()}`}>
                      {currentQuestion.stimulus.content}
                    </pre>
                  </div>
                ) : currentQuestion.stimulus.type === 'formula' ? (
                  <div
                    className={`rounded border border-blue-200 bg-blue-50 p-3 font-mono text-blue-900 ${getFontSizeClasses()}`}
                  >
                    {currentQuestion.stimulus.content}
                  </div>
                ) : (
                  <div className={`whitespace-pre-line text-slate-700 ${getFontSizeClasses()}`}>
                    {currentQuestion.stimulus.content}
                  </div>
                )}
              </div>
            )}

            <div className="min-w-0 space-y-5">
              {/* Pertanyaan */}
              <p className={`font-medium text-slate-900 ${getFontSizeClasses()}`}>{currentQuestion.prompt}</p>

              {/* TIPE 1: PILIHAN GANDA */}
              {currentQuestion.type === 'pilihan_ganda' && (
                <div role="radiogroup" aria-label="Pilihan jawaban" className="space-y-2.5">
                  {currentQuestion.options?.map((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    const isSelected = currentAnswer.selectedOptionId === opt.id;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => updateAnswer({ selectedOptionId: opt.id })}
                        className={`flex w-full cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-left transition ${
                          isSelected
                            ? 'border-blue-700 bg-blue-50'
                            : 'border-slate-300 bg-white hover:bg-slate-50'
                        } ${focusRing}`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                            isSelected
                              ? 'bg-blue-700 text-white'
                              : 'border border-slate-300 text-slate-600'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className={`self-center text-slate-900 ${getFontSizeClasses()}`}>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TIPE 2: PILIHAN GANDA KOMPLEKS */}
              {currentQuestion.type === 'pilihan_ganda_kompleks' && (
                <div className="space-y-2.5">
                  <p className="text-sm text-slate-500">
                    Pilih satu atau lebih jawaban yang benar.
                  </p>

                  {currentQuestion.options?.map((opt) => {
                    const currentSelected = currentAnswer.selectedOptionIds || [];
                    const isChecked = currentSelected.includes(opt.id);

                    const toggleComplexOption = () => {
                      const updated = isChecked
                        ? currentSelected.filter((id) => id !== opt.id)
                        : [...currentSelected, opt.id];
                      updateAnswer({ selectedOptionIds: updated });
                    };

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="checkbox"
                        aria-checked={isChecked}
                        onClick={toggleComplexOption}
                        className={`flex w-full cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-left transition ${
                          isChecked
                            ? 'border-blue-700 bg-blue-50'
                            : 'border-slate-300 bg-white hover:bg-slate-50'
                        } ${focusRing}`}
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            isChecked ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-400 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />}
                        </span>
                        <span className={`text-slate-900 ${getFontSizeClasses()}`}>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TIPE 3: BENAR / SALAH */}
              {currentQuestion.type === 'benar_salah' && (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 text-sm font-medium text-slate-600">
                        <th scope="col" className="border-b border-slate-200 p-3">
                          Pernyataan
                        </th>
                        <th scope="col" className="w-20 border-b border-slate-200 p-3 text-center">
                          Benar
                        </th>
                        <th scope="col" className="w-20 border-b border-slate-200 p-3 text-center">
                          Salah
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
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
                            <td className={`p-3 text-slate-900 ${getFontSizeClasses()}`}>{item.statement}</td>
                            <td className="p-3 text-center">
                              <input
                                type="radio"
                                name={`tf-${item.id}`}
                                aria-label={`Benar: ${item.statement}`}
                                checked={userChoice === true}
                                onChange={() => setChoice(true)}
                                className="h-5 w-5 cursor-pointer accent-blue-700"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="radio"
                                name={`tf-${item.id}`}
                                aria-label={`Salah: ${item.statement}`}
                                checked={userChoice === false}
                                onChange={() => setChoice(false)}
                                className="h-5 w-5 cursor-pointer accent-blue-700"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TIPE 4: MENJODOHKAN */}
              {currentQuestion.type === 'menjodohkan' && (
                <div className="space-y-2.5">
                  <p className="text-sm text-slate-500">
                    Pasangkan setiap pernyataan di kiri dengan pilihan yang sesuai di kanan.
                  </p>

                  {currentQuestion.matchingPairs?.map((pair) => {
                    const currentMatch = currentAnswer.matchingAnswers?.[pair.id] || '';
                    const responseOptions = currentQuestion.matchingPairs?.map((p) => p.response) || [];

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
                        className="flex flex-col justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:gap-4"
                      >
                        <span className={`font-medium text-slate-900 ${getFontSizeClasses()}`}>{pair.premise}</span>

                        <select
                          aria-label={`Pasangan untuk: ${pair.premise}`}
                          value={currentMatch}
                          onChange={(e) => setMatching(e.target.value)}
                          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 sm:w-64"
                        >
                          <option value="">Pilih pasangan</option>
                          {responseOptions.map((resp, rIdx) => (
                            <option key={rIdx} value={resp}>
                              {resp}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TIPE 5: ISIAN SINGKAT */}
              {currentQuestion.type === 'isian_singkat' && (
                <div className="space-y-1.5">
                  <label htmlFor="short-answer" className="block text-sm font-medium text-slate-700">
                    Jawaban singkat
                  </label>
                  <input
                    id="short-answer"
                    type="text"
                    value={currentAnswer.shortAnswerText || ''}
                    onChange={(e) => updateAnswer({ shortAnswerText: e.target.value })}
                    placeholder="Ketik jawaban di sini"
                    autoComplete="off"
                    className="h-11 w-full max-w-md select-text rounded-md border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              )}

              {/* TIPE 6: URAIAN */}
              {currentQuestion.type === 'uraian' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="essay-answer" className="block text-sm font-medium text-slate-700">
                      Jawaban uraian
                    </label>
                    <span className="text-xs text-slate-500">{currentAnswer.essayText?.length || 0} karakter</span>
                  </div>
                  <textarea
                    id="essay-answer"
                    rows={8}
                    value={currentAnswer.essayText || ''}
                    onChange={(e) => updateAnswer({ essayText: e.target.value })}
                    placeholder="Tuliskan jawaban Anda di sini"
                    className="w-full resize-y select-text rounded-md border border-slate-300 bg-white p-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Sidebar nomor soal (desktop) */}
        <aside className="mt-5 hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-[4.5rem] lg:mt-0 lg:block">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Daftar soal</h2>
          {renderQuestionPanel()}
        </aside>
      </main>

      {/* ===== Bilah kontrol bawah ===== */}
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:gap-4">
          <button
            type="button"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className={`flex h-11 cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white sm:px-5 ${focusRing}`}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span>Sebelumnya</span>
          </button>

          <button
            type="button"
            onClick={toggleDoubtful}
            aria-pressed={!!currentAnswer.isDoubtful}
            className={`flex h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-semibold transition sm:px-5 ${
              currentAnswer.isDoubtful
                ? 'border-amber-500 bg-amber-400 text-slate-900'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            } ${focusRing}`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                currentAnswer.isDoubtful ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-400 bg-white'
              }`}
              aria-hidden="true"
            >
              {currentAnswer.isDoubtful && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            <span>Ragu-ragu</span>
          </button>

          {currentIndex < totalCount - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className={`flex h-11 cursor-pointer items-center gap-1.5 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white transition hover:bg-blue-800 sm:px-5 ${focusRing}`}
            >
              <span>Selanjutnya</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenFinishModal}
              className={`flex h-11 cursor-pointer items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:px-6 ${focusRing}`}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>Selesai</span>
            </button>
          )}
        </div>
      </footer>

      {/* ===== Modal: daftar soal (mobile/tablet) ===== */}
      {isQuestionListOpen && (
        <Modal labelledBy="dlg-daftar-soal">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 id="dlg-daftar-soal" className="text-base font-semibold text-slate-900">
              Daftar soal
            </h2>
            <button
              type="button"
              onClick={() => setIsQuestionListOpen(false)}
              aria-label="Tutup daftar soal"
              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 ${focusRing}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-5">{renderQuestionPanel(() => setIsQuestionListOpen(false))}</div>
        </Modal>
      )}

      {/* ===== Modal: pengiriman belum diizinkan ===== */}
      {isLockedWarningOpen && (
        <Modal labelledBy="dlg-terkunci">
          <div className="space-y-4 p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <Lock className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="dlg-terkunci" className="text-base font-semibold text-slate-900">
                  Belum bisa mengirim jawaban
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Tata tertib ujian menetapkan waktu pengerjaan minimal{' '}
                  <strong className="font-semibold">{minSubmitMinutes} menit</strong> sejak sesi dimulai.
                </p>
              </div>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-center">
              <p className="text-sm text-amber-800">Token kirim jawaban akan muncul dalam</p>
              <p className="mt-1 font-mono text-xl font-semibold text-amber-900">
                {formatMinutesSeconds(remainingUntilSubmitUnlock)}
              </p>
            </div>

            <p className="text-sm leading-relaxed text-slate-500">
              Gunakan waktu ini untuk memeriksa kembali jawaban, terutama soal yang ditandai ragu-ragu.
            </p>

            <button
              type="button"
              onClick={() => setIsLockedWarningOpen(false)}
              className={`h-10 w-full cursor-pointer rounded-md bg-blue-700 text-sm font-semibold text-white transition hover:bg-blue-800 ${focusRing}`}
            >
              Kembali ke soal
            </button>
          </div>
        </Modal>
      )}

      {/* ===== Modal: konfirmasi kirim jawaban + token ===== */}
      {isSubmitModalOpen && (
        <Modal labelledBy="dlg-kirim">
          <form onSubmit={handleFinalSubmit} className="space-y-5 p-6">
            <div>
              <h2 id="dlg-kirim" className="text-base font-semibold text-slate-900">
                Konfirmasi selesai ujian
              </h2>
              <p className="mt-1 text-sm text-slate-500">Periksa ringkasan jawaban Anda sebelum mengirim.</p>
            </div>

            <dl className="grid grid-cols-3 divide-x divide-slate-200 rounded-md border border-slate-200 bg-slate-50 py-3 text-center">
              <div>
                <dt className="text-xs text-slate-500">Dijawab</dt>
                <dd className="text-xl font-semibold text-emerald-600">{answeredCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Ragu-ragu</dt>
                <dd className="text-xl font-semibold text-amber-600">{doubtfulCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Belum</dt>
                <dd className="text-xl font-semibold text-red-600">{unansweredCount}</dd>
              </div>
            </dl>

            {(doubtfulCount > 0 || unansweredCount > 0) && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                <span>
                  {unansweredCount > 0 && (
                    <>
                      Masih ada <strong className="font-semibold">{unansweredCount} soal belum dijawab</strong>.{' '}
                    </>
                  )}
                  {doubtfulCount > 0 && (
                    <>
                      Ada <strong className="font-semibold">{doubtfulCount} soal ragu-ragu</strong>.
                    </>
                  )}
                </span>
              </div>
            )}

            {/* Token kirim jawaban */}
            <div className="space-y-3 rounded-md border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                  <KeyRound className="h-4 w-4 text-blue-700" aria-hidden="true" />
                  Token kirim jawaban
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  Terbuka setelah {minSubmitMinutes} menit
                </span>
              </div>

              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="font-mono text-xl font-semibold tracking-widest text-blue-800">
                  {activeSubmitToken}
                </span>
                <button
                  type="button"
                  onClick={() => setSubmitTokenInput(activeSubmitToken)}
                  className={`cursor-pointer rounded text-sm font-medium text-blue-700 hover:underline ${focusRing}`}
                >
                  Isi otomatis
                </button>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="submit-token" className="block text-sm text-slate-600">
                  Ketik token untuk konfirmasi
                </label>
                <input
                  id="submit-token"
                  type="text"
                  value={submitTokenInput}
                  onChange={(e) => {
                    setSubmitTokenInput(e.target.value.toUpperCase());
                    setSubmitError('');
                  }}
                  placeholder="Ketik token di sini"
                  autoComplete="off"
                  className="h-10 w-full select-text rounded-md border border-slate-300 bg-white px-3 text-center font-mono text-sm font-semibold tracking-widest text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            </div>

            {submitError && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {submitError}
              </p>
            )}

            <p className="text-sm leading-relaxed text-slate-500">
              Setelah dikirim, jawaban langsung terkunci dan layar kembali ke halaman login agar komputer siap
              dipakai peserta berikutnya.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className={`h-10 cursor-pointer rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 ${focusRing}`}
              >
                Lanjut mengerjakan
              </button>
              <button
                type="submit"
                className={`h-10 cursor-pointer rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 ${focusRing}`}
              >
                Kirim jawaban
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ===== Peringatan integritas ===== */}
      {cheatAlert.show && (
        <Modal labelledBy="dlg-integritas" accentClass="border-red-300">
          <div className="space-y-4 p-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <ShieldAlert className="h-6 w-6" aria-hidden="true" />
            </span>

            <div className="space-y-1.5">
              <h2 id="dlg-integritas" className="text-base font-semibold text-slate-900">
                Peringatan integritas asesmen
              </h2>
              <p className="text-sm font-medium text-red-600">
                Perpindahan tab atau jendela terdeteksi (pelanggaran ke-{cheatAlert.count})
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                Anda terdeteksi beralih ke jendela lain atau meminimalkan browser. Aktivitas ini dicatat di audit
                log proktor.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCheatAlert({ show: false, count: cheatAlert.count })}
              className={`h-10 w-full cursor-pointer rounded-md bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700 ${focusRing}`}
            >
              Saya mengerti, kembali ke ujian
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};