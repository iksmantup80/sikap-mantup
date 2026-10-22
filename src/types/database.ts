export type UserRole =
  | 'anggota'
  | 'koordinator_subranting'
  | 'verifikator'
  | 'admin_ranting'
  | 'pengurus';

export type StatusKeaktifan =
  | 'aktif'
  | 'pasif'
  | 'mutasi_keluar'
  | 'meninggal';

export type StatusVerifikasi =
  | 'draft'
  | 'menunggu_verifikasi'
  | 'perlu_koreksi'
  | 'terverifikasi'
  | 'ditolak';

export type TingkatanWarga =
  | 'Warga Tingkat 1'
  | 'Warga Tingkat 2'
  | 'Warga Tingkat 3'
  | 'Pendekar / Warga Sepuh';

export type JenisKelamin = 'L' | 'P';

export interface WilayahDesa {
  id: string;
  nama_desa: string;
  kode_desa: string;
  nama_koordinator?: string | null;
  kontak_koordinator?: string | null;
  alamat_sekretariat?: string | null;
  urutan: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  desa_id?: string | null;
  desa?: WilayahDesa | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Anggota {
  id: string;
  nomor_kta?: string | null; // Nomor KTA resmi fisik dari Pusat Madiun
  nama_lengkap: string;
  nik?: string | null;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: JenisKelamin;
  desa_id: string;
  desa?: WilayahDesa;
  alamat_detail: string;
  rt_rw?: string | null;
  nomor_wa: string;
  tingkatan: TingkatanWarga;
  tahun_pengesahan: number;
  tempat_pengesahan: string;
  status_keaktifan: StatusKeaktifan;
  status_verifikasi: StatusVerifikasi;
  foto_kta_url?: string | null;
  foto_profil_url?: string | null;
  user_id?: string | null;
  catatan_verifikasi?: string | null;
  verifikator_id?: string | null;
  verified_at?: string | null;
  created_by?: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface PengajuanAnggota {
  id: string;
  kode_tiket: string;
  anggota_id: string;
  anggota?: Anggota;
  tipe_pengajuan: 'pendataan_mandiri' | 'input_koordinator' | 'pembaruan_profil';
  status: StatusVerifikasi;
  catatan_revisi?: string | null;
  submitted_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  actor?: Profile;
  action: string;
  entity: string;
  record_id?: string | null;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface DuplikatCandidate {
  anggota1: Anggota;
  anggota2: Anggota;
  alasan: 'KTA Sama' | 'Nama & Tanggal Lahir Sama' | 'Nomor Kontak Sama';
  confidence: number;
}
