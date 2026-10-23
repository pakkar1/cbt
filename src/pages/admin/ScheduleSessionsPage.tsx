import React, { useState } from 'react';
import { ExamSession } from '../../types';
import {
  getExamSessions,
  saveExamSession,
  getSubjects,
  getExamPackages,
  getStaffUsers,
  refreshSessionStartToken,
} from '../../services/storage';
import {
  Calendar,
  Clock,
  Layers,
  MapPin,
  UserCheck,
  CheckCircle,
  Play,
  RotateCcw,
  Edit2,
  Filter,
  KeyRound,
  Shield,
} from 'lucide-react';

export const ScheduleSessionsPage: React.FC = () => {
  const subjects = getSubjects();
  const packages = getExamPackages();
  const proctors = getStaffUsers().filter(u => u.role === 'proktor');

  const [sessions, setSessions] = useState<ExamSession[]>(getExamSessions());
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [editingSession, setEditingSession] = useState<ExamSession | null>(null);

  const reload = () => setSessions(getExamSessions());

  // Filter sessions for the selected day (1 to 13)
  const daySessions = sessions.filter(s => s.dayNumber === selectedDay);

  const handleStatusChange = (session: ExamSession, newStatus: ExamSession['status']) => {
    const updated = { ...session, status: newStatus };
    saveExamSession(updated);
    reload();
  };

  const handleRefreshToken = (session: ExamSession) => {
    refreshSessionStartToken(session.id, 'Administrator');
    reload();
  };

  const getSubjectName = (subId: string) => subjects.find(s => s.id === subId)?.name || 'Mata Pelajaran';
  const getPackageName = (pkgId: string) => packages.find(p => p.id === pkgId)?.name || 'Paket Soal';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Pengelolaan Jadwal 78 Sesi Asesmen
          </h1>
          <p className="text-xs text-slate-500">
            13 Hari Pelaksanaan × 6 Sesi per Hari · Kapasitas Maks. 120 Peserta/Sesi (9.360 Peserta-Slot)
          </p>
        </div>
      </div>

      {/* Day Selector Strip (Day 1 - 13) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Pilih Hari Pelaksanaan Asesmen (1 - 13):
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Menampilkan 6 Sesi di Hari Ke-{selectedDay}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {Array.from({ length: 13 }).map((_, dIdx) => {
            const dayNum = dIdx + 1;
            const isSelected = selectedDay === dayNum;
            const countActive = sessions.filter(s => s.dayNumber === dayNum && (s.status === 'OPEN' || s.status === 'IN_PROGRESS')).length;

            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDay(dayNum)}
                className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Hari {dayNum}</span>
                {countActive > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6 Sessions for Selected Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {daySessions.map(session => {
          const isLive = session.status === 'OPEN' || session.status === 'IN_PROGRESS';

          return (
            <div
              key={session.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs space-y-4 transition-all ${
                isLive ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
              }`}
            >
              {/* Session Top Bar */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800">
                  SESI {session.sessionNumber}
                </span>

                <div className="flex items-center gap-2">
                  <select
                    value={session.status}
                    onChange={(e) => handleStatusChange(session, e.target.value as any)}
                    className="text-[11px] font-bold px-2 py-1 rounded border border-slate-300 bg-slate-50 focus:outline-none"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="OPEN">Terbuka (Buka Sesi)</option>
                    <option value="IN_PROGRESS">Sedang Berjalan</option>
                    <option value="COMPLETED">Selesai</option>
                    <option value="SUSPENDED">Ditangguhkan</option>
                  </select>
                </div>
              </div>

              {/* Subject & Package */}
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm line-clamp-1">
                  {getSubjectName(session.subjectId)}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {getPackageName(session.examPackageId)}
                </p>
              </div>

              {/* Details List */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    Waktu
                  </span>
                  <span className="font-semibold text-slate-800">{session.startTime} - {session.endTime} ({session.durationMinutes} m)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    Ruang Lab
                  </span>
                  <span className="font-semibold text-slate-800">{session.roomName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <UserCheck className="w-3.5 h-3.5" />
                    Proktor
                  </span>
                  <span className="font-semibold text-slate-800">{session.proctorName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Kapasitas Maks</span>
                  <span className="font-bold text-slate-900">{session.maxCapacity} Siswa</span>
                </div>
              </div>

              {/* Token Strip */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between bg-slate-50 -mx-5 -mb-5 p-4 rounded-b-2xl">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">
                    Token Mulai:
                  </span>
                  <span className="font-mono text-sm font-extrabold text-blue-900 tracking-wider">
                    {session.startToken}
                  </span>
                </div>
                <button
                  onClick={() => handleRefreshToken(session)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-100/60 rounded transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
