import { NextResponse } from "next/server";
import { writeAboutAsync } from "@/lib/about";
import { storageMode } from "@/lib/admin-posts";
import { isLoggedIn } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const content =
    typeof (body as Record<string, unknown>)?.content === "string"
      ? ((body as Record<string, unknown>).content as string)
      : null;

  if (content === null) {
    return NextResponse.json({ ok: false, error: "内容格式错误" }, { status: 400 });
  }

  try {
    await writeAboutAsync(content);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "保存失败" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, mode: storageMode() });
}
