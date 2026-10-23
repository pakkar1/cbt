import React, { useState } from 'react';
import { Subject } from '../../types';
import {
  getSubjects,
  saveSubject,
} from '../../services/storage';
import {
  BookOpen,
  Plus,
  CheckCircle,
  Clock,
  Award,
  Edit2,
} from 'lucide-react';

export const SubjectsManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>(getSubjects());
  const [editingSub, setEditingSub] = useState<Subject | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [desc, setDesc] = useState('');
  const [duration, setDuration] = useState(90);
  const [kkm, setKkm] = useState(75);
  const [isActive, setIsActive] = useState(true);

  const reload = () => setSubjects(getSubjects());

  const openEdit = (sub: Subject) => {
    setEditingSub(sub);
    setName(sub.name);
    setCode(sub.code);
    setDesc(sub.description);
    setDuration(sub.defaultDurationMinutes);
    setKkm(sub.kkm);
    setIsActive(sub.isActive);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: Subject = {
      id: editingSub ? editingSub.id : `sub-${Date.now()}`,
      code: code || 'MP',
      name,
      description: desc,
      targetClasses: editingSub ? editingSub.targetClasses : ['7', '8', '9'],
      isActive,
      defaultDurationMinutes: Number(duration),
      kkm: Number(kkm),
    };

    saveSubject(updated);
    reload();
    setEditingSub(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Data 14 Mata Pelajaran Asesmen SMP
          </h1>
          <p className="text-xs text-slate-500">
            Seluruh mata pelajaran dikelola dinamis melalui basis data tanpa penguncian di kode frontend
          </p>
        </div>
      </div>

      {/* Grid of 14 Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((sub, idx) => (
          <div
            key={sub.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                {sub.code}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  sub.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {sub.isActive ? 'Aktif' : 'Non-Aktif'}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-sm line-clamp-1">
                {idx + 1}. {sub.name}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                {sub.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                {sub.defaultDurationMinutes} Mnt
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                KKM: {sub.kkm}
              </span>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                onClick={() => openEdit(sub)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Ubah</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: EDIT SUBJECT */}
      {editingSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Ubah Mata Pelajaran</h3>
              <button
                onClick={() => setEditingSub(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Mata Pelajaran:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kode:</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Batas KKM:</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={kkm}
                    onChange={(e) => setKkm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Durasi Ujian Default (Menit):</label>
                <input
                  type="number"
                  min={15}
                  max={240}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deskripsi Ringkas:</label>
                <textarea
                  rows={2}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-semibold text-slate-800">Status Mata Pelajaran Aktif</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
                >
                  Simpan
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
