import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getExamSessions,
  getExamPackages,
  getSubjects,
  getExamAttempt,
  getSchoolSettings,
} from '../../services/storage';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Lock,
  LogOut,
} from 'lucide-react';
import { ExamSession } from '../../types';

interface StudentDashboardProps {
  onStartExam: (session: ExamSession) => void;
}

// Baris data berpasangan label : nilai
const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-0.5 py-3 sm:grid sm:grid-cols-[11rem_1fr] sm:items-baseline sm:gap-4">
    <dt className="text-sm text-slate-500">{label}</dt>
    <dd className="text-sm font-medium text-slate-900">{children}</dd>
  </div>
);

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onStartExam }) => {
  const { currentUser, logout } = useAuth();
  const settings = getSchoolSettings() as unknown as Record<string, unknown> | undefined;
  const sessions = getExamSessions();
  const packages = getExamPackages();
  const subjects = getSubjects();

  // Nama sekolah dari pengaturan; fallback bila field berbeda/kosong
  const schoolName =
    (typeof settings?.schoolName === 'string' && settings.schoolName) ||
    (typeof settings?.namaSekolah === 'string' && settings.namaSekolah) ||
    'SMP Negeri 13 Surabaya';

  // Student class info
  const studentClass = currentUser?.rombel || currentUser?.kelas || '9A';
  const classGrade = studentClass.charAt(0); // e.g. '9'

  // Relevant sessions for student's class
  const relevantSessions = sessions.filter((s) =>
    s.classes.some((c) => c.startsWith(classGrade))
  );

  // Active / scheduled session for today or current period
  // Prioritize session with status 'OPEN' or 'IN_PROGRESS'
  const activeSession =
    relevantSessions.find((s) => s.status === 'OPEN' || s.status === 'IN_PROGRESS') ||
    relevantSessions.find((s) => s.status === 'DRAFT') ||
    null;

  const pkg = activeSession ? packages.find((p) => p.id === activeSession.examPackageId) : null;
  const subject = activeSession ? subjects.find((s) => s.id === activeSession.subjectId) : null;

  // Check if student already submitted this exam
  const existingAttempt =
    activeSession && currentUser ? getExamAttempt(currentUser.id, activeSession.id) : null;
  const isAlreadySubmitted =
    existingAttempt?.status === 'SUBMITTED' || existingAttempt?.status === 'AUTO_SUBMITTED';

  // A session is ready if proctor opened it ('OPEN' or 'IN_PROGRESS')
  const isSessionReady =
    activeSession && (activeSession.status === 'OPEN' || activeSession.status === 'IN_PROGRESS');

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] flex-col bg-slate-100 px-4">
      <main className="flex flex-1 items-center justify-center py-8 sm:py-10">
        <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {/* Header kartu */}
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Konfirmasi Data Peserta</h1>
              <p className="mt-1 text-sm text-slate-500">
                Periksa data Anda dan mata ujian sebelum memulai.
              </p>
            </div>
          </header>

          <div className="space-y-8 px-6 py-6 sm:px-8">
            {/* Data peserta */}
            <section aria-labelledby="sec-peserta">
              <h2 id="sec-peserta" className="text-sm font-semibold text-blue-700">
                Data peserta
              </h2>
              <dl className="mt-1 divide-y divide-slate-100">
                <InfoRow label="Nama lengkap">{currentUser?.name || '-'}</InfoRow>
                <InfoRow label="Nomor peserta">
                  <span className="font-mono">{currentUser?.nomorPeserta || '-'}</span>
                </InfoRow>
                <InfoRow label="NISN">
                  <span className="font-mono">{currentUser?.nisn || '-'}</span>
                </InfoRow>
                <InfoRow label="Kelas">Kelas {studentClass}</InfoRow>
                <InfoRow label="Sekolah">{schoolName}</InfoRow>
              </dl>
            </section>

            {/* Mata ujian */}
            <section aria-labelledby="sec-ujian">
              <h2 id="sec-ujian" className="text-sm font-semibold text-blue-700">
                Mata ujian
              </h2>

              {activeSession ? (
                <div className="mt-3 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {subject?.name || 'Mata Ujian Asesmen'}
                      </h3>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {pkg?.name || 'Paket naskah soal terstandar'}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        isSessionReady
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                          : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-300'
                      }`}
                    >
                      {isSessionReady ? 'Sesi dibuka' : 'Menunggu dibuka'}
                    </span>
                  </div>

                  <dl className="divide-y divide-slate-100 px-4">
                    <InfoRow label="Hari / sesi">
                      Hari ke-{activeSession.dayNumber}, Sesi {activeSession.sessionNumber}
                    </InfoRow>
                    <InfoRow label="Ruang ujian">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-blue-800">{activeSession.roomName}</span>
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-normal text-blue-700">
                          Multi-Ruang: otomatis diarahkan sesuai Token Proktor Ruang Anda
                        </span>
                      </div>
                    </InfoRow>
                    <InfoRow label="Waktu">
                      {activeSession.startTime} – {activeSession.endTime} WIB
                    </InfoRow>
                    <InfoRow label="Durasi">{activeSession.durationMinutes} menit</InfoRow>
                    <InfoRow label="Jumlah soal">{pkg?.questionIds.length ?? '-'} butir</InfoRow>
                  </dl>
                </div>
              ) : (
                <div className="mt-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold">Belum ada jadwal ujian</h3>
                    <p className="mt-1 text-sm leading-relaxed text-amber-800">
                      Tidak ada sesi ujian yang dijadwalkan untuk kelas Anda saat ini. Hubungi proktor
                      atau panitia ujian sekolah jika Anda seharusnya mengikuti asesmen.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Aksi */}
          {(isAlreadySubmitted || activeSession) && (
            <footer className="border-t border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
              {isAlreadySubmitted ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Ujian ini sudah selesai</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        Jawaban Anda sudah tersimpan di server. Keluar agar komputer dapat dipakai
                        peserta sesi berikutnya.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="h-10 shrink-0 cursor-pointer rounded-md bg-blue-700 px-5 text-sm font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  >
                    Keluar
                  </button>
                </div>
              ) : activeSession && isSessionReady ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => onStartExam(activeSession)}
                    className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-700 text-sm font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  >
                    <Play className="h-4 w-4 fill-white" aria-hidden="true" />
                    <span>Mulai ujian</span>
                  </button>
                  <p className="text-center text-xs text-slate-500">
                    Waktu pengerjaan mulai dihitung setelah Anda menekan tombol ini.
                  </p>
                </div>
              ) : activeSession ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    disabled
                    className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-slate-300 bg-slate-200 text-sm font-semibold text-slate-500"
                  >
                    <Lock className="h-4 w-4" aria-hidden="true" />
                    <span>Mulai ujian</span>
                  </button>
                  <p className="flex items-start justify-center gap-1.5 text-center text-xs leading-relaxed text-slate-600">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      Sesi dijadwalkan pukul {activeSession.startTime} – {activeSession.endTime} WIB.
                      Tunggu proktor membuka sesi.
                    </span>
                  </p>
                </div>
              ) : null}
            </footer>
          )}
        </div>
      </main>

      <footer className="pb-5 text-center text-xs text-slate-400">Neotest CBT · {schoolName}</footer>
    </div>
  );
};