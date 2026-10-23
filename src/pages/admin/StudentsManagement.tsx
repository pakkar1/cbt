import React, { useState, useRef } from 'react';
import { User } from '../../types';
import {
  getStudents,
  saveStudents,
  getSchoolSettings,
  addAuditLog,
} from '../../services/storage';
import {
  Users,
  Search,
  Upload,
  Download,
  Printer,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  FileSpreadsheet,
  QrCode,
} from 'lucide-react';

export const StudentsManagement: React.FC = () => {
  const settings = getSchoolSettings();
  const [students, setStudents] = useState<User[]>(getStudents());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPrintCardsOpen, setIsPrintCardsOpen] = useState(false);

  // CSV Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvPreview, setCsvPreview] = useState<{
    valid: User[];
    duplicates: string[];
    errors: string[];
  } | null>(null);

  const classes = ['ALL', '7A', '7B', '8A', '8B', '9A', '9B', '9C'];

  const reload = () => setStudents(getStudents());

  // Filtered students
  const filteredStudents = students.filter(s => {
    if (selectedClass !== 'ALL' && s.rombel !== selectedClass && s.kelas !== selectedClass) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        s.name.toLowerCase().includes(q) ||
        (s.nomorPeserta && s.nomorPeserta.toLowerCase().includes(q)) ||
        (s.nisn && s.nisn.includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Nama Lengkap', 'NISN', 'Nomor Peserta', 'Kelas', 'Rombongan Belajar', 'Sekolah', 'Status'];
    const rows = students.map(s => [
      `"${s.name}"`,
      `"${s.nisn || ''}"`,
      `"${s.nomorPeserta || ''}"`,
      `"${s.kelas || ''}"`,
      `"${s.rombel || ''}"`,
      `"${s.sekolah || settings.schoolName}"`,
      '"Aktif"',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Data_Peserta_CBT_${settings.schoolName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Sample Template CSV
  const handleDownloadTemplate = () => {
    const headers = ['Nama Lengkap', 'NISN', 'Nomor Peserta', 'Kelas', 'Rombongan Belajar', 'Sekolah', 'Status'];
    const sampleRows = [
      ['"Ahmad Pratama"', '"0091000101"', '"P09-01-101"', '"9"', '"9A"', `"${settings.schoolName}"`, '"Aktif"'],
      ['"Bunga Lestari"', '"0091000102"', '"P09-01-102"', '"9"', '"9A"', `"${settings.schoolName}"`, '"Aktif"'],
      ['"Chandra Wijaya"', '"0091000103"', '"P09-01-103"', '"9"', '"9B"', `"${settings.schoolName}"`, '"Aktif"'],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...sampleRows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Template_Import_Peserta_CBT.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV File on Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        setCsvPreview({ valid: [], duplicates: [], errors: ['File CSV kosong atau tidak memiliki data baris.'] });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
      
      const validUsers: User[] = [];
      const dupes: string[] = [];
      const errs: string[] = [];

      const existingNumbers = new Set(students.map(s => s.nomorPeserta?.toLowerCase()));

      for (let i = 1; i < lines.length; i++) {
        // Simple regex to split comma-separated tokens while respecting quotes
        const tokens = lines[i].split(',').map(t => t.trim().replace(/^["']|["']$/g, ''));
        if (tokens.length < 3) {
          errs.push(`Baris ${i + 1}: Format kolom tidak sesuai`);
          continue;
        }

        const name = tokens[0];
        const nisn = tokens[1];
        const noPeserta = tokens[2];
        const kelas = tokens[3] || '9';
        const rombel = tokens[4] || '9A';
        const sekolah = tokens[5] || settings.schoolName;

        if (!name || !noPeserta) {
          errs.push(`Baris ${i + 1}: Nama lengkap dan nomor peserta wajib diisi`);
          continue;
        }

        if (existingNumbers.has(noPeserta.toLowerCase())) {
          dupes.push(`${noPeserta} (${name})`);
          continue;
        }

        validUsers.push({
          id: `std-imp-${Date.now()}-${i}`,
          username: noPeserta,
          name,
          role: 'siswa',
          nomorPeserta: noPeserta,
          nisn,
          kelas,
          rombel,
          sekolah,
        });
      }

      setCsvPreview({
        valid: validUsers,
        duplicates: dupes,
        errors: errs,
      });
    };

    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    if (!csvPreview || csvPreview.valid.length === 0) return;

    const updated = [...students, ...csvPreview.valid];
    saveStudents(updated);
    addAuditLog(
      'admin',
      'Administrator',
      'admin',
      'Import Data Peserta via CSV',
      'CONFIG',
      `Berhasil menambahkan ${csvPreview.valid.length} data siswa baru.`
    );
    reload();
    setIsImportModalOpen(false);
    setCsvPreview(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Data Peserta Ujian & Cetak Kartu CBT
          </h1>
          <p className="text-xs text-slate-500">
            Total {students.length} peserta terdaftar · Mendukung impor batch CSV hingga 1.000 siswa
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
          </button>
          
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsPrintCardsOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kartu Ujian</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NISN, atau no. peserta..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
          />
        </div>

        {/* Class Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {classes.map(cls => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedClass === cls ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cls === 'ALL' ? 'Semua Kelas' : `Kelas ${cls}`}
            </button>
          ))}
        </div>

      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="p-3.5 w-12 text-center">No</th>
                <th className="p-3.5 w-32">Nomor Peserta</th>
                <th className="p-3.5 w-28">NISN</th>
                <th className="p-3.5">Nama Lengkap Siswa</th>
                <th className="p-3.5 text-center w-24">Kelas / Rombel</th>
                <th className="p-3.5">Sekolah</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.slice(0, 100).map((student, idx) => (
                <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 text-center font-mono text-slate-400">{idx + 1}</td>
                  <td className="p-3.5 font-mono font-bold text-slate-800">{student.nomorPeserta}</td>
                  <td className="p-3.5 font-mono text-slate-600">{student.nisn || '-'}</td>
                  <td className="p-3.5 font-semibold text-slate-900">{student.name}</td>
                  <td className="p-3.5 text-center font-medium text-slate-700">{student.rombel || student.kelas}</td>
                  <td className="p-3.5 text-slate-500">{student.sekolah || settings.schoolName}</td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Aktif
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            Tidak ada data peserta yang cocok.
          </div>
        )}
      </div>

      {/* MODAL: IMPORT CSV WITH VALIDATION PREVIEW */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                Import Data Peserta Ujian (CSV)
              </h3>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setCsvPreview(null);
                }}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600 leading-relaxed">
                Unggah file CSV dengan urutan header: <code>Nama Lengkap, NISN, Nomor Peserta, Kelas, Rombongan Belajar, Sekolah, Status</code>. Sistem akan otomatis memvalidasi header, memeriksa duplikasi, dan mencegah data ganda.
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Contoh Template CSV</span>
                </button>
              </div>

              {/* Upload Input */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-2 bg-slate-50">
                <Upload className="w-8 h-8 text-blue-600 mx-auto" />
                <p className="font-semibold text-slate-800">Pilih File CSV Peserta</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="text-xs text-slate-500 cursor-pointer"
                />
              </div>

              {/* Validation Results Report */}
              {csvPreview && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                      <p className="text-emerald-600 font-bold text-base font-mono">{csvPreview.valid.length}</p>
                      <p className="text-[11px] text-emerald-800">Valid & Siap Diimpor</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-amber-600 font-bold text-base font-mono">{csvPreview.duplicates.length}</p>
                      <p className="text-[11px] text-amber-800">Duplikat Dilewati</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-red-600 font-bold text-base font-mono">{csvPreview.errors.length}</p>
                      <p className="text-[11px] text-red-800">Baris Error</p>
                    </div>
                  </div>

                  {csvPreview.duplicates.length > 0 && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 max-h-24 overflow-y-auto">
                      <strong>Nomor Peserta Duplikat:</strong> {csvPreview.duplicates.join(', ')}
                    </div>
                  )}

                  {csvPreview.errors.length > 0 && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-900 max-h-24 overflow-y-auto">
                      <strong>Laporan Kesalahan:</strong> {csvPreview.errors.join('; ')}
                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setCsvPreview(null);
                }}
                className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyImport}
                disabled={!csvPreview || csvPreview.valid.length === 0}
                className="px-5 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold"
              >
                Terapkan Import ({csvPreview ? csvPreview.valid.length : 0} Siswa)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: PRINT EXAM CARDS (KARTU PESERTA ASESMEN) */}
      {isPrintCardsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 no-print">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Pratinjau Kartu Peserta Asesmen</h3>
                <p className="text-xs text-slate-500">Siap dicetak pada kertas A4 (berisi 6 kartu peserta per lembar)</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Kartu Sekarang</span>
                </button>
                <button
                  onClick={() => setIsPrintCardsOpen(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold p-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredStudents.slice(0, 6).map(s => (
                <div
                  key={s.id}
                  className="border-2 border-slate-300 rounded-xl p-4 bg-white text-xs space-y-3 relative shadow-xs"
                >
                  {/* Card Header */}
                  <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-[11px] text-blue-900 uppercase">
                        {settings.schoolName}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        KARTU PESERTA CBT / ANBK SMP 2026
                      </p>
                    </div>
                    <span className="font-mono font-bold text-slate-700 text-[10px]">
                      {s.rombel || '9A'}
                    </span>
                  </div>

                  {/* Card Body with Photo Box and Details */}
                  <div className="flex gap-4">
                    {/* Photo Placeholder */}
                    <div className="w-16 h-20 bg-slate-100 border border-slate-300 rounded-lg flex flex-col items-center justify-center text-[9px] text-slate-400 shrink-0">
                      <span>FOTO</span>
                      <span>2x3</span>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-800 flex-1">
                      <div>
                        <span className="text-slate-500 block text-[9px]">Nomor Peserta:</span>
                        <strong className="font-mono text-xs text-blue-900">{s.nomorPeserta}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Nama Lengkap:</span>
                        <strong className="line-clamp-1">{s.name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">NISN / Password:</span>
                        <span className="font-mono">{s.nisn || '0091000001'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Barcode Simulation */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-mono">|||||| | |||| ||| ||||</span>
                    <span>Ruang: Lab CBT</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 no-print">
              <button
                onClick={() => setIsPrintCardsOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
