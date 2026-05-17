import "./globals.css";
import { Space_Grotesk, Fraunces } from "next/font/google";
import AuthShell from "../components/AuthShell";

const sans = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable}`}>
        <div className="ambient-bg" />
        <div className="relative min-h-screen">
          <AuthShell>{children}</AuthShell>
        </div>
      </body>
    </html>
  );
}
