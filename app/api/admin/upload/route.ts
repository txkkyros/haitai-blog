import { NextResponse } from "next/server";
import { isLoggedIn } from "@/lib/auth";
import {
  MAX_UPLOAD_BYTES,
  buildFileName,
  isAllowedImage,
  saveUpload,
  uploadMode,
} from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "没有收到文件" }, { status: 400 });
  }

  if (!isAllowedImage(file.type)) {
    return NextResponse.json(
      { ok: false, error: "只支持 PNG / JPEG / WebP / GIF / AVIF" },
      { status: 400 },
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { ok: false, error: "图片太大，请控制在 4 MB 以内" },
      { status: 413 },
    );
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const fileName = buildFileName(file.type);
    const url = await saveUpload(fileName, bytes, file.type);

    return NextResponse.json({
      ok: true,
      url,
      size: file.size,
      mode: uploadMode(),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "上传失败" },
      { status: 500 },
    );
  }
}
