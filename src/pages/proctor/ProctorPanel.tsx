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
  getIncidents,
  getSchoolSettings,
} from '../../services/storage';
import {
  MonitorCheck,
  KeyRound,
  RefreshCw,
  Users,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  FileText,
  Clock,
  RotateCcw,
  Shield,
  Layers,
  ChevronDown,
  Printer,
  FileCheck2,
  ClipboardCheck,
  X,
} from 'lucide-react';

export const ProctorPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const settings = getSchoolSettings();
  const sessions = getExamSessions();
  const subjects = getSubjects();
  const allStudents = getStudents();

  // Selected session (default first open session or session 1)
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    sessions.find(s => s.status === 'OPEN' || s.status === 'IN_PROGRESS')?.id || sessions[0]?.id || 'sesi-h1-s1'
  );

  const [attempts, setAttempts] = useState<ExamAttempt[]>(getExamAttempts());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'SUBMITTED' | 'NOT_STARTED'>('ALL');

  // Modals for Printable Documents
  const [isBeritaAcaraModalOpen, setIsBeritaAcaraModalOpen] = useState(false);
  const [isDaftarHadirModalOpen, setIsDaftarHadirModalOpen] = useState(false);

  // Signing authorities & report details
  const [pengawasName, setPengawasName] = useState('Budi Santoso, S.Pd.');
  const [pengawasNip, setPengawasNip] = useState('198406122008011005');
  const [kepsekName, setKepsekName] = useState(settings.headmasterName || 'Dra. Hj. Siti Nurhasanah, M.Pd.');
  const [kepsekNip, setKepsekNip] = useState(settings.headmasterNip || '197405121998022001');
  const [beritaAcaraNotes, setBeritaAcaraNotes] = useState('Pelaksanaan ujian berjalan dengan tertib, aman, dan lancar sesuai petunjuk teknis operasional asesmen.');

  // Incident report modal state
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentType, setIncidentType] = useState<IncidentReport['incidentType']>('GANTI_KOMPUTER');
  const [incidentNotes, setIncidentNotes] = useState('');
  const [incidentAction, setIncidentAction] = useState('');
  const [incidentStudentId, setIncidentStudentId] = useState('');

  // Notification flash message
  const [flashMessage, setFlashMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const activeSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];
  const subject = subjects.find(s => s.id === activeSession?.subjectId);

  // Filter students belonging to active session classes (e.g. 9A, 9B, 9C)
  const sessionStudents = allStudents.slice(0, activeSession?.maxCapacity || 120);

  // Refresh attempts periodically to simulate live monitoring
  useEffect(() => {
    const update = () => setAttempts(getExamAttempts());
    update();
    const timer = setInterval(update, 2000);
    return () => clearInterval(timer);
  }, [selectedSessionId]);

  const showFlash = (text: string, type: 'success' | 'info' = 'success') => {
    setFlashMessage({ text, type });
    setTimeout(() => setFlashMessage(null), 3000);
  };

  // Handler for refreshing start token
  const handleRefreshToken = () => {
    if (!activeSession) return;
    const newToken = refreshSessionStartToken(activeSession.id, currentUser?.name || 'Proktor');
    showFlash(`Token Mulai Baru Berhasil Dirilis: ${newToken}`);
  };

  // Handler for releasing submit token
  const handleReleaseSubmitToken = () => {
    if (!activeSession) return;
    const submitTok = generateSessionSubmitToken(activeSession.id, currentUser?.name || 'Proktor');
    showFlash(`Token Submit Berhasil Diterbitkan: ${submitTok}`);
  };

  // Handler for resetting student login
  const handleResetStudent = (student: User) => {
    if (confirm(`Izinkan reset login untuk siswa ${student.name} (${student.nomorPeserta})? Tindakan ini akan mengizinkan siswa menyambung kembali sesi ujian jika terjadi pemadaman atau kendala perangkat.`)) {
      resetStudentSession(activeSession.id, student.id, currentUser?.name || 'Proktor');
      showFlash(`Akses login untuk ${student.name} berhasil di-reset.`);
      setAttempts(getExamAttempts());
    }
  };

  // Handler for logging incident
  const handleSaveIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !incidentNotes.trim()) return;

    const std = allStudents.find(s => s.id === incidentStudentId);

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
    showFlash('Berita Acara Kejadian berhasil dicatat dalam audit log.', 'info');
  };

  // Count metrics for current session
  const sessionAttempts = attempts.filter(a => a.examSessionId === activeSession?.id);
  const inProgressCount = sessionAttempts.filter(a => a.status === 'IN_PROGRESS').length;
  const submittedCount = sessionAttempts.filter(a => a.status === 'SUBMITTED' || a.status === 'AUTO_SUBMITTED').length;
  const notStartedCount = sessionStudents.length - sessionAttempts.length;

  // Filtered participant list
  const filteredStudents = sessionStudents.filter(student => {
    const att = sessionAttempts.find(a => a.studentId === student.id);
    
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Flash Banner */}
      {flashMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            flashMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          <span>{flashMessage.text}</span>
          <button onClick={() => setFlashMessage(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* Top Session Control Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Neotest</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-sans">
                  Panel Proktor
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Pengawasan realtime hingga 120 peserta per sesi · Neotest CBT — {settings.schoolName}
            </p>
          </div>

          {/* Session Selector & Print Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-300">
              <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                Sesi:
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                {sessions.slice(0, 12).map(s => (
                  <option key={s.id} value={s.id}>
                    Hari ke-{s.dayNumber} · Sesi {s.sessionNumber} ({s.startTime} - {s.endTime}) · {s.roomName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsBeritaAcaraModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Cetak Berita Acara Ujian Resmi"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Cetak Berita Acara</span>
            </button>

            <button
              onClick={() => setIsDaftarHadirModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Cetak Daftar Hadir Peserta"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Cetak Daftar Hadir</span>
            </button>
          </div>
        </div>

        {/* Live Token Management Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          
          {/* Card 1: Token Mulai Ujian */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                Token Mulai Ujian
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                Aktif
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold font-mono text-blue-900 tracking-widest">
                {activeSession?.startToken || 'SMP100'}
              </span>
              <button
                onClick={handleRefreshToken}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                title="Rilis Token Baru"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rilis Baru</span>
              </button>
            </div>
            <p className="text-[10px] text-blue-600">
              *Umumkan token ini ke peserta di ruang ujian
            </p>
          </div>

          {/* Card 2: Token Submit / Selesai */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                Token Submit (Penyelesaian)
              </span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">
                Min. 45 Mnt
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold font-mono text-indigo-900 tracking-widest">
                {activeSession?.submitToken || 'FINABC'}
              </span>
              <button
                onClick={handleReleaseSubmitToken}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Terbitkan</span>
              </button>
            </div>
            <p className="text-[10px] text-indigo-600">
              *Berikan kepada siswa yang telah memenuhi syarat waktu
            </p>
          </div>

          {/* Card 3: Status Sesi & Ruangan */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <span className="text-xs text-slate-500 block">Informasi Ruang & Jadwal</span>
            <p className="text-sm font-bold text-slate-900">
              {activeSession?.roomName}
            </p>
            <div className="text-xs text-slate-600 space-y-0.5">
              <p>Mata Ujian: <strong>{subject?.name}</strong></p>
              <p>Waktu: {activeSession?.startTime} - {activeSession?.endTime} WIB</p>
            </div>
          </div>

          {/* Card 4: Action Dokumen & Berita Acara */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-2">
            <div>
              <span className="text-xs font-semibold text-slate-700 block flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Dokumen Resmi Ujian
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Cetak Berita Acara (ttd Pengawas & Kepsek) dan Daftar Hadir
              </p>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={() => setIsBeritaAcaraModalOpen(true)}
                className="py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer className="w-3 h-3" />
                <span>Berita Acara</span>
              </button>
              <button
                onClick={() => setIsDaftarHadirModalOpen(true)}
                className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer className="w-3 h-3" />
                <span>Daftar Hadir</span>
              </button>
            </div>
            <button
              onClick={() => setIsIncidentModalOpen(true)}
              className="w-full py-1 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>+ Catat Insiden Ruangan</span>
            </button>
          </div>

        </div>

      </div>

      {/* Real-time Metrics Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <p className="text-xs text-slate-500">Total Kuota Peserta</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{sessionStudents.length}</p>
          <span className="text-[11px] text-slate-400">Kapasitas Maks. 120 / sesi</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <p className="text-xs text-slate-500">Sedang Mengerjakan</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{inProgressCount}</p>
          <span className="text-[11px] text-blue-500">Siswa aktif terhubung</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <p className="text-xs text-slate-500">Sudah Selesai (Submit)</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{submittedCount}</p>
          <span className="text-[11px] text-emerald-500">Jawaban terkunci</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <p className="text-xs text-slate-500">Belum Login</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{notStartedCount}</p>
          <span className="text-[11px] text-amber-500">Menunggu masuk tes</span>
        </div>
      </div>

      {/* Participant List & Realtime Monitor */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        
        {/* Controls Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau nomor peserta..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({sessionStudents.length})
            </button>
            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === 'IN_PROGRESS' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mengerjakan ({inProgressCount})
            </button>
            <button
              onClick={() => setStatusFilter('SUBMITTED')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === 'SUBMITTED' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Selesai ({submittedCount})
            </button>
            <button
              onClick={() => setStatusFilter('NOT_STARTED')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === 'NOT_STARTED' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Belum Login ({notStartedCount})
            </button>
          </div>

        </div>

        {/* Table of Participants */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="p-3.5 w-12 text-center">No</th>
                <th className="p-3.5">Nomor Peserta</th>
                <th className="p-3.5">Nama Siswa</th>
                <th className="p-3.5">Kelas / Rombel</th>
                <th className="p-3.5 text-center">Status Pengerjaan</th>
                <th className="p-3.5 text-center">Terjawab</th>
                <th className="p-3.5">Sinkronisasi Terakhir</th>
                <th className="p-3.5 text-center">Pelanggaran</th>
                <th className="p-3.5 text-right">Aksi Proktor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.slice(0, 50).map((student, idx) => {
                const att = sessionAttempts.find(a => a.studentId === student.id);
                
                let statusBadge = (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                    Belum Login
                  </span>
                );

                if (att?.status === 'IN_PROGRESS') {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                      Mengerjakan
                    </span>
                  );
                } else if (att?.status === 'SUBMITTED' || att?.status === 'AUTO_SUBMITTED') {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      Telah Selesai
                    </span>
                  );
                }

                const answered = att ? Object.keys(att.answers).length : 0;
                const violations = att?.violationCount || 0;

                return (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">
                      {student.nomorPeserta}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900">{student.name}</td>
                    <td className="p-3.5 text-slate-600">{student.rombel || '9A'}</td>
                    <td className="p-3.5 text-center">{statusBadge}</td>
                    <td className="p-3.5 text-center font-bold text-slate-700">
                      {att ? `${answered} soal` : '-'}
                    </td>
                    <td className="p-3.5 text-slate-500 text-[11px]">
                      {att ? new Date(att.lastSyncAt).toLocaleTimeString('id-ID') : '-'}
                    </td>
                    <td className="p-3.5 text-center">
                      {violations > 0 ? (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold text-[10px]">
                          {violations}x
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {att && att.status !== 'SUBMITTED' ? (
                        <button
                          onClick={() => handleResetStudent(student)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[11px] font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Izinkan siswa melanjutkan kembali jika komputer restart atau mati lampu"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Login</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            Tidak ada peserta yang cocok dengan filter pencarian.
          </div>
        )}

      </div>

      {/* Incident Modal (Berita Acara) */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Catat Berita Acara Insiden Ujian
              </h3>
              <button
                onClick={() => setIsIncidentModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIncident} className="space-y-4 text-xs">
              
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Jenis Kejadian / Insiden:
                </label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="GANTI_KOMPUTER">Ganti Komputer / Restart PC Siswa</option>
                  <option value="LISTRIK_PADAM">Pemadaman Aliran Listrik</option>
                  <option value="JARINGAN_PUTUS">Gangguan Jaringan Server / Switch</option>
                  <option value="KECURANGAN">Dugaan Pelanggaran Integritas</option>
                  <option value="LAINNYA">Kejadian Khusus Lainnya</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Pilih Siswa Terkait (Opsional):
                </label>
                <select
                  value={incidentStudentId}
                  onChange={(e) => setIncidentStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="">-- Seluruh Ruangan (Kendala Umum) --</option>
                  {sessionStudents.slice(0, 30).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nomorPeserta} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Uraian Kejadian / Kronologi:
                </label>
                <textarea
                  rows={3}
                  value={incidentNotes}
                  onChange={(e) => setIncidentNotes(e.target.value)}
                  placeholder="Deskripsikan secara objektif peristiwa yang terjadi di ruang ujian..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tindakan Penanganan yang Dilakukan:
                </label>
                <input
                  type="text"
                  value={incidentAction}
                  onChange={(e) => setIncidentAction(e.target.value)}
                  placeholder="Contoh: Siswa dipindahkan ke PC cadangan nomor 12 dan diberikan reset login"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIncidentModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
                >
                  Simpan Berita Acara
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL CETAK BERITA ACARA PELAKSANAAN UJIAN (NEOTEST) */}
      {isBeritaAcaraModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[95vh] flex flex-col">
            
            {/* Modal Header & Quick Action Buttons (Hidden when printing) */}
            <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-blue-600" />
                  <span>Cetak Berita Acara Pelaksanaan Ujian (Neotest)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Dokumen resmi berita acara ditandatangani oleh Pengawas Ruang dan Kepala Sekolah
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen / Simpan PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBeritaAcaraModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form Editor Kolom Tanda Tangan & Catatan (Hidden when printing) */}
            <div className="no-print bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
              <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                Sesuaikan Identitas Tanda Tangan & Catatan:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Nama Pengawas Ruang:</label>
                  <input
                    type="text"
                    value={pengawasName}
                    onChange={(e) => setPengawasName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">NIP Pengawas Ruang:</label>
                  <input
                    type="text"
                    value={pengawasNip}
                    onChange={(e) => setPengawasNip(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Nama Kepala Sekolah:</label>
                  <input
                    type="text"
                    value={kepsekName}
                    onChange={(e) => setKepsekName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">NIP Kepala Sekolah:</label>
                  <input
                    type="text"
                    value={kepsekNip}
                    onChange={(e) => setKepsekNip(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Catatan Pelaksanaan Ujian:</label>
                <input
                  type="text"
                  value={beritaAcaraNotes}
                  onChange={(e) => setBeritaAcaraNotes(e.target.value)}
                  placeholder="Catatan kondisi ketertiban, keamanan, atau kejadian khusus..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Official Document Preview & Printable Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white border border-slate-300 rounded-xl shadow-inner text-slate-900 print-container">
              
              {/* Kop Surat Resmi */}
              <div className="text-center pb-2 border-b-4 border-double border-black space-y-1">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-lg font-mono">
                    N
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide">
                      PEMERINTAH DAERAH DINAS PENDIDIKAN
                    </h2>
                    <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wider">
                      {settings.schoolName}
                    </h1>
                  </div>
                </div>
                <p className="text-xs text-slate-700">
                  {settings.address} · NPSN: {settings.npsn} · Akreditasi A
                </p>
                <p className="text-[11px] text-slate-600 font-mono">
                  Sistem Asesmen Berbasis Komputer — Platform Neotest CBT
                </p>
              </div>

              {/* Judul Berita Acara */}
              <div className="text-center my-6 space-y-1">
                <h2 className="text-sm sm:text-base font-extrabold uppercase underline underline-offset-4 tracking-wide">
                  BERITA ACARA PELAKSANAAN UJIAN BERBASIS KOMPUTER
                </h2>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  NEOTEST CBT TINGKAT SEKOLAH MENENGAH PERTAMA (SMP)
                </p>
                <p className="text-xs font-semibold text-slate-600">
                  Tahun Pelajaran {settings.academicYear} — Semester {settings.semester.toUpperCase()}
                </p>
              </div>

              {/* Paragraf Pembuka */}
              <div className="text-xs leading-relaxed space-y-4 text-justify">
                <p>
                  Pada hari ini, <strong>{new Date().toLocaleDateString('id-ID', { weekday: 'long' })}</strong> tanggal{' '}
                  <strong>{new Date().getDate()}</strong> bulan{' '}
                  <strong>{new Date().toLocaleDateString('id-ID', { month: 'long' })}</strong> tahun{' '}
                  <strong>{new Date().getFullYear()}</strong>, bertempat di <strong>{settings.schoolName}</strong>, telah diselenggarakan Ujian Berbasis Komputer (Neotest CBT) dengan rincian data pelaksanaan sebagai berikut:
                </p>

                {/* Tabel Identitas Sesi */}
                <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 space-y-2">
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="py-1.5 font-semibold w-48">1. Satuan Pendidikan</td>
                        <td className="py-1.5">: {settings.schoolName} (NPSN: {settings.npsn})</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-1.5 font-semibold">2. Mata Pelajaran</td>
                        <td className="py-1.5">: <strong>{subject?.name || 'Mata Pelajaran Ujian'}</strong></td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-1.5 font-semibold">3. Hari Pelaksanaan / Sesi</td>
                        <td className="py-1.5">: Hari ke-{activeSession?.dayNumber} / Sesi {activeSession?.sessionNumber}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-1.5 font-semibold">4. Waktu Pelaksanaan</td>
                        <td className="py-1.5">: {activeSession?.startTime} s.d. {activeSession?.endTime} WIB ({activeSession?.durationMinutes} Menit)</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-1.5 font-semibold">5. Ruangan / Laboratorium</td>
                        <td className="py-1.5">: {activeSession?.roomName}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold">6. Rincian Jumlah Peserta</td>
                        <td className="py-1.5">
                          : a. Jumlah Seharusnya Terdaftar : <strong>{sessionStudents.length} Orang</strong>
                          <br />
                          &nbsp;&nbsp;b. Jumlah Hadir Mengikuti Ujian : <strong>{submittedCount + inProgressCount} Orang</strong>
                          <br />
                          &nbsp;&nbsp;c. Jumlah Tidak Hadir : <strong>{notStartedCount} Orang</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Catatan Peserta Tidak Hadir */}
                <div className="space-y-1.5 pt-1">
                  <h4 className="font-bold text-xs uppercase tracking-wide">
                    7. Daftar Peserta yang Tidak Hadir:
                  </h4>
                  {notStartedCount > 0 ? (
                    <table className="w-full text-xs border border-slate-300">
                      <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                        <tr>
                          <th className="p-1.5 text-center border-r border-slate-300 w-10">No</th>
                          <th className="p-1.5 text-left border-r border-slate-300">Nomor Peserta</th>
                          <th className="p-1.5 text-left border-r border-slate-300">Nama Lengkap Peserta</th>
                          <th className="p-1.5 text-center border-r border-slate-300">Kelas</th>
                          <th className="p-1.5 text-left">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessionStudents.slice(0, 5).map((std, idx) => (
                          <tr key={std.id} className="border-b border-slate-200">
                            <td className="p-1.5 text-center border-r border-slate-300">{idx + 1}</td>
                            <td className="p-1.5 font-mono border-r border-slate-300">{std.nomorPeserta}</td>
                            <td className="p-1.5 border-r border-slate-300">{std.name}</td>
                            <td className="p-1.5 text-center border-r border-slate-300">{std.rombel || '9A'}</td>
                            <td className="p-1.5 text-slate-600">Tanpa Keterangan / Sakit</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-slate-700 italic bg-slate-50 p-2 rounded border border-slate-200">
                      Nihil (Seluruh {sessionStudents.length} peserta hadir lengkap dan mengikuti asesmen).
                    </p>
                  )}
                </div>

                {/* Catatan Pelaksanaan / Integritas */}
                <div className="space-y-1.5 pt-1">
                  <h4 className="font-bold text-xs uppercase tracking-wide">
                    8. Catatan Selama Pelaksanaan Asesmen:
                  </h4>
                  <p className="p-3 bg-slate-50 border border-slate-300 rounded text-xs leading-relaxed">
                    {beritaAcaraNotes}
                  </p>
                </div>

                <p className="pt-2">
                  Demikian Berita Acara Pelaksanaan Ujian ini dibuat dengan sesungguhnya dan penuh rasa tanggung jawab dalam rangkap secukupnya untuk dipergunakan sebagaimana mestinya.
                </p>
              </div>

              {/* Kolom Tanda Tangan Resmi Pengawas & Kepala Sekolah */}
              <div className="mt-10 pt-4 grid grid-cols-2 gap-8 text-xs text-center">
                
                {/* Tanda Tangan Kiri: Kepala Sekolah */}
                <div className="space-y-1">
                  <p className="font-semibold text-slate-800">Mengetahui,</p>
                  <p className="font-bold text-slate-900">Kepala {settings.schoolName}</p>
                  <div className="h-20 flex items-center justify-center text-slate-300 italic text-[11px]">
                    (Tanda Tangan & Cap Stempel Resmi)
                  </div>
                  <p className="font-bold underline text-slate-900 text-sm">
                    {kepsekName}
                  </p>
                  <p className="font-mono text-slate-700 text-xs">
                    NIP. {kepsekNip}
                  </p>
                </div>

                {/* Tanda Tangan Kanan: Pengawas Ruang Ujian */}
                <div className="space-y-1">
                  <p className="text-slate-800">
                    Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="font-bold text-slate-900">Pengawas Ruang Ujian,</p>
                  <div className="h-20 flex items-center justify-center text-slate-300 italic text-[11px]">
                    (Tanda Tangan Pengawas)
                  </div>
                  <p className="font-bold underline text-slate-900 text-sm">
                    {pengawasName}
                  </p>
                  <p className="font-mono text-slate-700 text-xs">
                    NIP. {pengawasNip}
                  </p>
                </div>

              </div>

            </div>

            {/* Footer Modal Action (no-print) */}
            <div className="no-print flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Format Terstandar ANBK Kemendikbudristek & Neotest CBT
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBeritaAcaraModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Berita Acara</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. MODAL CETAK DAFTAR HADIR PESERTA UJIAN (NEOTEST) */}
      {isDaftarHadirModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[95vh] flex flex-col">
            
            {/* Modal Header & Quick Action Buttons (no-print) */}
            <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                  <span>Cetak Daftar Hadir Peserta Ujian (Neotest)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar hadir resmi peserta per sesi dilengkapi kolom tanda tangan peserta & pengawas
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen / Simpan PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDaftarHadirModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick edit pengawas info (no-print) */}
            <div className="no-print bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Pengawas Ruang Ujian:</label>
                <input
                  type="text"
                  value={pengawasName}
                  onChange={(e) => setPengawasName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">NIP Pengawas Ruang:</label>
                <input
                  type="text"
                  value={pengawasNip}
                  onChange={(e) => setPengawasNip(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>
            </div>

            {/* Official Printable Attendance List */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white border border-slate-300 rounded-xl shadow-inner text-slate-900 print-container">
              
              {/* Kop Surat Resmi */}
              <div className="text-center pb-2 border-b-4 border-double border-black space-y-1">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-lg font-mono">
                    N
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide">
                      PEMERINTAH DAERAH DINAS PENDIDIKAN
                    </h2>
                    <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wider">
                      {settings.schoolName}
                    </h1>
                  </div>
                </div>
                <p className="text-xs text-slate-700">
                  {settings.address} · NPSN: {settings.npsn}
                </p>
                <p className="text-[11px] text-slate-600 font-mono">
                  Sistem Asesmen Berbasis Komputer — Platform Neotest CBT
                </p>
              </div>

              {/* Judul Dokumen */}
              <div className="text-center my-5 space-y-0.5">
                <h2 className="text-sm sm:text-base font-extrabold uppercase underline underline-offset-4 tracking-wide">
                  DAFTAR HADIR PESERTA UJIAN BERBASIS KOMPUTER
                </h2>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  NEOTEST CBT TINGKAT SEKOLAH MENENGAH PERTAMA (SMP)
                </p>
                <p className="text-xs font-semibold text-slate-600">
                  Tahun Pelajaran {settings.academicYear} — Semester {settings.semester.toUpperCase()}
                </p>
              </div>

              {/* Informasi Sesi Ujian */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs border border-slate-300 bg-slate-50 p-3 rounded-lg my-4">
                <div>
                  <span className="text-slate-500">Mata Pelajaran:</span>{' '}
                  <strong className="text-slate-900">{subject?.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Hari / Tanggal:</span>{' '}
                  <strong className="text-slate-900">
                    Hari ke-{activeSession?.dayNumber} ({new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Sesi Pelaksanaan:</span>{' '}
                  <strong className="text-slate-900">
                    Sesi {activeSession?.sessionNumber} ({activeSession?.startTime} - {activeSession?.endTime} WIB)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Ruangan / Lab:</span>{' '}
                  <strong className="text-slate-900">{activeSession?.roomName}</strong>
                </div>
              </div>

              {/* Tabel Daftar Hadir Siswa */}
              <table className="w-full text-xs border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                  <tr>
                    <th className="p-1.5 text-center border-r border-slate-300 w-8">No</th>
                    <th className="p-1.5 text-center border-r border-slate-300 w-28">No. Peserta</th>
                    <th className="p-1.5 text-center border-r border-slate-300 w-24">NISN</th>
                    <th className="p-1.5 text-left border-r border-slate-300">Nama Lengkap Peserta</th>
                    <th className="p-1.5 text-center border-r border-slate-300 w-16">Kelas</th>
                    <th className="p-1.5 text-center border-r border-slate-300 w-24">Status</th>
                    <th className="p-1.5 text-left w-36">Tanda Tangan</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionStudents.map((std, idx) => {
                    const att = sessionAttempts.find(a => a.studentId === std.id);
                    const isPresent = att && (att.status === 'IN_PROGRESS' || att.status === 'SUBMITTED' || att.status === 'AUTO_SUBMITTED');
                    const isOdd = (idx + 1) % 2 !== 0;

                    return (
                      <tr key={std.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="p-1.5 text-center border-r border-slate-300">{idx + 1}</td>
                        <td className="p-1.5 font-mono text-center border-r border-slate-300">{std.nomorPeserta}</td>
                        <td className="p-1.5 font-mono text-center border-r border-slate-300">{std.nisn || '-'}</td>
                        <td className="p-1.5 border-r border-slate-300 font-medium">{std.name}</td>
                        <td className="p-1.5 text-center border-r border-slate-300">{std.rombel || '9A'}</td>
                        <td className="p-1.5 text-center border-r border-slate-300 font-semibold">
                          {isPresent ? (
                            <span className="text-emerald-700">HADIR</span>
                          ) : (
                            <span className="text-slate-400">BELUM</span>
                          )}
                        </td>
                        <td className="p-1.5 text-slate-500 font-mono text-[11px]">
                          {isOdd ? `${idx + 1}. ....................` : `    ${idx + 1}. ....................`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Tanda Tangan Pengawas & Proktor di bawah daftar hadir */}
              <div className="mt-8 pt-4 grid grid-cols-2 gap-8 text-xs text-center">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-800">Mengetahui,</p>
                  <p className="font-bold text-slate-900">Proktor Ruang Ujian,</p>
                  <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                    (Tanda Tangan Proktor)
                  </div>
                  <p className="font-bold underline text-slate-900">
                    {currentUser?.name || 'Rahmat Hidayat'}
                  </p>
                  <p className="font-mono text-slate-500 text-xs">
                    ID. {currentUser?.username || 'proktor'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-slate-800">
                    {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="font-bold text-slate-900">Pengawas Ruang Ujian,</p>
                  <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                    (Tanda Tangan Pengawas)
                  </div>
                  <p className="font-bold underline text-slate-900">
                    {pengawasName}
                  </p>
                  <p className="font-mono text-slate-700 text-xs">
                    NIP. {pengawasNip}
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer (no-print) */}
            <div className="no-print flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Total {sessionStudents.length} Peserta Terdaftar pada Sesi Ini
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDaftarHadirModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Daftar Hadir</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
