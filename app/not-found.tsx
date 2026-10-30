import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page-head">
      <p className="section-kicker">404</p>
      <h1 className="page-title">这一页不存在</h1>
      <p className="page-lede">
        可能是链接写错了，也可能是文章还没写。要不回首页看看？
      </p>
      <p style={{ marginTop: 32 }}>
        <Link className="btn" href="/">
          回到首页
        </Link>
      </p>
    </section>
  );
}
