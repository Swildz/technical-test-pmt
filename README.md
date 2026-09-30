# Technical Assessment Solution: Subscriber Usage System

Repository implementasi dan dokumentasi komprehensif untuk penyelesaian **Technical Test** dengan backend berbasis **Node.js & Express.js**.

---

## 📑 Daftar Isi

1. [Ikhtisar & Arsitektur](#ikhtisar--arsitektur)
2. [Tech Stack & Prasyarat](#tech-stack--prasyarat)
3. [Panduan Instalasi & Menjalankan Aplikasi](#panduan-instalasi--menjalankan-aplikasi)
4. [Q1: Subscriber Usage API & Web Dashboard](#q1-subscriber-usage-api--web-dashboard)
5. [Q2: Usage Snapshot Automation (Cron & Cleanup)](#q2-usage-snapshot-automation-cron--cleanup)
6. [Q3: Subscriber & Usage SQL](#q3-subscriber--usage-sql)
7. [Q4: Troubleshoot & Explain](#q4-troubleshoot--explain)
8. [Struktur Direktori Proyek](#struktur-direktori-proyek)
9. [Git & Pengujian Otomatis](#git--pengujian-otomatis)

---

## 1. Ikhtisar & Arsitektur

Proyek ini dibangun untuk memenuhi seluruh persyaratan technical test:
- **Q1: REST API** untuk mencatat dan mengambil riwayat penggunaan pelanggan (*subscriber usage*) dengan penyimpanan *in-memory* yang aman dan tervalidasi, dilengkapi dengan **Interactive Web Dashboard** responsif.
- **Q2: Otomasi Snapshot CSV** menggunakan penjadwal cron (pukul 08:00, 12:00, 15:00 WIB), konvensi penamaan terstandarisasi, dan skrip terpisah untuk retensi pembersihan file snapshot > 30 hari.
- **Q3: Solusi SQL Berbasis Relasional** yang mencakup DDL, DML, Query agregasi, sorting, dan subquery dengan penjelasan matematis dan skrip simulasi interaktif.
- **Q4: Analisis Mendalam & Perbaikan Bug** pada fungsi fungsional `Array.prototype.reduce()`, akar masalah teknis, kode perbaikan standar & defensif, serta strategi preventif jangka panjang.

---

## 2. Tech Stack & Prasyarat

- **Runtime**: Node.js (v14.x atau lebih baru)
- **Package Manager**: NPM (v6.x atau lebih baru)
- **Framework Backend**: Express.js (v4.18.2)
- **Penjadwal Cron**: `node-cron` (v3.0.3) dengan dukungan timezone `Asia/Jakarta` (WIB, UTC+7)
- **CORS**: `cors` (v2.8.5)
- **Frontend**: HTML5 Semantik, Vanilla CSS3 (Custom Design System, Flexbox/Grid), Vanilla JavaScript (No heavy frameworks required)

---

## 3. Panduan Instalasi & Menjalankan Aplikasi

### Langkah 1: Clone / Buka Repository
```bash
git clone <repository_url>
cd PMT
```

### Langkah 2: Instal Dependensi
```bash
npm install
```

### Langkah 3: Menjalankan Server & Cron Job
```bash
npm start
```
*Output di terminal:*
```text
====================================================
  Subscriber Usage API Service running on port 3000
  API Base URL:     http://localhost:3000/api
  Web Dashboard:    http://localhost:3000
  Health Check:     http://localhost:3000/health
====================================================
[CRON] Scheduled Usage Snapshot cron initialized: "0 8,12,15 * * *" in timezone "Asia/Jakarta" (08:00, 12:00, 15:00 WIB).
```

### Langkah 4: Buka Web Dashboard
Buka browser Anda dan akses:
👉 **`http://localhost:3000`**

### Perintah NPM yang Tersedia (NPM Scripts)

| Perintah | Deskripsi |
| :--- | :--- |
| `npm start` | Menjalankan Express server dan mengaktifkan cron snapshot otomatis |
| `npm test` | Menjalankan seluruh rangkaian tes otomatis (API, Q4, dan SQL) |
| `npm run test:api` | Menjalankan tes integrasi otomatis untuk seluruh endpoint REST API |
| `npm run test:q4` | Menjalankan demo perbandingan kode bug vs perbaikan Q4 |
| `npm run test:sql` | Menjalankan simulasi & verifikasi seluruh query SQL Q3 |
| `npm run snapshot:now` | Menghasilkan file snapshot CSV saat ini secara instan |
| `npm run cleanup:snapshots` | Menjalankan skrip pembersih file CSV snapshot yang lebih tua dari 30 hari |
| `npm run simulate:old` | Membuat file CSV simulasi (usia 45, 35, 10, dan 2 hari) untuk menguji skrip cleanup |

---

## 4. Q1: Subscriber Usage API & Web Dashboard

### 4.1 Desain Endpoints

| Method | Endpoint | Deskripsi | Status Code |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/usage` | Mencatat riwayat penggunaan baru pelanggan | `201 Created` / `400 Bad Request` |
| `GET` | `/api/usage` | Mengambil seluruh riwayat penggunaan (mendukung filter & paginasi) | `200 OK` |
| `GET` | `/api/usage/:id` | Mengambil satu record penggunaan berdasarkan ID unik | `200 OK` / `404 Not Found` |
| `GET` | `/api/subscribers` | Mengambil daftar pelanggan beserta ringkasan agregasi penggunaan | `200 OK` |
| `GET` | `/api/subscribers/:id/summary` | Mengambil ringkasan penggunaan spesifik seorang pelanggan | `200 OK` |
| `GET` | `/api/snapshots` | Mengambil daftar file snapshot CSV yang telah di-generate | `200 OK` |
| `POST` | `/api/snapshots/trigger` | Memicu pembuatan file snapshot CSV secara langsung | `201 Created` |
| `GET` | `/health` | Health check ketersediaan server | `200 OK` |

---

### 4.2 Spesifikasi Kontrak Request & Response

#### 1. POST `/api/usage` - Record Subscriber Usage

- **Headers**: `Content-Type: application/json`
- **Request Body Shape**:
  ```json
  {
    "subscriberId": "SUB01",
    "callMinutes": 45,
    "smsCount": 12,
    "dataUsageMB": 2000,
    "timestamp": "2025-08-02 10:00"
  }
  ```
  *Keterangan parameter:*
  - `subscriberId` *(string, wajib)*: ID pelanggan (contoh: `"SUB01"`).
  - `callMinutes` *(number, wajib)*: Menit panggilan (bilangan non-negatif $\ge 0$).
  - `smsCount` *(integer, wajib)*: Jumlah SMS (bilangan bulat non-negatif $\ge 0$).
  - `dataUsageMB` *(number, wajib)*: Penggunaan data dalam megabyte (non-negatif $\ge 0$).
  - `timestamp` *(string, opsional)*: Waktu perekaman. Jika tidak diisi, otomatis menggunakan tanggal dan jam sistem saat ini.

- **Response Berhasil (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Subscriber usage recorded successfully.",
    "data": {
      "id": "REC-009",
      "subscriberId": "SUB01",
      "callMinutes": 45,
      "smsCount": 12,
      "dataUsageMB": 2000,
      "timestamp": "2025-08-02 10:00"
    }
  }
  ```

- **Response Validasi Gagal (`400 Bad Request`)**:
  ```json
  {
    "success": false,
    "message": "Validation failed.",
    "errors": [
      "Field \"subscriberId\" is required and must be a non-empty string.",
      "Field \"callMinutes\" is required and must be a non-negative number."
    ]
  }
  ```

---

#### 2. GET `/api/usage` - Retrieve Usage Records

- **Query Parameters**:
  - `subscriberId` *(opsional)*: Filter berdasarkan ID subscriber tertentu (misal: `?subscriberId=SUB01`).
  - `startDate` *(opsional)*: Filter tanggal mulai (`YYYY-MM-DD`).
  - `endDate` *(opsional)*: Filter tanggal selesai (`YYYY-MM-DD`).
  - `page` *(opsional)*: Nomor halaman paginasi.
  - `limit` *(opsional)*: Jumlah data per halaman.

- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 8,
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 8,
      "totalPages": 1
    },
    "data": [
      {
        "id": "REC-001",
        "subscriberId": "SUB01",
        "callMinutes": 40,
        "smsCount": 10,
        "dataUsageMB": 1500,
        "timestamp": "2025-08-01 08:00"
      },
      {
        "id": "REC-003",
        "subscriberId": "SUB02",
        "callMinutes": 90,
        "smsCount": 20,
        "dataUsageMB": 6000,
        "timestamp": "2025-08-01 08:00"
      }
    ]
  }
  ```

---

#### 3. GET `/api/subscribers` - Retrieve Subscribers Aggregation

- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 6,
    "data": [
      {
        "id": "SUB01",
        "name": "Amir",
        "plan": "Basic",
        "activationDate": "2023-01-12",
        "snapshotCount": 2,
        "totalCallMinutes": 75,
        "totalSmsCount": 18,
        "totalDataUsageMB": 2700,
        "avgCallMinutes": 37.5
      },
      {
        "id": "SUB02",
        "name": "Sari",
        "plan": "Premium",
        "activationDate": "2022-05-03",
        "snapshotCount": 2,
        "totalCallMinutes": 175,
        "totalSmsCount": 38,
        "totalDataUsageMB": 11800,
        "avgCallMinutes": 87.5
      }
    ]
  }
  ```

---

### 4.3 Interactive Frontend Web Dashboard (Plus Feature)

Aplikasi menyertakan frontend modern siap pakai di `http://localhost:3000`:
- **Real-Time KPI Cards**: Menampilkan Total Subscribers, Total Data Usage (MB), Total Call Minutes, dan Total SMS.
- **Form Perekaman Cepat**: Dilengkapi fitur *quick-tag selector* (SUB01 s.d. SUB06) dan validasi instan.
- **Live Search & Filter**: Memungkinkan pencarian data berdasarkan Subscriber ID tanpa me-refresh browser.
- **Tabel Rekap Pelanggan**: Menyajikan komparasi paket pelanggan, akumulasi kuota, dan rata-rata durasi telepon.
- **One-Click Snapshot Trigger**: Tombol untuk membuat dan meninjau file CSV snapshot secara langsung.

---

## 5. Q2: Usage Snapshot Automation (Cron & Cleanup)

### 5.1 Spesifikasi Cron Job
- **Jadwal Eksekusi**: 3 kali sehari pada jam **08:00, 12:00, dan 15:00 WIB**.
- **Ekspresi Cron**: `0 8,12,15 * * *`
- **Zona Waktu**: `Asia/Jakarta` (WIB / UTC+7).
- **Implementasi**: Modul `src/cron/snapshotCron.js` yang otomatis berjalan saat server backend dihidupkan (`npm start`).

```javascript
const cron = require('node-cron');
const { generateUsageSnapshot } = require('../services/snapshotService');

// Jadwal 08:00, 12:00, 15:00 WIB
cron.schedule('0 8,12,15 * * *', () => {
  generateUsageSnapshot();
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta'
});
```

---

### 5.2 Konvensi Penamaan File (File Naming Convention)

File CSV disimpan di dalam folder `./snapshots/` dengan format standar yang mudah diurutkan secara kronologis (*lexicographical sort*):

$$\text{Format: } \mathbf{usage\_snapshot\_YYYY-MM-DD\_HH-mm-ss\_WIB.csv}$$

- **`usage_snapshot_`**: Prefix penanda jenis data.
- **`YYYY-MM-DD`**: Tanggal pengambilan snapshot waktu WIB (Tahun 4 digit, Bulan 2 digit, Hari 2 digit).
- **`HH-mm-ss`**: Jam, menit, dan detik waktu WIB (24-hour format).
- **`_WIB`**: Penanda eksplisit zona waktu Waktu Indonesia Barat (UTC+7).
- **`.csv`**: Ekstensi file Comma-Separated Values standar RFC 4180.

*Contoh nyata nama file:*
```text
snapshots/usage_snapshot_2025-08-01_08-00-00_WIB.csv
snapshots/usage_snapshot_2025-08-01_12-00-00_WIB.csv
snapshots/usage_snapshot_2025-08-01_15-00-00_WIB.csv
```

*Contoh isi baris CSV:*
```csv
id,subscriberId,callMinutes,smsCount,dataUsageMB,timestamp
REC-001,SUB01,40,10,1500,2025-08-01 08:00
REC-002,SUB01,35,8,1200,2025-08-01 12:00
REC-003,SUB02,90,20,6000,2025-08-01 08:00
REC-004,SUB02,85,18,5800,2025-08-01 12:00
REC-005,SUB03,20,5,500,2025-08-01 08:00
REC-006,SUB04,150,30,9000,2025-08-01 08:00
REC-007,SUB05,70,15,5000,2025-08-01 08:00
REC-008,SUB06,25,6,700,2025-08-01 08:00
```

---

### 5.3 Skrip Pembersihan File Lebih Tua dari 30 Hari (Cleanup Script)

Sesuai instruksi soal, disediakan skrip terpisah: `scripts/cleanup-snapshots.js`.

- **Lokasi Skrip**: `scripts/cleanup-snapshots.js`
- **Cara Menjalankan**:
  ```bash
  # Menghapus file yang lebih tua dari 30 hari (default)
  npm run cleanup:snapshots

  # Atau menggunakan node secara langsung dengan argumen hari kustom:
  node scripts/cleanup-snapshots.js 30
  ```
- **Mekanisme Kerja**:
  1. Skrip membaca seluruh file `.csv` di dalam folder `./snapshots`.
  2. Mengekstrak tanggal modifikasi file (`stats.mtime`) serta memvalidasi timestamp dari nama file.
  3. Menghitung selisih hari relatif terhadap waktu saat ini ($\text{Age in Days} = \frac{\text{now} - \text{fileTime}}{86400000}$).
  4. Menghapus file yang usianya $> 30$ hari dengan `fs.unlinkSync()`, dan mencatat rekapitulasi audit log di terminal.

#### Simulasi Pengujian Cleanup
Untuk menguji skrip pembersih tanpa harus menunggu 30 hari:
```bash
# 1. Buat file dummy simulasi (usia 45 hari, 35 hari, 10 hari, dan 2 hari)
npm run simulate:old

# 2. Jalankan skrip pembersih
npm run cleanup:snapshots
```
*Hasil:* File berusia 45 hari dan 35 hari akan terhapus otomatis, sedangkan file berusia 10 dan 2 hari tetap aman tersimpan.

---

## 6. Q3: Subscriber & Usage SQL

Tersedia file SQL murni di: [`sql/schema_and_queries.sql`](file:///d:/2026%20-%20REC/PMT/sql/schema_and_queries.sql).
Dapat diuji langsung menggunakan: `npm run test:sql`.

### Struktur Tabel Referensi

**Tabel `subscribers`**:
```sql
CREATE TABLE subscribers (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    plan VARCHAR(50) NOT NULL,
    activation_date DATE NOT NULL
);
```

**Tabel `usage`**:
```sql
CREATE TABLE usage (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    subscriberId VARCHAR(10) NOT NULL,
    callMinutes INT NOT NULL,
    smsCount INT NOT NULL,
    dataUsageMB INT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    FOREIGN KEY (subscriberId) REFERENCES subscribers(id)
);
```

---

### Jawaban Soal SQL

#### Soal 1: Insert Pelanggan Baru Bernama Fajar
> *"Insert a new subscriber named Fajar, Basic plan, activated 24 January 2024."*

```sql
INSERT INTO subscribers (id, name, plan, activation_date)
VALUES ('SUB07', 'Fajar', 'Basic', '2024-01-24');
```
*Catatan:* ID `'SUB07'` diberikan melanjutkan urutan sekuensial `'SUB01'` s.d. `'SUB06'`. Format tanggal ISO `'YYYY-MM-DD'` digunakan agar kompatibel di semua RDBMS.

---

#### Soal 2: Update Paket Fajar Menjadi Premium
> *"Update Fajar's plan to Premium."*

```sql
UPDATE subscribers
SET plan = 'Premium'
WHERE name = 'Fajar';
```
*(Atau berdasarkan primary key: `UPDATE subscribers SET plan = 'Premium' WHERE id = 'SUB07';`)*

---

#### Soal 3: Hitung Total Penggunaan Data Pelanggan Premium
> *"Calculate the total data usage (sum of dataUsageMB across all snapshots) for all Premium-plan subscribers."*

```sql
SELECT 
    SUM(u.dataUsageMB) AS total_premium_data_usage_mb
FROM usage u
JOIN subscribers s ON u.subscriberId = s.id
WHERE s.plan = 'Premium';
```

**Hasil Perhitungan:**
- **SUB02 (Sari)**: $6.000 + 5.800 = 11.800\text{ MB}$
- **SUB05 (Rian)**: $5.000\text{ MB}$
- **Total**: $11.800 + 5.000 =$ **`16,800 MB`**.
*(Pelanggan Fajar belum memiliki record di tabel usage, sehingga tidak memengaruhi total).*

---

#### Soal 4: Top 3 Subscribers Berdasarkan Total Penggunaan Data
> *"Sort and display the top 3 subscribers by total data usage across all snapshots."*

```sql
SELECT 
    s.id AS subscriberId,
    s.name,
    s.plan,
    SUM(u.dataUsageMB) AS total_data_usage_mb
FROM subscribers s
JOIN usage u ON s.id = u.subscriberId
GROUP BY s.id, s.name, s.plan
ORDER BY total_data_usage_mb DESC
LIMIT 3;
```

**Hasil Output:**
| subscriberId | name | plan | total_data_usage_mb |
| :---: | :---: | :---: | :---: |
| **SUB02** | Sari | Premium | **11,800 MB** |
| **SUB04** | Dewi | Family | **9,000 MB** |
| **SUB05** | Rian | Premium | **5,000 MB** |

---

#### Soal 5: Subquery Pelanggan dengan Rata-rata Menit Panggilan $\le 30$
> *"Write a subquery to find subscribers whose average call minutes per snapshot is less than or equal to 30."*

**Solusi Standar (Subquery dengan `IN` dan `HAVING`):**
```sql
SELECT 
    s.id,
    s.name,
    s.plan,
    s.activation_date
FROM subscribers s
WHERE s.id IN (
    SELECT u.subscriberId
    FROM usage u
    GROUP BY u.subscriberId
    HAVING AVG(u.callMinutes) <= 30
);
```

**Solusi Alternatif (Correlated Subquery dengan `EXISTS`):**
```sql
SELECT 
    s.id,
    s.name,
    s.plan,
    s.activation_date
FROM subscribers s
WHERE EXISTS (
    SELECT 1
    FROM usage u
    WHERE u.subscriberId = s.id
    GROUP BY u.subscriberId
    HAVING AVG(u.callMinutes) <= 30
);
```

**Analisis & Hasil:**
- **SUB03 (Budi)**: $20 / 1 = 20.0\text{ menit } (\le 30)$ $\rightarrow$ **MATCH**
- **SUB06 (Nia)**: $25 / 1 = 25.0\text{ menit } (\le 30)$ $\rightarrow$ **MATCH**
- *SUB01 (Amir)*: $(40 + 35) / 2 = 37.5\text{ menit } (> 30)$ $\rightarrow$ *Excluded*
- *SUB02 (Sari)*: $(90 + 85) / 2 = 87.5\text{ menit } (> 30)$ $\rightarrow$ *Excluded*
- *SUB04 (Dewi)*: $150.0\text{ menit } (> 30)$ $\rightarrow$ *Excluded*
- *SUB05 (Rian)*: $70.0\text{ menit } (> 30)$ $\rightarrow$ *Excluded*

---

## 7. Q4: Troubleshoot & Explain

### Cuplikan Kode Soal:
```javascript
function getTotalUsageMB(records) {
 return records.reduce((total, record) => {
 total += record.dataUsageMB;
 });
}
```

### 1. Root Causes (Akar Masalah Mengapa Rusak)

1. **Hilangnya `return` Statement pada Callback:**
   Fungsi callback menggunakan blok kurung kurawal `{ ... }` namun tidak menuliskan `return total;`. Akibatnya, fungsi callback selalu mengembalikan `undefined`. Pada iterasi berikutnya, nilai akumulator `total` menjadi `undefined`, sehingga operasi penambahan menghasilkan `NaN`, dan pemanggilan akhir `getTotalUsageMB` mengembalikan nilai `undefined`.

2. **Hilangnya Argumen Nilai Awal Akumulator (`initialValue`):**
   `reduce` dipanggil tanpa argumen nilai awal kedua (`0`). Berdasarkan spesifikasi ECMAScript:
   - Jika `initialValue` tidak disertakan, `reduce` menginisialisasi `total` dengan **elemen pertama array (`records[0]`)**.
   - `records[0]` adalah sebuah **Object** (misal: `{ subscriberId: 'SUB01', ... }`), bukan angka.
   - Pada iterasi pertama, JS mencoba menambahkan objek dengan angka: `[object Object] + 1200`, menghasilkan string *coercion* yang salah atau `NaN`.

3. **Runtime Crash (`TypeError`) pada Array Kosong (`[]`):**
   Jika `records` bernilai array kosong `[]`, pemanggilan `.reduce()` tanpa initialValue akan melempar unhandled exception fatal:
   ```text
   TypeError: Reduce of empty array with no initial value
   ```
   Hal ini dapat menyebabkan backend service mengalami *crash* atau *downtime*.

---

### 2. Kode Perbaikan (Fix)

#### Solusi 1: Ringkas & Idiomatik
```javascript
function getTotalUsageMB(records) {
  return records.reduce((total, record) => total + record.dataUsageMB, 0);
}
```

#### Solusi 2: Defensif & Production-Ready (Sangat Direkomendasikan)
Menangani array kosong, input `null`/`undefined`, dan validasi tipe angka:
```javascript
function getTotalUsageMB(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return 0;
  }

  return records.reduce((total, record) => {
    const usage = Number(record && record.dataUsageMB);
    return total + (isNaN(usage) ? 0 : usage);
  }, 0);
}
```

---

### 3. Pencegahan Kelas Bug Ini di Masa Depan

1. **Static Typing dengan TypeScript**:
   Mendefinisikan tipe data eksplisit pada antarmuka model `UsageRecord[]`. TypeScript compiler akan langsung memunculkan peringatan *compile-time error* jika `initialValue` tidak sesuai tipe akumulator.
2. **Aturan ESLint Otomatis**:
   - `array-callback-return`: Memastikan setiap callback `reduce`/`map` selalu mengembalikan nilai secara eksplisit.
   - `no-return-assign`: Melarang operasi assignment di dalam callback ekspresi.
3. **Automated Unit Testing**:
   Menulis tes otomatis yang mencakup *edge cases* seperti array kosong `[]`, data `null`/`undefined`, dan data berformat string numerik.
4. **Code Review Checklist**:
   Menetapkan konvensi review bahwa setiap pemanggilan `reduce()` untuk agregasi objek ke nilai primitif **wajib** menyertakan `initialValue` (misal `0`, `""`, atau `{}`).

*Verifikasi langsung dapat dijalankan via:*
```bash
npm run test:q4
```

---

## 8. Struktur Direktori Proyek

```text
├── package.json              # Konfigurasi dependensi dan skrip NPM
├── README.md                 # Dokumentasi komprehensif proyek
├── server.js                 # Entry point aplikasi & inisialisasi server
├── src/
│   ├── app.js                # Konfigurasi Express, middleware, routing
│   ├── controllers/
│   │   └── usageController.js # Handler HTTP request/response
│   ├── routes/
│   │   └── usageRoutes.js    # Definisi route REST API
│   ├── services/
│   │   └── snapshotService.js # Logika ekspor CSV, nama file, dan cleanup
│   ├── cron/
│   │   └── snapshotCron.js   # Penjadwal otomatis cron (08:00, 12:00, 15:00 WIB)
│   ├── data/
│   │   └── inMemoryStore.js  # In-memory storage dengan data awal spesifikasi
│   └── middleware/
│       └── validator.js      # Middleware validasi payload API
├── public/                   # Frontend Web Dashboard (Plus Requirement)
│   ├── index.html            # Antarmuka web modern
│   ├── styles.css            # Styling responsif dengan CSS tokens
│   └── app.js                # Logika AJAX frontend & interaksi live
├── scripts/
│   ├── verify-all.js         # Suite pengujian otomatis endpoint API
│   ├── run-snapshot-now.js   # Skrip pemicu snapshot manual instan
│   ├── cleanup-snapshots.js  # Skrip pembersih file snapshot > 30 hari
│   ├── simulate-old-snapshots.js # Skrip pembantu pembuat snapshot dummy
│   └── run-sql-demo.js       # Skrip simulasi & verifikasi SQL Q3
├── sql/
│   └── schema_and_queries.sql # File DDL, DML, dan seluruh jawaban query SQL Q3
├── q4-troubleshoot/
│   ├── solution.js           # Kode demonstrasi bug vs fixed dengan test runner
│   └── explanation.md        # Analisis mendalam Q4
└── snapshots/                # Direktori penyimpanan file CSV snapshot
```

---

## 9. Git & Pengujian Otomatis

Semua file dikelola dengan Git. Untuk memastikan seluruh fungsionalitas berjalan 100%:

```bash
# Jalankan seluruh rangkaian pengujian:
npm test
```
*Hasil tes meliputi:*
- ✅ 10 Tes Endpoint REST API (`verify-all.js`)
- ✅ 7 Tes Edge-Case & Troubleshooting Q4 (`solution.js`)
- ✅ 5 Verifikasi Output Relasional SQL Q3 (`run-sql-demo.js`)
