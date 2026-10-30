import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
