import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kastly — קמפיינים שיווקיים בעברית, בכמה שניות",
  description:
    "הדביקו URL של העסק. קבלו קמפיין שיווקי מלא — טקסטים, תמונות ודף נחיתה — מותאם לפייסבוק, אינסטגרם ולינקדאין. הכול בעברית, בטון ישראלי.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
