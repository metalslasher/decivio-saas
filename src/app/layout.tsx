import { Manrope } from "next/font/google";
import Script from "next/script";
import { AuthDialogProvider } from "@/components/auth-dialog-provider";
import { JsonLd } from "@/components/json-ld";
import { AuthRecoveryRedirect } from "@/components/auth-recovery-redirect";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createOrganizationSchema, createWebSiteSchema, rootMetadata } from "@/lib/seo";
import "./globals.css";

export const metadata = rootMetadata;

const GOOGLE_TAG_MANAGER_ID = "GTM-P9B3V4LG";

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
    <html lang="uk" data-scroll-behavior="smooth">
      <head>
        <Script id="google-tag-manager" strategy="beforeInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GOOGLE_TAG_MANAGER_ID}');`}
        </Script>
      </head>
      <body className={`${bodyFont.variable} antialiased`}>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GOOGLE_TAG_MANAGER_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <AuthDialogProvider>
          <AuthRecoveryRedirect />
          <JsonLd data={organizationSchema} />
          <JsonLd data={webSiteSchema} />
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </AuthDialogProvider>
      </body>
    </html>
  );
}
