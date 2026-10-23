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
  BookOpen,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';

interface LoginPageProps {
  portal: PortalType;
  onLoginSuccess: () => void;
}

interface PortalConfig {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  userLabel: string;
  userPlaceholder: string;
  passLabel: string;
  passPlaceholder: string;
  notice: string;
}

const iconClass = 'h-6 w-6';

const PORTALS: Record<PortalType, PortalConfig> = {
  siswa: {
    icon: <GraduationCap className={iconClass} />,
    title: 'Login Peserta Didik',
    subtitle: 'Asesmen Digital Berbasis Komputer',
    userLabel: 'Nomor Peserta / NISN',
    userPlaceholder: 'Contoh: P09-01-001 atau 0091000001',
    passLabel: 'Password',
    passPlaceholder: 'Masukkan password',
    notice: 'Powered by Pakkar.',
  },
  proktor: {
    icon: <MonitorCheck className={iconClass} />,
    title: 'Login Proktor & Pengawas',
    subtitle: 'Monitoring Ruang Ujian & Berita Acara',
    userLabel: 'Username Proktor',
    userPlaceholder: 'Masukkan username proktor',
    passLabel: 'Password',
    passPlaceholder: 'Masukkan password',
    notice: 'Powered by Pakkar.',
  },
  guru: {
    icon: <BookOpen className={iconClass} />,
    title: 'Login Guru Mata Pelajaran',
    subtitle: 'Bank Soal & Koreksi Uraian',
    userLabel: 'NIP / Username',
    userPlaceholder: 'Masukkan NIP atau username',
    passLabel: 'Password',
    passPlaceholder: 'Masukkan password',
    notice: 'Powered by Pakkar.',
  },
  admin: {
    icon: <Shield className={iconClass} />,
    title: 'Login Administrator',
    subtitle: 'Data Siswa, Paket Ujian & Penjadwalan',
    userLabel: 'ID Administrator',
    userPlaceholder: 'Masukkan ID administrator',
    passLabel: 'Password',
    passPlaceholder: 'Masukkan password',
    notice: 'Powered by Pakkar.',
  },
  superadmin: {
    icon: <KeyRound className={iconClass} />,
    title: 'Login Super Administrator',
    subtitle: 'Konfigurasi Inti, Pengaturan Global & Audit Log',
    userLabel: 'Username',
    userPlaceholder: 'Masukkan username super admin',
    passLabel: 'Security Key',
    passPlaceholder: 'Masukkan kunci akses',
    notice: 'Powered by Pakkar.',
  },
};

const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 ' +
  'transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20';

export const LoginPage: React.FC<LoginPageProps> = ({ portal, onLoginSuccess }) => {
  const { login } = useAuth();
  const settings = getSchoolSettings() as unknown as Record<string, unknown> | undefined;

  // Nama sekolah dari pengaturan; fallback bila field berbeda/kosong
  const schoolName =
    (typeof settings?.schoolName === 'string' && settings.schoolName) ||
    (typeof settings?.namaSekolah === 'string' && settings.namaSekolah) ||
    'SMP Negeri 13 Surabaya';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cfg = PORTALS[portal];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await login(username.trim(), password, portal);
      if (res.success) {
        onLoginSuccess();
      } else {
        setErrorMsg(res.error || 'Username atau password tidak sesuai untuk portal ini.');
      }
    } catch {
      setErrorMsg('Terjadi kendala saat masuk. Coba lagi beberapa saat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(e.getModifierState('CapsLock'));
  };

  const fillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-slate-100 px-4">
      <main className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-sm">
          <div className="rounded-lg border border-slate-200 bg-white px-7 py-8 shadow-sm">
            {/* Identitas */}
            <div className="mb-7 text-center">
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                {cfg.icon}
              </span>
              <p className="text-xs text-slate-500">{schoolName}</p>
              <h1 className="mt-1 text-xl font-semibold text-slate-900">{cfg.title}</h1>
              <p className="mt-1 text-sm text-slate-500">{cfg.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <label htmlFor="login-username" className="block text-sm font-medium text-slate-700">
                  {cfg.userLabel}
                </label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={cfg.userPlaceholder}
                    autoComplete="username"
                    autoFocus
                    required
                    className={`${inputClass} pl-9 pr-3`}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
                  {cfg.passLabel}
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={handleCapsLock}
                    onKeyDown={handleCapsLock}
                    onBlur={() => setCapsLockOn(false)}
                    placeholder={cfg.passPlaceholder}
                    autoComplete="current-password"
                    required
                    className={`${inputClass} pl-9 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    aria-pressed={showPassword}
                    className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-slate-400 transition hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {capsLockOn && <p className="text-xs text-amber-700">Caps Lock sedang aktif.</p>}
              </div>

              {/* Galat */}
              <div aria-live="polite">
                {errorMsg && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              {/* Tombol */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-700 text-sm font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Memeriksa...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>

              {/* Akun uji coba (khusus portal guru) */}
              {portal === 'guru' && (
                <p className="text-center text-xs text-slate-500">
                  Akun uji coba:{' '}
                  <button
                    type="button"
                    onClick={() => fillDemo('guru', 'guru')}
                    className="cursor-pointer font-medium text-blue-700 hover:underline"
                  >
                    guru (IPA)
                  </button>
                  {' atau '}
                  <button
                    type="button"
                    onClick={() => fillDemo('gurubiasa', 'guru')}
                    className="cursor-pointer font-medium text-blue-700 hover:underline"
                  >
                    gurubiasa (9A, 9B)
                  </button>
                </p>
              )}
            </form>

            {/* Catatan */}
            <p className="mt-6 border-t border-slate-100 pt-4 text-center text-xs leading-relaxed text-slate-500">
              {cfg.notice}
            </p>
          </div>
        </div>
      </main>

      <footer className="pb-5 text-center text-xs text-slate-400">Neotest CBT · {schoolName}</footer>
    </div>
  );
};