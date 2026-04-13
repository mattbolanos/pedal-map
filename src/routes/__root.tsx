import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "#/components/ui/sonner";
import TanStackQueryProvider from "#/integrations/tanstack-query/root-provider";
import appCss from "#/styles.css?url";

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
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
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
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV !== "production" && (
          <script
            crossOrigin="anonymous"
            src="//unpkg.com/react-scan/dist/auto.global.js"
          />
        )}

        <HeadContent />
      </head>
      <body className="dark font-sans wrap-anywhere antialiased">
        <TanStackQueryProvider>{children}</TanStackQueryProvider>
        <Scripts />
        <Toaster />
      </body>
    </html>
  );
}
