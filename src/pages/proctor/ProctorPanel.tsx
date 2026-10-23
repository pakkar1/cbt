import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ExamSession,
  ExamAttempt,
  User,
  IncidentReport,
} from '../../types';
import {
  getExamSessions,
  getExamAttempts,
  getStudents,
  getSubjects,
  refreshSessionStartToken,
  generateSessionSubmitToken,
  resetStudentSession,
  addIncident,
  getSchoolSettings,
} from '../../services/storage';
import {
  KeyRound,
  RefreshCw,
  Search,
  RotateCcw,
  Shield,
  Printer,
  FileCheck2,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';

const PAGE_SIZE = 25;

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-1';

const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 ' +
  'focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20';

const outlineBtn =
  `flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 ${focusRing}`;

const primaryBtn =
  `flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white transition hover:bg-blue-800 ${focusRing}`;

// Pembungkus dialog modal
const Modal: React.FC<{
  labelledBy: string;
  wide?: boolean;
  children: React.ReactNode;
}> = ({ labelledBy, wide = false, children }) => (
  <div
    className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 ${
      wide ? 'p-2 sm:p-4' : 'p-4'
    }`}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className={`flex w-full flex-col rounded-lg border border-slate-200 bg-white shadow-xl ${
        wide ? 'max-h-[95vh] max-w-4xl' : 'max-h-[90vh] max-w-md overflow-y-auto'
      }`}
    >
      {children}
    </div>
  </div>
);

// Blok token (mulai / kirim)
const TokenBlock: React.FC<{
  icon: React.ReactNode;
  title: string;
  badge: string;
  token: string;
  hint: string;
  buttonLabel: string;
  onClick: () => void;
}> = ({ icon, title, badge, token, hint, buttonLabel, onClick }) => (
  <div className="flex flex-col gap-3 p-5">
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
        {icon}
        {title}
      </span>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{badge}</span>
    </div>
    <p className="font-mono text-3xl font-semibold tracking-widest text-blue-800">{token}</p>
    <p className="text-sm text-slate-500">{hint}</p>
    <button type="button" onClick={onClick} className={`${primaryBtn} w-full sm:w-auto sm:self-start`}>
      <RefreshCw className="h-4 w-4" aria-hidden="true" />
      <span>{buttonLabel}</span>
    </button>
  </div>
);

export const ProctorPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const settings = getSchoolSettings();
  const sessions = getExamSessions();
  const subjects = getSubjects();
  const allStudents = getStudents();

  // Selected session (default first open session or session 1)
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    sessions.find((s) => s.status === 'OPEN' || s.status === 'IN_PROGRESS')?.id ||
      sessions[0]?.id ||
      'sesi-h1-s1'
  );

  const [attempts, setAttempts] = useState<ExamAttempt[]>(getExamAttempts());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'SUBMITTED' | 'NOT_STARTED'>('ALL');
  const [page, setPage] = useState(1);

  // Modals for Printable Documents
  const [isBeritaAcaraModalOpen, setIsBeritaAcaraModalOpen] = useState(false);
  const [isDaftarHadirModalOpen, setIsDaftarHadirModalOpen] = useState(false);

  // Signing authorities & report details
  const [pengawasName, setPengawasName] = useState('Budi Santoso, S.Pd.');
  const [pengawasNip, setPengawasNip] = useState('198406122008011005');
  const [kepsekName, setKepsekName] = useState(settings.headmasterName || 'Dra. Hj. Siti Nurhasanah, M.Pd.');
  const [kepsekNip, setKepsekNip] = useState(settings.headmasterNip || '197405121998022001');
  const [tempatTtd, setTempatTtd] = useState('Surabaya');
  const [beritaAcaraNotes, setBeritaAcaraNotes] = useState(
    'Pelaksanaan ujian berjalan dengan tertib, aman, dan lancar sesuai petunjuk teknis operasional asesmen.'
  );

  // Incident report modal state
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentType, setIncidentType] = useState<IncidentReport['incidentType']>('GANTI_KOMPUTER');
  const [incidentNotes, setIncidentNotes] = useState('');
  const [incidentAction, setIncidentAction] = useState('');
  const [incidentStudentId, setIncidentStudentId] = useState('');

  // Konfirmasi reset login siswa
  const [resetTarget, setResetTarget] = useState<User | null>(null);

  // Notification flash message
  const [flashMessage, setFlashMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const activeSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];
  const subject = subjects.find((s) => s.id === activeSession?.subjectId);

  // Filter students belonging to active session classes (e.g. 9A, 9B, 9C)
  const sessionStudents = allStudents.slice(0, activeSession?.maxCapacity || 120);

  // Batas waktu minimal kirim jawaban (sama dengan yang dipakai di ruang ujian)
  const minSubmitMinutes = activeSession?.minSubmitMinutes || settings.minSubmitTimeMinutes || 45;

  // Sesi dikelompokkan per hari untuk pemilih sesi
  const sessionsByDay = sessions.reduce<Record<number, ExamSession[]>>((acc, s) => {
    (acc[s.dayNumber] ||= []).push(s);
    return acc;
  }, {});

  // Refresh attempts periodically to simulate live monitoring
  useEffect(() => {
    const update = () => setAttempts(getExamAttempts());
    update();
    const timer = setInterval(update, 2000);
    return () => clearInterval(timer);
  }, [selectedSessionId]);

  // Kembali ke halaman 1 saat filter berubah
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, selectedSessionId]);

  const showFlash = (text: string, type: 'success' | 'info' = 'success') => {
    setFlashMessage({ text, type });
    setTimeout(() => setFlashMessage(null), 3000);
  };

  // Handler for refreshing start token
  const handleRefreshToken = () => {
    if (!activeSession) return;
    const newToken = refreshSessionStartToken(activeSession.id, currentUser?.name || 'Proktor');
    showFlash(`Token mulai baru berhasil dirilis: ${newToken}`);
  };

  // Handler for releasing submit token
  const handleReleaseSubmitToken = () => {
    if (!activeSession) return;
    const submitTok = generateSessionSubmitToken(activeSession.id, currentUser?.name || 'Proktor');
    showFlash(`Token kirim jawaban berhasil diterbitkan: ${submitTok}`);
  };

  // Handler for resetting student login (setelah dikonfirmasi)
  const confirmResetStudent = () => {
    if (!resetTarget || !activeSession) return;
    resetStudentSession(activeSession.id, resetTarget.id, currentUser?.name || 'Proktor');
    showFlash(`Akses login untuk ${resetTarget.name} berhasil di-reset.`);
    setAttempts(getExamAttempts());
    setResetTarget(null);
  };

  // Handler for logging incident
  const handleSaveIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !incidentNotes.trim()) return;

    const std = allStudents.find((s) => s.id === incidentStudentId);

    addIncident({
      sessionId: activeSession.id,
      proctorId: currentUser?.id || 'usr-proktor-1',
      proctorName: currentUser?.name || 'Rahmat Hidayat',
      studentId: std?.id,
      studentName: std?.name,
      incidentType: incidentType,
      notes: incidentNotes,
      actionTaken: incidentAction || 'Diizinkan melanjutkan sesi dengan pengawasan proktor',
    });

    setIsIncidentModalOpen(false);
    setIncidentNotes('');
    setIncidentAction('');
    showFlash('Berita acara kejadian berhasil dicatat dalam audit log.', 'info');
  };

  // Count metrics for current session
  const sessionAttempts = attempts.filter((a) => a.examSessionId === activeSession?.id);
  const inProgressCount = sessionAttempts.filter((a) => a.status === 'IN_PROGRESS').length;
  const submittedCount = sessionAttempts.filter(
    (a) => a.status === 'SUBMITTED' || a.status === 'AUTO_SUBMITTED'
  ).length;
  const notStartedCount = sessionStudents.length - sessionAttempts.length;

  // Peserta yang belum memulai ujian sama sekali (dipakai di berita acara)
  const absentStudents = sessionStudents.filter((s) => !sessionAttempts.some((a) => a.studentId === s.id));

  // Filtered participant list
  const filteredStudents = sessionStudents.filter((student) => {
    const att = sessionAttempts.find((a) => a.studentId === student.id);

    // Search
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.nomorPeserta && student.nomorPeserta.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'IN_PROGRESS') return att?.status === 'IN_PROGRESS';
    if (statusFilter === 'SUBMITTED') return att?.status === 'SUBMITTED' || att?.status === 'AUTO_SUBMITTED';
    if (statusFilter === 'NOT_STARTED') return !att;
    return true;
  });

  // Paginasi daftar peserta
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageStudents = filteredStudents.slice(pageStart, pageStart + PAGE_SIZE);

  const filterTabs: { key: typeof statusFilter; label: string; count: number }[] = [
    { key: 'ALL', label: 'Semua', count: sessionStudents.length },
    { key: 'IN_PROGRESS', label: 'Mengerjakan', count: inProgressCount },
    { key: 'SUBMITTED', label: 'Selesai', count: submittedCount },
    { key: 'NOT_STARTED', label: 'Belum login', count: notStartedCount },
  ];

  // Kop surat dokumen cetak
  const renderKop = () => (
    <div className="border-b-4 border-double border-black pb-2 text-center">
      <h2 className="text-sm font-bold uppercase tracking-wide sm:text-base">
        Pemerintah Daerah Dinas Pendidikan
      </h2>
      <h1 className="text-base font-bold uppercase tracking-wide sm:text-lg">{settings.schoolName}</h1>
      <p className="mt-1 text-xs text-slate-700">
        {settings.address} · NPSN: {settings.npsn}
      </p>
      <p className="text-[11px] text-slate-600">Sistem Asesmen Berbasis Komputer — Neotest CBT</p>
    </div>
  );

  const today = new Date();
  const todayLong = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      {/* ===== Judul halaman ===== */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Panel Proktor</h1>
          <p className="mt-1 text-sm text-slate-500">
            {settings.schoolName} · Kapasitas {activeSession?.maxCapacity || 120} peserta per sesi
          </p>
        </div>
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500 motion-safe:animate-pulse" aria-hidden="true" />
          Data diperbarui otomatis
        </p>
      </header>

      {/* ===== Sesi & token ===== */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Sesi ujian */}
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm" aria-labelledby="sec-sesi">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 id="sec-sesi" className="text-sm font-semibold text-slate-900">
              Sesi ujian
            </h2>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <label htmlFor="session-select" className="mb-1.5 block text-sm font-medium text-slate-700">
                Pilih sesi
              </label>
              <select
                id="session-select"
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                {Object.entries(sessionsByDay).map(([day, list]) => (
                  <optgroup key={day} label={`Hari ke-${day}`}>
                    {list.map((s) => (
                      <option key={s.id} value={s.id}>
                        Sesi {s.sessionNumber} · {s.startTime}–{s.endTime} · {s.roomName}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <dl className="divide-y divide-slate-100 text-sm">
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-slate-500">Mata ujian</dt>
                <dd className="text-right font-medium text-slate-900">{subject?.name || '-'}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-slate-500">Ruang</dt>
                <dd className="text-right font-medium text-slate-900">{activeSession?.roomName || '-'}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-slate-500">Waktu</dt>
                <dd className="text-right font-medium text-slate-900">
                  {activeSession?.startTime} – {activeSession?.endTime} WIB
                </dd>
              </div>
            </dl>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setIsBeritaAcaraModalOpen(true)} className={outlineBtn}>
                <FileCheck2 className="h-4 w-4" aria-hidden="true" />
                <span>Berita acara</span>
              </button>
              <button type="button" onClick={() => setIsDaftarHadirModalOpen(true)} className={outlineBtn}>
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                <span>Daftar hadir</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsIncidentModalOpen(true)}
              className={`${outlineBtn} w-full`}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Catat insiden ruangan</span>
            </button>
          </div>
        </section>

        {/* Token ujian */}
        <section
          className="rounded-lg border border-slate-200 bg-white shadow-sm lg:col-span-2"
          aria-labelledby="sec-token"
        >
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 id="sec-token" className="text-sm font-semibold text-slate-900">
              Token ujian
            </h2>
          </div>
          <div className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <TokenBlock
              icon={<KeyRound className="h-4 w-4 text-blue-700" aria-hidden="true" />}
              title="Token mulai ujian"
              badge="Aktif"
              token={activeSession?.startToken || '------'}
              hint="Umumkan token ini kepada peserta di ruang ujian."
              buttonLabel="Rilis token baru"
              onClick={handleRefreshToken}
            />
            <TokenBlock
              icon={<Shield className="h-4 w-4 text-blue-700" aria-hidden="true" />}
              title="Token kirim jawaban"
              badge={`Min. ${minSubmitMinutes} menit`}
              token={activeSession?.submitToken || 'FIN' + (activeSession?.sessionNumber || 0) * 111}
              hint="Berikan kepada peserta yang sudah memenuhi syarat waktu pengerjaan."
              buttonLabel="Terbitkan token"
              onClick={handleReleaseSubmitToken}
            />
          </div>
        </section>
      </div>

      {/* ===== Ringkasan ===== */}
      <dl className="grid grid-cols-2 divide-x divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm sm:grid-cols-4 sm:divide-y-0">
        {[
          { label: 'Total peserta', value: sessionStudents.length, note: 'Terdaftar di sesi ini', color: 'text-slate-900' },
          { label: 'Sedang mengerjakan', value: inProgressCount, note: 'Terhubung ke server', color: 'text-blue-700' },
          { label: 'Sudah selesai', value: submittedCount, note: 'Jawaban terkunci', color: 'text-emerald-600' },
          { label: 'Belum login', value: notStartedCount, note: 'Menunggu masuk', color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="px-5 py-4">
            <dt className="text-sm text-slate-500">{s.label}</dt>
            <dd className={`mt-1 text-3xl font-semibold tabular-nums ${s.color}`}>{s.value}</dd>
            <p className="mt-0.5 text-xs text-slate-400">{s.note}</p>
          </div>
        ))}
      </dl>

      {/* ===== Daftar peserta ===== */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-labelledby="sec-peserta">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 id="sec-peserta" className="text-sm font-semibold text-slate-900">
            Daftar peserta
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau nomor peserta"
                aria-label="Cari peserta"
                className={`${inputClass} h-9 pl-9`}
              />
            </div>

            <div
              role="group"
              aria-label="Filter status peserta"
              className="flex w-full overflow-x-auto rounded-md border border-slate-300 bg-slate-50 p-0.5 sm:w-auto"
            >
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  aria-pressed={statusFilter === tab.key}
                  className={`h-8 cursor-pointer whitespace-nowrap rounded px-3 text-sm font-medium transition ${
                    statusFilter === tab.key
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  } ${focusRing}`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th scope="col" className="w-12 px-4 py-3 text-center font-medium">
                  No
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Nomor peserta
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Nama
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Kelas
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-center font-medium">
                  Terjawab
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Sinkron terakhir
                </th>
                <th scope="col" className="px-4 py-3 text-center font-medium">
                  Pelanggaran
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageStudents.map((student, idx) => {
                const att = sessionAttempts.find((a) => a.studentId === student.id);

                let statusBadge = (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
                    Belum login
                  </span>
                );

                if (att?.status === 'IN_PROGRESS') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-blue-600 motion-safe:animate-pulse"
                        aria-hidden="true"
                      />
                      Mengerjakan
                    </span>
                  );
                } else if (att?.status === 'SUBMITTED' || att?.status === 'AUTO_SUBMITTED') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Selesai
                    </span>
                  );
                }

                const answered = att ? Object.keys(att.answers).length : 0;
                const violations = att?.violationCount || 0;

                return (
                  <tr key={student.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3 text-center font-mono text-slate-400">{pageStart + idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-800">{student.nomorPeserta}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{student.name}</td>
                    <td className="px-4 py-3 text-slate-600">{student.rombel || '9A'}</td>
                    <td className="px-4 py-3">{statusBadge}</td>
                    <td className="px-4 py-3 text-center tabular-nums text-slate-700">
                      {att ? `${answered} soal` : '-'}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-500">
                      {att ? new Date(att.lastSyncAt).toLocaleTimeString('id-ID') : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {violations > 0 ? (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                          {violations}x
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {att && att.status !== 'SUBMITTED' ? (
                        <button
                          type="button"
                          onClick={() => setResetTarget(student)}
                          title="Izinkan peserta melanjutkan jika komputer restart atau mati lampu"
                          className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 ${focusRing}`}
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Reset login</span>
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            Tidak ada peserta yang cocok dengan pencarian atau filter.
          </div>
        )}

        {/* Paginasi */}
        {filteredStudents.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
            <span>
              Menampilkan {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filteredStudents.length)} dari{' '}
              {filteredStudents.length} peserta
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                aria-label="Halaman sebelumnya"
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white ${focusRing}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                aria-label="Halaman berikutnya"
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white ${focusRing}`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ===== Notifikasi ===== */}
      {flashMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-1/2 z-[60] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-white shadow-lg ${
            flashMessage.type === 'success' ? 'bg-emerald-700' : 'bg-slate-800'
          }`}
        >
          <span>{flashMessage.text}</span>
          <button
            type="button"
            onClick={() => setFlashMessage(null)}
            aria-label="Tutup notifikasi"
            className={`cursor-pointer rounded text-white/80 hover:text-white ${focusRing}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ===== Modal: konfirmasi reset login ===== */}
      {resetTarget && (
        <Modal labelledBy="dlg-reset">
          <div className="space-y-4 p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="dlg-reset" className="text-base font-semibold text-slate-900">
                  Reset login peserta?
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Izinkan reset login untuk{' '}
                  <strong className="font-semibold">
                    {resetTarget.name} ({resetTarget.nomorPeserta})
                  </strong>
                  ? Peserta dapat menyambung kembali sesi ujian jika terjadi pemadaman atau kendala perangkat.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setResetTarget(null)} className={outlineBtn}>
                Batal
              </button>
              <button type="button" onClick={confirmResetStudent} className={primaryBtn}>
                Reset login
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ===== Modal: catat insiden ===== */}
      {isIncidentModalOpen && (
        <Modal labelledBy="dlg-insiden">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 id="dlg-insiden" className="text-base font-semibold text-slate-900">
              Catat insiden ujian
            </h2>
            <button
              type="button"
              onClick={() => setIsIncidentModalOpen(false)}
              aria-label="Tutup"
              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 ${focusRing}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSaveIncident} className="space-y-4 p-6">
            <div className="space-y-1.5">
              <label htmlFor="incident-type" className="block text-sm font-medium text-slate-700">
                Jenis kejadian
              </label>
              <select
                id="incident-type"
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value as IncidentReport['incidentType'])}
                className={inputClass}
              >
                <option value="GANTI_KOMPUTER">Ganti komputer / restart PC siswa</option>
                <option value="LISTRIK_PADAM">Pemadaman aliran listrik</option>
                <option value="JARINGAN_PUTUS">Gangguan jaringan server / switch</option>
                <option value="KECURANGAN">Dugaan pelanggaran integritas</option>
                <option value="LAINNYA">Kejadian khusus lainnya</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="incident-student" className="block text-sm font-medium text-slate-700">
                Peserta terkait <span className="font-normal text-slate-400">(opsional)</span>
              </label>
              <select
                id="incident-student"
                value={incidentStudentId}
                onChange={(e) => setIncidentStudentId(e.target.value)}
                className={inputClass}
              >
                <option value="">Seluruh ruangan (kendala umum)</option>
                {sessionStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nomorPeserta} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="incident-notes" className="block text-sm font-medium text-slate-700">
                Kronologi kejadian
              </label>
              <textarea
                id="incident-notes"
                rows={3}
                value={incidentNotes}
                onChange={(e) => setIncidentNotes(e.target.value)}
                placeholder="Jelaskan secara objektif peristiwa yang terjadi di ruang ujian"
                className="w-full rounded-md border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="incident-action" className="block text-sm font-medium text-slate-700">
                Tindakan penanganan
              </label>
              <input
                id="incident-action"
                type="text"
                value={incidentAction}
                onChange={(e) => setIncidentAction(e.target.value)}
                placeholder="Contoh: peserta dipindahkan ke PC cadangan nomor 12 dan login di-reset"
                className={inputClass}
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setIsIncidentModalOpen(false)} className={outlineBtn}>
                Batal
              </button>
              <button type="submit" className={primaryBtn}>
                Simpan
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ===== Modal: cetak berita acara ===== */}
      {isBeritaAcaraModalOpen && (
        <Modal labelledBy="dlg-berita-acara" wide>
          <div className="no-print flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <h2 id="dlg-berita-acara" className="text-base font-semibold text-slate-900">
                Berita acara pelaksanaan ujian
              </h2>
              <p className="text-sm text-slate-500">Ditandatangani pengawas ruang dan kepala sekolah.</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => window.print()} className={primaryBtn}>
                <Printer className="h-4 w-4" aria-hidden="true" />
                <span>Cetak / simpan PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBeritaAcaraModalOpen(false)}
                aria-label="Tutup"
                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 ${focusRing}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Editor identitas (tidak ikut tercetak) */}
          <div className="no-print space-y-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-sm font-medium text-slate-700">Identitas tanda tangan dan catatan</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1">
                <label htmlFor="ba-pengawas" className="block text-xs text-slate-600">
                  Nama pengawas ruang
                </label>
                <input
                  id="ba-pengawas"
                  type="text"
                  value={pengawasName}
                  onChange={(e) => setPengawasName(e.target.value)}
                  className={`${inputClass} h-9`}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="ba-pengawas-nip" className="block text-xs text-slate-600">
                  NIP pengawas
                </label>
                <input
                  id="ba-pengawas-nip"
                  type="text"
                  value={pengawasNip}
                  onChange={(e) => setPengawasNip(e.target.value)}
                  className={`${inputClass} h-9 font-mono`}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="ba-kepsek" className="block text-xs text-slate-600">
                  Nama kepala sekolah
                </label>
                <input
                  id="ba-kepsek"
                  type="text"
                  value={kepsekName}
                  onChange={(e) => setKepsekName(e.target.value)}
                  className={`${inputClass} h-9`}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="ba-kepsek-nip" className="block text-xs text-slate-600">
                  NIP kepala sekolah
                </label>
                <input
                  id="ba-kepsek-nip"
                  type="text"
                  value={kepsekNip}
                  onChange={(e) => setKepsekNip(e.target.value)}
                  className={`${inputClass} h-9 font-mono`}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="ba-tempat" className="block text-xs text-slate-600">
                  Kota tanda tangan
                </label>
                <input
                  id="ba-tempat"
                  type="text"
                  value={tempatTtd}
                  onChange={(e) => setTempatTtd(e.target.value)}
                  className={`${inputClass} h-9`}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="ba-catatan" className="block text-xs text-slate-600">
                Catatan pelaksanaan ujian
              </label>
              <input
                id="ba-catatan"
                type="text"
                value={beritaAcaraNotes}
                onChange={(e) => setBeritaAcaraNotes(e.target.value)}
                placeholder="Catatan ketertiban, keamanan, atau kejadian khusus"
                className={`${inputClass} h-9`}
              />
            </div>
          </div>

          {/* Dokumen (area cetak) */}
          <div className="print-container flex-1 overflow-y-auto bg-white p-6 text-slate-900 sm:p-10">
            {renderKop()}

            <div className="my-6 space-y-1 text-center">
              <h2 className="text-sm font-bold uppercase underline underline-offset-4 sm:text-base">
                Berita Acara Pelaksanaan Ujian Berbasis Komputer
              </h2>
              <p className="text-xs font-semibold uppercase">Neotest CBT Tingkat Sekolah Menengah Pertama (SMP)</p>
              <p className="text-xs text-slate-600">
                Tahun Pelajaran {settings.academicYear} — Semester {settings.semester.toUpperCase()}
              </p>
            </div>

            <div className="space-y-4 text-justify text-xs leading-relaxed">
              <p>
                Pada hari ini, <strong>{today.toLocaleDateString('id-ID', { weekday: 'long' })}</strong> tanggal{' '}
                <strong>{today.getDate()}</strong> bulan{' '}
                <strong>{today.toLocaleDateString('id-ID', { month: 'long' })}</strong> tahun{' '}
                <strong>{today.getFullYear()}</strong>, bertempat di <strong>{settings.schoolName}</strong>, telah
                diselenggarakan Ujian Berbasis Komputer (Neotest CBT) dengan rincian pelaksanaan sebagai berikut:
              </p>

              <table className="w-full text-xs">
                <tbody className="align-top">
                  <tr className="border-b border-slate-300">
                    <td className="w-52 py-1.5 font-semibold">1. Satuan pendidikan</td>
                    <td className="py-1.5">
                      : {settings.schoolName} (NPSN: {settings.npsn})
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="py-1.5 font-semibold">2. Mata pelajaran</td>
                    <td className="py-1.5">
                      : <strong>{subject?.name || 'Mata Pelajaran Ujian'}</strong>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="py-1.5 font-semibold">3. Hari pelaksanaan / sesi</td>
                    <td className="py-1.5">
                      : Hari ke-{activeSession?.dayNumber} / Sesi {activeSession?.sessionNumber}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="py-1.5 font-semibold">4. Waktu pelaksanaan</td>
                    <td className="py-1.5">
                      : {activeSession?.startTime} s.d. {activeSession?.endTime} WIB ({activeSession?.durationMinutes}{' '}
                      menit)
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="py-1.5 font-semibold">5. Ruangan / laboratorium</td>
                    <td className="py-1.5">: {activeSession?.roomName}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-semibold">6. Rincian jumlah peserta</td>
                    <td className="py-1.5">
                      : a. Jumlah seharusnya terdaftar : <strong>{sessionStudents.length} orang</strong>
                      <br />
                      &nbsp;&nbsp;b. Jumlah hadir mengikuti ujian :{' '}
                      <strong>{submittedCount + inProgressCount} orang</strong>
                      <br />
                      &nbsp;&nbsp;c. Jumlah tidak hadir : <strong>{notStartedCount} orang</strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold">7. Daftar peserta yang tidak hadir</h4>
                {absentStudents.length > 0 ? (
                  <table className="w-full border border-slate-400 text-xs">
                    <thead className="border-b border-slate-400 bg-slate-100 font-semibold">
                      <tr>
                        <th className="w-10 border-r border-slate-400 p-1.5 text-center">No</th>
                        <th className="border-r border-slate-400 p-1.5 text-left">Nomor peserta</th>
                        <th className="border-r border-slate-400 p-1.5 text-left">Nama lengkap peserta</th>
                        <th className="border-r border-slate-400 p-1.5 text-center">Kelas</th>
                        <th className="p-1.5 text-left">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {absentStudents.map((std, idx) => (
                        <tr key={std.id} className="border-b border-slate-300">
                          <td className="border-r border-slate-400 p-1.5 text-center">{idx + 1}</td>
                          <td className="border-r border-slate-400 p-1.5 font-mono">{std.nomorPeserta}</td>
                          <td className="border-r border-slate-400 p-1.5">{std.name}</td>
                          <td className="border-r border-slate-400 p-1.5 text-center">{std.rombel || '9A'}</td>
                          <td className="p-1.5 text-slate-600">Tanpa keterangan</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="border border-slate-300 p-2 italic text-slate-700">
                    Nihil (seluruh {sessionStudents.length} peserta hadir dan mengikuti asesmen).
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold">8. Catatan selama pelaksanaan asesmen</h4>
                <p className="border border-slate-300 p-3 leading-relaxed">{beritaAcaraNotes}</p>
              </div>

              <p className="pt-2">
                Demikian berita acara pelaksanaan ujian ini dibuat dengan sesungguhnya dan penuh rasa tanggung jawab,
                dalam rangkap secukupnya untuk dipergunakan sebagaimana mestinya.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-8 pt-4 text-center text-xs">
              <div className="space-y-1">
                <p>Mengetahui,</p>
                <p className="font-semibold">Kepala {settings.schoolName}</p>
                <div className="flex h-20 items-center justify-center text-[11px] italic text-slate-300">
                  (Tanda tangan &amp; cap stempel resmi)
                </div>
                <p className="text-sm font-semibold underline">{kepsekName}</p>
                <p className="font-mono">NIP. {kepsekNip}</p>
              </div>

              <div className="space-y-1">
                <p>
                  {tempatTtd}, {todayLong}
                </p>
                <p className="font-semibold">Pengawas Ruang Ujian,</p>
                <div className="flex h-20 items-center justify-center text-[11px] italic text-slate-300">
                  (Tanda tangan pengawas)
                </div>
                <p className="text-sm font-semibold underline">{pengawasName}</p>
                <p className="font-mono">NIP. {pengawasNip}</p>
              </div>
            </div>
          </div>

          <div className="no-print flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
            <span className="text-xs text-slate-400">Dokumen dibuat oleh Neotest CBT</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setIsBeritaAcaraModalOpen(false)} className={outlineBtn}>
                Tutup
              </button>
              <button type="button" onClick={() => window.print()} className={primaryBtn}>
                <Printer className="h-4 w-4" aria-hidden="true" />
                <span>Cetak berita acara</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ===== Modal: cetak daftar hadir ===== */}
      {isDaftarHadirModalOpen && (
        <Modal labelledBy="dlg-daftar-hadir" wide>
          <div className="no-print flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <h2 id="dlg-daftar-hadir" className="text-base font-semibold text-slate-900">
                Daftar hadir peserta ujian
              </h2>
              <p className="text-sm text-slate-500">Dilengkapi kolom tanda tangan peserta dan pengawas.</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => window.print()} className={primaryBtn}>
                <Printer className="h-4 w-4" aria-hidden="true" />
                <span>Cetak / simpan PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDaftarHadirModalOpen(false)}
                aria-label="Tutup"
                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 ${focusRing}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="no-print grid grid-cols-1 gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="dh-pengawas" className="block text-xs text-slate-600">
                Pengawas ruang ujian
              </label>
              <input
                id="dh-pengawas"
                type="text"
                value={pengawasName}
                onChange={(e) => setPengawasName(e.target.value)}
                className={`${inputClass} h-9`}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="dh-pengawas-nip" className="block text-xs text-slate-600">
                NIP pengawas ruang
              </label>
              <input
                id="dh-pengawas-nip"
                type="text"
                value={pengawasNip}
                onChange={(e) => setPengawasNip(e.target.value)}
                className={`${inputClass} h-9 font-mono`}
              />
            </div>
          </div>

          <div className="print-container flex-1 overflow-y-auto bg-white p-6 text-slate-900 sm:p-10">
            {renderKop()}

            <div className="my-5 space-y-1 text-center">
              <h2 className="text-sm font-bold uppercase underline underline-offset-4 sm:text-base">
                Daftar Hadir Peserta Ujian Berbasis Komputer
              </h2>
              <p className="text-xs font-semibold uppercase">Neotest CBT Tingkat Sekolah Menengah Pertama (SMP)</p>
              <p className="text-xs text-slate-600">
                Tahun Pelajaran {settings.academicYear} — Semester {settings.semester.toUpperCase()}
              </p>
            </div>

            <div className="my-4 grid grid-cols-2 gap-x-6 gap-y-1 border border-slate-300 p-3 text-xs">
              <div>
                <span className="text-slate-500">Mata pelajaran:</span>{' '}
                <strong>{subject?.name}</strong>
              </div>
              <div>
                <span className="text-slate-500">Hari / tanggal:</span>{' '}
                <strong>
                  Hari ke-{activeSession?.dayNumber} (
                  {today.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  )
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Sesi pelaksanaan:</span>{' '}
                <strong>
                  Sesi {activeSession?.sessionNumber} ({activeSession?.startTime} - {activeSession?.endTime} WIB)
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Ruangan / lab:</span> <strong>{activeSession?.roomName}</strong>
              </div>
            </div>

            <table className="w-full border border-slate-400 text-xs">
              <thead className="border-b border-slate-400 bg-slate-100 font-semibold">
                <tr>
                  <th className="w-8 border-r border-slate-400 p-1.5 text-center">No</th>
                  <th className="w-28 border-r border-slate-400 p-1.5 text-center">No. peserta</th>
                  <th className="w-24 border-r border-slate-400 p-1.5 text-center">NISN</th>
                  <th className="border-r border-slate-400 p-1.5 text-left">Nama lengkap peserta</th>
                  <th className="w-16 border-r border-slate-400 p-1.5 text-center">Kelas</th>
                  <th className="w-24 border-r border-slate-400 p-1.5 text-center">Status</th>
                  <th className="w-36 p-1.5 text-left">Tanda tangan</th>
                </tr>
              </thead>
              <tbody>
                {sessionStudents.map((std, idx) => {
                  const att = sessionAttempts.find((a) => a.studentId === std.id);
                  const isPresent =
                    att &&
                    (att.status === 'IN_PROGRESS' ||
                      att.status === 'SUBMITTED' ||
                      att.status === 'AUTO_SUBMITTED');
                  const isOdd = (idx + 1) % 2 !== 0;

                  return (
                    <tr key={std.id} className="border-b border-slate-300">
                      <td className="border-r border-slate-400 p-1.5 text-center">{idx + 1}</td>
                      <td className="border-r border-slate-400 p-1.5 text-center font-mono">{std.nomorPeserta}</td>
                      <td className="border-r border-slate-400 p-1.5 text-center font-mono">{std.nisn || '-'}</td>
                      <td className="border-r border-slate-400 p-1.5">{std.name}</td>
                      <td className="border-r border-slate-400 p-1.5 text-center">{std.rombel || '9A'}</td>
                      <td className="border-r border-slate-400 p-1.5 text-center font-semibold">
                        {isPresent ? (
                          <span className="text-emerald-700">Hadir</span>
                        ) : (
                          <span className="text-slate-400">Belum</span>
                        )}
                      </td>
                      <td className="p-1.5 font-mono text-[11px] text-slate-500">
                        {isOdd ? `${idx + 1}. ....................` : `    ${idx + 1}. ....................`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-8 grid grid-cols-2 gap-8 pt-4 text-center text-xs">
              <div className="space-y-1">
                <p>Mengetahui,</p>
                <p className="font-semibold">Proktor Ruang Ujian,</p>
                <div className="flex h-16 items-center justify-center text-[11px] italic text-slate-300">
                  (Tanda tangan proktor)
                </div>
                <p className="font-semibold underline">{currentUser?.name || 'Rahmat Hidayat'}</p>
                <p className="font-mono text-slate-600">ID. {currentUser?.username || 'proktor'}</p>
              </div>

              <div className="space-y-1">
                <p>{todayLong}</p>
                <p className="font-semibold">Pengawas Ruang Ujian,</p>
                <div className="flex h-16 items-center justify-center text-[11px] italic text-slate-300">
                  (Tanda tangan pengawas)
                </div>
                <p className="font-semibold underline">{pengawasName}</p>
                <p className="font-mono text-slate-700">NIP. {pengawasNip}</p>
              </div>
            </div>
          </div>

          <div className="no-print flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
            <span className="text-xs text-slate-400">
              Total {sessionStudents.length} peserta terdaftar pada sesi ini
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setIsDaftarHadirModalOpen(false)} className={outlineBtn}>
                Tutup
              </button>
              <button type="button" onClick={() => window.print()} className={primaryBtn}>
                <Printer className="h-4 w-4" aria-hidden="true" />
                <span>Cetak daftar hadir</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};