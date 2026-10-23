import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getExamAttempts,
  getSubjects,
  getExamPackages,
  getSchoolSettings,
} from '../../services/storage';
import {
  Award,
  CheckCircle,
  Clock,
  ArrowLeft,
  FileCheck,
  AlertCircle,
} from 'lucide-react';

interface StudentResultsPageProps {
  onBack: () => void;
}

export const StudentResultsPage: React.FC<StudentResultsPageProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const settings = getSchoolSettings();
  const attempts = getExamAttempts();
  const subjects = getSubjects();
  const packages = getExamPackages();

  // Find completed attempts for current student
  const studentAttempts = attempts.filter(
    a => a.studentId === currentUser?.id && (a.status === 'SUBMITTED' || a.status === 'AUTO_SUBMITTED')
  );

  const getSubjectName = (subId?: string) => subjects.find(s => s.id === subId)?.name || 'Mata Pelajaran';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda Peserta</span>
        </button>

        <span className="text-xs text-slate-500 font-mono">
          {currentUser?.nomorPeserta} · {currentUser?.name}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Riwayat Nilai & Hasil Asesmen Peserta
        </h1>
        <p className="text-xs text-slate-500">
          Daftar ujian resmi yang telah Anda selesaikan di {settings.schoolName}
        </p>
      </div>

      {studentAttempts.length > 0 ? (
        <div className="space-y-4">
          {studentAttempts.map(att => {
            const pkg = packages.find(p => p.id === att.examPackageId);
            const sub = subjects.find(s => s.id === pkg?.subjectId);
            const scaled = att.maxScore ? (( (att.totalScore || 0) / att.maxScore ) * 100).toFixed(1) : '0';

            return (
              <div
                key={att.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {sub?.name || 'Asesmen Komprehensif'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {pkg?.name} · Sesi: <span className="font-mono">{att.examSessionId}</span>
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                      att.isPassed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {att.isPassed ? 'Memenuhi KKM' : 'Perlu Evaluasi Uraian'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block">Nilai Skala 100</span>
                    <strong className="text-xl font-extrabold text-blue-700 font-mono mt-1 block">
                      {scaled}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block">Skor Bobot</span>
                    <strong className="text-xl font-extrabold text-slate-900 font-mono mt-1 block">
                      {att.totalScore} / {att.maxScore}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block">Standar KKM</span>
                    <strong className="text-xl font-extrabold text-slate-700 font-mono mt-1 block">
                      {pkg?.kkm || 75}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block">Waktu Submit</span>
                    <span className="font-mono text-slate-700 mt-1 block font-semibold text-[11px]">
                      {att.finishedAt ? new Date(att.finishedAt).toLocaleTimeString('id-ID') : '-'}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">Belum Ada Riwayat Ujian yang Selesai</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Anda belum menyelesaikan sesi ujian apa pun. Silakan masuk ke Beranda Peserta untuk memulai sesi ujian yang sedang aktif.
          </p>
        </div>
      )}

    </div>
  );
};
