import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { ghGetFileRaw, githubEnabled } from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

/**
 * 图片直出：上传后的图片存在仓库里，构建产物里没有，
 * 所以走这个接口现读现发，插进文章后立刻就能看见。
 */
export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("p") ?? "";

  if (!/^\/uploads\/[\w.\-]+$/.test(target)) {
    return new NextResponse("bad path", { status: 400 });
  }

  const ext = target.split(".").pop()?.toLowerCase() ?? "";
  const contentType = MIME[ext] ?? "application/octet-stream";
  const headers = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=86400",
  };

  try {
    if (githubEnabled()) {
      const file = await ghGetFileRaw(`public${target}`);
      if (!file) return new NextResponse("not found", { status: 404 });
      return new NextResponse(Buffer.from(file.base64, "base64"), { headers });
    }

    const local = path.join(process.cwd(), "public", target.replace(/^\//, ""));
    if (!fs.existsSync(local)) return new NextResponse("not found", { status: 404 });
    return new NextResponse(fs.readFileSync(local), { headers });
  } catch {
    return new NextResponse("error", { status: 500 });
  }
}
