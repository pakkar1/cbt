import React, { useState } from 'react';
import { useAuth, PortalType } from '../../context/AuthContext';
import { getSchoolSettings } from '../../services/storage';
import {
  GraduationCap,
  Lock,
  User,
  Shield,
  MonitorCheck,
  AlertCircle,
  ArrowRight,
  BookOpen,
  KeyRound,
} from 'lucide-react';

interface LoginPageProps {
  portal: PortalType;
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ portal, onLoginSuccess }) => {
  const { login } = useAuth();
  const settings = getSchoolSettings();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Portal-specific visual identity & headings
  const portalConfig = {
    siswa: {
      badge: 'Portal Peserta Ujian Siswa',
      badgeClass: 'bg-blue-100 text-blue-800',
      icon: <GraduationCap className="w-8 h-8 text-white" />,
      iconBg: 'bg-blue-600',
      title: 'Login Asesmen Peserta Didik',
      subtitle: `Neotest CBT — ${settings.schoolName}`,
      userLabel: 'Nomor Peserta Ujian / NISN',
      userPlaceholder: 'Contoh: P09-01-001 atau 0091000001',
      passLabel: 'Password / PIN Peserta',
      passPlaceholder: 'Masukkan password yang tertera di kartu peserta',
      buttonText: 'Masuk Ruang Asesmen Siswa',
      notice: 'Pastikan Anda telah menerima Kartu Peserta Ujian dari panitia sekolah. Dilarang membagikan kredensial login kepada peserta lain.',
    },
    proktor: {
      badge: 'Portal Khusus Proktor Ruang Lab',
      badgeClass: 'bg-amber-100 text-amber-800',
      icon: <MonitorCheck className="w-8 h-8 text-white" />,
      iconBg: 'bg-amber-600',
      title: 'Login Proktor & Pengawas CBT',
      subtitle: 'Neotest CBT — Monitoring Ruang Ujian & Berita Acara',
      userLabel: 'ID / Username Proktor',
      userPlaceholder: 'Masukkan username proktor',
      passLabel: 'Password Pengawas',
      passPlaceholder: 'Masukkan kata sandi proktor',
      buttonText: 'Buka Monitoring Sesi Lab',
      notice: 'Hanya proktor dan pengawas ruang ujian resmi yang berhak mengakses sistem ini.',
    },
    guru: {
      badge: 'Portal Guru Pengampu Mapel',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      icon: <BookOpen className="w-8 h-8 text-white" />,
      iconBg: 'bg-emerald-600',
      title: 'Login Guru Pengampu Mata Pelajaran',
      subtitle: 'Pengelolaan Bank Soal & Koreksi Rubrik Uraian Siswa',
      userLabel: 'NIP / Username Guru',
      userPlaceholder: 'Masukkan NIP atau username guru',
      passLabel: 'Password Akun Guru',
      passPlaceholder: 'Masukkan kata sandi guru',
      buttonText: 'Masuk Panel Guru Pengampu',
      notice: 'Akses terbatas untuk dewan guru pengampu 14 mata pelajaran SMP terdaftar.',
    },
    admin: {
      badge: 'Portal Administrator CBT',
      badgeClass: 'bg-indigo-100 text-indigo-800',
      icon: <Shield className="w-8 h-8 text-white" />,
      iconBg: 'bg-indigo-600',
      title: 'Login Administrator CBT Sekolah',
      subtitle: 'Manajemen Data Siswa, Paket Ujian & Penjadwalan 78 Sesi',
      userLabel: 'ID Administrator CBT',
      userPlaceholder: 'Masukkan ID administrator',
      passLabel: 'Password Administrator',
      passPlaceholder: 'Masukkan kata sandi administrator',
      buttonText: 'Masuk Panel Administrator',
      notice: 'Area administrasi internal. Setiap aktivitas pengelolaan sistem dicatat dalam audit trail keamanan.',
    },
    superadmin: {
      badge: 'Security Gateway Master',
      badgeClass: 'bg-purple-100 text-purple-800',
      icon: <KeyRound className="w-8 h-8 text-white" />,
      iconBg: 'bg-purple-700',
      title: 'Super Administrator Gateway',
      subtitle: 'Otorisasi Konfigurasi Inti, Pengaturan Global & Audit Log',
      userLabel: 'Master Username',
      userPlaceholder: 'Masukkan username super admin',
      passLabel: 'Master Security Key',
      passPlaceholder: 'Masukkan kunci akses keamanan',
      buttonText: 'Otorisasi Akses Super Admin',
      notice: 'Pintu masuk dengan hak akses tertinggi. Akses diawasi dan diverifikasi secara berkala.',
    },
  }[portal];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = login(username, password, portal);
    if (res.success) {
      onLoginSuccess();
    } else {
      setErrorMsg(res.error || 'Kredensial tidak valid untuk portal ini.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className={`w-16 h-16 rounded-2xl ${portalConfig.iconBg} flex items-center justify-center mx-auto shadow-md`}>
          {portalConfig.icon}
        </div>
        
        <div className="space-y-1">
          <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider ${portalConfig.badgeClass}`}>
            {portalConfig.badge}
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 pt-1">
            {portalConfig.title}
          </h2>
          <p className="text-xs text-slate-500">
            {portalConfig.subtitle}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10 space-y-6">
          
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                {portalConfig.userLabel}:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={portalConfig.userPlaceholder}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 font-medium text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                {portalConfig.passLabel}:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={portalConfig.passPlaceholder}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 font-medium text-xs"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-3 ${portalConfig.iconBg} hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs`}
            >
              <span>{portalConfig.buttonText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {portal === 'guru' && (
              <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Uji Coba Cepat Kredensial Guru:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('guru');
                      setPassword('guru');
                    }}
                    className="p-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-left cursor-pointer transition-colors"
                  >
                    <span className="font-bold text-purple-900 block text-[11px]">1. Guru Pembuat Soal</span>
                    <span className="text-[10px] text-purple-700 block">Username: guru (IPA)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('gurubiasa');
                      setPassword('guru');
                    }}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-left cursor-pointer transition-colors"
                  >
                    <span className="font-bold text-emerald-900 block text-[11px]">2. Guru Biasa (Unduh Nilai)</span>
                    <span className="text-[10px] text-emerald-700 block">Username: gurubiasa (9A, 9B)</span>
                  </button>
                </div>
              </div>
            )}

          </form>

          {/* Security Notice */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
            {portalConfig.notice}
          </div>

        </div>
      </div>

    </div>
  );
};
