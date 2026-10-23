import React, { useState } from 'react';
import { getAuditLogs } from '../../services/storage';
import { AuditLog } from '../../types';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  KeyRound,
  User,
  Layers,
  Award,
} from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [logs] = useState<AuditLog[]>(getAuditLogs());
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter(log => {
    if (categoryFilter !== 'ALL' && log.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        log.action.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getCategoryBadge = (cat: AuditLog['category']) => {
    switch (cat) {
      case 'AUTH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">Autentikasi</span>;
      case 'TOKEN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700">Token</span>;
      case 'EXAM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">Ujian CBT</span>;
      case 'PROCTOR':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800">Proktor</span>;
      case 'GRADING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">Penilaian</span>;
      case 'CONFIG':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">Konfigurasi</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{cat}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Audit Log & Rekam Jejak Keamanan Sistem
          </h1>
          <p className="text-xs text-slate-500">
            Pencatatan menyeluruh setiap peristiwa autentikasi, penerbitan token, autosave jawaban, reset sesi, dan penskoran
          </p>
        </div>
      </div>

      {/* Filter strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari aksi, pengguna, atau rincian log..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'AUTH', 'TOKEN', 'EXAM', 'PROCTOR', 'GRADING', 'CONFIG'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat === 'ALL' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>

      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="p-3.5 w-36">Waktu Kejadian</th>
                <th className="p-3.5 w-24 text-center">Kategori</th>
                <th className="p-3.5">Pelaku / Pengguna</th>
                <th className="p-3.5">Tindakan / Aksi</th>
                <th className="p-3.5">Rincian Peristiwa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('id-ID')}
                  </td>
                  <td className="p-3.5 text-center">
                    {getCategoryBadge(log.category)}
                  </td>
                  <td className="p-3.5">
                    <span className="font-semibold text-slate-900 block">{log.userName}</span>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">{log.userRole}</span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-800">
                    {log.action}
                  </td>
                  <td className="p-3.5 text-slate-600 leading-relaxed max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            Tidak ada riwayat aktivitas yang sesuai filter.
          </div>
        )}
      </div>

    </div>
  );
};
