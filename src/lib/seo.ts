import type { Metadata } from "next";
import { getPublicSiteUrl } from "@/lib/site-url";

type MetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
};

type BreadcrumbItem = {
  name: string;
  path: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type OfferItem = {
  name: string;
  price: number | string;
  description?: string;
  urlPath?: string;
  category?: string;
};

type SoftwareApplicationSchemaOptions = {
  name?: string;
  path: string;
  description: string;
  featureList?: string[];
  offers?: OfferItem[];
  applicationCategory?: string;
  isAccessibleForFree?: boolean;
};

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

export const siteConfig = {
  name: "Decivio",
  description:
    "Decivio допомагає оцінити ваш дохід, ринок і кар'єрний потенціал, посилити резюме та підготуватися до кращої пропозиції.",
  url: getPublicSiteUrl(),
  locale: "uk_UA",
  language: "uk-UA",
  socialLinks: [
    "https://t.me/decivio",
    "https://www.instagram.com/decivio",
    "https://www.linkedin.com/company/decivio",
    "https://www.facebook.com/decivio",
    "https://www.youtube.com/@decivio"
  ]
} as const;

const defaultKeywords = [
  "оцінка зарплати",
  "аналіз доходу",
  "прогноз доходу",
  "ринкова зарплата",
  "підготовка до співбесіди",
  "покращення резюме",
  "аналіз зарплати",
  "кар'єрне планування"
];

function buildRobots(noIndex: boolean): Metadata["robots"] {
  if (noIndex) {
    return {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true
      }
    };
  }

  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  };
}

export function buildAbsoluteUrl(path = "/") {
  return new URL(path, `${siteConfig.url}/`).toString();
}

function buildBrandedTitle(title: string) {
  return `${title} | ${siteConfig.name}`;
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(`${siteConfig.url}/`),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "Career Development",
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  keywords: defaultKeywords,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website"
  },
  twitter: {
    card: "summary",
    title: siteConfig.name,
    description: siteConfig.description
  },
  robots: buildRobots(false),
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg"
  },
  verification: googleSiteVerification
    ? {
        google: googleSiteVerification
      }
    : undefined
};

export function createMetadata({ title, description, path, keywords = [], noIndex = false }: MetadataOptions): Metadata {
  const mergedKeywords = Array.from(new Set([...defaultKeywords, ...keywords]));
  const brandedTitle = buildBrandedTitle(title);

  return {
    title,
    description,
    keywords: mergedKeywords,
    alternates: {
      canonical: path
    },
    openGraph: {
      title: brandedTitle,
      description,
      url: buildAbsoluteUrl(path),
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website"
    },
    twitter: {
      card: "summary",
      title: brandedTitle,
      description
    },
    robots: buildRobots(noIndex)
  };
}

export function createOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: buildAbsoluteUrl("/favicon.svg"),
    description: siteConfig.description,
    sameAs: siteConfig.socialLinks
  };
}

export function createWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: siteConfig.language,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name
    }
  };
}

export function createBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildAbsoluteUrl(item.path)
    }))
  };
}

export function createFaqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

export function createSoftwareApplicationSchema({
  name = siteConfig.name,
  path,
  description,
  featureList,
  offers,
  applicationCategory = "BusinessApplication",
  isAccessibleForFree = true
}: SoftwareApplicationSchemaOptions) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    url: buildAbsoluteUrl(path),
    description,
    applicationCategory,
    operatingSystem: "Web",
    inLanguage: siteConfig.language,
    isAccessibleForFree,
    brand: {
      "@type": "Brand",
      name: siteConfig.name
    },
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url
    },
    featureList,
    offers: offers?.map((offer) => ({
      "@type": "Offer",
      name: offer.name,
      description: offer.description,
      price: offer.price,
      priceCurrency: "UAH",
      category: offer.category ?? "Career development software",
      url: buildAbsoluteUrl(offer.urlPath ?? path)
    }))
  };
}
