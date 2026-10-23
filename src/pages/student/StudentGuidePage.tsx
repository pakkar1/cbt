import React from 'react';
import {
  HelpCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Wifi,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface StudentGuidePageProps {
  onBack: () => void;
}

export const StudentGuidePage: React.FC<StudentGuidePageProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda Peserta</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Panduan Resmi Pengerjaan Asesmen ANBK & TKA SMP
        </h1>
        <p className="text-xs text-slate-500">
          Tata cara penggunaan ruang ujian digital, navigasi soal, dan mekanisme autosave
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        
        {/* Step 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm">
            1
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Konfirmasi Data & Token</h3>
          <p className="text-slate-600 leading-relaxed">
            Periksa kecocokan nama, nomor peserta, dan mata ujian pada layar konfirmasi. Masukkan <strong>Token Mulai Ujian</strong> yang diumumkan oleh Proktor Ruang Ujian, lalu centang persetujuan tata tertib sebelum menekan tombol Mulai.
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center text-sm">
            2
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Penyimpanan Jawaban Otomatis (Autosave)</h3>
          <p className="text-slate-600 leading-relaxed">
            Sistem secara otomatis menyimpan jawaban setiap kali Anda memilih atau mengubah pilihan. Indikator di pojok atas akan menampilkan status <strong>"Tersimpan"</strong> (Hijau) saat data berhasil tersinkronisasi dengan server.
          </p>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 font-bold flex items-center justify-center text-sm">
            3
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Fitur Tombol Ragu-ragu</h3>
          <p className="text-slate-600 leading-relaxed">
            Jika Anda belum yakin dengan jawaban yang dipilih, klik tombol <strong>Ragu-ragu</strong> di bagian bawah. Nomor soal tersebut akan ditandai dengan warna <strong>Kuning</strong> pada Daftar Soal sehingga memudahkan Anda meninjau kembali.
          </p>
        </div>

        {/* Step 4 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 font-bold flex items-center justify-center text-sm">
            4
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Daftar Soal & Navigasi Cepat</h3>
          <p className="text-slate-600 leading-relaxed">
            Gunakan tombol <strong>Daftar Soal</strong> di pojok kanan atas untuk melihat status seluruh nomor soal. Warna Biru menandakan telah dijawab, Kuning menandakan ragu-ragu, dan Abu-abu menandakan belum dijawab.
          </p>
        </div>

      </div>

      {/* Troubleshooting card */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-3 text-xs">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Prosedur Penanganan Kendala Teknis di Ruang Ujian
        </h4>
        <ul className="space-y-2 text-slate-600 leading-relaxed">
          <li>
            • <strong>Komputer Mati Lampu / Restart Tiba-tiba:</strong> Jangan panik. Seluruh jawaban Anda yang telah tersimpan tetap utuh di server. Beritahukan kepada Proktor untuk melakukan <em>Reset Login</em>, lalu login kembali pada komputer pengganti.
          </li>
          <li>
            • <strong>Waktu Habis Otomatis:</strong> Saat hitungan mundur berakhir, ujian akan otomatis terkunci dan jawaban terakhir Anda terkirim secara aman ke server.
          </li>
          <li>
            • <strong>Larangan Berpindah Tab:</strong> Sistem dilengkapi sensor pelacak perpindahan jendela. Berpindah tab akan memunculkan peringatan pelanggaran integritas.
          </li>
        </ul>
      </div>

    </div>
  );
};
