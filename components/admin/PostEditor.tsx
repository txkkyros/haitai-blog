"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { marked } from "marked";

export type EditorDraft = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string;
  content: string;
};

function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w\u4e00-\u9fff\u3040-\u30ff-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function PostEditor({
  initial,
  isNew,
  previousSlug,
}: {
  initial: EditorDraft;
  isNew: boolean;
  previousSlug?: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<EditorDraft>(initial);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [showPreview, setShowPreview] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const previewHtml = useMemo(() => {
    try {
      return marked.parse(draft.content, { async: false }) as string;
    } catch {
      return "<p>预览解析失败</p>";
    }
  }, [draft.content]);

  function update<K extends keyof EditorDraft>(key: K, value: EditorDraft[K]) {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      if (key === "title" && !slugTouched) {
        next.slug = slugify(String(value));
      }
      return next;
    });
    setNotice(null);
  }

  async function handleSave() {
    setPending(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          tags: draft.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          previousSlug,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "保存失败");
        return;
      }

      setNotice(
        data?.mode === "github"
          ? "已提交到 GitHub，Vercel 正在重新部署，约 1 分钟后生效"
          : "已保存",
      );
      router.refresh();

      if (isNew) {
        router.push(`/admin/edit?slug=${encodeURIComponent(data.slug)}`);
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`确定删除《${draft.title || draft.slug}》？`)) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: draft.slug }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "删除失败");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-editor">
      <div className="admin-editor-head">
        <div>
          <Link className="admin-back" href="/admin">
            ← 返回列表
          </Link>
          <h1 className="admin-editor-title">{isNew ? "新建文章" : "编辑文章"}</h1>
        </div>

        <div className="admin-editor-actions">
          <button
            className="admin-link"
            type="button"
            onClick={() => setShowPreview((value) => !value)}
          >
            {showPreview ? "隐藏预览" : "显示预览"}
          </button>

          {!isNew ? (
            <button
              className="admin-link admin-link-danger"
              type="button"
              onClick={handleDelete}
              disabled={pending}
            >
              删除
            </button>
          ) : null}

          <button className="btn" type="button" onClick={handleSave} disabled={pending}>
            {pending ? "保存中…" : "保存"}
          </button>
        </div>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}
      {notice ? <p className="admin-notice">{notice}</p> : null}

      <div className="admin-fields">
        <label className="admin-field">
          <span>标题</span>
          <input
            className="admin-input"
            value={draft.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder="文章标题"
          />
        </label>

        <div className="admin-field-row">
          <label className="admin-field">
            <span>文件名（URL）</span>
            <input
              className="admin-input"
              value={draft.slug}
              onChange={(event) => {
                setSlugTouched(true);
                update("slug", event.target.value);
              }}
              placeholder="my-first-post"
            />
          </label>

          <label className="admin-field admin-field-narrow">
            <span>日期</span>
            <input
              className="admin-input"
              type="date"
              value={draft.date}
              onChange={(event) => update("date", event.target.value)}
            />
          </label>
        </div>

        <label className="admin-field">
          <span>摘要</span>
          <input
            className="admin-input"
            value={draft.excerpt}
            onChange={(event) => update("excerpt", event.target.value)}
            placeholder="列表页显示的一句话"
          />
        </label>

        <label className="admin-field">
          <span>标签（逗号分隔）</span>
          <input
            className="admin-input"
            value={draft.tags}
            onChange={(event) => update("tags", event.target.value)}
            placeholder="随笔, Next.js"
          />
        </label>
      </div>

      <div className={showPreview ? "admin-workspace" : "admin-workspace is-single"}>
        <label className="admin-field admin-field-grow">
          <span>正文（Markdown）</span>
          <textarea
            className="admin-textarea"
            value={draft.content}
            onChange={(event) => update("content", event.target.value)}
            placeholder={"在这里写正文…\n\n## 小标题\n\n- 列表项\n\n> 引用"}
            spellCheck={false}
          />
        </label>

        {showPreview ? (
          <div className="admin-field admin-field-grow">
            <span>预览</span>
            <div
              className="admin-preview article-body"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
