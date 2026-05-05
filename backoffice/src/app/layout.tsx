'use client';

import { Poppins, Source_Sans_3 } from "next/font/google";
import { CreThemeProvider } from "@cre/web-ui";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${sourceSans.variable}`}
    >
      <body>
        <CreThemeProvider scope="global" initialMode="light">
          {children}
        </CreThemeProvider>
      </body>
    </html>
  );
}
