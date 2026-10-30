import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getAdjacentPosts, getAllPosts, getPost } from "@/lib/posts";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// 内容在构建时从 content/posts 读入并静态化；后台保存会触发重新部署
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    return { title: "文章未找到" };
  }

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    notFound();
  }

  const { newer, older } = getAdjacentPosts(slug);

  return (
    <article className="article">
      <header className="article-head">
        <div className="article-meta">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span className="meta-dot" />
          <span>{post.readingMinutes} 分钟阅读</span>
        </div>
        <h1 className="article-title">{post.title}</h1>
        <div className="article-tags">
          {post.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div
        className="article-body"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />

      <nav className="article-nav" aria-label="文章导航">
        {newer ? (
          <Link href={`/posts/${newer.slug}`}>
            <span>← 上一篇</span>
            <strong>{newer.title}</strong>
          </Link>
        ) : (
          <span />
        )}
        {older ? (
          <Link className="next" href={`/posts/${older.slug}`}>
            <span>下一篇 →</span>
            <strong>{older.title}</strong>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
