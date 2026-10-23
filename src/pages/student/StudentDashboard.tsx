import React, { useState, useEffect } from 'react';
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
  BookOpen,
  MapPin,
  Lock,
  User,
  LogOut,
  Calendar,
} from 'lucide-react';
import { ExamSession } from '../../types';

interface StudentDashboardProps {
  onStartExam: (session: ExamSession) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onStartExam }) => {
  const { currentUser, logout } = useAuth();
  const settings = getSchoolSettings();
  const sessions = getExamSessions();
  const packages = getExamPackages();
  const subjects = getSubjects();

  // Student class info
  const studentClass = currentUser?.rombel || currentUser?.kelas || '9A';
  const classGrade = studentClass.charAt(0); // e.g. '9'

  // Relevant sessions for student's class
  const relevantSessions = sessions.filter(s =>
    s.classes.some(c => c.startsWith(classGrade))
  );

  // Active / scheduled session for today or current period
  // Prioritize session with status 'OPEN' or 'IN_PROGRESS'
  const activeSession = relevantSessions.find(s => s.status === 'OPEN' || s.status === 'IN_PROGRESS')
    || relevantSessions.find(s => s.status === 'DRAFT')
    || null;

  const pkg = activeSession ? packages.find(p => p.id === activeSession.examPackageId) : null;
  const subject = activeSession ? subjects.find(s => s.id === activeSession.subjectId) : null;

  // Check if student already submitted this exam
  const existingAttempt = activeSession && currentUser
    ? getExamAttempt(currentUser.id, activeSession.id)
    : null;
  const isAlreadySubmitted = existingAttempt?.status === 'SUBMITTED' || existingAttempt?.status === 'AUTO_SUBMITTED';

  // Session time & status logic
  // A session is ready if proctor opened it ('OPEN' or 'IN_PROGRESS')
  const isSessionReady = activeSession && (activeSession.status === 'OPEN' || activeSession.status === 'IN_PROGRESS');

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-100">
      <div className="max-w-2xl w-full space-y-6">
        
        {/* Main Card: Tes Kemampuan Akademik Style */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Header */}
          <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">
                {settings.schoolName}
              </h1>
              <p className="text-xs text-blue-100">
                Neotest CBT · Konfirmasi Peserta & Jadwal Asesmen
              </p>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg bg-blue-700/80 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Keluar akun"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Bagian 1: Data Diri Siswa */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Data Diri Peserta Didik
              </h2>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nama Lengkap:</span>
                    <strong className="text-sm font-bold text-slate-900 block mt-0.5">
                      {currentUser?.name}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nomor Peserta Ujian:</span>
                    <strong className="text-sm font-mono font-bold text-blue-700 block mt-0.5">
                      {currentUser?.nomorPeserta || 'P09-01-001'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">NISN:</span>
                    <span className="font-mono font-semibold text-slate-800 block mt-0.5">
                      {currentUser?.nisn || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Kelas / Rombongan Belajar:</span>
                    <span className="font-semibold text-slate-800 block mt-0.5">
                      Kelas {currentUser?.rombel || currentUser?.kelas || '9A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bagian 2: Mata Pelajaran yang Diujikan */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Mata Pelajaran yang Diujikan
              </h2>

              {activeSession ? (
                <div className="bg-blue-50/60 rounded-xl border border-blue-200/80 p-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                        HARI KE-{activeSession.dayNumber} · SESI {activeSession.sessionNumber}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {activeSession.roomName}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mt-2">
                      {subject?.name || 'Mata Ujian Asesmen'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {pkg?.name || 'Paket Naskah Soal Terstandar'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-blue-200/50 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Waktu Ujian:</span>
                      <strong className="text-slate-800 font-semibold">
                        {activeSession.startTime} - {activeSession.endTime} WIB
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Alokasi Durasi:</span>
                      <strong className="text-slate-800 font-semibold">
                        {activeSession.durationMinutes} Menit
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Jumlah Butir Soal:</span>
                      <strong className="text-slate-800 font-semibold">
                        {pkg?.questionIds.length || 8} Butir
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                /* Jika tidak ada jadwal sama sekali */
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 text-center space-y-2 text-amber-900">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                  <h3 className="font-bold text-sm">Tidak Ada Jadwal Ujian Saat Ini</h3>
                  <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
                    Saat ini tidak ada sesi ujian yang dijadwalkan untuk kelas Anda. Silakan hubungi proktor atau panitia ujian sekolah jika Anda dijadwalkan mengikuti asesmen.
                  </p>
                </div>
              )}
            </div>

            {/* Bagian 3: Tombol Mulai Ujian */}
            <div className="pt-4 border-t border-slate-100">
              {isAlreadySubmitted ? (
                /* Jika sudah pernah submit */
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
                  <div className="inline-flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Anda Telah Menyelesaikan Ujian Ini</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    Jawaban Anda telah tersimpan secara resmi di server. Silakan klik tombol keluar agar komputer dapat digunakan oleh peserta sesi berikutnya.
                  </p>
                  <button
                    onClick={logout}
                    className="mt-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Keluar ke Halaman Awal
                  </button>
                </div>
              ) : activeSession ? (
                isSessionReady ? (
                  /* Tombol AKTIF jika sudah sesuai waktu dan sesi dibuka */
                  <div className="space-y-2">
                    <button
                      onClick={() => onStartExam(activeSession)}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer hover:shadow-lg"
                    >
                      <Play className="w-5 h-5 fill-white" />
                      <span>Mulai Ujian</span>
                    </button>
                    <p className="text-[11px] text-center text-slate-500">
                      *Klik Mulai Ujian untuk memverifikasi token dan memulai hitung mundur waktu resmi
                    </p>
                  </div>
                ) : (
                  /* Tombol TIDAK AKTIF / DISABLED jika belum waktunya */
                  <div className="space-y-3">
                    <button
                      disabled
                      className="w-full py-4 bg-slate-200 text-slate-400 font-bold text-base rounded-xl cursor-not-allowed flex items-center justify-center gap-2.5 border border-slate-300"
                    >
                      <Lock className="w-5 h-5 text-slate-400" />
                      <span>Mulai Ujian (Belum Waktunya)</span>
                    </button>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-800">
                      <strong>Sesi Ujian Belum Dimulai.</strong> Sesi ini dijadwalkan pada pukul <strong>{activeSession.startTime} - {activeSession.endTime} WIB</strong>. Harap menunggu proktor ruangan membuka sesi ujian.
                    </div>
                  </div>
                )
              ) : null}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
