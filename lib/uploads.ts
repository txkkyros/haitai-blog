import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ghGetFile, ghPutFileRaw, githubEnabled } from "./github";

/** 允许的图片类型 → 扩展名 */
const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/** 单张图片上限 4 MB（Netlify 函数请求体有大小限制） */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** 仓库里的相对目录 */
const REPO_DIR = "public/uploads";
/** 本地目录 */
const LOCAL_DIR = path.join(process.cwd(), "public", "uploads");

export function isAllowedImage(mime: string): boolean {
  return mime in EXT_BY_MIME;
}

export function buildFileName(mime: string): string {
  const ext = EXT_BY_MIME[mime] ?? "bin";
  const stamp = new Date().toISOString().slice(0, 10);
  const random = crypto.randomBytes(6).toString("hex");
  return `${stamp}-${random}.${ext}`;
}

/** 保存图片，返回可以直接放进 Markdown 的 URL。 */
export async function saveUpload(
  fileName: string,
  bytes: Buffer,
  mime: string,
): Promise<string> {
  const url = `/uploads/${fileName}`;

  if (githubEnabled()) {
    const target = `${REPO_DIR}/${fileName}`;
    const existing = await ghGetFile(target);
    await ghPutFileRaw(
      target,
      bytes.toString("base64"),
      `上传图片：${fileName}`,
      existing?.sha,
    );
    return url;
  }

  if (!fs.existsSync(LOCAL_DIR)) {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
  }
  fs.writeFileSync(path.join(LOCAL_DIR, fileName), bytes);
  return url;
}

export function uploadMode(): "github" | "local" {
  return githubEnabled() ? "github" : "local";
}
