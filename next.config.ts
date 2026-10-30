import type { NextConfig } from "next";

// 静态导出（GitHub Pages 用）：把站点编译成纯 HTML
const isExport = process.env.STATIC_EXPORT === "1";
const basePath = "/haitai-blog";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isExport
    ? {
        output: "export" as const,
        basePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  // 内容在请求时从 content/ 读取，部署到 Vercel 这类平台时需要把文件打进产物
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
  // 开发模式下通过公网隧道访问时，Next 会拦截跨源的 dev 资源
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.lhr.life",
    "*.localhost.run",
    "*.serveousercontent.com",
  ],
};

export default nextConfig;
