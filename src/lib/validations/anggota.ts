import { z } from "zod";

export const formAnggotaSchema = z.object({
  nama_lengkap: z
    .string()
    .min(3, "Nama lengkap minimal 3 karakter")
    .max(100, "Nama terlalu panjang"),
  nik: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[0-9]{16}$/.test(val),
      "NIK harus berupa 16 digit angka (opsional)"
    ),
  nomor_kta: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim().length >= 3,
      "Nomor KTA harus sesuai kartu fisik resmi"
    ),
  tempat_lahir: z
    .string()
    .min(2, "Tempat lahir wajib diisi"),
  tanggal_lahir: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Tanggal lahir tidak valid"),
  jenis_kelamin: z.enum(["L", "P"], {
    message: "Pilih jenis kelamin",
  }),
  desa_id: z.string().min(1, "Wajib memilih desa / subranting"),
  alamat_detail: z
    .string()
    .min(5, "Alamat domisili lengkap wajib diisi (minimal 5 karakter)"),
  rt_rw: z.string().optional(),
  nomor_wa: z
    .string()
    .min(9, "Nomor WhatsApp minimal 9 digit")
    .regex(
      /^(?:\+62|62|0)8[1-9][0-9]{6,10}$/,
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
    .min(1980, "Tahun pengesahan minimal 1980")
    .max(2026, "Tahun pengesahan tidak boleh masa depan"),
  tempat_pengesahan: z
    .string()
    .min(2, "Tempat pengesahan wajib diisi (misal: Padepokan Pusat Madiun)"),
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
