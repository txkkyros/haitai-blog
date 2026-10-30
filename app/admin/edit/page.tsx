import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PostEditor from "@/components/admin/PostEditor";
import { readDraft } from "@/lib/admin-posts";
import { isLoggedIn } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "编辑文章",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ slug?: string }>;
};

export default async function AdminEditPage({ searchParams }: PageProps) {
  if (!(await isLoggedIn())) {
    redirect("/admin");
  }

  const { slug } = await searchParams;
  const existing = slug ? await readDraft(slug) : null;

  if (slug && !existing) {
    redirect("/admin");
  }

  const initial = existing
    ? {
        slug: existing.slug,
        title: existing.title,
        date: existing.date,
        excerpt: existing.excerpt,
        tags: existing.tags.join(", "),
        content: existing.content,
      }
    : {
        slug: "",
        title: "",
        date: new Date().toISOString().slice(0, 10),
        excerpt: "",
        tags: "",
        content: "",
      };

  return (
    <section className="admin-shell">
      <PostEditor
        initial={initial}
        isNew={!existing}
        previousSlug={existing ? existing.slug : undefined}
      />
    </section>
  );
}
