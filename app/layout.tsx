import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://liuhuanjun.top"),
  title: { default: "Raven", template: "%s / Raven" },
  description: "Leo.h.Jay 的设计与开发笔记。",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <footer className="page footer">
          <span className="mono">Raven</span>
          <span className="label">© 2026 Leo.h.Jay</span>
          <span className="footer-links label">
            <a href="https://github.com/lhjZY">GitHub</a>
            <a href="https://x.com/SevenLhj">X</a>
            <a href="mailto:leo.h.jay1998@gmail.com">Email</a>
          </span>
        </footer>
      </body>
    </html>
  );
}
