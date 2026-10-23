import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, PortalType } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { LoginPage } from './pages/auth/LoginPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ExamConfirmPage } from './pages/student/ExamConfirmPage';
import { ExamRoomPage } from './pages/student/ExamRoomPage';
import { StudentSchedulePage } from './pages/student/StudentSchedulePage';
import { StudentResultsPage } from './pages/student/StudentResultsPage';
import { StudentGuidePage } from './pages/student/StudentGuidePage';
import { ProctorPanel } from './pages/proctor/ProctorPanel';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { QuestionBankPage } from './pages/admin/QuestionBankPage';
import { ExamPackagesPage } from './pages/admin/ExamPackagesPage';
import { ScheduleSessionsPage } from './pages/admin/ScheduleSessionsPage';
import { StudentsManagement } from './pages/admin/StudentsManagement';
import { ExamResultsPage } from './pages/admin/ExamResultsPage';
import { SubjectsManagement } from './pages/admin/SubjectsManagement';
import { SchoolSettingsPage } from './pages/admin/SchoolSettingsPage';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { TeachersManagement } from './pages/admin/TeachersManagement';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import {
  ExamSession,
  ExamPackage,
  ExamAttempt,
} from './types';
import {
  getExamPackages,
  getOrCreateExamAttempt,
} from './services/storage';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';

// Determine active portal based on URL pathname, query, or hash
function detectPortalFromURL(): PortalType {
  const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
  const search = new URLSearchParams(window.location.search).get('portal')?.toLowerCase();
  const hash = window.location.hash.toLowerCase().replace(/^#/, '');

  if (path.endsWith('/proktor') || search === 'proktor' || hash === 'proktor') {
    return 'proktor';
  }
  if (path.endsWith('/guru') || search === 'guru' || hash === 'guru') {
    return 'guru';
  }
  if (path.endsWith('/admin') || search === 'admin' || hash === 'admin') {
    return 'admin';
  }
  if (path.endsWith('/superadmin') || search === 'superadmin' || hash === 'superadmin') {
    return 'superadmin';
  }
  return 'siswa';
}

const MainApp: React.FC = () => {
  const { currentUser, logout, isLoading } = useAuth();

  // Active portal based on URL link
  const [activePortal, setActivePortal] = useState<PortalType>(detectPortalFromURL());

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Exam flow states (for students)
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null);
  const [activePackage, setActivePackage] = useState<ExamPackage | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<ExamAttempt | null>(null);
  const [isExamRoomActive, setIsExamRoomActive] = useState<boolean>(false);
  const [isConfirmActive, setIsConfirmActive] = useState<boolean>(false);

  // Sync portal state when URL changes (popstate or hashchange)
  useEffect(() => {
    const handleUrlChange = () => {
      const detected = detectPortalFromURL();
      setActivePortal(detected);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600 text-sm font-semibold">
          <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Memuat Sistem CBT ANBK SMP...</span>
        </div>
      </div>
    );
  }

  // If student is currently taking an exam in the digital room
  if (currentUser && isExamRoomActive && activeSession && activePackage && activeAttempt) {
    return (
      <ExamRoomPage
        session={activeSession}
        pkg={activePackage}
        attempt={activeAttempt}
        onExitAndLogout={() => {
          setIsExamRoomActive(false);
          setIsConfirmActive(false);
          setActiveSession(null);
          setActivePackage(null);
          setActiveAttempt(null);
          logout();
        }}
      />
    );
  }

  // If student is in Pre-Exam Confirmation screen
  if (currentUser && isConfirmActive && activeSession) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <Navbar hideNavLinks />
        <main className="flex-1">
          <ExamConfirmPage
            session={activeSession}
            onConfirmStart={(validToken, confirmedSession) => {
              const targetSession = confirmedSession || activeSession;
              const pkg = getExamPackages().find(p => p.id === targetSession.examPackageId) || getExamPackages()[0];
              const attempt = getOrCreateExamAttempt(currentUser, targetSession, pkg);
              setActiveSession(targetSession);
              setActivePackage(pkg);
              setActiveAttempt(attempt);
              setIsConfirmActive(false);
              setIsExamRoomActive(true);
            }}
            onCancel={() => {
              setIsConfirmActive(false);
              setActiveSession(null);
            }}
          />
        </main>
      </div>
    );
  }

  // Not logged in -> Show dedicated Login Page for the active URL Portal
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar hideNavLinks />
        <main className="flex-1">
          <LoginPage
            portal={activePortal}
            onLoginSuccess={() => setCurrentTab('dashboard')}
          />
        </main>
      </div>
    );
  }

  // SECURITY CHECK: Verify that currentUser has authority to access this portal URL
  const isAuthorized = (() => {
    if (activePortal === 'siswa') return currentUser.role === 'siswa';
    if (activePortal === 'proktor') return currentUser.role === 'proktor' || currentUser.role === 'admin' || currentUser.role === 'super_admin';
    if (activePortal === 'guru') return currentUser.role === 'guru' || currentUser.role === 'admin' || currentUser.role === 'super_admin';
    if (activePortal === 'admin') return currentUser.role === 'admin' || currentUser.role === 'super_admin';
    if (activePortal === 'superadmin') return currentUser.role === 'super_admin';
    return false;
  })();

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 shadow-md text-center space-y-5">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Akses Portal Tidak Diizinkan</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Anda saat ini masuk sebagai <strong>{currentUser.name}</strong> dengan peran <strong>{currentUser.role.toUpperCase()}</strong>. Akun Anda tidak memiliki otoritas untuk mengakses tautan portal <strong>/{activePortal}</strong> ini.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                // Navigate back to user's authorized home
                if (currentUser.role === 'siswa') window.location.href = '/';
                else if (currentUser.role === 'proktor') window.location.href = '/proktor';
                else if (currentUser.role === 'guru') window.location.href = '/guru';
                else window.location.href = '/admin';
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Kembali ke Portal Resmi Anda
            </button>
            <button
              onClick={logout}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Keluar (Logout) Akun Ini</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Navigation handlers
  const handleStartExam = (session: ExamSession) => {
    setActiveSession(session);
    setIsConfirmActive(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar currentTab={currentTab} onNavigate={(tab) => setCurrentTab(tab)} />

      <main className="flex-1">
        
        {/* SISWA VIEWS - SEDERHANA & FOKUS SESUAI STANDAR TES KOMPETENSI */}
        {currentUser.role === 'siswa' && (
          <StudentDashboard onStartExam={handleStartExam} />
        )}

        {/* PROKTOR VIEWS - FOKUS PANEL MONITORING TANPA SUBMENU ATAS */}
        {currentUser.role === 'proktor' && (
          <ProctorPanel />
        )}

        {/* GURU VIEWS - DEDIKASI DAN SEDERHANA HANYA 5 FITUR UTAMA */}
        {currentUser.role === 'guru' && (
          <TeacherDashboard />
        )}

        {/* ADMIN & SUPER ADMIN VIEWS */}
        {(currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            
            {/* Secondary Sub-Navigation */}
            <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setCurrentTab('admin_dashboard')}
                className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                  currentTab === 'admin_dashboard' || currentTab === 'dashboard'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Dashboard Utama
              </button>
              <button
                onClick={() => setCurrentTab('bank_soal')}
                className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                  currentTab === 'bank_soal'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Bank Soal (14 Mapel)
              </button>
              <button
                onClick={() => setCurrentTab('paket_ujian')}
                className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                  currentTab === 'paket_ujian'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Paket Ujian
              </button>
              <button
                onClick={() => setCurrentTab('jadwal_sesi')}
                className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                  currentTab === 'jadwal_sesi'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Jadwal 78 Sesi
              </button>
              <button
                onClick={() => setCurrentTab('data_siswa')}
                className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                  currentTab === 'data_siswa'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Data Peserta & Kartu
              </button>
              <button
                onClick={() => setCurrentTab('data_guru')}
                className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                  currentTab === 'data_guru'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Data Guru & Mapel
              </button>
              <button
                onClick={() => setCurrentTab('proctor_panel')}
                className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                  currentTab === 'proctor_panel'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Monitoring Proktor
              </button>
              <button
                onClick={() => setCurrentTab('hasil_analisis')}
                className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                  currentTab === 'hasil_analisis'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Rekap & Koreksi Uraian
              </button>
              <button
                onClick={() => setCurrentTab('mata_pelajaran')}
                className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                  currentTab === 'mata_pelajaran'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Mata Pelajaran
              </button>
              <button
                onClick={() => setCurrentTab('audit_log')}
                className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                  currentTab === 'audit_log'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Audit Log
              </button>
              <button
                onClick={() => setCurrentTab('pengaturan')}
                className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                  currentTab === 'pengaturan'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Pengaturan Sekolah
              </button>
            </div>

            {/* Active Content Sub-View */}
            {(currentTab === 'admin_dashboard' || currentTab === 'dashboard') && (
              <AdminDashboard onNavigate={(tab) => setCurrentTab(tab)} />
            )}
            {currentTab === 'bank_soal' && <QuestionBankPage />}
            {currentTab === 'paket_ujian' && <ExamPackagesPage />}
            {currentTab === 'jadwal_sesi' && <ScheduleSessionsPage />}
            {currentTab === 'data_siswa' && <StudentsManagement />}
            {currentTab === 'data_guru' && <TeachersManagement />}
            {currentTab === 'proctor_panel' && <ProctorPanel />}
            {currentTab === 'hasil_analisis' && <ExamResultsPage />}
            {currentTab === 'mata_pelajaran' && <SubjectsManagement />}
            {currentTab === 'audit_log' && <AuditLogPage />}
            {currentTab === 'pengaturan' && <SchoolSettingsPage />}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-slate-700">Neotest — Sistem Ujian Berbasis Komputer</span>
          <span className="font-mono text-slate-400">ANBK & TKA Standard Compliant</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
