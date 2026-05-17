import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UrbanTree GIS - Hệ thống Quản lý Cây xanh Đô thị",
  description:
    "Hệ thống GIS quản lý cây xanh, công viên và mảng xanh đô thị. Theo dõi, giám sát và duy tu hạ tầng xanh thành phố.",
  keywords: ["cây xanh", "GIS", "đô thị", "quản lý", "bản đồ", "TP.HCM"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
