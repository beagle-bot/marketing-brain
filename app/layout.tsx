import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppFrame } from "@/components/AppFrame";
import { BrainProvider } from "@/components/BrainProvider";

export const metadata: Metadata = {
  title: "marketing brain",
  description: "每天 30 条中国营销案例，筛选成你的营销大脑。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "marketing brain",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#15181d"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <BrainProvider>
          <AppFrame>{children}</AppFrame>
        </BrainProvider>
      </body>
    </html>
  );
}
