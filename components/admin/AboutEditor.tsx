"use client";

import { useMemo, useState } from "react";
import { marked } from "marked";
import { useRouter } from "next/navigation";

export default function AboutEditor({ initial }: { initial: string }) {
  const router = useRouter();
  const [content, setContent] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const previewHtml = useMemo(() => {
    try {
      return marked.parse(content, { async: false }) as string;
    } catch {
      return "<p>预览解析失败</p>";
    }
  }, [content]);

  async function handleSave() {
    setPending(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/admin/about", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
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
          <h1 className="admin-editor-title">关于页面</h1>
          <p className="admin-sub">
            这里写的内容会直接显示在 <code>/about</code>，支持 Markdown。
          </p>
        </div>

        <button className="btn" type="button" onClick={handleSave} disabled={pending}>
          {pending ? "保存中…" : "保存"}
        </button>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}
      {notice ? <p className="admin-notice">{notice}</p> : null}

      <div className="admin-workspace">
        <label className="admin-field admin-field-grow">
          <span>内容（Markdown）</span>
          <textarea
            className="admin-textarea"
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              setNotice(null);
            }}
            placeholder={"想写什么就写什么。\n\n## 小标题\n\n- 列表项\n\n**加粗**、*斜体*、[链接](https://example.com)"}
            spellCheck={false}
          />
        </label>

        <div className="admin-field admin-field-grow">
          <span>预览</span>
          <div
            className="admin-preview article-body"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>
    </div>
  );
}
