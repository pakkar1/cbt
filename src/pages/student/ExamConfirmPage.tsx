import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ExamSession, ExamPackage } from '../../types';
import {
  getSubjects,
  getExamPackages,
  getSchoolSettings,
  addAuditLog,
  findSessionByToken,
} from '../../services/storage';
import {
  ShieldAlert,
  Clock,
  BookOpen,
  User,
  KeyRound,
  ArrowLeft,
  Play,
  CheckCircle2,
  MapPin,
} from 'lucide-react';

interface ExamConfirmPageProps {
  session: ExamSession;
  onConfirmStart: (token: string, confirmedSession?: ExamSession) => void;
  onCancel: () => void;
}

export const ExamConfirmPage: React.FC<ExamConfirmPageProps> = ({
  session,
  onConfirmStart,
  onCancel,
}) => {
  const { currentUser } = useAuth();
  const settings = getSchoolSettings();
  const subjects = getSubjects();
  const packages = getExamPackages();

  const [inputToken, setInputToken] = useState('');
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-detect target room session from token input
  const detectedSession = useMemo(() => {
    if (!inputToken || inputToken.trim().length < 4) return null;
    return findSessionByToken(inputToken.trim());
  }, [inputToken]);

  const activeTargetSession = detectedSession || session;
  const subject = subjects.find(s => s.id === activeTargetSession.subjectId);
  const pkg = packages.find(p => p.id === activeTargetSession.examPackageId);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const tokenClean = inputToken.trim().toUpperCase();
    if (!tokenClean) {
      setErrorMsg('Silakan masukkan Token Mulai Ujian dari proktor ruangan Anda.');
      return;
    }

    // Validate token: either directly matches current session OR matches another active room's session
    const resolvedSession = findSessionByToken(tokenClean) || 
      (tokenClean === session.startToken.toUpperCase() ? session : null);

    if (!resolvedSession) {
      setErrorMsg('Token Mulai tidak valid atau salah. Harap masukkan token yang dikeluarkan oleh Proktor di ruangan Anda (Ruang 1, Ruang 2, Ruang 3, atau Ruang 4).');
      addAuditLog(
        currentUser?.id || 'unknown',
        currentUser?.name || 'Siswa',
        'siswa',
        'Percobaan Token Mulai Gagal',
        'TOKEN',
        `Input token salah oleh siswa: ${tokenClean}`
      );
      return;
    }

    if (!agreementChecked) {
      setErrorMsg('Anda wajib mencentang persetujuan tata tertib asesmen.');
      return;
    }

    // Pass resolved session so student is strictly bound to the proctor's room
    onConfirmStart(tokenClean, resolvedSession);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Top Back Button */}
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda Peserta</span>
        </button>

        {/* Confirmation Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Card Header (Authentic ANBK Styling) */}
          <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold">Konfirmasi Data & Tes Peserta</h2>
              <p className="text-xs text-blue-100">
                {settings.schoolName} — Neotest CBT Terstandar
              </p>
            </div>
            <div className="px-3 py-1 rounded bg-blue-700/80 text-xs font-mono font-bold tracking-wider">
              SESI {session.sessionNumber}
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Student & Exam Details Table */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Nama Peserta:</span>
                  <strong className="text-slate-900 text-sm block mt-0.5">{currentUser?.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Nomor Peserta / NISN:</span>
                  <strong className="text-slate-900 font-mono text-sm block mt-0.5">
                    {currentUser?.nomorPeserta || 'P09-01-001'} / {currentUser?.nisn || '-'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Mata Pelajaran:</span>
                  <strong className="text-slate-800 block mt-0.5">{subject?.name || 'Mata Ujian'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Kelas & Ruangan:</span>
                  <span className="text-slate-800 font-medium block mt-0.5">
                    Kelas {currentUser?.rombel || '9A'} · <strong>{activeTargetSession.roomName}</strong>
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Alokasi Waktu:</span>
                  <span className="text-slate-800 font-semibold block mt-0.5">
                    {activeTargetSession.durationMinutes} Menit ({pkg?.questionIds.length || 8} Soal)
                  </span>
                </div>
              </div>
            </div>

            {/* Token Input Form */}
            <form onSubmit={handleStart} className="space-y-6">
              
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-5 space-y-3">
                <label htmlFor="token" className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  Masukkan Token Mulai Tes (Dari Proktor Ruangan):
                </label>

                <div className="relative">
                  <input
                    id="token"
                    type="text"
                    value={inputToken}
                    onChange={(e) => {
                      setInputToken(e.target.value.toUpperCase());
                      setErrorMsg('');
                    }}
                    placeholder="Ketik token dari proktor..."
                    maxLength={10}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl font-mono text-center text-xl font-bold tracking-widest text-slate-900 focus:border-blue-600 focus:outline-none transition-colors"
                    autoFocus
                  />
                </div>

                {/* Live multi-room detection banner */}
                {detectedSession ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Token terverifikasi untuk <strong>{detectedSession.roomName}</strong> (Proktor: {detectedSession.proctorName}). Anda otomatis terdaftar sebagai peserta di Ruang ini.
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    *<strong>Sistem Multi-Ruang:</strong> Masukkan token yang tertera di layar/papan tulis ruangan Anda (Ruang 1, Ruang 2, Ruang 3, atau Ruang 4). Sistem akan otomatis menghubungkan Anda ke proktor ruang tersebut.
                  </p>
                )}
              </div>

              {/* Agreement checkbox */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  id="agreement"
                  type="checkbox"
                  checked={agreementChecked}
                  onChange={(e) => setAgreementChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="agreement" className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none">
                  Saya menyatakan bahwa identitas yang tertera adalah benar milik saya, dan saya bersedia mematuhi tata tertib asesmen serta tidak melakukan kecurangan dalam bentuk apa pun.
                </label>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal / Kembali
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Mulai Mengerjakan Ujian</span>
                </button>
              </div>

            </form>

          </div>

        </div>

      </div>
    </div>
  );
};
