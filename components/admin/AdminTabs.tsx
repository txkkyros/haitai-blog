import Link from "next/link";

export default function AdminTabs({ active }: { active: "posts" | "about" }) {
  return (
    <nav className="admin-tabs" aria-label="后台导航">
      <Link
        href="/admin"
        className={active === "posts" ? "admin-tab is-active" : "admin-tab"}
      >
        文章
      </Link>
      <Link
        href="/admin/about"
        className={active === "about" ? "admin-tab is-active" : "admin-tab"}
      >
        关于页面
      </Link>
    </nav>
  );
}
