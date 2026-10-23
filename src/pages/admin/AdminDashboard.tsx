import React from 'react';
import {
  getStudents,
  getSubjects,
  getExamPackages,
  getExamSessions,
  getExamAttempts,
  getQuestions,
  getSchoolSettings,
} from '../../services/storage';
import {
  Users,
  BookOpen,
  Calendar,
  Layers,
  CheckCircle,
  Clock,
  TrendingUp,
  FileCheck,
  Award,
  ArrowRight,
  ShieldCheck,
  Server,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const settings = getSchoolSettings();
  const students = getStudents();
  const subjects = getSubjects();
  const packages = getExamPackages();
  const sessions = getExamSessions();
  const attempts = getExamAttempts();
  const questions = getQuestions();

  const activeSessions = sessions.filter(s => s.status === 'OPEN' || s.status === 'IN_PROGRESS');
  const completedAttempts = attempts.filter(a => a.status === 'SUBMITTED' || a.status === 'AUTO_SUBMITTED');
  const inProgressAttempts = attempts.filter(a => a.status === 'IN_PROGRESS');

  return (
    <div className="space-y-8">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
            Sistem Asesmen Berbasis Komputer SMP
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Dashboard Pengendalian Ujian Sekolah
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tahun Ajaran {settings.academicYear} · Semester {settings.semester} · {settings.schoolName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('proctor_panel')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-2xs"
          >
            Monitoring Proktor Live
          </button>
          <button
            onClick={() => onNavigate('hasil_analisis')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-2xs"
          >
            Rekap Nilai Siswa
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Target Siswa Terdaftar</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
            {students.length} <span className="text-xs font-normal text-slate-400">/ 1.000</span>
          </p>
          <span className="text-[11px] text-slate-500">Kelas 7, 8, dan 9 SMP</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Mata Pelajaran Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
            {subjects.filter(s => s.isActive).length} <span className="text-xs font-normal text-slate-400">Mapel</span>
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">14 Mapel Lengkap</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Jadwal Sesi Ujian</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
            {sessions.length} <span className="text-xs font-normal text-slate-400">Sesi</span>
          </p>
          <span className="text-[11px] text-slate-500">13 Hari × 6 Sesi/Hari</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Bank Soal Tersedia</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
            {questions.length} <span className="text-xs font-normal text-slate-400">Butir</span>
          </p>
          <span className="text-[11px] text-slate-500">6 Format Soal Terstandar</span>
        </div>
      </div>

      {/* Real-time Assessment Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Session Distribution & Real-time Live Status */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Distribusi Kapasitas 78 Sesi Asesmen
              </h3>
              <p className="text-xs text-slate-500">
                Maksimal 120 peserta per sesi · Kapasitas total sistem: 9.360 peserta-slot
              </p>
            </div>
            <button
              onClick={() => onNavigate('jadwal_sesi')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Kelola Sesi
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Session Status Blocks */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500">Sesi Terbuka / Aktif</p>
              <p className="text-xl font-bold text-blue-600 mt-1 font-mono">{activeSessions.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500">Peserta Sedang Ujian</p>
              <p className="text-xl font-bold text-amber-600 mt-1 font-mono">{inProgressAttempts.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500">Ujian Telah Selesai</p>
              <p className="text-xl font-bold text-emerald-600 mt-1 font-mono">{completedAttempts.length}</p>
            </div>
          </div>

          {/* Day 1 - Day 13 matrix overview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Jadwal 13 Hari Pelaksanaan:</span>
              <span className="text-slate-400 font-normal">Klik untuk melihat detail per hari</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {Array.from({ length: 13 }).map((_, dIdx) => {
                const dayNum = dIdx + 1;
                const daySessions = sessions.filter(s => s.dayNumber === dayNum);
                const hasActive = daySessions.some(s => s.status === 'OPEN' || s.status === 'IN_PROGRESS');

                return (
                  <button
                    key={dayNum}
                    onClick={() => onNavigate('jadwal_sesi')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      hasActive
                        ? 'border-blue-500 bg-blue-50/70 text-blue-900 shadow-2xs font-bold'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className="text-[11px] block">Hari {dayNum}</span>
                    <span className="text-xs font-mono font-bold mt-0.5 block">6 Sesi</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Col: Quick Access Shortcuts & Architecture Specs */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Akses Cepat Pengelolaan
            </h3>
            
            <div className="space-y-2 text-xs">
              <button
                onClick={() => onNavigate('data_siswa')}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold">Import & Cetak Kartu Siswa</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('bank_soal')}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">Bank Soal & Stimulus ANBK</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('paket_ujian')}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold">Konfigurasi Paket Ujian</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('hasil_analisis')}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold">Koreksi Uraian & Analisis Butir</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('audit_log')}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-slate-600" />
                  <span className="font-semibold">Audit Log Integritas Keamanan</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* System Spec Information Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Server className="w-4 h-4 text-blue-600" />
              Karakteristik Arsitektur CBT SMP
            </div>
            <ul className="space-y-1.5 text-slate-600">
              <li>· <strong>Autosave:</strong> Debounced atomic write dengan recovery queue.</li>
              <li>· <strong>Timer:</strong> Server-authoritative countdown dengan auto-submit.</li>
              <li>· <strong>Token:</strong> Dual-layer Token Mulai & Token Submit.</li>
              <li>· <strong>Keamanan:</strong> Anti-tamper window detection & audit trail.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};
