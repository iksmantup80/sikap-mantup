"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRootPage() {
  const router = useRouter();

  useEffect(() => {
    const role = sessionStorage.getItem("sikap_user_role");
    const email = (sessionStorage.getItem("sikap_user_email") || "").toLowerCase();

    if (email.includes("iksmantup") || email.includes("admin")) {
      router.replace("/dashboard/admin");
      return;
    }

    if (role === "verifikator") router.replace("/dashboard/verifikator");
    else if (role === "koordinator_subranting") router.replace("/dashboard/koordinator");
    else if (role === "anggota") router.replace("/dashboard/anggota");
    else router.replace("/dashboard/admin");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-stone-500">
      Mengarahkan ke dashboard peran Anda...
    </div>
  );
}
