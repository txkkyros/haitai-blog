import { NextResponse } from "next/server";
import { isLoggedIn } from "@/lib/auth";
import {
  deleteDraft,
  isValidSlug,
  listPosts,
  saveDraft,
  storageMode,
  type DraftPost,
} from "@/lib/admin-posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard() {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }
  return null;
}

function parseDraft(body: unknown): DraftPost | null {
  if (typeof body !== "object" || body === null) return null;
  const raw = body as Record<string, unknown>;

  const slug = typeof raw.slug === "string" ? raw.slug.trim() : "";
  const title = typeof raw.title === "string" ? raw.title.trim() : "";

  if (!slug || !title) return null;
  if (!isValidSlug(slug)) return null;

  const tags = Array.isArray(raw.tags)
    ? raw.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : [];

  const date =
    typeof raw.date === "string" && raw.date.trim().length > 0
      ? raw.date.trim()
      : new Date().toISOString().slice(0, 10);

  return {
    slug,
    title,
    date,
    excerpt: typeof raw.excerpt === "string" ? raw.excerpt.trim() : "",
    tags,
    content: typeof raw.content === "string" ? raw.content : "",
  };
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;

  try {
    return NextResponse.json({
      ok: true,
      posts: await listPosts(),
      mode: storageMode(),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "读取失败" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const draft = parseDraft(body);

  if (!draft) {
    return NextResponse.json(
      { ok: false, error: "标题和文件名不能为空，文件名只能包含文字、数字、横线和下划线" },
      { status: 400 },
    );
  }

  const previousSlug =
    typeof (body as Record<string, unknown>)?.previousSlug === "string"
      ? ((body as Record<string, unknown>).previousSlug as string)
      : undefined;

  try {
    await saveDraft(draft, previousSlug);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "保存失败" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    slug: draft.slug,
    mode: storageMode(),
  });
}

export async function DELETE(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const slug = typeof (body as Record<string, unknown>)?.slug === "string"
    ? ((body as Record<string, unknown>).slug as string)
    : "";

  if (!slug || !isValidSlug(slug)) {
    return NextResponse.json({ ok: false, error: "非法的文件名" }, { status: 400 });
  }

  try {
    const removed = await deleteDraft(slug);
    if (!removed) {
      return NextResponse.json({ ok: false, error: "文章不存在" }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "删除失败" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, mode: storageMode() });
}
