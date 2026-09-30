# Q4: Troubleshoot & Explain Analysis

## 1. Kode Asli (Original Code)

```javascript
function getTotalUsageMB(records) {
  return records.reduce((total, record) => {
    total += record.dataUsageMB;
  });
}
```

---

## 2. Analisis Akar Masalah (Root Causes)

Fungsi di atas memiliki **tiga kegagalan fatal (fatal flaws)** yang menyebabkan runtime error atau hasil yang salah (`undefined` / `NaN` / `[object Object]`):

### Masalah 1: Tidak Ada `return` pada Callback `reduce`
- Callback function menggunakan block body `{ ... }`, di mana baris di dalamnya hanya berupa ekspresi assignment: `total += record.dataUsageMB;`.
- Di JavaScript, fungsi tanpa kata kunci `return` eksplisit secara otomatis mengembalikan nilai `undefined`.
- Pada iterasi ke-2 dan seterusnya, parameter akumulator `total` menerima hasil dari iterasi sebelumnya (yaitu `undefined`).
- Ketika JavaScript mengevaluasi `undefined += record.dataUsageMB`, hasilnya adalah `NaN`.
- Selain itu, nilai akhir yang dikembalikan oleh `reduce` adalah return value dari iterasi terakhir, sehingga fungsi `getTotalUsageMB` selalu mengembalikan `undefined`!

### Masalah 2: Tidak Diberikannya Nilai Awal Akumulator (`initialValue`)
- Pemanggilan `.reduce(callback)` tidak menyertakan argumen kedua (`initialValue`).
- Sesuai spesifikasi ECMAScript:
  - Jika `initialValue` **tidak diberikan**, `reduce` akan mengambil **elemen pertama array (`records[0]`)** sebagai nilai awal akumulator `total`, dan iterasi callback langsung dimulai dari elemen kedua (`records[1]`).
  - Dalam kasus ini, elemen `records[0]` adalah sebuah **Object**, contohnya: `{ subscriberId: 'SUB01', callMinutes: 40, smsCount: 10, dataUsageMB: 1500 }`.
  - Pada iterasi pertama, terjadi operasi penambahan objek dengan angka: `[object Object] + 1200`, yang menghasilkan string coercion `"[object Object]1200"` atau `NaN` jika dikonversi. Akumulator tidak pernah bertindak sebagai angka murni (number).

### Masalah 3: Runtime Crash (TypeError) jika Array Kosong (`[]`)
- Jika fungsi menerima array kosong (`records = []`), pemanggilan `.reduce()` tanpa `initialValue` akan melempar error fatal:
  ```text
  TypeError: Reduce of empty array with no initial value
  ```
- Ini akan menghentikan eksekusi aplikasi (unhandled exception / HTTP 500 error) jika ada pelanggan yang belum memiliki catatan penggunaan.

---

## 3. Solusi Perbaikan Kode (The Fix)

### Solusi 1: Bentuk Idiomatik & Ringkas (Concise & Standard)
Solusi paling bersih dengan arrow function implicit return dan menyertakan `initialValue = 0`:

```javascript
function getTotalUsageMB(records) {
  return records.reduce((total, record) => total + record.dataUsageMB, 0);
}
```

### Solusi 2: Bentuk Defensif & Production-Ready (Recommended)
Solusi ini menangani validasi input (`null`, `undefined`, bukan array), array kosong, serta sanitasi tipe data numerik:

```javascript
/**
 * Menghitung total dataUsageMB dari sekumpulan usage records.
 * Menangani null/undefined, array kosong, dan tipe data non-angka dengan aman.
 *
 * @param {Array<Object>} records - Daftar record penggunaan subscriber
 * @returns {number} Total penggunaan data dalam MB
 */
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

## 4. Cara Mencegah Kelas Bug Ini di Masa Depan (Prevention Strategies)

Untuk mencegah bug serupa terjadi kembali di level tim dan sistem produksi, terapkan langkah-langkah berikut:

### 1. Penerapan Static Type Checking (TypeScript / JSDoc)
Dengan TypeScript, kesalahan ini langsung terdeteksi saat proses kompilasi sebelum kode pernah dijalankan:
```typescript
interface UsageRecord {
  subscriberId: string;
  callMinutes: number;
  smsCount: number;
  dataUsageMB: number;
}

function getTotalUsageMB(records: UsageRecord[]): number {
  // TypeScript compiler akan memberikan error jika initialValue (0) tidak diberikan:
  // Error: No overload matches this call. Overload 1 of 3, '(callbackfn: (previousValue: UsageRecord, ...'
  return records.reduce((total: number, record: UsageRecord) => total + record.dataUsageMB, 0);
}
```

### 2. Konfigurasi Linter (ESLint)
Aktifkan aturan linter ketat pada file `.eslintrc`:
- **`array-callback-return`**: Memaksa setiap callback array method (`reduce`, `map`, `filter`, `find`) untuk selalu memiliki return statement.
- **`no-return-assign`**: Melarang assignment (`total += ...`) di dalam return/callback untuk mencegah mutasi state yang tidak disengaja.
- **`consistent-return`**: Memastikan fungsi mengembalikan nilai secara konsisten.

### 3. Penulisan Unit Test Otomatis (TDD / Automated Testing)
Tulis unit test yang mencakup *happy path* dan *boundary edge cases*:
- Input normal dengan beberapa record: `[{ dataUsageMB: 1500 }, { dataUsageMB: 1200 }]` -> `2700`.
- Input array kosong: `[]` -> `0`.
- Input satu elemen: `[{ dataUsageMB: 500 }]` -> `500`.
- Input null / undefined / malformed objects.

### 4. Code Review Guidelines
- Tetapkan standar arsitektur bahwa setiap pemanggilan `Array.prototype.reduce()` **wajib** menyertakan nilai awal akumulator (`initialValue`), terutama saat tipe elemen array (Object) berbeda dengan tipe akumulator (Number/Array/Map).
- Hindari mutasi parameter di callback (`total += ...`), melainkan gunakan ekspresi fungsional murni (`total + ...`).
