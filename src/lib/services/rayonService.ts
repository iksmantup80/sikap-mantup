import { Rayon } from "@/types/database";
import { DESA_MANTUP_LIST } from "../constants/desas";
import { createClient } from "../supabase/client";

let localRayonList: Rayon[] = [];

function initFromLocalStorage() {
  if (typeof window === "undefined") return;
  try {
    const cached = localStorage.getItem("sikap_cached_rayon");
    if (cached) {
      localRayonList = JSON.parse(cached);
    }
  } catch (e) {
    console.warn("Gagal membaca cache rayon:", e);
  }
}

function saveToLocalStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("sikap_cached_rayon", JSON.stringify(localRayonList));
  } catch (e) {
    console.warn("Gagal menyimpan cache rayon:", e);
  }
}

if (typeof window !== "undefined") {
  initFromLocalStorage();
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const RayonService = {
  getAll: (): Rayon[] => {
    return localRayonList;
  },

  getAllAsync: async (): Promise<Rayon[]> => {
    try {
      const supabase = createClient();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (supabaseUrl && !supabaseUrl.includes("example.supabase.co")) {
        const { data, error } = await supabase
          .from("rayon")
          .select("*, desa:wilayah_desa(*)")
          .order("nama_rayon", { ascending: true });

        if (!error && Array.isArray(data)) {
          const list: Rayon[] = data.map((item) => ({
            id: item.id,
            nama_rayon: item.nama_rayon,
            desa_id: item.desa_id,
            desa: item.desa || DESA_MANTUP_LIST.find((d) => d.id === item.desa_id) || null,
            nama_ketua: item.nama_ketua,
            no_wa: item.no_wa || null,
            alamat_lokasi: item.alamat_lokasi || null,
            email_akun: item.email_akun,
            password_hash: item.password_hash,
            is_active: item.is_active ?? true,
            created_at: item.created_at,
            updated_at: item.updated_at,
          }));

          localRayonList = list;
          saveToLocalStorage();
          return list;
        }
      }
    } catch (e) {
      console.warn("Gagal load rayon dari cloud, gunakan cache lokal:", e);
    }
    return localRayonList;
  },

  create: async (payload: {
    nama_rayon: string;
    desa_id: string;
    nama_ketua: string;
    no_wa: string;
    alamat_lokasi: string;
    email_akun: string;
    password_plain: string;
  }): Promise<{ success: boolean; message: string; rayon?: Rayon }> => {
    const id = generateUUID();
    const cleanEmail = payload.email_akun.toLowerCase().trim();
    const desaObj = DESA_MANTUP_LIST.find((d) => d.id === payload.desa_id);

    const newRayon: Rayon = {
      id,
      nama_rayon: payload.nama_rayon.trim(),
      desa_id: payload.desa_id,
      desa: desaObj || null,
      nama_ketua: payload.nama_ketua.trim(),
      no_wa: payload.no_wa.trim(),
      alamat_lokasi: payload.alamat_lokasi.trim(),
      email_akun: cleanEmail,
      password_hash: payload.password_plain.trim(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Simpan ke Supabase Cloud
    try {
      const supabase = createClient();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (supabaseUrl && !supabaseUrl.includes("example.supabase.co")) {
        const { error } = await supabase.from("rayon").insert({
          id,
          nama_rayon: newRayon.nama_rayon,
          desa_id: newRayon.desa_id,
          nama_ketua: newRayon.nama_ketua,
          no_wa: newRayon.no_wa,
          alamat_lokasi: newRayon.alamat_lokasi,
          email_akun: newRayon.email_akun,
          password_hash: newRayon.password_hash,
          is_active: true,
        });

        if (error) {
          console.error("Gagal simpan rayon ke Supabase:", error);
          if (error.code === "23505") {
            return {
              success: false,
              message: `Email akun '${cleanEmail}' sudah terdaftar untuk rayon lain.`,
            };
          }
        }
      }
    } catch (e) {
      console.warn("Gagal simpan cloud, tersimpan ke cache lokal:", e);
    }

    localRayonList.push(newRayon);
    saveToLocalStorage();

    return {
      success: true,
      message: `Rayon '${newRayon.nama_rayon}' dan Akun Validator '${newRayon.nama_ketua}' berhasil didaftarkan!`,
      rayon: newRayon,
    };
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const supabase = createClient();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl && !supabaseUrl.includes("example.supabase.co")) {
        await supabase.from("rayon").delete().eq("id", id);
      }
    } catch (e) {
      console.warn("Gagal hapus rayon di cloud:", e);
    }

    localRayonList = localRayonList.filter((r) => r.id !== id);
    saveToLocalStorage();
    return { success: true, message: "Rayon berhasil dihapus" };
  },

  authenticate: async (
    email: string,
    password: string
  ): Promise<{ authenticated: boolean; rayon?: Rayon; message?: string }> => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPass = password.trim();

    // 1. Coba verifikasi langsung dari Cloud Supabase
    try {
      const supabase = createClient();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (supabaseUrl && !supabaseUrl.includes("example.supabase.co")) {
        const { data, error } = await supabase
          .from("rayon")
          .select("*, desa:wilayah_desa(*)")
          .eq("email_akun", cleanEmail)
          .eq("is_active", true)
          .maybeSingle();

        if (!error && data) {
          if (data.password_hash === cleanPass) {
            return {
              authenticated: true,
              rayon: {
                id: data.id,
                nama_rayon: data.nama_rayon,
                desa_id: data.desa_id,
                desa: data.desa,
                nama_ketua: data.nama_ketua,
                no_wa: data.no_wa,
                alamat_lokasi: data.alamat_lokasi,
                email_akun: data.email_akun,
                password_hash: data.password_hash,
                is_active: data.is_active,
              },
            };
          } else {
            return { authenticated: false, message: "Kata sandi akun Ketua Rayon salah." };
          }
        }
      }
    } catch (e) {
      console.warn("Koneksi cloud gagal untuk auth rayon, fallback ke cache:", e);
    }

    // 2. Fallback ke local cache
    const found = localRayonList.find(
      (r) => r.email_akun.toLowerCase() === cleanEmail && r.is_active
    );
    if (found) {
      if (found.password_hash === cleanPass) {
        return { authenticated: true, rayon: found };
      }
      return { authenticated: false, message: "Kata sandi akun Ketua Rayon salah." };
    }

    return { authenticated: false };
  },
};
