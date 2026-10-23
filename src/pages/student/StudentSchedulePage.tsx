import React, { useState } from 'react';
import {
  getExamSessions,
  getSubjects,
  getExamPackages,
  getSchoolSettings,
} from '../../services/storage';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Play,
  ArrowLeft,
} from 'lucide-react';
import { ExamSession } from '../../types';

interface StudentSchedulePageProps {
  onBack: () => void;
  onStartExam: (session: ExamSession) => void;
}

export const StudentSchedulePage: React.FC<StudentSchedulePageProps> = ({
  onBack,
  onStartExam,
}) => {
  const settings = getSchoolSettings();
  const sessions = getExamSessions();
  const subjects = getSubjects();
  const packages = getExamPackages();

  const [selectedDay, setSelectedDay] = useState<number>(1);

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Mata Ujian';
  const getPackageName = (id: string) => packages.find(p => p.id === id)?.name || 'Paket Asesmen';

  const daySessions = sessions.filter(s => s.dayNumber === selectedDay);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda Peserta</span>
        </button>

        <span className="text-xs text-slate-500">
          Total 78 Sesi · 13 Hari Pelaksanaan Asesmen
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Jadwal Lengkap 78 Sesi Asesmen Tingkat SMP
          </h1>
          <p className="text-xs text-slate-500">
            Asesmen Berbasis Komputer dilaksanakan dalam 6 sesi per hari selama 13 hari kalender
          </p>
        </div>

        {/* Day selection */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-xs">
          {Array.from({ length: 13 }).map((_, dIdx) => {
            const dNum = dIdx + 1;
            const isSel = selectedDay === dNum;
            const hasOpen = sessions.filter(s => s.dayNumber === dNum && s.status === 'OPEN').length > 0;

            return (
              <button
                key={dNum}
                onClick={() => setSelectedDay(dNum)}
                className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Hari {dNum}</span>
                {hasOpen && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of 6 Sessions for Selected Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {daySessions.map(session => {
          const isOpen = session.status === 'OPEN';

          return (
            <div
              key={session.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs space-y-4 transition-all ${
                isOpen ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-800">
                  SESI {session.sessionNumber}
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    session.status === 'OPEN'
                      ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                      : session.status === 'COMPLETED'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {session.status === 'OPEN' ? 'Sedang Dibuka' : 'Terjadwal'}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base line-clamp-1">
                  {getSubjectName(session.subjectId)}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {getPackageName(session.examPackageId)}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    Waktu Ujian
                  </span>
                  <span className="font-semibold text-slate-800">{session.startTime} - {session.endTime} WIB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    Ruang Lab CBT
                  </span>
                  <span className="font-semibold text-slate-800">{session.roomName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Proktor Ruangan</span>
                  <span className="font-semibold text-slate-800">{session.proctorName}</span>
                </div>
              </div>

              {isOpen && (
                <button
                  onClick={() => onStartExam(session)}
                  className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Masuk Ujian Sesi Ini</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
