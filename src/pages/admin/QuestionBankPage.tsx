import React, { useState } from 'react';
import { Question, QuestionType, DifficultyLevel } from '../../types';
import {
  getQuestions,
  getSubjects,
  saveQuestion,
  deleteQuestion,
} from '../../services/storage';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Trash2,
  Edit3,
  Layers,
  BookOpen,
  CheckCircle,
  FileText,
  Download,
  Upload,
} from 'lucide-react';

export const QuestionBankPage: React.FC = () => {
  const subjects = getSubjects();
  const [questions, setQuestions] = useState<Question[]>(getQuestions());
  
  // Filters
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form State for new/edit question
  const [formSubjectId, setFormSubjectId] = useState(subjects[0]?.id || 'sub-bind');
  const [formKelas, setFormKelas] = useState('9');
  const [formTopic, setFormTopic] = useState('');
  const [formCompetency, setFormCompetency] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<DifficultyLevel>('sedang');
  const [formType, setFormType] = useState<QuestionType>('pilihan_ganda');
  const [formPrompt, setFormPrompt] = useState('');
  const [formWeight, setFormWeight] = useState(2);
  
  // Stimulus
  const [hasStimulus, setHasStimulus] = useState(false);
  const [stimulusType, setStimulusType] = useState<'text' | 'table' | 'formula'>('text');
  const [stimulusTitle, setStimulusTitle] = useState('');
  const [stimulusContent, setStimulusContent] = useState('');

  // Options (for PG & PG Kompleks)
  const [options, setOptions] = useState<Array<{ id: string; text: string }>>([
    { id: 'opt-a', text: '' },
    { id: 'opt-b', text: '' },
    { id: 'opt-c', text: '' },
    { id: 'opt-d', text: '' },
  ]);
  const [correctOptionId, setCorrectOptionId] = useState('opt-a');
  const [correctOptionIds, setCorrectOptionIds] = useState<string[]>(['opt-a', 'opt-b']);

  // True/False Items
  const [tfItems, setTfItems] = useState([
    { id: 'tf-1', statement: '', correctAnswer: true },
    { id: 'tf-2', statement: '', correctAnswer: false },
  ]);

  // Matching Pairs
  const [matchingPairs, setMatchingPairs] = useState([
    { id: 'm-1', premise: '', response: '' },
    { id: 'm-2', premise: '', response: '' },
  ]);

  // Short Answer
  const [shortAnswers, setShortAnswers] = useState('');

  // Essay Rubric & Google Form Answer Key
  const [essayMaxScore, setEssayMaxScore] = useState(10);
  const [essayGuidelines, setEssayGuidelines] = useState('');
  const [essayKeyAnswer, setEssayKeyAnswer] = useState('');
  const [essayKeywords, setEssayKeywords] = useState('');

  const reload = () => setQuestions(getQuestions());

  const openAddModal = () => {
    setEditingQuestion(null);
    setFormSubjectId(subjects[0]?.id || 'sub-bind');
    setFormKelas('9');
    setFormTopic('');
    setFormCompetency('');
    setFormDifficulty('sedang');
    setFormType('pilihan_ganda');
    setFormPrompt('');
    setFormWeight(2);
    setHasStimulus(false);
    setStimulusTitle('');
    setStimulusContent('');
    setEssayMaxScore(10);
    setEssayGuidelines('');
    setEssayKeyAnswer('');
    setEssayKeywords('');
    setOptions([
      { id: 'opt-a', text: '' },
      { id: 'opt-b', text: '' },
      { id: 'opt-c', text: '' },
      { id: 'opt-d', text: '' },
    ]);
    setCorrectOptionId('opt-a');
    setCorrectOptionIds(['opt-a']);
    setIsEditorOpen(true);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setFormSubjectId(q.subjectId);
    setFormKelas(q.kelas);
    setFormTopic(q.topic);
    setFormCompetency(q.competency);
    setFormDifficulty(q.difficulty);
    setFormType(q.type);
    setFormPrompt(q.prompt);
    setFormWeight(q.weight);

    if (q.stimulus) {
      setHasStimulus(true);
      setStimulusType(q.stimulus.type === 'image' ? 'text' : q.stimulus.type);
      setStimulusTitle(q.stimulus.title || '');
      setStimulusContent(q.stimulus.content);
    } else {
      setHasStimulus(false);
      setStimulusTitle('');
      setStimulusContent('');
    }

    if (q.options) setOptions(q.options);
    if (q.correctOptionId) setCorrectOptionId(q.correctOptionId);
    if (q.correctOptionIds) setCorrectOptionIds(q.correctOptionIds);
    if (q.trueFalseItems) setTfItems(q.trueFalseItems);
    if (q.matchingPairs) setMatchingPairs(q.matchingPairs);
    if (q.correctShortAnswer) setShortAnswers(q.correctShortAnswer.join(', '));
    if (q.essayRubric) {
      setEssayMaxScore(q.essayRubric.maxScore);
      setEssayGuidelines(q.essayRubric.guidelines);
    }
    setEssayKeyAnswer(q.essayKeyAnswer || '');
    setEssayKeywords(q.essayKeywords ? q.essayKeywords.join(', ') : '');

    setIsEditorOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPrompt.trim()) return;

    const newQ: Question = {
      id: editingQuestion ? editingQuestion.id : `q-${Date.now()}`,
      code: editingQuestion ? editingQuestion.code : `Q-${Date.now().toString().slice(-4)}`,
      subjectId: formSubjectId,
      kelas: formKelas,
      topic: formTopic || 'Umum',
      competency: formCompetency || 'Kompetensi Asesmen Standar',
      difficulty: formDifficulty,
      type: formType,
      prompt: formPrompt,
      weight: Number(formWeight),
      isActive: true,
      createdAt: editingQuestion ? editingQuestion.createdAt : new Date().toISOString(),
      stimulus: hasStimulus && stimulusContent.trim() ? {
        type: stimulusType,
        title: stimulusTitle,
        content: stimulusContent,
      } : undefined,
    };

    if (formType === 'pilihan_ganda') {
      newQ.options = options.filter(o => o.text.trim().length > 0);
      newQ.correctOptionId = correctOptionId;
    } else if (formType === 'pilihan_ganda_kompleks') {
      newQ.options = options.filter(o => o.text.trim().length > 0);
      newQ.correctOptionIds = correctOptionIds;
    } else if (formType === 'benar_salah') {
      newQ.trueFalseItems = tfItems.filter(it => it.statement.trim().length > 0);
    } else if (formType === 'menjodohkan') {
      newQ.matchingPairs = matchingPairs.filter(p => p.premise.trim() && p.response.trim());
    } else if (formType === 'isian_singkat') {
      newQ.correctShortAnswer = shortAnswers.split(',').map(s => s.trim()).filter(Boolean);
    } else if (formType === 'uraian') {
      newQ.essayRubric = {
        maxScore: Number(essayMaxScore),
        guidelines: essayGuidelines,
      };
      newQ.essayKeyAnswer = essayKeyAnswer.trim() || undefined;
      const kw = essayKeywords.split(',').map(s => s.trim()).filter(Boolean);
      newQ.essayKeywords = kw.length > 0 ? kw : undefined;
    }

    saveQuestion(newQ);
    reload();
    setIsEditorOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus butir soal ini dari bank soal?')) {
      deleteQuestion(id);
      reload();
    }
  };

  // Filtered list
  const filteredQuestions = questions.filter(q => {
    if (selectedSubjectId !== 'ALL' && q.subjectId !== selectedSubjectId) return false;
    if (selectedType !== 'ALL' && q.type !== selectedType) return false;
    if (selectedDifficulty !== 'ALL' && q.difficulty !== selectedDifficulty) return false;
    if (searchQuery) {
      const qText = `${q.prompt} ${q.topic} ${q.code}`.toLowerCase();
      if (!qText.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Bank Soal & Penulisan Butir Asesmen
          </h1>
          <p className="text-xs text-slate-500">
            Kelola soal literasi, numerasi, dan sains mencakup 14 mata pelajaran SMP
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Butir Soal Baru</span>
        </button>
      </div>

      {/* Filter Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari topik atau materi..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">Semua Mata Pelajaran (14 Mapel)</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          {/* Question Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">Semua Tipe Format Soal</option>
              <option value="pilihan_ganda">Pilihan Ganda Tunggal</option>
              <option value="pilihan_ganda_kompleks">Pilihan Ganda Kompleks</option>
              <option value="benar_salah">Benar / Salah</option>
              <option value="menjodohkan">Menjodohkan</option>
              <option value="isian_singkat">Isian Singkat</option>
              <option value="uraian">Uraian / Essay</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">Semua Tingkat Kesukaran</option>
              <option value="mudah">Mudah</option>
              <option value="sedang">Sedang</option>
              <option value="sukar">Sukar</option>
            </select>
          </div>

        </div>
      </div>

      {/* Questions Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="p-3.5 w-12 text-center">No</th>
                <th className="p-3.5 w-24">Kode</th>
                <th className="p-3.5">Mata Pelajaran & Materi</th>
                <th className="p-3.5">Format Soal</th>
                <th className="p-3.5 text-center">Tingkat</th>
                <th className="p-3.5 text-center">Bobot</th>
                <th className="p-3.5 text-center">Stimulus</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuestions.map((q, idx) => {
                const sub = subjects.find(s => s.id === q.subjectId);

                return (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">{q.code}</td>
                    <td className="p-3.5 space-y-0.5">
                      <p className="font-bold text-slate-900">{sub?.name || 'Mapel'}</p>
                      <p className="text-slate-500 line-clamp-1">{q.topic} · Kelas {q.kelas}</p>
                      <p className="text-slate-700 text-[11px] line-clamp-2 mt-1">{q.prompt}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium capitalize">
                        {q.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          q.difficulty === 'mudah'
                            ? 'bg-emerald-100 text-emerald-800'
                            : q.difficulty === 'sedang'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-800">{q.weight}</td>
                    <td className="p-3.5 text-center">
                      {q.stimulus ? (
                        <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {q.stimulus.type}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewQuestion(q)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Pratinjau Tampilan Siswa"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(q)}
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Sunting Soal"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Soal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredQuestions.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            Tidak ada butir soal yang sesuai dengan kriteria filter.
          </div>
        )}
      </div>

      {/* MODAL: PREVIEW QUESTION IN CBT FORMAT */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Pratinjau Butir Soal ANBK</h3>
                <p className="text-xs text-slate-500 font-mono">{previewQuestion.code} · Bobot {previewQuestion.weight} Poin</p>
              </div>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Stimulus Box */}
            {previewQuestion.stimulus && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                {previewQuestion.stimulus.title && (
                  <h4 className="font-bold text-slate-900">{previewQuestion.stimulus.title}</h4>
                )}
                <div className="text-slate-700 whitespace-pre-line leading-relaxed">
                  {previewQuestion.stimulus.content}
                </div>
              </div>
            )}

            <div className="text-sm font-semibold text-slate-900">
              {previewQuestion.prompt}
            </div>

            {/* Options display */}
            {previewQuestion.options && (
              <div className="space-y-2">
                {previewQuestion.options.map((opt, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  const isCorrect =
                    previewQuestion.correctOptionId === opt.id ||
                    previewQuestion.correctOptionIds?.includes(opt.id);

                  return (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        isCorrect ? 'bg-emerald-50 border-emerald-300 font-semibold text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-white border flex items-center justify-center font-bold">
                          {letter}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                      {isCorrect && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                          KUNCI JAWABAN
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {previewQuestion.essayRubric && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-blue-900">Pedoman Penskoran Rubrik:</span>
                <p className="text-blue-800">{previewQuestion.essayRubric.guidelines}</p>
                <p className="text-blue-700 font-semibold">Skor Maksimal: {previewQuestion.essayRubric.maxScore}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewQuestion(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT QUESTION */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingQuestion ? 'Sunting Butir Soal' : 'Tulis Butir Soal Baru'}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mata Pelajaran:</label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Kelas:</label>
                  <select
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="7">Kelas 7</option>
                    <option value="8">Kelas 8</option>
                    <option value="9">Kelas 9</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Format Soal:</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as QuestionType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="pilihan_ganda">Pilihan Ganda Biasa</option>
                    <option value="pilihan_ganda_kompleks">Pilihan Ganda Kompleks</option>
                    <option value="benar_salah">Benar / Salah</option>
                    <option value="menjodohkan">Menjodohkan</option>
                    <option value="isian_singkat">Isian Singkat</option>
                    <option value="uraian">Uraian / Essay</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Topik / Materi:</label>
                  <input
                    type="text"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="Contoh: Ekosistem Pesisir"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tingkat Kesukaran:</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="mudah">Mudah</option>
                    <option value="sedang">Sedang</option>
                    <option value="sukar">Sukar</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Bobot Poin Soal:</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formWeight}
                    onChange={(e) => setFormWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Stimulus Section Toggle */}
              <div className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hasStimulus}
                      onChange={(e) => setHasStimulus(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    Sertakan Stimulus Bacaan / Data / Tabel
                  </label>
                  {hasStimulus && (
                    <select
                      value={stimulusType}
                      onChange={(e) => setStimulusType(e.target.value as any)}
                      className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="text">Teks Bacaan Artikel</option>
                      <option value="table">Tabel Data</option>
                      <option value="formula">Formula Matematika</option>
                    </select>
                  )}
                </div>

                {hasStimulus && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <input
                      type="text"
                      value={stimulusTitle}
                      onChange={(e) => setStimulusTitle(e.target.value)}
                      placeholder="Judul Stimulus..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                    <textarea
                      rows={3}
                      value={stimulusContent}
                      onChange={(e) => setStimulusContent(e.target.value)}
                      placeholder="Isi teks stimulus, paragraf, atau data tabel..."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                )}
              </div>

              {/* Question Prompt */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Kalimat Soal / Pertanyaan (Prompt):
                </label>
                <textarea
                  rows={3}
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  placeholder="Ketik pertanyaan dengan jelas..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              {/* Conditional Answer Config per Type */}
              {(formType === 'pilihan_ganda' || formType === 'pilihan_ganda_kompleks') && (
                <div className="space-y-2 border-t border-slate-200 pt-3">
                  <label className="font-bold text-slate-800 block">
                    Pilihan Jawaban & Kunci ({formType === 'pilihan_ganda' ? 'Pilih 1 Kunci' : 'Centang Semua Kunci Benar'}):
                  </label>
                  {options.map((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    return (
                      <div key={opt.id} className="flex items-center gap-2">
                        {formType === 'pilihan_ganda' ? (
                          <input
                            type="radio"
                            name="correct_pg"
                            checked={correctOptionId === opt.id}
                            onChange={() => setCorrectOptionId(opt.id)}
                            className="w-4 h-4 text-blue-600"
                          />
                        ) : (
                          <input
                            type="checkbox"
                            checked={correctOptionIds.includes(opt.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCorrectOptionIds([...correctOptionIds, opt.id]);
                              } else {
                                setCorrectOptionIds(correctOptionIds.filter(id => id !== opt.id));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                        )}
                        <span className="w-5 font-bold text-slate-500">{letter}.</span>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const updated = [...options];
                            updated[oIdx].text = e.target.value;
                            setOptions(updated);
                          }}
                          placeholder={`Teks pilihan ${letter}...`}
                          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {formType === 'isian_singkat' && (
                <div className="space-y-1 border-t border-slate-200 pt-3">
                  <label className="font-semibold text-slate-700 block">
                    Kunci Jawaban Singkat (Pisahkan dengan koma jika ada beberapa variasi):
                  </label>
                  <input
                    type="text"
                    value={shortAnswers}
                    onChange={(e) => setShortAnswers(e.target.value)}
                    placeholder="Contoh: 1540, 1.540, 1540 liter"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              )}

              {formType === 'uraian' && (
                <div className="space-y-3 border-t border-slate-200 pt-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
                    <label className="font-bold text-emerald-900 block text-xs">
                      Kunci Jawaban Resmi / Model Google Form Quiz:
                    </label>
                    <textarea
                      rows={2}
                      value={essayKeyAnswer}
                      onChange={(e) => setEssayKeyAnswer(e.target.value)}
                      placeholder="Model jawaban yang benar untuk acuan koreksi..."
                      className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-slate-900 text-xs"
                    />
                    <label className="font-bold text-emerald-900 block text-xs">
                      Kata Kunci Validasi Otomatis (Pisahkan dengan koma):
                    </label>
                    <input
                      type="text"
                      value={essayKeywords}
                      onChange={(e) => setEssayKeywords(e.target.value)}
                      placeholder="Contoh: mitigasi, adaptasi, gas rumah kaca, emisi"
                      className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-slate-900 text-xs"
                    />
                  </div>

                  <label className="font-bold text-slate-800 block">
                    Rubrik Penilaian & Skor Maksimal:
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={essayMaxScore}
                      onChange={(e) => setEssayMaxScore(Number(e.target.value))}
                      placeholder="Skor Maks"
                      className="w-24 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    />
                    <input
                      type="text"
                      value={essayGuidelines}
                      onChange={(e) => setEssayGuidelines(e.target.value)}
                      placeholder="Pedoman skor (kriteria jawaban lengkap)..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
                >
                  Simpan ke Bank Soal
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
