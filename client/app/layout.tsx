import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Manrope, Cairo } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CartProvider } from "@/components/CartProvider";
import { LanguageProvider } from "@/components/LanguageProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Naqaa | منتجات العناية بالشعر",
  description: "نقاء الطبيعة لمنتجات العناية بالشعر",
};

import { AuthProvider } from "@/components/AuthProvider";

import { CMSProvider } from "@/components/CMSProvider";
import { WishlistProvider } from "@/components/WishlistProvider";
import { SocketProvider } from "@/components/SocketProvider";

import { SideWishlist } from "@/components/SideWishlist";
import { Navbar } from "@/components/Navbar";
import { SideCart } from "@/components/SideCart";
import { MenuProvider } from "@/components/MenuProvider";
import { SideMenu } from "@/components/SideMenu";
import { Preloader } from "@/components/Preloader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${manrope.variable} ${cairo.variable} h-full antialiased font-body dark`}
      suppressHydrationWarning
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL,GRAD,opsz@100..700,0..1,-50..200,20..48&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('naqaa-theme');
              if (t) {
                document.documentElement.classList.remove('light','dark');
                document.documentElement.classList.add(t);
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-surface selection:bg-primary/30">
        <ThemeProvider>
          <LanguageProvider>
            <Preloader />
            <AuthProvider>
              <SocketProvider>
                <CMSProvider>
                  <WishlistProvider>
                    <CartProvider>
                      <MenuProvider>
                        <SideWishlist />
                        <SideCart />
                        <SideMenu />
                        <Navbar />
                        {children}
                      </MenuProvider>
                    </CartProvider>
                  </WishlistProvider>
                </CMSProvider>
              </SocketProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
