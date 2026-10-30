import type { Metadata } from "next";
import { readAbout, renderAbout } from "@/lib/about";

export const metadata: Metadata = {
  title: "关于",
};

export default function AboutPage() {
  const source = readAbout();

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
