import Link from "next/link";
import { formatDate, type PostMeta } from "@/lib/posts";

export default function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="post-card">
      <div className="post-card-meta">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span className="meta-dot" />
        <span>{post.readingMinutes} 分钟</span>
      </div>

      <h3 className="post-card-title">
        {/* 链接通过 ::after 铺满整张卡片，点卡片任意位置都能进文章 */}
        <Link className="post-card-link" href={`/posts/${post.slug}`}>
          {post.title}
        </Link>
      </h3>

      <p className="post-card-excerpt">{post.excerpt}</p>

      <div className="post-card-tags">
        {post.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>

      <span className="post-card-more" aria-hidden="true">
        阅读全文 <span className="post-card-arrow">→</span>
      </span>
    </article>
  );
}
