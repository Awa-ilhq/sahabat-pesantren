# Alur Sistem Sahabat Pesantren

Dokumen ini menggambarkan alur kerja aplikasi **sebagaimana diimplementasikan saat ini** di repo ini. Fokusnya alur end-to-end per peran, bukan spesifikasi baru.

- Frontend: React 19 + Vite, routing di `src/routes/AppRouter.jsx`.
- Sumber data: mode mock (`VITE_USE_MOCK=true`) atau API Laravel (`VITE_USE_MOCK=false`).
- Kontrak endpoint dan asumsi backend: lihat [`API_ASSUMPTIONS.md`](./API_ASSUMPTIONS.md).
- Diagram memakai Mermaid; bisa dirender di GitHub atau ekstensi Markdown Mermaid di VS Code.

## 1. Aktor dan hak akses

| Peran | Halaman awal | Yang bisa dilakukan |
| --- | --- | --- |
| **Santri** | `/santri/buat-laporan` | Membuat laporan, curhat dengan Teman Cerita (AI mock), melihat laporan sendiri, membaca/membalas percakapan, mengatur tampil/tidaknya nama, menjawab permintaan identitas, keluar cepat. |
| **Pengurus** | `/petugas/dashboard` | Melihat laporan yang ditujukan ke pengurus, mengubah status, membalas pesan, menambah catatan internal, meneruskan/eskalasi laporan. |
| **Pimpinan** | `/pimpinan/dashboard` | Melihat seluruh laporan non-sensitif, melakukan tindakan petugas, meminta izin melihat nama pelapor, melihat dashboard ringkasan, mengelola akun dan data santri, melihat audit log, memutuskan pengajuan penonaktifan akun pimpinan. |
| **Pengawas** | `/dashboard/pengawas` | Melihat laporan sensitif (`menyangkut_pimpinan`), melihat dashboard ringkasan, menelusuri audit log, menerima notifikasi terkait. Tidak dapat mengubah status, membalas pesan, atau menulis catatan internal. |

Aturan pembagian laporan:

- Kategori `masalah_pengurus` → penerima **pimpinan**.
- Laporan dengan `menyangkut_pimpinan = true` → penerima **pengawas** dan hanya terlihat oleh pelapor serta pengawas.
- Kategori lain → penerima **pengurus**.
- Pimpinan dapat melihat seluruh laporan kecuali laporan sensitif; pengurus hanya laporan dengan `penerima = pengurus`.
- Halaman awal mengikuti `dashboard` dari respons login bila ada; jika tidak, ditentukan dari peran (`homeForRole`).

## 2. Arsitektur singkat

```mermaid
flowchart LR
  subgraph Pengguna
    S["Santri"]
    P["Pengurus"]
    M["Pimpinan"]
    W["Pengawas"]
  end

  subgraph Frontend["Frontend React + Vite"]
    R["AppRouter + RequireAuth"]
    L["Layout per peran"]
    Q["TanStack Query"]
    A["src/api"]
  end

  subgraph SumberData["Sumber data"]
    MOCK["Mode mock<br/>state di memori"]
    BE["API Laravel"]
  end

  LS[("localStorage<br/>token + user")]

  S --> R
  P --> R
  M --> R
  W --> R
  R --> L
  L --> Q
  Q --> A
  A -->|"VITE_USE_MOCK=true"| MOCK
  A -->|"VITE_USE_MOCK=false"| BE
  R <--> LS
```

Catatan teknis:

- `src/api/index.js` memilih mock atau service asli secara otomatis.
- `src/api/client.js` memakai base URL `VITE_API_URL + "/api"` dan mengirim token sebagai `Authorization: Bearer`.
- Data mock hidup di memori dan kembali ke data awal saat halaman dimuat ulang.

## 3. Alur autentikasi dan sesi

```mermaid
flowchart TD
  A["Buka aplikasi"] --> B{"Sudah punya sesi?"}
  B -- "Tidak" --> C["Halaman publik /"]
  C --> D["/login"]
  B -- "Ya" --> E["RedirectIfAuthenticated"]
  E --> E1{"mustChangePassword?"}
  E1 -- "Ya" --> M["/ganti-password"]
  E1 -- "Tidak" --> F["Langsung ke halaman awal sesuai peran"]

  D --> G["Isi identifier dan password"]
  G --> H["POST login"]
  H --> I{"Berhasil?"}
  I -- "Tidak" --> J["Tampilkan pesan 401 / 403 / 422"]
  J --> G
  I -- "Ya" --> K["Simpan token + user di localStorage"]
  K --> L{"mustChangePassword?"}
  L -- "Ya" --> M
  L -- "Tidak" --> N{"Peran?"}
  N -- "santri" --> O["/santri/buat-laporan"]
  N -- "pengurus" --> P["/petugas/dashboard"]
  N -- "pimpinan" --> Q["/pimpinan/dashboard"]
  N -- "pengawas" --> W["/dashboard/pengawas"]

  O --> R["RequireAuth + layout per peran"]
  P --> R
  Q --> R
  W --> R
  M --> R
  R --> T{"Token ditolak 401?"}
  T -- "Ya" --> U["Hapus sesi, kembali ke /login"]
  T -- "Tidak" --> V{"Peran tidak cocok?"}
  V -- "Ya" --> W["/403"]
  V -- "Tidak" --> X["Halaman diizinkan"]
```

Perilaku sesi:

- Satu browser memakai satu akun; sesi disinkronkan antar-tab lewat `localStorage`.
- `RequireAuth` menjaga halaman berdasarkan login, peran, dan kewajiban ganti kata sandi.
- Semua peran, termasuk santri, yang memiliki `mustChangePassword` diarahkan ke `/ganti-password` dan tidak bisa membuka halaman lain sampai kata sandi diganti.
- Akun baru (pengurus buatan pimpinan maupun santri hasil impor) diberi `must_change_password: true`, sehingga pemilik akun wajib mengganti kata sandi awal saat pertama masuk.
- Respons `401` otomatis menghapus sesi dan mengarahkan ke `/login`.
- Respons `403` ditampilkan sebagai akses ditolak, tanpa membocorkan apakah data ada.

### Logout otomatis dan keluar cepat

```mermaid
flowchart LR
  A["Aktivitas pengguna"] --> B["Reset timer idle"]
  B --> C{"Tidak ada aktivitas<br/>sampai batas waktu?"}
  C -- "Belum" --> A
  C -- "Sisa 30 detik" --> D["Tampilkan IdleWarning"]
  D --> E{"Pilih"}
  E -- "Tetap di sini" --> B
  E -- "Keluar sekarang" --> F["Logout + /login"]
  C -- "Waktu habis" --> F
```

| Peran | Batas idle | Catatan |
| --- | --- | --- |
| Santri | 180 detik (default) | Ada tombol **Keluar Cepat** dan pintasan tombol `Esc` dua kali. |
| Pengurus/Pimpinan | 900 detik (default) | Logout biasa dari header/sidebar. |

## 4. Alur santri

### 4.1 Membuat laporan

```mermaid
flowchart TD
  A["Login santri"] --> B["Menu Buat Laporan"]
  B --> C["Pilih kategori"]
  C --> C1["Perundungan"]
  C --> C2["Kekerasan fisik"]
  C --> C3["Kekerasan verbal"]
  C --> C4["Masalah dengan pengurus"]
  C --> C5["Masalah pribadi"]
  C --> C6["Lainnya"]
  C1 --> D["Tulis cerita minimal 20 karakter"]
  C2 --> D
  C3 --> D
  C4 --> D
  C5 --> D
  C6 --> D
  D --> E["Pilih tampilkan nama?<br/>default: tidak"]
  E --> E2{"Menyangkut pimpinan?"}
  E2 -- "Ya" --> E3["Tampilkan pemberitahuan<br/>laporan sensitif"]
  E2 -- "Tidak" --> F["Kirim laporan"]
  E3 --> F
  F --> G{"Validasi"}
  G -- "422" --> H["Tampilkan error per field"]
  H --> D
  G -- "429" --> I["Batas 3 laporan per hari<br/>coba lagi besok"]
  G -- "Berhasil" --> J["Server membuat nomor laporan,<br/>status baru, waktu, dan penerima"]
  J --> K{"Menyangkut pimpinan?"}
  K -- "Ya" --> L["penerima = pengawas"]
  K -- "Tidak" --> K2{"Kategori masalah_pengurus?"}
  K2 -- "Ya" --> M["penerima = pimpinan"]
  K2 -- "Tidak" --> M2["penerima = pengurus"]
  L --> N["Layar sukses + nomor laporan"]
  M --> N
  M2 --> N
  N --> O["Laporan Saya"]
```

Aturan penting:

- Kategori `masalah_pengurus` langsung diteruskan ke pimpinan; UI menampilkan pemberitahuan sebelum dikirim.
- Sakelar **Menyangkut pimpinan** menandai laporan sebagai sensitif (`menyangkut_pimpinan`). Laporan sensitif hanya dapat dibaca pelapor dan pengawas; pengurus/pimpinan tidak melihatnya di daftar maupun detail.
- Identitas **default tersembunyi**. Santri dapat menyalakan opsi tampilkan nama saat membuat laporan atau mengubahnya kapan saja di detail laporan.
- Batas 3 laporan per hari dan minimal 20 karakter adalah perilaku mock; backend dapat memvalidasi ulang (lihat `API_ASSUMPTIONS.md`).

### 4.2 Laporan Saya dan detail laporan

```mermaid
flowchart TD
  A["Laporan Saya"] --> B["Ringkasan jumlah laporan<br/>baru / diproses / selesai"]
  B --> C["Filter status, kategori, kode laporan"]
  C --> D["Pilih laporan"]
  D --> E["Detail laporan:<br/>nomor, status, kategori, tanggal, isi"]
  E --> F["Percakapan dengan petugas"]
  E --> G["Switch tampilkan namaku ke petugas"]
  E --> H{"Ada permintaan identitas?"}
  H -- "menunggu" --> I["Setujui atau Tolak"]
  H -- "disetujui" --> J["Cabut persetujuan"]
  H -- "ditolak / dicabut" --> K["Lihat status jawaban"]
  I --> L["Status permintaan diperbarui"]
  J --> L
  G --> M["tampilkan_identitas diperbarui"]
```

- Laporan yang memiliki permintaan identitas berstatus `menunggu` ditandai di daftar.
- Membuka detail laporan atau percakapan menandai notifikasi terkait sudah dibaca.
- Santri hanya bisa membuka laporan miliknya sendiri.

### 4.3 Teman Cerita (AI)

```mermaid
flowchart TD
  A["Menu Teman Cerita"] --> B["Baca disclaimer:<br/>AI, bukan manusia / layanan darurat"]
  B --> C["Santri menulis cerita atau memilih jawaban cepat"]
  C --> D{"Pesan mengandung tanda bahaya?"}
  D -- "Ya" --> E["Balasan keselamatan + arahkan ke<br/>pengurus/ustaz dan SAPA 129"]
  D -- "Tidak" --> F["Balasan empatik singkat<br/>1–3 kalimat"]
  E --> G["Setelah beberapa giliran<br/>AI menawarkan draf laporan"]
  F --> G
  G --> H{"Santri setuju?"}
  H -- "Tidak" --> C
  H -- "Ya" --> I["Draf kategori + isi ditampilkan<br/>dan bisa diedit"]
  I --> J["Lanjut ke /santri/buat-laporan<br/>lewat state router"]
  J --> K["Santri memeriksa dan mengirim sendiri"]
```

- Fitur ini hanya untuk santri dan tidak muncul di UI petugas/pimpinan.
- `VITE_USE_AI_MOCK=false` memakai AI asli backend melalui `POST /chat`. Bila variabel tidak diisi, nilainya mengikuti `VITE_USE_MOCK` (mock → balasan tiruan, API asli → AI asli). Set `true` untuk memaksa balasan tiruan.
- Percakapan Teman Cerita disimpan per akun di `localStorage` agar tidak hilang saat pindah halaman; riwayat hanya dihapus lewat tombol "Mulai ulang". Draf tidak disimpan dan hanya diteruskan lewat state router.
- AI tidak pernah mengirim laporan otomatis. Laporan tetap harus dikirim santri dari form.
- Untuk backend asli, lihat asumsi endpoint AI di [`API_ASSUMPTIONS.md`](./API_ASSUMPTIONS.md).

## 5. Alur pengurus

```mermaid
flowchart TD
  A["Login pengurus"] --> B["Dashboard pengurus<br/>/petugas/dashboard"]
  B --> C["Statistik laporan yang diteruskan<br/>ke peran pengurus"]
  C --> D["Daftar laporan /petugas"]
  D --> E["Cari kode / isi / pelapor<br/>filter status dan kategori"]
  E --> F["Buka detail laporan"]
  F --> G{"Laporan ditujukan ke pengurus?"}
  G -- "Tidak" --> H["Tidak muncul / 403"]
  G -- "Ya" --> I["Detail laporan"]
  I --> J["Ubah status:<br/>baru, diproses, selesai"]
  I --> K["Balas pesan ke pelapor"]
  I --> L["Tambah catatan internal<br/>tidak terlihat santri"]
  I --> M["Teruskan / eskalasi laporan"]
  J --> N["Status laporan berubah"]
  K --> O["Pesan baru untuk santri"]
  M --> P["Tujuan eskalasi tercatat"]
```

- Pengurus tidak melihat kartu permintaan identitas; data itu hanya untuk pimpinan dan pelapor. Backend juga tidak boleh mengirim field `permintaan_identitas` kepada pengurus.
- Nama pelapor tampil bila `tampilkan_identitas` aktif. Saat ini backend juga mengaktifkannya ketika santri menyetujui permintaan pimpinan, sehingga pengurus dan pimpinan sama-sama melihat nama. Jika kebijakan hanya pimpinan, backend harus mengirim nama hanya untuk pimpinan tanpa menyalakan flag. Selain itu UI menampilkan `Pelapor (identitas disembunyikan)`.
- Daftar menandai laporan yang melewati `batas_klarifikasi` sebagai **Lewat batas**. Ini indikator visual, bukan pembatasan otomatis.
- Catatan internal hanya dapat dibaca dan ditulis oleh petugas (pengurus/pimpinan).

## 6. Alur pimpinan

```mermaid
flowchart TD
  A["Login pimpinan"] --> B["Dashboard<br/>/pimpinan/dashboard"]
  B --> C["Ringkasan:<br/>total santri, total laporan,<br/>per status, per kategori"]
  B --> D["Menu Laporan /petugas"]
  D --> E["Semua laporan"]
  E --> F["Tindakan petugas:<br/>status, pesan, catatan, eskalasi"]
  F --> G["Minta lihat nama pelapor"]

  B --> X["Menu Audit /pimpinan/audit<br/>dan Persetujuan /pimpinan/pengajuan"]
  X --> X1["Telusuri audit log"]
  X --> X2["Putuskan pengajuan<br/>penonaktifan akun pimpinan"]

  B --> H["Menu Akun /pimpinan/akun"]
  H --> I["Tab Akun Pengurus / Pimpinan"]
  H --> J["Tab Akun Santri"]
  H --> K["Tab Impor / Update Santri"]
  I --> I1["Cari/filter, tambah akun pengurus,<br/>aktifkan/nonaktifkan;<br/>nonaktif akun pimpinan → pengajuan"]
  J --> J1["Cari/filter, aktifkan/nonaktifkan akun santri"]
  K --> K1["Unduh template / data saat ini"]
  K1 --> K2["Pilih berkas .xlsx maksimal 5 MB"]
  K2 --> K3["Pratinjau validasi<br/>maksimal 500 baris"]
  K3 --> K4{"Semua baris valid?"}
  K4 -- "Tidak" --> K5["Perbaiki berkas; impor dibatalkan"]
  K4 -- "Ya" --> K6["Impor: NIS menjadi kunci<br/>update atau buat akun baru"]
```

Ketentuan impor/ekspor santri:

- Format `.xlsx`, maksimal 5 MB dan 500 baris.
- NIS dipakai untuk memperbarui akun lama atau membuat akun baru.
- Akun lama boleh memakai password kosong (password lama tidak berubah).
- Akun baru wajib password minimal 8 karakter.
- Ekspor memuat data akun terkini dengan kolom yang sama; password dikosongkan.
- Santri yang tidak tercantum pada berkas tidak dihapus atau dinonaktifkan.

## 7. Alur pengawas, laporan sensitif, audit, dan persetujuan akun

```mermaid
flowchart TD
  A["Login pengawas"] --> B["Dashboard /dashboard/pengawas"]
  B --> C["Ringkasan: laporan baru,<br/>laporan sensitif, audit hari ini"]
  B --> D["Menu Laporan Sensitif<br/>/dashboard/pengawas/laporan"]
  D --> E["Daftar laporan menyangkut_pimpinan"]
  E --> F["Buka detail laporan"]
  F --> G["Baca isi dan percakapan;<br/>tanpa ubah status, balas, atau catatan internal"]
  B --> H["Menu Audit /dashboard/pengawas/audit"]
  H --> I["Filter aksi, aktor, dan tanggal"]
  B --> J["Notifikasi"]
```

```mermaid
flowchart TD
  A["Pimpinan menonaktifkan akun pimpinan"] --> B["PATCH status { active: false }"]
  B --> C{"422 requires_approval?"}
  C -- "Tidak" --> D["Akun langsung dinonaktifkan"]
  C -- "Ya" --> E["Modal persetujuan + request_id"]
  E --> F["Pengajuan muncul di<br/>/pimpinan/pengajuan"]
  F --> G{"Keputusan pimpinan lain"}
  G -- "Disetujui" --> H["PATCH deactivation-requests/{id}<br/>status disetujui; akun nonaktif"]
  G -- "Ditolak" --> I["Akun tetap aktif"]
```

Aturan:

- Laporan sensitif (`menyangkut_pimpinan`) hanya terlihat pelapor dan pengawas; pengurus/pimpinan mendapat 403/tidak melihatnya.
- Pengawas bersifat baca-saja: tombol ubah status, balas pesan, dan catatan internal disembunyikan.
- Audit log memakai `GET /admin/audit-logs` dan menampilkan tanggal + jam; halaman lain tetap menampilkan tanggal saja.
- Penonaktifan akun pimpinan membutuhkan persetujuan dua orang. Frontend menangkap `requiresApproval` pada error 422, bukan endpoint approve/reject terpisah.
- Pengawas hanya tersedia di mode mock sampai backend menyediakan peran dan route terkait.

## 8. State machine status laporan

```mermaid
stateDiagram-v2
  state "Baru" as baru
  state "Diproses" as diproses
  state "Selesai" as selesai

  [*] --> baru: laporan dibuat
  baru --> diproses: petugas menindaklanjuti
  baru --> selesai: petugas menutup
  diproses --> baru: dikembalikan
  diproses --> selesai: selesai
  selesai --> baru: dibuka kembali
  selesai --> diproses: dibuka kembali
```

Catatan:

- UI menyediakan ketiga status pada dropdown, sehingga perpindahan antar status dimungkinkan; backend tetap yang memvalidasi.
- Aksi **kirim pesan**, **catatan internal**, dan **eskalasi** tidak mengubah status laporan.
- Pada mock, `perlu_klarifikasi` dimatikan saat status diubah ke selain `baru`.

## 9. Alur permintaan identitas

```mermaid
stateDiagram-v2
  state "Menunggu jawaban santri" as menunggu
  state "Disetujui" as disetujui
  state "Ditolak" as ditolak
  state "Dicabut" as dicabut

  [*] --> menunggu: pimpinan mengajukan alasan
  menunggu --> disetujui: santri setuju
  menunggu --> ditolak: santri tolak
  disetujui --> dicabut: santri mencabut
  dicabut --> disetujui: santri menyalakan lagi
  ditolak --> menunggu: pimpinan mengajukan lagi
  dicabut --> menunggu: pimpinan mengajukan lagi
```

Aturan visibilitas nama:

```mermaid
flowchart TD
  A["Petugas membuka laporan"] --> B{"tampilkan_identitas = true?"}
  B -- "Ya" --> E["Nama pelapor terlihat"]
  B -- "Tidak" --> F["Pelapor (identitas disembunyikan)"]
```

- Permintaan baru hanya bisa diajukan pimpinan.
- Pimpinan mengisi alasan (20–1000 karakter) dan boleh melampirkan bukti JPG/PNG/PDF maksimal 5 MB.
- Permintaan ditolak `409` jika masih ada permintaan `menunggu` atau sudah `disetujui`.
- Santri dapat menolak tanpa memengaruhi proses laporan.
- Persetujuan saat ini mengaktifkan `tampilkan_identitas`, sehingga pengurus dan pimpinan dapat melihat nama. Jika kebijakan hanya pimpinan, backend harus mengirim nama hanya ke pimpinan tanpa menyalakan flag.
- Jika santri mencabut persetujuan, status permintaan menjadi `dicabut` dan nama kembali disembunyikan.

## 10. Alur notifikasi

```mermaid
flowchart TD
  A["Aplikasi aktif"] --> B["Ringkasan + daftar notifikasi<br/>setiap 30 detik + saat tab kembali fokus"]
  B --> C["GET /notifications/summary"]
  B --> D["GET /notifications"]
  D --> E{"Endpoint tersedia?"}
  E -- "Ya" --> F["Item notifikasi dari server"]
  E -- "404" --> G["Turunkan dari /reports/mine<br/>atau /reports + waktu baca"]
  C --> H{"Peran"}
  H -- "Santri" --> I["permintaan_identitas<br/>pesan_baru<br/>status_diubah"]
  H -- "Pengurus / Pimpinan" --> J["laporan_baru<br/>pesan_baru"]
  I --> K["Badge menu + halaman Notifikasi"]
  J --> K
  F --> K
  G --> K
  K --> L["Klik item menuju detail laporan"]
  L --> M["Server menandai sudah dibaca"]
  M --> N["Ringkasan dan daftar diinvalidasi, badge turun"]
```

| Peran | Kategori | Pemicu |
| --- | --- | --- |
| Santri | `permintaan_identitas` | Ada permintaan `menunggu` yang lebih baru dari waktu baca terakhir. |
| Santri | `pesan_baru` | Ada pesan dari pengguna lain setelah waktu baca terakhir. |
| Santri | `status_diubah` | Status laporan berubah setelah waktu baca terakhir. |
| Pengurus/Pimpinan | `laporan_baru` | Ada laporan `baru` yang belum pernah dibuka oleh peran tersebut. |
| Pengurus/Pimpinan | `pesan_baru` | Ada pesan dari pengguna lain pada laporan yang belum `selesai`. |

`pembaruan` adalah jumlah seluruh kategori; satu laporan dapat terhitung di lebih dari satu kategori.

Halaman Notifikasi menampilkan satu item per kategori per laporan (mis. satu laporan bisa muncul sebagai "pesan baru" dan "status berubah"). Setiap item langsung menuju detail laporan sesuai peran: `/santri/laporan/{id}` untuk santri, `/petugas/laporan/{id}` untuk pengurus/pimpinan. `GET /notifications` sudah tersedia dan mengembalikan hanya item belum dibaca. Bila endpoint mengembalikan `404`, frontend memakai fallback dengan menurunkan daftar dari data laporan dan waktu baca per peran (`santri_dibaca`, `pengurus_dibaca`, `pimpinan_dibaca`).

## 11. Peta route dan hak akses

| Route | Akses | Halaman |
| --- | --- | --- |
| `/` | Publik | Landing page |
| `/login` | Publik (redirect jika sudah login) | Login |
| `/ganti-password` | Semua yang login | Ganti kata sandi |
| `/santri` | Santri | Redirect ke `/santri/buat-laporan` |
| `/santri/buat-laporan` | Santri | Buat laporan |
| `/santri/teman-cerita` | Santri | Teman Cerita (AI, mock) |
| `/santri/laporan-saya` | Santri | Daftar laporan miliknya |
| `/santri/laporan/:id` | Santri (pemilik) | Detail laporan |
| `/santri/notifikasi` | Santri | Daftar notifikasi |
| `/santri/profil` | Santri | Profil |
| `/petugas` | Pengurus, Pimpinan | Daftar laporan |
| `/petugas/dashboard` | Pengurus | Dashboard pengurus |
| `/petugas/laporan/:id` | Pengurus, Pimpinan | Detail laporan |
| `/petugas/notifikasi` | Pengurus, Pimpinan | Daftar notifikasi |
| `/petugas/profil` | Pengurus, Pimpinan | Profil |
| `/pimpinan` | Pimpinan | Redirect ke `/pimpinan/dashboard` |
| `/pimpinan/dashboard` | Pimpinan | Dashboard ringkasan |
| `/pimpinan/akun` | Pimpinan | Kelola akun, impor/ekspor santri |
| `/pimpinan/audit` | Pimpinan | Audit log |
| `/pimpinan/pengajuan` | Pimpinan | Persetujuan penonaktifan akun pimpinan |
| `/pimpinan/notifikasi` | Pimpinan | Daftar notifikasi |
| `/pimpinan/profil` | Pimpinan | Profil |
| `/dashboard/pengawas` | Pengawas, Pimpinan | Dashboard pengawas |
| `/dashboard/pengawas/laporan` | Pengawas | Daftar laporan sensitif |
| `/dashboard/pengawas/laporan/:id` | Pengawas | Detail laporan sensitif (baca-saja) |
| `/dashboard/pengawas/audit` | Pengawas, Pimpinan | Audit log |
| `/dashboard/pengawas/notifikasi` | Pengawas, Pimpinan | Daftar notifikasi |
| `/dashboard/pengawas/profil` | Pengawas, Pimpinan | Profil |
| `/pengawas` | Pengawas | Redirect ke `/dashboard/pengawas` |
| `/403` | Publik | Akses ditolak |
| `*` | Publik | Halaman tidak ditemukan |

## 12. Endpoint utama yang tersedia untuk frontend

Base URL pemanggilan: `VITE_API_URL + "/api"`. Tabel di bawah memakai jalur relatif terhadap base tersebut (sesuai service di `src/api/services`).

| Kelompok | Metode & jalur | Peran | Kegunaan |
| --- | --- | --- | --- |
| Auth | `POST /auth/login` | Publik | Masuk dan memperoleh token |
| Auth | `POST /auth/password` | Login | Ganti kata sandi |
| Auth | `POST /logout` | Login | Keluar |
| Laporan | `POST /reports` | Santri | Membuat laporan |
| Laporan | `GET /reports/mine` | Santri | Daftar laporan sendiri |
| Laporan | `GET /reports` | Pengurus, Pimpinan, Pengawas | Daftar laporan sesuai akses peran (pengawas: hanya sensitif) |
| Laporan | `GET /reports/{id}` | Pemilik / petugas berhak / pengawas untuk laporan sensitif | Detail laporan |
| Laporan | `PATCH /reports/{id}/identity` | Santri | Ubah `tampilkan_identitas` |
| Laporan | `PATCH /reports/{id}/status` | Pengurus, Pimpinan | Ubah status |
| Laporan | `POST /reports/{id}/escalate` | Pengurus, Pimpinan | Teruskan laporan |
| Identitas | `POST /reports/{id}/identity-request` | Pimpinan | Ajukan permintaan melihat nama |
| Identitas | `PATCH /reports/{id}/identity-request` | Santri | Setujui (`1`) atau tolak (`0`) |
| Pesan | `GET /reports/{id}/messages` | Pemilik / petugas berhak | Baca percakapan |
| Pesan | `POST /reports/{id}/messages` | Pemilik / petugas berhak | Kirim pesan |
| Catatan | `POST /reports/{id}/notes` | Pengurus, Pimpinan | Tambah catatan internal |
| AI | `POST /chat` | Santri | Kirim `{ message, history }` dan terima balasan Teman Cerita (asumsi) |
| AI | `POST /ai/conversations/{id}/draft` | Santri | Buat draf laporan dari percakapan (asumsi) |
| Notifikasi | `GET /notifications/summary` | Login | Ringkasan badge notifikasi |
| Notifikasi | `GET /notifications` | Login | Daftar item notifikasi belum dibaca (fallback bila `404`) |
| Dashboard | `GET /dashboard/summary` | Pimpinan, Pengawas | Ringkasan dashboard |
| Admin | `GET /admin/santri/template` | Pimpinan | Template impor (tersedia di service; UI saat ini membuat template lokal) |
| Admin | `POST /admin/santri/import` | Pimpinan | Pratinjau / impor santri |
| Admin | `GET /admin/santri/export` | Pimpinan | Ekspor data santri |
| Admin | `GET /admin/accounts` | Pimpinan | Daftar akun petugas (asumsi) |
| Admin | `POST /admin/accounts` | Pimpinan | Buat akun pengurus (asumsi) |
| Admin | `PATCH /admin/accounts/{id}/status` | Pimpinan | Aktif/nonaktif akun; akun pimpinan butuh persetujuan (asumsi) |
| Admin | `GET /admin/deactivation-requests` | Pimpinan | Daftar pengajuan penonaktifan akun pimpinan (asumsi) |
| Admin | `PATCH /admin/deactivation-requests/{id}` | Pimpinan | Setujui/tolak pengajuan penonaktifan (asumsi) |
| Audit | `GET /admin/audit-logs` | Pengawas, Pimpinan | Audit log tindakan sensitif |
| Kesehatan | `GET /health` | Opsional | Health check kios/demo |

Catatan: `API_ASSUMPTIONS.md` menuliskan sebagian endpoint dengan prefix `/api/v1`, sedangkan `src/api/client.js` memakai `${VITE_API_URL}/api`. Samakan prefix ini dengan backend sebelum rilis produksi. Endpoint `template` dan `health` tersedia di kontrak/service, tetapi belum dipakai oleh UI saat ini.

## 13. Aturan privasi dan keamanan yang berlaku

- Nama pelapor disamarkan secara default; hanya terbuka bila santri menyalakan `tampilkan_identitas`. Saat ini persetujuan permintaan pimpinan juga menyalakan flag tersebut, jadi pengurus dan pimpinan sama-sama melihat nama.
- Pengurus tidak menerima data permintaan identitas dan tidak pernah melihat NIS/nomor santri di UI.
- Laporan `menyangkut_pimpinan` hanya dapat dibaca pelapor dan pengawas; pengurus dan pimpinan tidak menerima laporan itu dari API.
- Tanggal pada UI petugas ditampilkan tanpa jam, kecuali waktu pada audit log.
- Isi laporan dan draf tidak disimpan di browser. Hanya token sesi dan riwayat Teman Cerita (per akun) yang disimpan di `localStorage`; riwayat AI dihapus lewat tombol "Mulai ulang".
- Semua permintaan API mengirim token `Bearer`; respons `401` memicu logout otomatis.
- CSP membatasi koneksi ke `'self'` dan origin API produksi yang tercantum di `connect-src`; perbarui daftar itu bila origin API berubah.

## 14. Rujukan kode

| Bagian | File utama |
| --- | --- |
| Routing & proteksi peran | `src/routes/AppRouter.jsx`, `src/features/auth/RequireAuth.jsx` |
| Login & sesi | `src/pages/LoginPage.jsx`, `src/features/auth/AuthProvider.jsx`, `src/lib/session.js` |
| Idle & keluar cepat | `src/features/auth/useIdleTimer.js`, `src/features/auth/IdleWarning.jsx`, `src/layouts/SantriLayout.jsx` |
| Alur santri | `src/pages/santri/CreateReportPage.jsx`, `MyReportsPage.jsx`, `SantriReportDetailPage.jsx` |
| Alur petugas | `src/pages/staff/StaffReportListPage.jsx`, `StaffReportDetailPage.jsx` |
| Alur pimpinan | `src/pages/pimpinan/DashboardPage.jsx`, `AccountsPage.jsx`, `DeactivationRequestsPage.jsx` |
| Alur pengawas | `src/pages/pengawas/PengawasDashboardPage.jsx`, `SensitiveReportListPage.jsx`, `AuditLogPage.jsx` |
| Audit & persetujuan | `src/features/audit/hooks.js`, `src/features/deactivation/hooks.js`, `src/api/services/audit.js`, `src/api/services/deactivation.js` |
| Identitas | `src/features/identity/IdentityRequestStaff.jsx`, `IdentityRequestSantri.jsx` |
| Teman Cerita (AI) | `src/pages/santri/TemanCeritaPage.jsx`, `src/features/ai-chat/*`, `src/api/services/ai.js`, `src/api/mock/index.js` |
| Notifikasi | `src/features/notifications/hooks.js`, `queryKeys.js`, `src/api/services/notifications.js`, `src/pages/NotifikasiPage.jsx` |
| Kontrak API | `API_ASSUMPTIONS.md`, `src/api/services/*.js`, `src/api/mock/index.js` |
