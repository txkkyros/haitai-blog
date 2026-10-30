"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    router.refresh();
    setPending(false);
  }

  return (
    <button className="admin-link" type="button" onClick={handleLogout} disabled={pending}>
      {pending ? "退出中…" : "退出登录"}
    </button>
  );
}
