export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p>
          © {new Date().getFullYear()} 海苔的博客
          <span className="footer-dot">·</span>
          用 Next.js 构建
        </p>
        <p className="footer-note">慢慢写，认真生活。</p>
      </div>
    </footer>
  );
}
