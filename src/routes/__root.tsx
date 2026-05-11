import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { NotFound } from "#/components/not-found";
import { Toaster } from "#/components/ui/sonner";
import ConvexRootProvider from "#/integrations/convex/root-provider";
import TanStackQueryProvider from "#/integrations/tanstack-query/root-provider";
import { UserLocationProvider } from "#/lib/user-location-provider";
import appCss from "#/styles.css?url";

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;
const SITE_DESCRIPTION =
  "Live Citi Bike station availability, capacity, and recent station activity across New York City.";
const SITE_ORIGIN = getSiteOrigin();
const SOCIAL_IMAGE_URL = new URL("/og-image-1200x630.png", SITE_ORIGIN).href;

function getSiteOrigin() {
  const origin =
    process.env.VITE_SITE_URL ??
    process.env.SITE_URL ??
    process.env.URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    "https://pedal-map.vercel.app";

  return origin.startsWith("http") ? origin : `https://${origin}`;
}

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Pedal Map",
      },
      {
        name: "description",
        content: SITE_DESCRIPTION,
      },
      {
        property: "og:title",
        content: "Pedal Map",
      },
      {
        property: "og:description",
        content: SITE_DESCRIPTION,
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:url",
        content: SITE_ORIGIN,
      },
      {
        property: "og:image",
        content: SOCIAL_IMAGE_URL,
      },
      {
        property: "og:image:width",
        content: "1200",
      },
      {
        property: "og:image:height",
        content: "630",
      },
      {
        property: "og:image:alt",
        content: "Pedal Map showing live Citi Bike station availability.",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:title",
        content: "Pedal Map",
      },
      {
        name: "twitter:description",
        content: SITE_DESCRIPTION,
      },
      {
        name: "twitter:image",
        content: SOCIAL_IMAGE_URL,
      },
      {
        name: "twitter:image:alt",
        content: "Pedal Map showing live Citi Bike station availability.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.ico",
        sizes: "any",
      },
      {
        rel: "icon",
        href: "/favicon.svg",
        type: "image/svg+xml",
      },
      {
        rel: "icon",
        href: "/favicon-96x96.png",
        type: "image/png",
        sizes: "96x96",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "preconnect",
        href: "https://api.mapbox.com",
      },
      {
        rel: "dns-prefetch",
        href: "https://api.mapbox.com",
      },
    ],
  }),
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        {process.env.REACT_SCAN_ENABLED === "true" && (
          <script
            async
            crossOrigin="anonymous"
            src="//unpkg.com/react-scan/dist/auto.global.js"
          />
        )}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: <theme came with the template> */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="bg-background dark font-sans wrap-anywhere antialiased">
        <TanStackQueryProvider>
          <ConvexRootProvider>
            <UserLocationProvider>{children}</UserLocationProvider>
          </ConvexRootProvider>
        </TanStackQueryProvider>
        <Scripts />
        <Toaster richColors />
        <Analytics />
      </body>
    </html>
  );
}
