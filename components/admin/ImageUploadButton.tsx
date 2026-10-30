"use client";

import { useRef, useState } from "react";

/** 浏览器端压缩：最长边缩到 1600px，转 WebP，通常能压到原图 1/5 以下 */
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxEdge = 1600;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return file;

  context.drawImage(bitmap, 0, 0, width, height);

  const toBlob = (type: string, quality?: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

  return (await toBlob("image/webp", 0.86)) ?? (await toBlob("image/jpeg", 0.9)) ?? file;
}

export default function ImageUploadButton({
  onInsert,
  disabled,
}: {
  onInsert: (markdown: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    setNotice(null);

    try {
      let payload: Blob = file;
      let name = file.name;

      try {
        payload = await compressImage(file);
        name = name.replace(/\.[^.]+$/, "") + ".webp";
      } catch {
        // 压缩失败就传原图
      }

      const body = new FormData();
      body.append("file", payload, name);

      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "上传失败");
        return;
      }

      const alt = file.name.replace(/\.[^.]+$/, "");
      onInsert(`![${alt}](${data.url})`);
      setNotice(
        `已插入，${Math.round(payload.size / 1024)} KB` +
          (data.mode === "github" ? "（提交中，约 30 秒后可见）" : ""),
      );
    } catch {
      setError("上传失败，请重试");
    } finally {
      setUploading(false);
    }
  }

  return (
    <span className="admin-upload">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        onChange={handleChange}
        hidden
      />
      <button
        className="admin-link"
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
      >
        {uploading ? "上传中…" : "插入图片"}
      </button>
      {error ? <span className="admin-upload-msg is-error">{error}</span> : null}
      {notice ? <span className="admin-upload-msg">{notice}</span> : null}
    </span>
  );
}
