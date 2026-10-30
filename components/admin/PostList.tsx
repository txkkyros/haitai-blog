"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PostSummary } from "@/lib/admin-posts";

export default function PostList({ posts }: { posts: PostSummary[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(slug: string, title: string) {
    if (!window.confirm(`确定删除《${title}》？此操作不可撤销。`)) return;

    setBusy(slug);
    setError(null);

    try {
      const response = await fetch("/api/admin/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "删除失败");
        return;
      }

      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setBusy(null);
    }
  }

  if (posts.length === 0) {
    return (
      <div className="admin-empty">
        <p>还没有文章。</p>
        <Link className="btn" href="/admin/edit">
          写第一篇
        </Link>
      </div>
    );
  }

  return (
    <>
      {error ? <p className="admin-error">{error}</p> : null}

      <ul className="admin-post-list">
        {posts.map((post) => (
          <li key={post.slug} className="admin-post-row">
            <div className="admin-post-info">
              <span className="admin-post-date">{post.date}</span>
              <span className="admin-post-title">{post.title}</span>
              <span className="admin-post-slug">/{post.slug}</span>
            </div>

            <div className="admin-post-actions">
              <Link className="admin-link" href={`/admin/edit?slug=${encodeURIComponent(post.slug)}`}>
                编辑
              </Link>
              <button
                className="admin-link admin-link-danger"
                type="button"
                onClick={() => handleDelete(post.slug, post.title)}
                disabled={busy === post.slug}
              >
                {busy === post.slug ? "删除中…" : "删除"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
