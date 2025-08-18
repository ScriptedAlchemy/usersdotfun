import { ClientOnly, Link } from "@tanstack/react-router";
import { ModeToggle } from "~/components/mode-toggle";
import { useWebSocket } from "~/lib/websocket";
import { UserSection } from "./user-section";

function WebSocketStatus() {
  const { isConnected } = useWebSocket();

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 border-2 ${
          isConnected
            ? "bg-primary border-primary animate-pulse"
            : "bg-destructive border-destructive"
        }`}
        title={isConnected ? "WebSocket Connected" : "WebSocket Disconnected"}
      />
      <span className="text-xs font-mono uppercase text-muted-foreground">
        {isConnected ? "Online" : "Offline"}
      </span>
    </div>
  );
}

export function Header() {
  return (
    <header className="border-b-2 border-border bg-background relative z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <nav className="flex gap-6">
            <Link
              to="/"
              className="text-sm font-mono font-bold uppercase tracking-wide transition-all hover:text-primary hover:translate-x-1"
              activeProps={{
                className: "text-primary",
              }}
              inactiveProps={{
                className: "text-foreground",
              }}
            >
              Home
            </Link>
            <Link
              to="/workflows"
              className="text-sm font-mono font-bold uppercase tracking-wide transition-all hover:text-primary hover:translate-x-1"
              activeProps={{
                className: "text-primary",
              }}
              inactiveProps={{
                className: "text-foreground",
              }}
            >
              Workflows
            </Link>
            <Link
              to="/queues"
              className="text-sm font-mono font-bold uppercase tracking-wide transition-all hover:text-primary hover:translate-x-1"
              activeProps={{
                className: "text-primary",
              }}
              inactiveProps={{
                className: "text-foreground",
              }}
            >
              Queues
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <WebSocketStatus />
            <ClientOnly>
              <UserSection />
            </ClientOnly>
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
