import React, { useState } from 'react';
import { ExamPackage, Question } from '../../types';
import {
  getExamPackages,
  saveExamPackage,
  getQuestions,
  getSubjects,
} from '../../services/storage';
import {
  FileCheck,
  Plus,
  Clock,
  Layers,
  Shuffle,
  Award,
  CheckSquare,
  Edit2,
  Trash2,
} from 'lucide-react';

export const ExamPackagesPage: React.FC = () => {
  const [packages, setPackages] = useState<ExamPackage[]>(getExamPackages());
  const subjects = getSubjects();
  const allQuestions = getQuestions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<ExamPackage | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || 'sub-bind');
  const [kelas, setKelas] = useState('9');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [randomizeOptions, setRandomizeOptions] = useState(true);
  const [partialCredit, setPartialCredit] = useState(true);
  const [kkm, setKkm] = useState(75);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const reload = () => setPackages(getExamPackages());

  const openAddModal = () => {
    setEditingPkg(null);
    setName('');
    setCode(`PKG-${Date.now().toString().slice(-4)}`);
    setSubjectId(subjects[0]?.id || 'sub-bind');
    setKelas('9');
    setDurationMinutes(60);
    setRandomizeQuestions(true);
    setRandomizeOptions(true);
    setPartialCredit(true);
    setKkm(75);
    setSelectedQuestionIds(allQuestions.slice(0, 5).map(q => q.id));
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: ExamPackage) => {
    setEditingPkg(pkg);
    setName(pkg.name);
    setCode(pkg.code);
    setSubjectId(pkg.subjectId);
    setKelas(pkg.kelas);
    setDurationMinutes(pkg.durationMinutes);
    setRandomizeQuestions(pkg.randomizeQuestions);
    setRandomizeOptions(pkg.randomizeOptions);
    setPartialCredit(pkg.partialCreditForComplex);
    setKkm(pkg.kkm);
    setSelectedQuestionIds(pkg.questionIds);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const totalWeight = selectedQuestionIds.reduce((sum, qId) => {
      const q = allQuestions.find(it => it.id === qId);
      return sum + (q?.weight || 0);
    }, 0);

    const newPkg: ExamPackage = {
      id: editingPkg ? editingPkg.id : `pkg-${Date.now()}`,
      code: code || `PKG-${Date.now()}`,
      name,
      subjectId,
      kelas,
      durationMinutes: Number(durationMinutes),
      questionIds: selectedQuestionIds,
      randomizeQuestions,
      randomizeOptions,
      partialCreditForComplex: partialCredit,
      kkm: Number(kkm),
      totalWeight,
      createdAt: editingPkg ? editingPkg.createdAt : new Date().toISOString(),
    };

    saveExamPackage(newPkg);
    reload();
    setIsModalOpen(false);
  };

  const toggleQuestionSelection = (qId: string) => {
    if (selectedQuestionIds.includes(qId)) {
      setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== qId));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, qId]);
    }
  };

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Mata Pelajaran';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Paket Naskah Ujian & Pengacakan Soal
          </h1>
          <p className="text-xs text-slate-500">
            Penyusunan naskah soal asesmen dengan konfigurasi durasi, KKM, dan algoritma pengacakan
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Paket Ujian Baru</span>
        </button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {packages.map(pkg => {
          return (
            <div
              key={pkg.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                  {pkg.code}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Kelas {pkg.kelas}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base line-clamp-1">
                  {pkg.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {getSubjectName(pkg.subjectId)}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    Alokasi Waktu
                  </span>
                  <span className="font-semibold text-slate-800">{pkg.durationMinutes} Menit</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Layers className="w-3.5 h-3.5" />
                    Komposisi Soal
                  </span>
                  <span className="font-bold text-slate-900">{pkg.questionIds.length} Butir (Total Bobot {pkg.totalWeight} Poin)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Award className="w-3.5 h-3.5" />
                    Standar KKM
                  </span>
                  <span className="font-semibold text-slate-800">{pkg.kkm}</span>
                </div>
              </div>

              {/* Badges for random & partial credit */}
              <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                {pkg.randomizeQuestions && (
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-medium flex items-center gap-1">
                    <Shuffle className="w-3 h-3" /> Acak Butir
                  </span>
                )}
                {pkg.randomizeOptions && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
                    Acak Opsi Pilihan
                  </span>
                )}
                {pkg.partialCreditForComplex && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-medium">
                    Kredit Parsial PG Kompleks
                  </span>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(pkg)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Sunting</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD / EDIT EXAM PACKAGE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingPkg ? 'Sunting Paket Ujian' : 'Buat Paket Ujian Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nama Paket Ujian:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Asesmen Literasi Membaca Kelas 9"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kode Paket:</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Contoh: PKG-LIT-2026"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mata Pelajaran:</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Durasi (Menit):</label>
                  <input
                    type="number"
                    min={15}
                    max={240}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Batas KKM (0 - 100):</label>
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

              {/* Toggles */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block mb-1">Pengaturan Mesin Asesmen:</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={randomizeQuestions}
                      onChange={(e) => setRandomizeQuestions(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Acak Urutan Soal Tiap Siswa</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={randomizeOptions}
                      onChange={(e) => setRandomizeOptions(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Acak Opsi Pilihan Ganda</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={partialCredit}
                      onChange={(e) => setPartialCredit(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Kredit Parsial PG Kompleks</span>
                  </label>
                </div>
              </div>

              {/* Question Selection Checkbox List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">
                    Pilih Butir Soal ({selectedQuestionIds.length} Terpilih):
                  </label>
                  <span className="text-[11px] text-slate-500">Centang butir soal yang ingin dimasukkan ke paket</span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-1">
                  {allQuestions.map(q => {
                    const isChecked = selectedQuestionIds.includes(q.id);
                    return (
                      <div
                        key={q.id}
                        onClick={() => toggleQuestionSelection(q.id)}
                        className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked ? 'bg-blue-50/70 text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <div>
                            <span className="font-mono font-bold text-[11px]">{q.code}</span>
                            <span className="mx-2">·</span>
                            <span className="font-semibold">{q.topic}</span>
                            <span className="text-slate-400 ml-2">({q.type.replace(/_/g, ' ')})</span>
                          </div>
                        </div>
                        <span className="font-bold text-slate-600 text-[11px]">{q.weight} Poin</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
                >
                  Simpan Paket Ujian
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
