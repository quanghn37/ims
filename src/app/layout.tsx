import React from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/locales/LanguageContext";
import { AntdLocaleProvider } from "@/locales/AntdLocaleProvider";
import { ErpLayout } from "@/components/layout/ErpLayout";

export const metadata = {
  title: "ConsIMS System",
  description: "ConsIMS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body style={{ margin: 0, padding: 0, background: "#f2f6f5", color: "#123443", fontFamily: "Segoe UI, -apple-system, Roboto, sans-serif" }}>
        <AntdRegistry>
          <AuthProvider>
            <LanguageProvider>
              <AntdLocaleProvider>
                <ErpLayout>{children}</ErpLayout>
              </AntdLocaleProvider>
            </LanguageProvider>
          </AuthProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
