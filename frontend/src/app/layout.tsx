import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { clashDisplay, satoshi } from "@/fonts/fonts";
import ToastContainer from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CampusFlow — the whole campus, in sync",
  description:
    "Timetables, classrooms, and roles unified in one platform that refuses to double-book. Conflict-free scheduling for students, teachers, and admins.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${clashDisplay.variable} ${satoshi.variable} ${inter.variable} motion-safe:scroll-smooth`}
    >
      <body className={inter.className}>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
