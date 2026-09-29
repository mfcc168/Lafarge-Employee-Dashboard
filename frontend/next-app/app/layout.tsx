import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/app/providers";
import AppShell from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Lafarge Employee Dashboard",
  description: "Employee reports, vacation, payroll and sales dashboard",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
