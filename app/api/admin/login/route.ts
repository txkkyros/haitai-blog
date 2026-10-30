import { NextResponse } from "next/server";
import { checkPassword, startSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!checkPassword(password)) {
    // 简单延迟，降低暴力尝试效率
    await new Promise((resolve) => setTimeout(resolve, 400));
    return NextResponse.json(
      { ok: false, error: "密码不正确" },
      { status: 401 },
    );
  }

  await startSession();
  return NextResponse.json({ ok: true });
}
