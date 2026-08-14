import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { UserProvider } from "@/providers/UserProvider";
import { AssessmentGate } from "@/components/AssessmentGate";
import { QueryProvider } from "@/providers/QueryProvider";
import { AssessmentProvider } from "@/providers/AssessmentProvider";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["vietnamese", "latin"], // Hỗ trợ đầy đủ ký tự tiếng Việt.
  variable: "--font-jetbrains-mono", // Tạo biến CSS để dùng font thống nhất trong toàn ứng dụng.
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "gPBL",
    template: "%s | gPBL",
  },
  description: "AI-assisted coding challenge and project-based learning platform.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full font-[family-name:var(--font-jetbrains-mono)]">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <QueryProvider>
            <ToastProvider>
              <UserProvider>
                <AssessmentProvider>
                  <AssessmentGate>
                    <main>{children}</main>
                  </AssessmentGate>
                </AssessmentProvider>
              </UserProvider>
            </ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
