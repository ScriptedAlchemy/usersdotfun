/// <reference types="vite/client" />
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "next-themes";
import * as React from "react";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import { Toaster } from "~/components/ui/sonner";
import { WebSocketProvider, useWebSocket } from "~/lib/websocket";
import appCss from "~/styles/app.css?url";
import { seo } from "~/utils/seo";

const queryClient = new QueryClient();

function WebSocketStatus() {
  const { isConnected } = useWebSocket();
  
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}
        title={isConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}
      />
      <span className="text-sm text-muted-foreground">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: () => (
    <>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <Outlet />
      </ThemeProvider>
      <Toaster />
      <TanStackRouterDevtools />
    </>
  ),
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...seo({
        title:
          "TanStack Start | Type-Safe, Client-First, Full-Stack React Framework",
        description: `TanStack Start is a type-safe, client-first, full-stack React framework. `,
      }),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
      { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
      { rel: "icon", href: "/favicon.ico" },
    ],
    scripts: [
      {
        src: "/customScript.js",
        type: "text/javascript",
      },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <html>
          <head>
            <HeadContent />
          </head>
          <body>
            <div className="p-2 flex justify-between items-center">
              <div className="flex gap-2 text-lg">
                <Link
                  to="/"
                  activeProps={{
                    className: "font-bold",
                  }}
                  activeOptions={{ exact: true }}
                >
                  Home
                </Link>{" "}
                <Link
                  to="/jobs"
                  activeProps={{
                    className: "font-bold",
                  }}
                >
                  Jobs
                </Link>{" "}
                <Link
                  to="/queues"
                  activeProps={{
                    className: "font-bold",
                  }}
                >
                  Queues
                </Link>{" "}
                <Link
                  to="/projects"
                  activeProps={{
                    className: "font-bold",
                  }}
                >
                  Projects
                </Link>{" "}
                <Link
                  to="/users"
                  activeProps={{
                    className: "font-bold",
                  }}
                >
                  Users
                </Link>{" "}
                <Link
                  to="/route-a"
                  activeProps={{
                    className: "font-bold",
                  }}
                >
                  Pathless Layout
                </Link>{" "}
                <Link
                  to="/deferred"
                  activeProps={{
                    className: "font-bold",
                  }}
                >
                  Deferred
                </Link>{" "}
              </div>
              <WebSocketStatus />
            </div>
            <hr />
            {children}
            <Scripts />
          </body>
        </html>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}
