import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import {
  findUserByCredentials,
  getAllUsers,
  getStaffUsers,
  getStudents,
  addAuditLog,
  initializeStorage,
} from '../services/storage';

export type PortalType = 'siswa' | 'proktor' | 'guru' | 'admin' | 'superadmin';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password?: string, portal?: PortalType) => { success: boolean; error?: string };
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'anbk_auth_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeStorage();
    const stored = localStorage.getItem(AUTH_USER_KEY);
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(AUTH_USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (
    username: string,
    password?: string,
    portal: PortalType = 'siswa'
  ): { success: boolean; error?: string } => {
    if (!username.trim()) {
      return {
        success: false,
        error: portal === 'siswa' ? 'Silakan masukkan nomor peserta atau NISN.' : 'Silakan masukkan username/ID pengawas.'
      };
    }

    const user = findUserByCredentials(username, password);
    if (!user) {
      return {
        success: false,
        error: portal === 'siswa'
          ? 'Nomor peserta atau NISN tidak ditemukan dalam basis data sesi ujian.'
          : 'Username atau password staf tidak terdaftar.'
      };
    }

    // Role-to-Portal security authorization
    if (portal === 'siswa' && user.role !== 'siswa') {
      return {
        success: false,
        error: 'Akun staf/pengawas tidak diizinkan login melalui portal peserta ujian. Silakan akses portal staf resmi.'
      };
    }

    if (portal === 'proktor' && user.role !== 'proktor' && user.role !== 'admin' && user.role !== 'super_admin') {
      return {
        success: false,
        error: 'Akses ditolak: Akun Anda tidak memiliki hak akses sebagai Proktor Ruang Ujian.'
      };
    }

    if (portal === 'guru' && user.role !== 'guru' && user.role !== 'admin' && user.role !== 'super_admin') {
      return {
        success: false,
        error: 'Akses ditolak: Akun Anda tidak memiliki kewenangan sebagai Guru Pengampu.'
      };
    }

    if (portal === 'admin' && user.role !== 'admin' && user.role !== 'super_admin') {
      return {
        success: false,
        error: 'Akses ditolak: Portal ini hanya untuk Administrator CBT Sekolah.'
      };
    }

    if (portal === 'superadmin' && user.role !== 'super_admin') {
      return {
        success: false,
        error: 'Akses ditolak: Portal Gateway Super Administrator terlindungi khusus.'
      };
    }

    setCurrentUser(user);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

    addAuditLog(
      user.id,
      user.name,
      user.role,
      `Login Berhasil via Portal ${portal.toUpperCase()}`,
      'AUTH',
      `Login pengguna ${user.username} melalui portal terpisah ${portal}`
    );

    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        'Logout Pengguna',
        'AUTH',
        'Pengguna mengakhiri sesi'
      );
    }
    setCurrentUser(null);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
