import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AboutEditor from "@/components/admin/AboutEditor";
import AdminTabs from "@/components/admin/AdminTabs";
import LogoutButton from "@/components/admin/LogoutButton";
import { readAbout } from "@/lib/about";
import { isLoggedIn } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "关于页面",
  robots: { index: false, follow: false },
};

export default async function AdminAboutPage() {
  if (!(await isLoggedIn())) {
    redirect("/admin");
  }

  return (
    <section className="admin-shell">
      <div className="admin-head">
        <div>
          <p className="section-kicker">ADMIN</p>
          <h1 className="admin-title">页面内容</h1>
          <p className="admin-sub">保存后前台立即生效。</p>
        </div>
        <div className="admin-head-actions">
          <LogoutButton />
        </div>
      </div>

      <AdminTabs active="about" />

      <AboutEditor initial={readAbout()} />
    </section>
  );
}
