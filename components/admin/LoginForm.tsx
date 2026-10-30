"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "登录失败");
        setPending(false);
        return;
      }

      router.refresh();
    } catch {
      setError("网络错误，请重试");
      setPending(false);
    }
  }

  return (
    <form className="admin-login" onSubmit={handleSubmit}>
      <h1 className="admin-login-title">管理后台</h1>
      <p className="admin-login-lede">输入密码后即可管理文章。</p>

      <input
        className="admin-input"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="密码"
        autoFocus
        autoComplete="current-password"
      />

      {error ? <p className="admin-error">{error}</p> : null}

      <button className="btn" type="submit" disabled={pending || password.length === 0}>
        {pending ? "验证中…" : "进入"}
      </button>
    </form>
  );
}
