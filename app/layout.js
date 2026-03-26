import "./globals.css";

export const metadata = {
  title: "内容雷达 — 全域内容监控平台",
  description: "按分类管理内容监控任务，支持多平台关键词与博主监控，AI 智能生成选题报告",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
