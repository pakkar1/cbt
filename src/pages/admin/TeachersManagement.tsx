import React, { useState } from 'react';
import { User, TeacherType, Subject } from '../../types';
import {
  getStaffUsers,
  saveStaffUser,
  saveStaffUsers,
  getSubjects,
  getSchoolSettings,
  addAuditLog,
} from '../../services/storage';
import {
  GraduationCap,
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle,
  ShieldCheck,
  BookOpen,
  Users,
  Layers,
  Award,
  KeyRound,
  FileSpreadsheet,
  Info,
} from 'lucide-react';

export const TeachersManagement: React.FC = () => {
  const settings = getSchoolSettings();
  const subjects = getSubjects();
  const [staffUsers, setStaffUsers] = useState<User[]>(getStaffUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'pembuat_soal' | 'guru_biasa'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSubjectId, setFormSubjectId] = useState(subjects[0]?.id || 'sub-ipa');
  const [formAssignedClasses, setFormAssignedClasses] = useState<string[]>(['9A', '9B']);
  const [formTeacherType, setFormTeacherType] = useState<TeacherType>('guru_biasa');

  const availableClasses = ['7A', '7B', '8A', '8B', '9A', '9B', '9C'];

  const reload = () => setStaffUsers(getStaffUsers());

  // Filter only teachers
  const teachers = staffUsers.filter(u => u.role === 'guru');

  const filteredTeachers = teachers.filter(t => {
    if (filterRole !== 'ALL') {
      const type = t.teacherType || 'pembuat_soal';
      if (type !== filterRole) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        t.name.toLowerCase().includes(q) ||
        t.username.toLowerCase().includes(q) ||
        (t.email && t.email.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const openAddTeacher = () => {
    setEditingTeacher(null);
    setFormName('');
    setFormUsername('');
    setFormEmail('');
    setFormSubjectId(subjects[0]?.id || 'sub-ipa');
    setFormAssignedClasses(['9A', '9B']);
    setFormTeacherType('guru_biasa');
    setIsModalOpen(true);
  };

  const openEditTeacher = (teacher: User) => {
    setEditingTeacher(teacher);
    setFormName(teacher.name);
    setFormUsername(teacher.username);
    setFormEmail(teacher.email || '');
    setFormSubjectId(teacher.assignedSubjectId || teacher.subjectIds?.[0] || subjects[0]?.id || 'sub-ipa');
    setFormAssignedClasses(teacher.assignedClasses || ['9A', '9B']);
    setFormTeacherType(teacher.teacherType || 'pembuat_soal');
    setIsModalOpen(true);
  };

  const handleToggleClass = (cls: string) => {
    if (formAssignedClasses.includes(cls)) {
      if (formAssignedClasses.length === 1) {
        alert('Setidaknya pilih minimal 1 kelas penugasan!');
        return;
      }
      setFormAssignedClasses(formAssignedClasses.filter(c => c !== cls));
    } else {
      setFormAssignedClasses([...formAssignedClasses, cls]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim()) {
      alert('Nama dan Username guru wajib diisi!');
      return;
    }

    const updatedUser: User = {
      id: editingTeacher ? editingTeacher.id : `usr-guru-${Date.now()}`,
      username: formUsername.trim().toLowerCase(),
      name: formName.trim(),
      role: 'guru',
      email: formEmail.trim() || undefined,
      sekolah: settings.schoolName,
      assignedSubjectId: formSubjectId,
      subjectIds: [formSubjectId],
      assignedClasses: formAssignedClasses,
      teacherType: formTeacherType,
    };

    saveStaffUser(updatedUser);
    addAuditLog(
      'admin',
      'Administrator',
      'admin',
      editingTeacher ? 'Update Penugasan Guru' : 'Tambah Guru & Penugasan Mapel',
      'CONFIG',
      `Guru: ${updatedUser.name}, Mapel: ${formSubjectId}, Kelas: [${formAssignedClasses.join(', ')}], Peran: ${formTeacherType}`
    );

    reload();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Hapus akun guru ${name} dari sistem?`)) {
      const remaining = staffUsers.filter(u => u.id !== id);
      saveStaffUsers(remaining);
      addAuditLog('admin', 'Administrator', 'admin', 'Hapus Akun Guru', 'CONFIG', `Menghapus akun guru: ${name}`);
      reload();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Manajemen Guru & Hak Akses Mapel
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
              Otoritas Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Atur mata pelajaran yang diampu, kelas penugasan, dan peran guru (Pembuat Soal vs Guru Biasa). Ketika guru login, mata pelajaran akan terkunci otomatis sesuai setingan ini.
          </p>
        </div>

        <button
          onClick={openAddTeacher}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Guru & Mapel</span>
        </button>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-purple-900">
            <span className="px-2 py-0.5 rounded bg-purple-200 text-purple-800 text-[10px]">
              Guru Pembuat Soal
            </span>
            <span>Koordinator & Penulis Butir Soal</span>
          </div>
          <p className="text-purple-950 leading-relaxed text-[11px]">
            Berhak mengentri soal baru di <strong>Bank Soal</strong>, menyusun <strong>Paket Ujian</strong>, melakukan koreksi uraian dengan kunci Google Form, serta mengakses laporan <strong>Analisis Butir & Daya Pembeda</strong>.
          </p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-emerald-900">
            <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 text-[10px]">
              Guru Biasa (Pengajar)
            </span>
            <span>Pengajar Kelas & Pengunduh Nilai</span>
          </div>
          <p className="text-emerald-950 leading-relaxed text-[11px]">
            Hanya dapat melihat dan <strong>mengunduh rekap nilai siswa</strong> (format Excel & PDF) serta koreksi uraian untuk kelas yang diampu saja (misal: IPA Kelas 9A, 9B). Menu Bank Soal & Paket Ujian disembunyikan.
          </p>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, NIP, atau username..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-slate-500 whitespace-nowrap">Filter Peran:</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
            >
              <option value="ALL">Semua Guru ({teachers.length})</option>
              <option value="pembuat_soal">Pembuat Soal & Paket</option>
              <option value="guru_biasa">Guru Biasa (Unduh Nilai)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="p-3.5 w-12 text-center">No</th>
                <th className="p-3.5">Nama Guru & NIP</th>
                <th className="p-3.5">Username Login</th>
                <th className="p-3.5">Mata Pelajaran (Diset)</th>
                <th className="p-3.5">Kelas Penugasan</th>
                <th className="p-3.5">Peran & Hak Akses</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map((t, idx) => {
                const subObj = subjects.find(s => s.id === t.assignedSubjectId || s.id === t.subjectIds?.[0]);
                const isMaker = (t.teacherType || 'pembuat_soal') === 'pembuat_soal';
                const classes = t.assignedClasses || ['9A', '9B', '9C'];

                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{t.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{t.email || '-'}</div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-blue-700 bg-blue-50/40">
                      {t.username}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">
                        {subObj?.name || 'Belum Diatur'}
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">Kode: {subObj?.code || '-'}</span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        {classes.map(c => (
                          <span key={c} className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-slate-700">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isMaker ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {isMaker ? 'Pembuat Soal & Paket' : 'Guru Biasa (Unduh Nilai)'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditTeacher(t)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Edit Penugasan Guru"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Guru"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTeachers.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            Tidak ada guru yang sesuai dengan pencarian atau filter.
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT TEACHER ASSIGNMENT */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingTeacher ? 'Edit Penugasan Guru' : 'Tambah Guru & Seting Mapel'}
                </h3>
                <p className="text-slate-500">Konfigurasi mata pelajaran, kelas, dan hak akses guru</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap & Gelar Guru:</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Drs. Hendro Wibisono, M.Pd"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Username Login (NIP):</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="Contoh: guru, hendro1978"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email Guru (Opsional):</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="email@sekolah.sch.id"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              {/* Subject Selection (Admin sets this - Teacher gets it automatically) */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
                <label className="font-bold text-blue-900 block">
                  Mata Pelajaran yang Diampu (Otomatis Terkunci di Guru):
                </label>
                <select
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-slate-900 font-bold"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) — KKM: {s.kkm}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-blue-800">
                  Guru tidak perlu memilih mata pelajaran lagi saat login, sistem akan langsung mengarahkan ke mapel ini.
                </p>
              </div>

              {/* Class Assignment */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Pilih Kelas yang Diampu (Checklist Kelas):
                </label>
                <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {availableClasses.map(cls => {
                    const isSelected = formAssignedClasses.includes(cls);
                    return (
                      <button
                        type="button"
                        key={cls}
                        onClick={() => handleToggleClass(cls)}
                        className={`py-1.5 px-2 rounded-lg font-bold text-center transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {cls}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Guru hanya akan melihat dan mengunduh nilai untuk kelas-kelas yang dicentang di atas.
                </p>
              </div>

              {/* Teacher Role Assignment */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="font-bold text-slate-800 block">
                  Tipe Hak Akses Guru:
                </label>
                
                <div className="space-y-2">
                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    formTeacherType === 'pembuat_soal'
                      ? 'bg-purple-50/70 border-purple-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="teacherRole"
                      checked={formTeacherType === 'pembuat_soal'}
                      onChange={() => setFormTeacherType('pembuat_soal')}
                      className="mt-0.5 text-purple-600"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">
                        Guru Pembuat Soal & Paket Ujian
                      </span>
                      <span className="text-slate-600 text-[11px] block mt-0.5">
                        Dapat mengentri butir soal di Bank Soal, menyusun Paket Ujian, koreksi uraian, dan analisis butir soal.
                      </span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    formTeacherType === 'guru_biasa'
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="teacherRole"
                      checked={formTeacherType === 'guru_biasa'}
                      onChange={() => setFormTeacherType('guru_biasa')}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">
                        Guru Biasa (Pengajar Kelas)
                      </span>
                      <span className="text-slate-600 text-[11px] block mt-0.5">
                        Hanya melihat & mengunduh rekap nilai siswa sesuai mapel dan kelasnya (misal: IPA Kelas 9A, 9B). Menu Bank Soal & Paket Ujian disembunyikan.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Simpan Penugasan Guru
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
