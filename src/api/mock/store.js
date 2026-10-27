// Data contoh untuk mode mock. Semua fiktif dan netral (tidak grafis).
// Tidak pernah memakai storage browser: state hidup di memori modul saja.

const pad = (value) => String(value).padStart(2, '0')

const iso = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const offsetDate = (days) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return iso(date)
}

export const accounts = [
  {
    id: 1,
    username: 'santri1',
    password: 'santri123',
    name: 'Ahmad Fauzi',
    email: 'ahmad@example.test',
    nis: 'santri1',
    jenisKelamin: 'laki',
    teleponOrtu: '081234567890',
    role: 'santri',
    active: true,
    mustChangePassword: false,
  },
  {
    id: 2,
    username: 'santri2',
    password: 'santri123',
    name: 'Siti Aminah',
    email: 'siti@example.test',
    nis: 'santri2',
    jenisKelamin: 'perempuan',
    teleponOrtu: '081234567891',
    role: 'santri',
    active: true,
    mustChangePassword: true,
  },
  {
    id: 3,
    username: 'pengurus1',
    password: 'pengurus123',
    name: 'Ust. Rizal',
    role: 'pengurus',
    active: true,
    mustChangePassword: false,
  },
  {
    id: 4,
    username: 'pimpinan1',
    password: 'pimpinan123',
    name: 'KH. Abdullah',
    role: 'pimpinan',
    active: true,
    mustChangePassword: false,
  },
  {
    id: 5,
    username: 'pengurus2',
    password: 'pengurus123',
    name: 'Ustzh. Maryam',
    role: 'pengurus',
    active: false,
    mustChangePassword: false,
  },
  {
    id: 6,
    username: 'pengawas1',
    password: 'pengawas123',
    name: 'Dewan Pengawas',
    email: 'pengawas@example.test',
    role: 'pengawas',
    active: true,
    mustChangePassword: false,
  },
  {
    id: 7,
    username: 'pengurus3',
    password: 'pengurus123',
    name: 'Ust. Hasan',
    role: 'pengurus',
    active: true,
    mustChangePassword: false,
  },
  {
    id: 8,
    username: 'pimpinan2',
    password: 'pimpinan123',
    name: 'Ust. Mahfud',
    email: 'mahfud@example.test',
    role: 'pimpinan',
    active: true,
    mustChangePassword: false,
  },
]

// Nama pemilik laporan yang bukan akun login (data historis).
const peopleById = {
  100: 'Ridwan Hakim',
  101: 'Nur Hidayah',
  102: 'Fajar Ramadhan',
}

export const personName = (id) =>
  accounts.find((account) => account.id === id)?.name ?? peopleById[id] ?? null

let messageId = 100
let noteId = 100

const message = (from, senderName, body, daysAgo) => {
  const sender = accounts.find((account) => account.name === senderName)
  return {
    id: (messageId += 1),
    from: sender?.role ?? from,
    senderId: sender?.id ?? null,
    senderName,
    body,
    createdAt: offsetDate(daysAgo),
  }
}

const note = (authorName, body, daysAgo) => ({
  id: (noteId += 1),
  authorName,
  body,
  createdAt: offsetDate(daysAgo),
})

export const reports = [
  {
    id: 1,
    noLaporan: 1,
    ownerId: 1,
    kategori: 'perundungan',
    isi: 'Saya sering diejek soal asal daerah saya di kamar asrama saat waktu bebas.',
    tampilkanIdentitas: false,
    status: 'baru',
    penerima: 'pengurus',
    batasKlarifikasi: offsetDate(-1),
    perluKlarifikasi: true,
    escalated: null,
    createdAt: offsetDate(-2),
    messages: [],
    notes: [],
    permintaanIdentitas: {
      status: 'menunggu',
      alasan:
        'Pesantren perlu menemui kamu langsung agar kejadian ini bisa ditindak dan kamu terlindungi.',
      dimintaOleh: 'KH. Abdullah',
      bukti: null,
      createdAt: offsetDate(0),
      answeredAt: null,
    },
  },
  {
    id: 2,
    noLaporan: 2,
    ownerId: 1,
    kategori: 'kekerasan_fisik',
    isi: 'Ada teman yang mendorong saya sampai terjatuh di lapangan saat olahraga.',
    tampilkanIdentitas: true,
    status: 'diproses',
    penerima: 'pimpinan',
    batasKlarifikasi: offsetDate(-3),
    perluKlarifikasi: false,
    escalated: {
      tujuan: 'kepolisian',
      catatan: 'Sudah dilaporkan ke pihak berwenang bersama pimpinan.',
      at: offsetDate(-3),
    },
    createdAt: offsetDate(-4),
    messages: [
      message('santri', 'Ahmad Fauzi', 'Terima kasih sudah ditindaklanjuti, Pak.', -3),
      message('petugas', 'KH. Abdullah', 'Terima kasih sudah berani melapor. Kamu aman.', -3),
    ],
    notes: [
      note('Ust. Rizal', 'Sudah dikoordinasikan dengan wali kelas dan pengasuh asrama.', -3),
    ],
  },
  {
    id: 3,
    noLaporan: 3,
    ownerId: 2,
    kategori: 'kekerasan_verbal',
    isi: 'Ada yang membentak saya di depan teman-teman saat kegiatan malam.',
    tampilkanIdentitas: false,
    status: 'selesai',
    penerima: 'pengurus',
    batasKlarifikasi: offsetDate(-19),
    perluKlarifikasi: false,
    escalated: null,
    createdAt: offsetDate(-20),
    messages: [],
    notes: [],
  },
  {
    id: 4,
    noLaporan: 4,
    ownerId: 100,
    kategori: 'masalah_pengurus',
    isi: 'Saya merasa ada perlakuan yang tidak adil saat pembagian tugas kebersihan.',
    tampilkanIdentitas: false,
    menyangkutPimpinan: true,
    status: 'diproses',
    penerima: 'pengurus',
    batasKlarifikasi: offsetDate(0),
    perluKlarifikasi: false,
    escalated: null,
    createdAt: offsetDate(-1),
    messages: [],
    notes: [note('Ust. Rizal', 'Menunggu arahan pimpinan.', -1)],
  },
  {
    id: 5,
    noLaporan: 5,
    ownerId: 1,
    kategori: 'masalah_pribadi',
    isi: 'Belakangan saya sulit tidur dan sering merasa cemas tanpa alasan jelas.',
    tampilkanIdentitas: false,
    status: 'baru',
    penerima: 'pengurus',
    batasKlarifikasi: offsetDate(1),
    perluKlarifikasi: false,
    escalated: null,
    createdAt: offsetDate(0),
    messages: [],
    notes: [],
  },
  {
    id: 6,
    noLaporan: 6,
    ownerId: 2,
    kategori: 'perundungan',
    isi: 'Saya dikucilkan dari kelompok belajar dan tdak ada yang mau duduk dekat saya.',
    tampilkanIdentitas: false,
    status: 'diproses',
    penerima: 'pengurus',
    batasKlarifikasi: offsetDate(-5),
    perluKlarifikasi: false,
    escalated: null,
    createdAt: offsetDate(-6),
    messages: [
      message('petugas', 'Ust. Rizal', 'Boleh cerita sejak kapan hal ini terjadi?', -5),
      message('santri', 'Siti Aminah', 'Sejak sekitar dua minggu lalu, Pak.', -5),
    ],
    notes: [],
  },
  {
    id: 7,
    noLaporan: 7,
    ownerId: 101,
    kategori: 'kekerasan_verbal',
    isi: 'Ada yang mengatai saya dengan sebutan yang menyakitkan berulang kali.',
    tampilkanIdentitas: true,
    status: 'selesai',
    penerima: 'pengurus',
    batasKlarifikasi: offsetDate(-24),
    perluKlarifikasi: false,
    escalated: null,
    createdAt: offsetDate(-25),
    messages: [],
    notes: [],
  },
  {
    id: 8,
    noLaporan: 8,
    ownerId: 1,
    kategori: 'lainnya',
    isi: 'Saya ingin bertanya soal prosedur izin pulang, tidak tahu harus ke siapa.',
    tampilkanIdentitas: false,
    status: 'selesai',
    penerima: 'pengurus',
    batasKlarifikasi: offsetDate(-29),
    perluKlarifikasi: false,
    escalated: null,
    createdAt: offsetDate(-30),
    messages: [],
    notes: [],
  },
  {
    id: 9,
    noLaporan: 9,
    ownerId: 2,
    kategori: 'masalah_pengurus',
    isi: 'Ada pengurus yang menurut saya terlalu keras saat menegur kami.',
    tampilkanIdentitas: false,
    menyangkutPimpinan: true,
    status: 'baru',
    penerima: 'pengurus',
    batasKlarifikasi: offsetDate(-1),
    perluKlarifikasi: true,
    escalated: null,
    createdAt: offsetDate(-2),
    messages: [],
    notes: [],
  },
  {
    id: 10,
    noLaporan: 10,
    ownerId: 100,
    kategori: 'kekerasan_fisik',
    isi: 'Saya pernah ditendang saat latihan, tapi saya takut memberi tahu nama pelakunya.',
    tampilkanIdentitas: false,
    status: 'diproses',
    penerima: 'pengurus',
    batasKlarifikasi: offsetDate(-4),
    perluKlarifikasi: false,
    escalated: {
      tujuan: 'sapa_129',
      catatan: 'Konsultasi dengan layanan SAPA 129.',
      at: offsetDate(-4),
    },
    createdAt: offsetDate(-5),
    messages: [],
    notes: [],
  },
  {
    id: 11,
    noLaporan: 11,
    ownerId: 102,
    kategori: 'perundungan',
    isi: 'Ada yang mengambil barang saya tanpa izin dan tidak mengembalikannya.',
    tampilkanIdentitas: false,
    status: 'selesai',
    penerima: 'pengurus',
    batasKlarifikasi: offsetDate(-39),
    perluKlarifikasi: false,
    escalated: null,
    createdAt: offsetDate(-40),
    messages: [],
    notes: [],
  },
  {
    id: 12,
    noLaporan: 12,
    ownerId: 1,
    kategori: 'masalah_pribadi',
    isi: 'Saya sedang rindu rumah dan sulit fokus belajar belakangan ini.',
    tampilkanIdentitas: false,
    status: 'baru',
    penerima: 'pengurus',
    batasKlarifikasi: offsetDate(0),
    perluKlarifikasi: false,
    escalated: null,
    createdAt: offsetDate(-1),
    messages: [],
    notes: [],
  },
]

let reportSequence = reports.length

export const nextReportId = () => {
  reportSequence += 1
  return { id: reportSequence, noLaporan: reportSequence }
}

export const nextMessageId = () => (messageId += 1)
export const nextNoteId = () => (noteId += 1)
