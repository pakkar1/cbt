import React, { useState } from 'react';
import {
  getSchoolSettings,
  saveSchoolSettings,
  resetFactoryData,
} from '../../services/storage';
import {
  Settings,
  Shield,
  Save,
  RotateCcw,
  CheckCircle,
  Building,
  Lock,
} from 'lucide-react';
import { SchoolSettings } from '../../types';

export const SchoolSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SchoolSettings>(getSchoolSettings());
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSchoolSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetFactory = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh database CBT ke data bawaan awal (14 Mapel, 78 Sesi, Bank Soal Lengkap)?')) {
      resetFactoryData();
      setSettings(getSchoolSettings());
      alert('Sistem berhasil di-reset ke konfigurasi awal.');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Pengaturan Identitas Sekolah & Kebijakan CBT
          </h1>
          <p className="text-xs text-slate-500">
            Sesuaikan nama platform, logo, warna utama, dan tata tertib ujian nasional
          </p>
        </div>

        {isSaved && (
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Pengaturan Disimpan
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        
        {/* Identitas Sekolah Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-4 h-4 text-blue-600" />
            Identitas Sekolah & Aplikasi Asesmen
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nama Sekolah / Instansi:
              </label>
              <input
                type="text"
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nomor Pokok Sekolah Nasional (NPSN):
              </label>
              <input
                type="text"
                value={settings.npsn}
                onChange={(e) => setSettings({ ...settings, npsn: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Tahun Ajaran Aktif:
              </label>
              <input
                type="text"
                value={settings.academicYear}
                onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Semester:
              </label>
              <select
                value={settings.semester}
                onChange={(e) => setSettings({ ...settings, semester: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              >
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nama Kepala Sekolah:
              </label>
              <input
                type="text"
                value={settings.headmasterName}
                onChange={(e) => setSettings({ ...settings, headmasterName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                NIP Kepala Sekolah:
              </label>
              <input
                type="text"
                value={settings.headmasterNip}
                onChange={(e) => setSettings({ ...settings, headmasterNip: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Alamat Lengkap Sekolah:
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>
        </div>

        {/* Kebijakan Token & Anti-Cheat */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock className="w-4 h-4 text-blue-600" />
            Kebijakan Integritas & Token Ujian
          </h3>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireSubmitToken}
                onChange={(e) => setSettings({ ...settings, requireSubmitToken: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <strong className="text-slate-800 block">Wajibkan Token Submit untuk Menyelesaikan Ujian</strong>
                <span className="text-slate-500 text-[11px]">
                  Jika dicentang, siswa harus memasukkan token submit khusus dari pengawas ruangan setelah mencapai durasi minimum 45 menit.
                </span>
              </div>
            </label>

            <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Waktu Minimum Sebelum Boleh Submit (Menit):
                </label>
                <input
                  type="number"
                  min={10}
                  max={120}
                  value={settings.minSubmitTimeMinutes}
                  onChange={(e) => setSettings({ ...settings, minSubmitTimeMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Batas Toleransi Perpindahan Tab:
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.maxViolationsAllowed}
                  onChange={(e) => setSettings({ ...settings, maxViolationsAllowed: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-slate-100">
              <input
                type="checkbox"
                checked={settings.preventTabSwitch}
                onChange={(e) => setSettings({ ...settings, preventTabSwitch: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <strong className="text-slate-800 block">Aktifkan Deteksi Anti-Curang (Tab-Switch Alert)</strong>
                <span className="text-slate-500 text-[11px]">
                  Mendeteksi perpindahan fokus browser / minimize dan mencatat pelanggaran ke dalam Berita Acara Proktor.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleResetFactory}
            className="w-full sm:w-auto px-4 py-2.5 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset ke Database Awal Pabrik</span>
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Pengaturan</span>
          </button>
        </div>

      </form>

    </div>
  );
};
