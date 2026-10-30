import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/admin/LoginForm";
import LogoutButton from "@/components/admin/LogoutButton";
import AdminTabs from "@/components/admin/AdminTabs";
import PostList from "@/components/admin/PostList";
import { listPosts } from "@/lib/admin-posts";
import { isLoggedIn } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "管理后台",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const loggedIn = await isLoggedIn();

  if (!loggedIn) {
    return (
      <section className="admin-shell">
        <LoginForm />
      </section>
    );
  }

  const posts = await listPosts();

  return (
    <section className="admin-shell">
      <div className="admin-head">
        <div>
          <p className="section-kicker">ADMIN</p>
          <h1 className="admin-title">文章管理</h1>
          <p className="admin-sub">共 {posts.length} 篇，保存后前台立即生效。</p>
        </div>

        <div className="admin-head-actions">
          <LogoutButton />
          <Link className="btn" href="/admin/edit">
            新建文章
          </Link>
        </div>
      </div>

      <AdminTabs active="posts" />

      <PostList posts={posts} />
    </section>
  );
}
