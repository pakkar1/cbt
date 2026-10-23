import { Subject, Question, ExamPackage, ExamSession, User, SchoolSettings } from '../types';

export const INITIAL_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: 'SMP Negeri 1 Cerdas Mandiri',
  npsn: '20239182',
  academicYear: '2026/2027',
  semester: 'Ganjil',
  address: 'Jl. Pendidikan Merdeka No. 45, Jakarta Pusat',
  headmasterName: 'Dra. Hj. Siti Nurhasanah, M.Pd.',
  headmasterNip: '197405121998022001',
  logoText: 'SMP Cerdas',
  primaryColor: '#1d4ed8', // Royal Blue like standard national CBT
  requireSubmitToken: true,
  minSubmitTimeMinutes: 45,
  preventTabSwitch: true,
  maxViolationsAllowed: 3,
};

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub-pai',
    code: 'PAI',
    name: 'Pendidikan Agama Islam',
    description: 'Pendidikan Agama Islam dan Budi Pekerti jenjang SMP',
    targetClasses: ['7', '8', '9'],
    isActive: true,
    defaultDurationMinutes: 90,
    kkm: 75,
  },
  {
    id: 'sub-pak',
    code: 'PAK',
    name: 'Pendidikan Agama Kristen',
    description: 'Pendidikan Agama Kristen dan Budi Pekerti',
    targetClasses: ['7', '8', '9'],
    isActive: true,
    defaultDurationMinutes: 90,
    kkm: 75,
  },
  {
    id: 'sub-pakt',
    code: 'PAKT',
    name: 'Pendidikan Agama Katolik',
    description: 'Pendidikan Agama Katolik dan Budi Pekerti',
    targetClasses: ['7', '8', '9'],
    isActive: true,
    defaultDurationMinutes: 90,
    kkm: 75,
  },
  {
    id: 'sub-pah',
    code: 'PAH',
    name: 'Pendidikan Agama Hindu',
    description: 'Pendidikan Agama Hindu dan Budi Pekerti',
    targetClasses: ['7', '8', '9'],
    isActive: true,
    defaultDurationMinutes: 90,
    kkm: 75,
  },
  {
    id: 'sub-bind',
    code: 'BIND',
    name: 'Bahasa Indonesia',
    description: 'Literasi membaca, teks deskripsi, narasi, dan eksposisi',
    targetClasses: ['7', '8', '9'],
    isActive: true,
    defaultDurationMinutes: 120,
    kkm: 75,
  },
  {
    id: 'sub-mat',
    code: 'MAT',
    name: 'Matematika',
    description: 'Numerasi, aljabar, geometri, statistika, dan peluang',
    targetClasses: ['7', '8', '9'],
    isActive: true,
    defaultDurationMinutes: 120,
    kkm: 70,
  },
  {
    id: 'sub-pkn',
    code: 'PPKN',
    name: 'Pendidikan Pancasila/PKn',
    description: 'Nilai-nilai Pancasila, UUD 1945, dan norma hukum',
    targetClasses: ['7', '8', '9'],
    isActive: true,
    defaultDurationMinutes: 90,
    kkm: 75,
  },
  {
    id: 'sub-bing',
    code: 'BING',
    name: 'Bahasa Inggris',
    description: 'English literacy, reading texts, transactional dialogue',
    targetClasses: ['7', '8', '9'],
    isActive: true,
    defaultDurationMinutes: 90,
    kkm: 72,
  },
  {
    id: 'sub-ipa',
    code: 'IPA',
    name: 'Ilmu Pengetahuan Alam (IPA)',
    description: 'Fisika dasar, biologi organisme, sistem ekologi dan zat kimia',
    targetClasses: ['7', '8', '9'],
    isActive: true,
    defaultDurationMinutes: 120,
    kkm: 72,
  },
  {
    id: 'sub-ips',
    code: 'IPS',
    name: 'Ilmu Pengetahuan Sosial (IPS)',
    description: 'Geografi Nusantara, sejarah kebangsaan, dan interaksi ekonomi',
    targetClasses: ['7', '8', '9'],
    isActive: true,
    defaultDurationMinutes: 90,
    kkm: 75,
  },
  {
    id: 'sub-pjok',
    code: 'PJOK',
    name: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    description: 'Kebugaran jasmani, permainan bola besar/kecil, dan gizi seimbang',
    targetClasses: ['7', '8', '9'],
    isActive: true,
    defaultDurationMinutes: 90,
    kkm: 75,
  },
  {
    id: 'sub-sbk',
    code: 'SBK',
    name: 'Seni Budaya/Prakarya (SBK/Prakarya)',
    description: 'Seni rupa, seni musik nusantara, dan kerajinan bahan lunak',
    targetClasses: ['7', '8', '9'],
    isActive: true,
    defaultDurationMinutes: 90,
    kkm: 75,
  },
  {
    id: 'sub-infor',
    code: 'INF',
    name: 'Informatika',
    description: 'Berpikir komputasional, jaringan komputer, dan analisis data',
    targetClasses: ['7', '8', '9'],
    isActive: true,
    defaultDurationMinutes: 90,
    kkm: 75,
  },
  {
    id: 'sub-ai',
    code: 'AICOD',
    name: 'AI dan Coding',
    description: 'Dasar kecerdasan artifisial, etika data, dan logika pemrograman',
    targetClasses: ['7', '8', '9'],
    isActive: true,
    defaultDurationMinutes: 90,
    kkm: 75,
  },
];

export const INITIAL_QUESTIONS: Question[] = [
  // 1. Bahasa Indonesia - Stimulus Bacaan - Pilihan Ganda Biasa
  {
    id: 'q-bind-01',
    code: 'Q-BIND-01',
    subjectId: 'sub-bind',
    kelas: '9',
    topic: 'Literasi Membaca - Teks Informasi',
    competency: 'Menemukan informasi tersirat dalam teks eksplanasi ilmiah',
    difficulty: 'sedang',
    type: 'pilihan_ganda',
    stimulus: {
      type: 'text',
      title: 'Konservasi Mangrove di Pesisir Utara Jawa',
      content: `Hutan mangrove memiliki peranan vital sebagai benteng alami pencegah abrasi air laut dan penyerap karbon (blue carbon) yang sangat efisien. Berdasarkan penelitian Badan Riset dan Inovasi Nasional (BRIN) tahun 2025, satu hektare hutan mangrove yang sehat mampu menyerap karbon hingga empat kali lipat lebih banyak dibandingkan luas hutan tropis daratan yang sama.\n\nNamun, konversi lahan pesisir menjadi tambak intensif dan permukiman tanpa izin telah mengurangi luasan hutan mangrove di pantai utara Jawa hingga 30% dalam kurun waktu satu dekade terakhir. Untuk memulihkan ekosistem tersebut, program penanaman kembali jenis Rhizophora mucronata dan Avicennia marina gencar dilakukan dengan melibatkan kelompok tani nelayan lokal.`
    },
    prompt: 'Berdasarkan teks di atas, mengapa hutan mangrove dianggap memiliki keunggulan komparatif yang signifikan dibanding hutan tropis daratan dalam penanggulangan krisis iklim?',
    options: [
      { id: 'opt-a', text: 'Mangrove tahan terhadap terjangan gelombang tsunami dan pasang air laut' },
      { id: 'opt-b', text: 'Satu hektare mangrove mampu menyerap karbon hingga 4 kali lipat lebih banyak dibanding hutan daratan' },
      { id: 'opt-c', text: 'Mangrove lebih mudah ditanam oleh kelompok nelayan tanpa memerlukan biaya perawatan' },
      { id: 'opt-d', text: 'Hutan mangrove dapat dialihfungsikan menjadi tambak intensif yang bernilai ekonomi' },
      { id: 'opt-e', text: 'Akar napas mangrove tidak memerlukan oksigen dari atmosfer' }
    ],
    correctOptionId: 'opt-b',
    weight: 2,
    isActive: true,
    createdAt: '2026-03-01T08:00:00Z',
  },

  // 2. Bahasa Indonesia - Pilihan Ganda Kompleks (Centang Lebih dari Satu)
  {
    id: 'q-bind-02',
    code: 'Q-BIND-02',
    subjectId: 'sub-bind',
    kelas: '9',
    topic: 'Literasi Membaca - Rekomendasi Solutif',
    competency: 'Mengevaluasi gagasan dan dampak lingkungan dari aktivitas manusia',
    difficulty: 'sukar',
    type: 'pilihan_ganda_kompleks',
    stimulus: {
      type: 'text',
      title: 'Konservasi Mangrove di Pesisir Utara Jawa',
      content: `(Mengacu pada teks "Konservasi Mangrove di Pesisir Utara Jawa")`
    },
    prompt: 'Pilihlah DUA atau TIGA pernyataan yang sesuai dengan fakta dan fakta implisit dalam teks mengenai upaya pelestarian mangrove! (Jawaban benar lebih dari satu)',
    options: [
      { id: 'opt-c1', text: 'Alih fungsi lahan menjadi tambak berkontribusi pada penyusutan mangrove di pesisir utara' },
      { id: 'opt-c2', text: 'Spesies Rhizophora mucronata dan Avicennia marina digunakan sebagai bibit penanaman kembali' },
      { id: 'opt-c3', text: 'Semua jenis hutan daratan memiliki kapasitas penyerapan karbon yang lebih besar daripada mangrove' },
      { id: 'opt-c4', text: 'Keterlibatan masyarakat nelayan lokal merupakan salah satu strategi restorasi yang diterapkan' }
    ],
    correctOptionIds: ['opt-c1', 'opt-c2', 'opt-c4'],
    weight: 3,
    isActive: true,
    createdAt: '2026-03-01T08:00:00Z',
  },

  // 3. Matematika - Stimulus Tabel - Benar / Salah
  {
    id: 'q-mat-01',
    code: 'Q-MAT-01',
    subjectId: 'sub-mat',
    kelas: '9',
    topic: 'Statistika & Analisis Data',
    competency: 'Menafsirkan data tabel frekuensi dan menghitung pemusatan data',
    difficulty: 'sedang',
    type: 'benar_salah',
    stimulus: {
      type: 'table',
      title: 'Data Penggunaan Kuota Internet Belajar Siswa Kelas 9 (GB per Bulan)',
      content: `| Rentang Kuota (GB) | Frekuensi Siswa |\n| :--- | :--- |\n| 10 - 14 | 12 |\n| 15 - 19 | 28 |\n| 20 - 24 | 40 |\n| 25 - 29 | 15 |\n| 30 - 34 | 5 |\n*Total responden: 100 siswa*`
    },
    prompt: 'Tentukan kebenaran dari masing-masing pernyataan berikut berdasarkan data tabel di atas:',
    trueFalseItems: [
      { id: 'tf-1', statement: 'Modus data penggunaan kuota berada pada interval rentang 20 - 24 GB.', correctAnswer: true },
      { id: 'tf-2', statement: 'Lebih dari 60% siswa menghabiskan kuota internet minimal 20 GB dalam sebulan.', correctAnswer: true },
      { id: 'tf-3', statement: 'Jumlah siswa yang memakai kuota kurang dari 15 GB adalah 28 orang.', correctAnswer: false },
      { id: 'tf-4', statement: 'Median (nilai tengah) data terletak pada kelompok interval rentang 15 - 19 GB.', correctAnswer: false }
    ],
    weight: 3,
    isActive: true,
    createdAt: '2026-03-01T08:00:00Z',
  },

  // 4. IPA - Menjodohkan (Matching)
  {
    id: 'q-ipa-01',
    code: 'Q-IPA-01',
    subjectId: 'sub-ipa',
    kelas: '9',
    topic: 'Bioteknologi dan Pangan',
    competency: 'Mengidentifikasi mikroorganisme dan produk bioteknologi konvensional',
    difficulty: 'mudah',
    type: 'menjodohkan',
    stimulus: {
      type: 'text',
      title: 'Pemanfaatan Mikroorganisme dalam Bioteknologi Tradisional',
      content: 'Bioteknologi konvensional memanfaatkan mikroorganisme alami melalui proses fermentasi untuk menghasilkan olahan pangan bernutrisi tinggi.'
    },
    prompt: 'Jodohkanlah produk olahan fermentasi pada Kolom Premis dengan jenis mikroorganisme yang berperan pada Kolom Respon!',
    matchingPairs: [
      { id: 'm-1', premise: 'Tempe Kedelai', response: 'Rhizopus oryzae' },
      { id: 'm-2', premise: 'Yoghurt Susu', response: 'Lactobacillus bulgaricus' },
      { id: 'm-3', premise: 'Nata de Coco', response: 'Acetobacter xylinum' },
      { id: 'm-4', premise: 'Tape Ketan/Singkong', response: 'Saccharomyces cerevisiae' }
    ],
    weight: 3,
    isActive: true,
    createdAt: '2026-03-01T08:00:00Z',
  },

  // 5. Matematika / Numerasi - Isian Singkat
  {
    id: 'q-mat-02',
    code: 'Q-MAT-02',
    subjectId: 'sub-mat',
    kelas: '9',
    topic: 'Geometri dan Bangun Ruang',
    competency: 'Menghitung volume tabung dan penerapan konversi debit',
    difficulty: 'sedang',
    type: 'isian_singkat',
    stimulus: {
      type: 'formula',
      title: 'Bak Penampungan Air Sekolah',
      content: 'Bak penampungan air berbentuk tabung memiliki jari-jari alas r = 70 cm dan tinggi t = 100 cm. (Gunakan nilai π = 22/7).'
    },
    prompt: 'Berapakah volume total air yang dapat ditampung bak tersebut dalam satuan LITER? (Tuliskan hanya angkanya saja, contoh: 1500)',
    correctShortAnswer: ['1540', '1.540', '1540 liter', '1540 L'],
    weight: 2,
    isActive: true,
    createdAt: '2026-03-01T08:00:00Z',
  },

  // 6. AI dan Coding - Uraian (Essay with Rubric)
  {
    id: 'q-ai-01',
    code: 'Q-AICOD-01',
    subjectId: 'sub-ai',
    kelas: '9',
    topic: 'Etika AI dan Rekayasa Prompt',
    competency: 'Menganalisis bias data dan merumuskan pedoman penggunaan AI yang etis di sekolah',
    difficulty: 'sukar',
    type: 'uraian',
    stimulus: {
      type: 'text',
      title: 'Studi Kasus: Penggunaan Model Bahasa AI untuk Mengerjakan Esai Sekolah',
      content: 'Seorang siswa SMP menggunakan generative AI untuk menyusun karya tulis ilmiah tentang sejarah perjuangan bangsa. Siswa tersebut langsung menyalin (copy-paste) seluruh jawaban AI tanpa menyunting atau memeriksa sumber rujukan primer, sehingga terdapat beberapa fakta tanggal dan tokoh yang keliru (halusinasi AI).'
    },
    prompt: 'Jelaskan dua risiko utama dari tindakan siswa tersebut dan rumuskan 3 (tiga) prinsip etis yang seharusnya diterapkan siswa saat memanfaatkan AI sebagai sarana bantu pembelajaran!',
    essayRubric: {
      maxScore: 10,
      guidelines: 'Skor 10: Menjelaskan 2 risiko dengan logis (plagiarisme, kekeliruan fakta/halusinasi) dan menyertakan 3 prinsip etis aplikatif (verifikasi silang, atribusi sumber, AI sebagai pemantik ide bukan pengganti berpikir mandiri). Skor 5-8: Penjelasan parsial. Skor 1-4: Hanya menyebutkan definisi umum.'
    },
    essayKeyAnswer: 'Risiko utama adalah terjadinya plagiarisme (penurunan orisinalitas karya) dan penyebaran informasi keliru karena fenomena halusinasi AI. Tiga prinsip etis: 1. Melakukan verifikasi silang (cross-check) fakta terhadap buku teks atau jurnal primer. 2. Memberikan atribusi/sitasi jujur atas bantuan AI. 3. Memposisikan AI sebagai sarana brainstorming pemantik ide, bukan penulis tugas mandiri.',
    essayKeywords: ['plagiarisme', 'halusinasi', 'verifikasi', 'atribusi', 'pemantik ide'],
    weight: 5,
    isActive: true,
    createdAt: '2026-03-01T08:00:00Z',
  },

  // 7. Informatika - Flowchart & Algoritma - Pilihan Ganda Biasa
  {
    id: 'q-inf-01',
    code: 'Q-INF-01',
    subjectId: 'sub-infor',
    kelas: '9',
    topic: 'Berpikir Komputasional & Percabangan',
    competency: 'Menganalisis hasil trace table pada algoritma penentuan kelulusan',
    difficulty: 'mudah',
    type: 'pilihan_ganda',
    stimulus: {
      type: 'text',
      title: 'Pseudocode Seleksi Tim Olimpiade',
      content: `JIKA nilai_akademik >= 85 DAN nilai_wawancara >= 80 MAKA\n    status = "LOLOS TAHAP 1"\nSELAIN ITU JIKA nilai_akademik >= 90 MAKA\n    status = "CADANGAN KHUSUS"\nSELAIN ITU\n    status = "TIDAK LOLOS"`
    },
    prompt: 'Jika seorang siswa memperoleh nilai_akademik = 92 dan nilai_wawancara = 75, maka status apakah yang akan dicetak oleh sistem?',
    options: [
      { id: 'inf-a', text: 'LOLOS TAHAP 1' },
      { id: 'inf-b', text: 'CADANGAN KHUSUS' },
      { id: 'inf-c', text: 'TIDAK LOLOS' },
      { id: 'inf-d', text: 'ERROR SISTEM' }
    ],
    correctOptionId: 'inf-b',
    weight: 2,
    isActive: true,
    createdAt: '2026-03-01T08:00:00Z',
  },

  // 8. Pendidikan Pancasila - Pilihan Ganda Kompleks
  {
    id: 'q-pkn-01',
    code: 'Q-PPKN-01',
    subjectId: 'sub-pkn',
    kelas: '9',
    topic: 'Pancasila dalam Kehidupan Berbangsa',
    competency: 'Mengimplementasikan nilai Sila Keempat dalam musyawarah OSIS',
    difficulty: 'sedang',
    type: 'pilihan_ganda_kompleks',
    stimulus: {
      type: 'text',
      title: 'Musyawarah Pemilihan Tema Pentas Seni Sekolah',
      content: 'Pengurus OSIS mengadakan musyawarah untuk menentukan tema Pentas Seni Tahunan. Terjadi perbedaan pendapat sengit antara panitia sie acara dan bendahara mengenai alokasi anggaran dan jenis dekorasi.'
    },
    prompt: 'Manakah sikap yang mencerminkan pengamalan Sila Keempat Pancasila dalam situasi tersebut? (Pilih semua yang benar)',
    options: [
      { id: 'pkn-1', text: 'Menghargai setiap usulan anggota musyawarah dengan mendengarkan tanpa memotong pembicaraan' },
      { id: 'pkn-2', text: 'Ketua OSIS mengambil keputusan sepihak untuk mempercepat waktu rapat' },
      { id: 'pkn-3', text: 'Mengutamakan kepentingan bersama sekolah di atas kepentingan kelompok' },
      { id: 'pkn-4', text: 'Menerima dan melaksanakan hasil keputusan mufakat dengan iktikad baik dan tanggung jawab' }
    ],
    correctOptionIds: ['pkn-1', 'pkn-3', 'pkn-4'],
    weight: 3,
    isActive: true,
    createdAt: '2026-03-01T08:00:00Z',
  }
];

export const INITIAL_EXAM_PACKAGES: ExamPackage[] = [
  {
    id: 'pkg-anbk-literasi-01',
    code: 'PKG-LIT-9-2026',
    name: 'Asesmen Komprehensif Literasi & Bahasa - Kelas 9',
    subjectId: 'sub-bind',
    kelas: '9',
    durationMinutes: 60,
    questionIds: ['q-bind-01', 'q-bind-02', 'q-pkn-01'],
    randomizeQuestions: true,
    randomizeOptions: true,
    partialCreditForComplex: true,
    kkm: 75,
    totalWeight: 8,
    createdAt: '2026-03-05T08:00:00Z',
  },
  {
    id: 'pkg-anbk-numerasi-01',
    code: 'PKG-NUM-9-2026',
    name: 'Asesmen Komprehensif Sains, Numerasi & Informatika - Kelas 9',
    subjectId: 'sub-mat',
    kelas: '9',
    durationMinutes: 90,
    questionIds: ['q-mat-01', 'q-ipa-01', 'q-mat-02', 'q-inf-01', 'q-ai-01'],
    randomizeQuestions: true,
    randomizeOptions: true,
    partialCreditForComplex: true,
    kkm: 70,
    totalWeight: 15,
    createdAt: '2026-03-05T08:00:00Z',
  },
  {
    id: 'pkg-simulasi-lengkap',
    code: 'PKG-SIM-ALL-9',
    name: 'Simulasi Lengkap ANBK / TKA Terpadu SMP 2026',
    subjectId: 'sub-ai',
    kelas: '9',
    durationMinutes: 60,
    questionIds: [
      'q-bind-01',
      'q-bind-02',
      'q-mat-01',
      'q-ipa-01',
      'q-mat-02',
      'q-inf-01',
      'q-pkn-01',
      'q-ai-01'
    ],
    randomizeQuestions: true,
    randomizeOptions: true,
    partialCreditForComplex: true,
    kkm: 75,
    totalWeight: 23,
    createdAt: '2026-03-06T08:00:00Z',
  }
];

export const CBT_ROOMS = [
  { id: 'r1', name: 'Lab Komputer 1', code: 'Ruang 1', proctorId: 'usr-proktor-1', proctorName: 'Rahmat Hidayat, S.Kom', defaultTokenPrefix: '10' },
  { id: 'r2', name: 'Lab Komputer 2', code: 'Ruang 2', proctorId: 'usr-proktor-2', proctorName: 'Ahmad Fauzi, S.Kom', defaultTokenPrefix: '20' },
  { id: 'r3', name: 'Lab Komputer 3', code: 'Ruang 3', proctorId: 'usr-proktor-3', proctorName: 'Nurul Hidayah, S.Pd.', defaultTokenPrefix: '30' },
  { id: 'r4', name: 'Lab Multimedia', code: 'Ruang 4', proctorId: 'usr-proktor-4', proctorName: 'Dian Pratama, M.Kom', defaultTokenPrefix: '40' },
];

// Helper to generate exam sessions supporting multi-room (Lab 1, 2, 3, 4)
export function generateDefaultSessions(): ExamSession[] {
  const sessions: ExamSession[] = [];
  const timeslots = [
    { start: '07:30', end: '09:00' },
    { start: '09:15', end: '10:45' },
    { start: '11:00', end: '12:30' },
    { start: '13:00', end: '14:30' },
    { start: '14:45', end: '16:15' },
    { start: '16:30', end: '18:00' },
  ];

  const startDate = new Date();
  
  for (let day = 1; day <= 13; day++) {
    const curDate = new Date(startDate);
    curDate.setDate(startDate.getDate() + (day - 1));
    const dateStr = curDate.toISOString().split('T')[0];

    for (let sNum = 1; sNum <= 6; sNum++) {
      const time = timeslots[sNum - 1];
      const subjectIdx = ((day - 1) * 6 + (sNum - 1)) % INITIAL_SUBJECTS.length;
      const subject = INITIAL_SUBJECTS[subjectIdx];
      const packageId = sNum % 2 === 1 ? 'pkg-simulasi-lengkap' : 'pkg-anbk-numerasi-01';

      // Generate a session for each room so multi-room operates concurrently
      CBT_ROOMS.forEach((room, rIdx) => {
        // Sesi 1 Ruang 1 keeps canonical ID 'sesi-h1-s1', other rooms have '-rX'
        const sessionId = (rIdx === 0) ? `sesi-h${day}-s${sNum}` : `sesi-h${day}-s${sNum}-${room.id}`;
        
        let status: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'SUSPENDED' = 'DRAFT';
        if (day === 1 && sNum === 1) status = 'OPEN';
        else if (day === 1 && sNum === 2) status = 'IN_PROGRESS';

        // Distinct, predictable start tokens per room (e.g. Day 1 Sesi 1: SMP101 for Ruang 1, SMP102 for Ruang 2, etc.)
        const randomToken = `SMP${sNum}${rIdx + 1}${day % 10}`;

        sessions.push({
          id: sessionId,
          dayNumber: day,
          sessionNumber: sNum,
          date: dateStr,
          startTime: time.start,
          endTime: time.end,
          durationMinutes: 60,
          subjectId: subject.id,
          examPackageId: packageId,
          classes: ['9A', '9B', '9C'],
          roomName: room.name,
          maxCapacity: 30, // 30 PCs per room (standard CBT lab capacity)
          proctorId: room.proctorId,
          proctorName: room.proctorName,
          status,
          startToken: randomToken,
          isSubmitTokenRequired: true,
          minSubmitMinutes: 45,
        });
      });
    }
  }

  return sessions;
}

// Generate 120 realistic students for session 1 + classes
export function generateDefaultStudents(): User[] {
  const students: User[] = [];
  const indonesianFirstNames = [
    'Ahmad', 'Aditya', 'Aisyah', 'Anisa', 'Bayu', 'Bintang', 'Citra', 'Dimas', 
    'Dinda', 'Fajar', 'Farhan', 'Gita', 'Hafizh', 'Indah', 'Jovanka', 'Kevin', 
    'Laras', 'Maulana', 'Nadia', 'Naufal', 'Putri', 'Rafi', 'Rangga', 'Rizky', 
    'Salsabila', 'Syifa', 'Tegar', 'Tiara', 'Wahyu', 'Zahra'
  ];
  const indonesianLastNames = [
    'Pratama', 'Saputra', 'Ramadhan', 'Wijaya', 'Kusuma', 'Lestari', 'Hidayat', 
    'Permana', 'Nugroho', 'Siregar', 'Wibowo', 'Santoso', 'Utami', 'Firmansyah', 
    'Mahendra', 'Suryani', 'Anggraini', 'Nasution', 'Subagyo', 'Wulandari'
  ];

  const classes = ['9A', '9B', '9C', '8A', '8B', '7A', '7B'];

  for (let i = 1; i <= 120; i++) {
    const fName = indonesianFirstNames[(i - 1) % indonesianFirstNames.length];
    const lName = indonesianLastNames[(i * 3) % indonesianLastNames.length];
    const fullName = `${fName} ${lName}`;
    const studentNum = `P09-01-${String(i).padStart(3, '0')}`;
    const nisn = `009${String(1000000 + i)}`;
    const cls = classes[Math.floor((i - 1) / 20) % classes.length];

    students.push({
      id: `std-${i}`,
      username: studentNum,
      name: fullName,
      role: 'siswa',
      nomorPeserta: studentNum,
      nisn: nisn,
      kelas: cls.substring(0, 1),
      rombel: cls,
      sekolah: 'SMP Negeri 1 Cerdas Mandiri',
    });
  }

  return students;
}

export const INITIAL_STAFF_USERS: User[] = [
  {
    id: 'usr-superadmin',
    username: 'superadmin',
    name: 'Budi Santoso, M.T. (Super Admin)',
    role: 'super_admin',
    email: 'superadmin@smp-cerdas.sch.id',
    sekolah: 'SMP Negeri 1 Cerdas Mandiri',
  },
  {
    id: 'usr-admin',
    username: 'admin',
    name: 'Siti Rahmawati, S.Pd. (Admin CBT)',
    role: 'admin',
    email: 'admin@smp-cerdas.sch.id',
    sekolah: 'SMP Negeri 1 Cerdas Mandiri',
  },
  {
    id: 'usr-guru-1',
    username: 'guru',
    name: 'Drs. Hendro Wibisono (Guru IPA - Pembuat Soal)',
    role: 'guru',
    teacherType: 'pembuat_soal',
    assignedSubjectId: 'sub-ipa',
    subjectIds: ['sub-ipa'],
    assignedClasses: ['9A', '9B', '9C'],
    email: 'hendro@smp-cerdas.sch.id',
    sekolah: 'SMP Negeri 1 Cerdas Mandiri',
  },
  {
    id: 'usr-guru-2',
    username: 'gurubiasa',
    name: 'Dewi Lestari, S.Pd. (Guru IPA Kelas 9A & 9B)',
    role: 'guru',
    teacherType: 'guru_biasa',
    assignedSubjectId: 'sub-ipa',
    subjectIds: ['sub-ipa'],
    assignedClasses: ['9A', '9B'],
    email: 'dewi.lestari@smp-cerdas.sch.id',
    sekolah: 'SMP Negeri 1 Cerdas Mandiri',
  },
  {
    id: 'usr-guru-3',
    username: 'gurutik',
    name: 'Aris Munandar, S.Kom (Guru Informatika Kelas 8 & 9)',
    role: 'guru',
    teacherType: 'guru_biasa',
    assignedSubjectId: 'sub-infor',
    subjectIds: ['sub-infor'],
    assignedClasses: ['8A', '8B', '9A'],
    email: 'aris.munandar@smp-cerdas.sch.id',
    sekolah: 'SMP Negeri 1 Cerdas Mandiri',
  },
  {
    id: 'usr-proktor-1',
    username: 'proktor',
    name: 'Rahmat Hidayat, S.Kom (Proktor Ruang 1)',
    role: 'proktor',
    email: 'rahmat.proktor@smp-cerdas.sch.id',
    sekolah: 'SMP Negeri 1 Cerdas Mandiri',
    assignedSessionIds: ['sesi-h1-s1', 'sesi-h1-s2'],
    assignedRoom: 'Lab Komputer 1',
  },
  {
    id: 'usr-proktor-1b',
    username: 'proktor1',
    name: 'Rahmat Hidayat, S.Kom (Proktor Ruang 1)',
    role: 'proktor',
    email: 'rahmat.proktor@smp-cerdas.sch.id',
    sekolah: 'SMP Negeri 1 Cerdas Mandiri',
    assignedSessionIds: ['sesi-h1-s1', 'sesi-h1-s2'],
    assignedRoom: 'Lab Komputer 1',
  },
  {
    id: 'usr-proktor-2',
    username: 'proktor2',
    name: 'Ahmad Fauzi, S.Kom (Proktor Ruang 2)',
    role: 'proktor',
    email: 'ahmad.proktor@smp-cerdas.sch.id',
    sekolah: 'SMP Negeri 1 Cerdas Mandiri',
    assignedSessionIds: ['sesi-h1-s1-r2', 'sesi-h1-s2-r2'],
    assignedRoom: 'Lab Komputer 2',
  },
  {
    id: 'usr-proktor-3',
    username: 'proktor3',
    name: 'Nurul Hidayah, S.Pd. (Proktor Ruang 3)',
    role: 'proktor',
    email: 'nurul.proktor@smp-cerdas.sch.id',
    sekolah: 'SMP Negeri 1 Cerdas Mandiri',
    assignedSessionIds: ['sesi-h1-s1-r3', 'sesi-h1-s2-r3'],
    assignedRoom: 'Lab Komputer 3',
  },
  {
    id: 'usr-proktor-4',
    username: 'proktor4',
    name: 'Dian Pratama, M.Kom (Proktor Ruang 4)',
    role: 'proktor',
    email: 'dian.proktor@smp-cerdas.sch.id',
    sekolah: 'SMP Negeri 1 Cerdas Mandiri',
    assignedSessionIds: ['sesi-h1-s1-r4', 'sesi-h1-s2-r4'],
    assignedRoom: 'Lab Multimedia',
  },
];
