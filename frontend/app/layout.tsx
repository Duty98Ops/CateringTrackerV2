import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Catering Cost Tracker",
  description:
    "Sistem Monitoring dan Analisis Biaya Operasional Bahan Baku pada Usaha Catering",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="w-full flex-1 overflow-x-hidden px-4 pb-12 pt-16 md:px-8 md:pt-7 max-w-[1480px]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
