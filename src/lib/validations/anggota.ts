import { z } from "zod";

export const formAnggotaSchema = z.object({
  nama_lengkap: z
    .string()
    .trim()
    .min(2, "Nama lengkap minimal 2 karakter")
    .max(100, "Nama terlalu panjang"),
  nik: z
    .string()
    .optional()
    .transform((val) => (val ? val.replace(/[\s\-]/g, "") : ""))
    .refine(
      (val) => !val || /^[0-9]{16}$/.test(val),
      "NIK harus berupa 16 digit angka jika diisi"
    ),
  nomor_kta: z
    .string()
    .optional()
    .transform((val) => (val ? val.trim() : "")),
  angkatan: z
    .string()
    .optional()
    .transform((val) => (val ? val.trim() : "")),
  tanggal_pengesahan: z
    .string()
    .optional()
    .transform((val) => (val ? val.trim() : "")),
  tempat_lahir: z
    .string()
    .trim()
    .min(2, "Tempat lahir wajib diisi"),
  tanggal_lahir: z
    .string()
    .min(1, "Tanggal lahir wajib diisi")
    .refine((val) => !isNaN(Date.parse(val)), "Tanggal lahir tidak valid"),
  jenis_kelamin: z.enum(["L", "P"], {
    message: "Pilih jenis kelamin (Laki-laki / Perempuan)",
  }),
  desa_id: z.string().min(1, "Wajib memilih desa / subranting"),
  alamat_detail: z
    .string()
    .trim()
    .min(3, "Alamat domisili wajib diisi (minimal 3 karakter)"),
  rt_rw: z.string().optional(),
  nomor_wa: z
    .string()
    .min(8, "Nomor WhatsApp minimal 8 digit")
    .transform((val) => (val ? val.replace(/[\s\-\.\(\)]/g, "") : ""))
    .refine(
      (val) => /^(?:\+?62|0)?8[0-9]{7,12}$/.test(val),
      "Format nomor WA tidak valid (contoh: 081234567890)"
    ),
  kategori_anggota: z.enum(["warga", "siswa"]).default("warga"),
  tingkatan: z.enum(
    [
      "Warga Tingkat 1",
      "Warga Tingkat 2",
      "Warga Tingkat 3",
      "Pendekar / Warga Sepuh",
      "Siswa Sabuk Kuning",
      "Siswa Sabuk Biru",
      "Siswa Sabuk Merah",
      "Calon Warga",
    ],
    {
      message: "Pilih tingkatan sabuk warga / siswa",
    }
  ),
  tempat_latihan: z.string().optional(),
  nama_pelatih: z.string().optional(),
  tahun_pengesahan: z.coerce
    .number()
    .int()
    .min(1980, "Tahun minimal 1980")
    .max(2030, "Tahun tidak boleh lebih dari 2030"),
  tempat_pengesahan: z
    .string()
    .optional()
    .default("Padepokan Pusat Madiun"),
  status_keaktifan: z.enum(
    ["aktif", "pasif", "mutasi_keluar", "meninggal"],
    {
      message: "Pilih status keaktifan",
    }
  ),
  foto_kta_url: z.string().optional(),
  foto_profil_url: z.string().optional(),
  is_demo: z.boolean().default(false),
});

export type FormAnggotaInput = z.infer<typeof formAnggotaSchema>;
