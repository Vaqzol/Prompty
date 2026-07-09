import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import "highlight.js/styles/vs2015.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai"],
  display: "swap",
  variable: "--font-ibm-plex-sans-thai",
});

export const metadata: Metadata = {
  title: {
    default: "Prompty — Developer & Creator Prompt Hub",
    template: "%s | Prompty",
  },
  description: "แพลตฟอร์มแบ่งปัน Prompt และ Code Snippet สำหรับ Developer และ Creator",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${inter.variable} ${ibmPlexSansThai.variable}`} data-scroll-behavior="smooth">
      <body>
        {children}
        {modal}
      </body>
    </html>
  );
}
