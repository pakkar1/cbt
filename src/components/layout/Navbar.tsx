import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSchoolSettings } from '../../services/storage';
import {
  GraduationCap,
  LogOut,
  UserCheck,
  Shield,
  Layers,
  MonitorCheck,
} from 'lucide-react';
import { Role } from '../../types';

interface NavbarProps {
  currentTab?: string;
  onNavigate?: (tab: string) => void;
  hideNavLinks?: boolean; // For exam room full focus
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, hideNavLinks = false }) => {
  const { currentUser, logout } = useAuth();
  const settings = getSchoolSettings();

  const roleLabels: Record<Role, string> = {
    super_admin: 'Super Admin',
    admin: 'Administrator CBT',
    guru: 'Guru Pengampu',
    proktor: 'Proktor Ruang Ujian',
    siswa: 'Peserta Ujian',
  };

  const roleIcons: Record<Role, React.ReactNode> = {
    super_admin: <Shield className="w-3.5 h-3.5 text-purple-600" />,
    admin: <Layers className="w-3.5 h-3.5 text-blue-600" />,
    guru: <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />,
    proktor: <MonitorCheck className="w-3.5 h-3.5 text-amber-600" />,
    siswa: <UserCheck className="w-3.5 h-3.5 text-sky-600" />,
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap block leading-tight">
                  Neotest
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 tracking-wide">
                  CBT
                </span>
              </div>
              <span className="text-xs text-slate-500 block truncate max-w-[200px] sm:max-w-xs">
                {settings.schoolName}
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation links (Hidden for Siswa, Proktor, and Guru for focused role experiences) */}
          {!hideNavLinks && onNavigate && currentUser && (
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              {currentUser.role === 'siswa' || currentUser.role === 'proktor' || currentUser.role === 'guru' ? null : (
                <>
                  <button
                    onClick={() => onNavigate('admin_dashboard')}
                    className={`whitespace-nowrap transition-colors hover:text-blue-600 py-1 ${
                      currentTab === 'admin_dashboard' ? 'text-blue-600 font-semibold border-b-2 border-blue-600' : ''
                    }`}
                  >
                    Ringkasan Utama
                  </button>
                  <button
                    onClick={() => onNavigate('bank_soal')}
                    className={`whitespace-nowrap transition-colors hover:text-blue-600 py-1 ${
                      currentTab === 'bank_soal' ? 'text-blue-600 font-semibold border-b-2 border-blue-600' : ''
                    }`}
                  >
                    Bank Soal (14 Mapel)
                  </button>
                  <button
                    onClick={() => onNavigate('paket_ujian')}
                    className={`whitespace-nowrap transition-colors hover:text-blue-600 py-1 ${
                      currentTab === 'paket_ujian' ? 'text-blue-600 font-semibold border-b-2 border-blue-600' : ''
                    }`}
                  >
                    Paket Ujian
                  </button>
                  <button
                    onClick={() => onNavigate('data_siswa')}
                    className={`whitespace-nowrap transition-colors hover:text-blue-600 py-1 ${
                      currentTab === 'data_siswa' ? 'text-blue-600 font-semibold border-b-2 border-blue-600' : ''
                    }`}
                  >
                    Peserta & Kartu
                  </button>
                  <button
                    onClick={() => onNavigate('hasil_analisis')}
                    className={`whitespace-nowrap transition-colors hover:text-blue-600 py-1 ${
                      currentTab === 'hasil_analisis' ? 'text-blue-600 font-semibold border-b-2 border-blue-600' : ''
                    }`}
                  >
                    Analisis Nilai
                  </button>
                </>
              )}
            </nav>
          )}

          {/* Zone 3: User Info & Secure Logout (NO ROLE SWITCHER) */}
          <div className="flex items-center gap-3 shrink-0">
            {currentUser && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg">
                  {roleIcons[currentUser.role]}
                  <span className="font-semibold text-slate-800">{currentUser.name}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500 font-medium">{roleLabels[currentUser.role]}</span>
                </div>

                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Keluar dari sesi"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
