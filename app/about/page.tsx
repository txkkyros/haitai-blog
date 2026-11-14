import type { Metadata } from "next";
import { readAboutAsync, renderAbout } from "@/lib/about";

export const metadata: Metadata = {
  title: "关于",
};

// 请求时读取，后台改完刷新即可看到
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const source = await readAboutAsync();

  if (source.trim().length === 0) {
    return <section className="about-empty" />;
  }

  return (
    <article className="article">
      <div
        className="article-body article-body-wide"
        dangerouslySetInnerHTML={{ __html: renderAbout(source) }}
      />
    </article>
  );
}
