import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { Providers } from "@/components/providers";
import { FeedbackWidgetWrapper } from "@/components/feedback-widget-wrapper";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CROWN — Comunidade",
  description: "Comunidade CROWN para mulheres empreendedoras",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${montserrat.className} ${montserrat.variable} antialiased`}>
        <Providers>
          <div className="mx-auto max-w-[430px] lg:max-w-full min-h-screen relative">
            {children}
          </div>
          <FeedbackWidgetWrapper />
        </Providers>
      </body>
    </html>
  );
}
