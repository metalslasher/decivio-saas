import { Manrope } from "next/font/google";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createOrganizationSchema, createWebSiteSchema, rootMetadata } from "@/lib/seo";
import "./globals.css";

export const metadata = rootMetadata;

const bodyFont = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"]
});

const organizationSchema = createOrganizationSchema();
const webSiteSchema = createWebSiteSchema();

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className={`${bodyFont.variable} antialiased`}>
        <JsonLd data={organizationSchema} />
        <JsonLd data={webSiteSchema} />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
