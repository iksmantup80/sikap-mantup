-- ====================================================================
-- SIKAP MANTUP - SKEMA DATABASE POSTGRESQL & ROW LEVEL SECURITY (RLS)
-- Sistem Informasi Keanggotaan dan Administrasi Persaudaraan
-- IKSPI Kera Sakti Ranting Mantup, Kec. Mantup, Kab. Lamongan
-- ====================================================================

-- 1. Ekstensi
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'anggota',
        'koordinator_subranting',
        'verifikator',
        'admin_ranting',
        'pengurus'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_keaktifan AS ENUM (
        'aktif',
        'pasif',
        'mutasi_keluar',
        'meninggal'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_verifikasi AS ENUM (
        'draft',
        'menunggu_verifikasi',
        'perlu_koreksi',
        'terverifikasi',
        'ditolak'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tingkatan_warga AS ENUM (
        'Warga Tingkat 1',
        'Warga Tingkat 2',
        'Warga Tingkat 3',
        'Pendekar / Warga Sepuh'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE jenis_kelamin AS ENUM ('L', 'P');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABEL WILAYAH DESA / SUBRANTING (15 Desa di Kec. Mantup)
CREATE TABLE IF NOT EXISTS wilayah_desa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_desa VARCHAR(100) NOT NULL UNIQUE,
    kode_desa VARCHAR(20) NOT NULL UNIQUE,
    nama_koordinator VARCHAR(150),
    kontak_koordinator VARCHAR(50),
    alamat_sekretariat TEXT,
    urutan INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABEL PROFILES (Terhubung dengan Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    role user_role NOT NULL DEFAULT 'anggota',
    desa_id UUID REFERENCES wilayah_desa(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABEL MASTER ANGGOTA
CREATE TABLE IF NOT EXISTS anggota (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_kta VARCHAR(100), -- KTA resmi diterbitkan Pusat Madiun, bukan generate lokal
    nama_lengkap VARCHAR(255) NOT NULL,
    nik VARCHAR(30),
    tempat_lahir VARCHAR(100) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    jenis_kelamin jenis_kelamin NOT NULL DEFAULT 'L',
    desa_id UUID NOT NULL REFERENCES wilayah_desa(id) ON DELETE RESTRICT,
    alamat_detail TEXT NOT NULL,
    rt_rw VARCHAR(30),
    nomor_wa VARCHAR(30) NOT NULL,
    tingkatan tingkatan_warga NOT NULL DEFAULT 'Warga Tingkat 1',
    tahun_pengesahan SMALLINT NOT NULL,
    tempat_pengesahan VARCHAR(150) NOT NULL DEFAULT 'Padepokan Pusat Madiun',
    status_keaktifan status_keaktifan NOT NULL DEFAULT 'aktif',
    status_verifikasi status_verifikasi NOT NULL DEFAULT 'menunggu_verifikasi',
    foto_kta_url TEXT,
    foto_profil_url TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    catatan_verifikasi TEXT,
    verifikator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABEL TRACKING PENGAJUAN / TIKET
CREATE TABLE IF NOT EXISTS pengajuan_anggota (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_tiket VARCHAR(50) NOT NULL UNIQUE,
    anggota_id UUID NOT NULL REFERENCES anggota(id) ON DELETE CASCADE,
    tipe_pengajuan VARCHAR(50) NOT NULL DEFAULT 'pendataan_mandiri', -- 'pendataan_mandiri' | 'input_koordinator' | 'pembaruan_profil'
    status status_verifikasi NOT NULL DEFAULT 'menunggu_verifikasi',
    catatan_revisi TEXT,
    submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TABEL AUDIT LOG (Keamanan & Pelacakan Tindakan)
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- INDEKS & ATURAN ANTI-DUPLIKASI
-- ====================================================================

-- Mencegah duplikasi nomor KTA resmi yang aktif/terverifikasi
CREATE UNIQUE INDEX IF NOT EXISTS idx_anggota_nomor_kta_unique 
ON anggota (nomor_kta) 
WHERE nomor_kta IS NOT NULL AND nomor_kta != '' AND status_verifikasi != 'ditolak';

-- Indeks pencarian kembar identitas (Nama Lengkap + Tanggal Lahir)
CREATE INDEX IF NOT EXISTS idx_anggota_identitas 
ON anggota (LOWER(TRIM(nama_lengkap)), tanggal_lahir);

-- Indeks performa query wilayah dan status
CREATE INDEX IF NOT EXISTS idx_anggota_desa_status 
ON anggota (desa_id, status_verifikasi, status_keaktifan);

-- Indeks tiket pengajuan
CREATE INDEX IF NOT EXISTS idx_pengajuan_kode_tiket 
ON pengajuan_anggota (kode_tiket);

-- ====================================================================
-- FUNGSI & TRIGGER UNTUK AUDIT & PROFIL BARU
-- ====================================================================

-- Trigger update 'updated_at' otomatis
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wilayah_updated_at BEFORE UPDATE ON wilayah_desa
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trg_anggota_updated_at BEFORE UPDATE ON anggota
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trg_pengajuan_updated_at BEFORE UPDATE ON pengajuan_anggota
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Handler saat akun baru mendaftar di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'anggota'),
        false -- Default nonaktif sampai diverifikasi admin
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pada auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ====================================================================
-- SEED DATA: 15 DESA KECAMATAN MANTUP, LAMONGAN
-- ====================================================================
INSERT INTO wilayah_desa (nama_desa, kode_desa, urutan, is_active)
VALUES
    ('Desa Mantup', 'MTP-01', 1, true),
    ('Desa Sukobendu', 'MTP-02', 2, true),
    ('Desa Kedungsumber', 'MTP-03', 3, true),
    ('Desa Sumberkerep', 'MTP-04', 4, true),
    ('Desa Mojosari', 'MTP-05', 5, true),
    ('Desa Kedukbembem', 'MTP-06', 6, true),
    ('Desa Tunggunjagir', 'MTP-07', 7, true),
    ('Desa Plabuhan', 'MTP-08', 8, true),
    ('Desa Rumpuk', 'MTP-09', 9, true),
    ('Desa Tugu', 'MTP-10', 10, true),
    ('Desa Sukosongo', 'MTP-11', 11, true),
    ('Desa Sumberagung', 'MTP-12', 12, true),
    ('Desa Sumberdadi', 'MTP-13', 13, true),
    ('Desa Sidomulyo', 'MTP-14', 14, true),
    ('Desa Kutorejo', 'MTP-15', 15, true)
ON CONFLICT (nama_desa) DO UPDATE 
SET kode_desa = EXCLUDED.kode_desa, urutan = EXCLUDED.urutan;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE wilayah_desa ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengajuan_anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: Get Current User Role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: Get Current User Desa ID
CREATE OR REPLACE FUNCTION get_user_desa()
RETURNS UUID AS $$
    SELECT desa_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- A. Kebijakan wilayah_desa
-- Siapapun dapat membaca data desa (untuk pilihan form publik)
CREATE POLICY "Public read wilayah_desa"
ON wilayah_desa FOR SELECT
TO anon, authenticated
USING (true);

-- Hanya Admin Ranting yang dapat memodifikasi desa
CREATE POLICY "Admin manage wilayah_desa"
ON wilayah_desa FOR ALL
TO authenticated
USING (get_user_role() = 'admin_ranting')
WITH CHECK (get_user_role() = 'admin_ranting');

-- B. Kebijakan profiles
-- Pengguna dapat membaca profilnya sendiri
CREATE POLICY "User read own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR get_user_role() IN ('admin_ranting', 'verifikator', 'pengurus'));

-- Pengguna dapat mengupdate nomor telp / nama miliknya
CREATE POLICY "User update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid() OR get_user_role() = 'admin_ranting')
WITH CHECK (
    -- Anggota biasa tidak boleh mengubah role atau is_active miliknya
    (id = auth.uid() AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid()) AND is_active = (SELECT p.is_active FROM profiles p WHERE p.id = auth.uid()))
    OR get_user_role() = 'admin_ranting'
);

-- Admin Ranting memiliki akses penuh terhadap profiles
CREATE POLICY "Admin all profiles"
ON profiles FOR ALL
TO authenticated
USING (get_user_role() = 'admin_ranting')
WITH CHECK (get_user_role() = 'admin_ranting');

-- C. Kebijakan anggota
-- 1. Insert: Publik/Calon anggota dapat mengirim pengajuan mandiri; koordinator & admin dapat input
CREATE POLICY "Public & Koord insert anggota"
ON anggota FOR INSERT
TO anon, authenticated
WITH CHECK (
    -- Jika anonym/calon anggota: status verifikasi wajib 'menunggu_verifikasi' atau 'draft'
    (auth.uid() IS NULL AND status_verifikasi IN ('menunggu_verifikasi', 'draft'))
    OR (get_user_role() = 'koordinator_subranting' AND desa_id = get_user_desa())
    OR (get_user_role() = 'admin_ranting')
);

-- 2. Select:
CREATE POLICY "Anggota select policy"
ON anggota FOR SELECT
TO anon, authenticated
USING (
    -- Admin, verifikator, dan pengurus dapat membaca seluruh data
    get_user_role() IN ('admin_ranting', 'verifikator', 'pengurus')
    -- Koordinator dapat membaca anggota di desanya
    OR (get_user_role() = 'koordinator_subranting' AND desa_id = get_user_desa())
    -- Anggota login dapat membaca datanya sendiri
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- 3. Update:
CREATE POLICY "Anggota update policy"
ON anggota FOR UPDATE
TO authenticated
USING (
    get_user_role() = 'admin_ranting'
    OR get_user_role() = 'verifikator'
    OR (get_user_role() = 'koordinator_subranting' AND desa_id = get_user_desa() AND status_verifikasi IN ('draft', 'perlu_koreksi'))
    OR (user_id = auth.uid() AND status_verifikasi IN ('perlu_koreksi'))
)
WITH CHECK (
    get_user_role() = 'admin_ranting'
    OR (get_user_role() = 'verifikator')
    OR (get_user_role() = 'koordinator_subranting' AND desa_id = get_user_desa())
    OR (user_id = auth.uid() AND status_verifikasi IN ('perlu_koreksi', 'menunggu_verifikasi'))
);

-- D. Kebijakan pengajuan_anggota
-- Publik dapat mengecek status tiket pengajuan berdasarkan kode_tiket
CREATE POLICY "Public read pengajuan by tiket"
ON pengajuan_anggota FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public insert pengajuan"
ON pengajuan_anggota FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admin & Verif update pengajuan"
ON pengajuan_anggota FOR UPDATE
TO authenticated
USING (get_user_role() IN ('admin_ranting', 'verifikator'))
WITH CHECK (get_user_role() IN ('admin_ranting', 'verifikator'));

-- E. Kebijakan audit_log
CREATE POLICY "Admin read audit_log"
ON audit_log FOR SELECT
TO authenticated
USING (get_user_role() = 'admin_ranting');

CREATE POLICY "System insert audit_log"
ON audit_log FOR INSERT
TO authenticated
WITH CHECK (true);
