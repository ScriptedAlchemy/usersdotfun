import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ModeToggle } from "~/components/mode-toggle";
import { Button } from "~/components/ui/button";
import { authClient, useSession } from "~/lib/auth-client";
import { useWebSocket } from "~/lib/websocket";

function WebSocketStatus() {
  const { isConnected } = useWebSocket();

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 border-2 ${
          isConnected ? "bg-primary border-primary animate-pulse" : "bg-destructive border-destructive"
        }`}
        title={isConnected ? "WebSocket Connected" : "WebSocket Disconnected"}
      />
      <span className="text-xs font-mono uppercase text-muted-foreground">
        {isConnected ? "Online" : "Offline"}
      </span>
    </div>
  );
}

function UserSection() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isLoading, setLoading] = useState(false);

  if (isPending) {
    return <div className="text-xs font-mono uppercase text-muted-foreground">Loading...</div>;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm font-mono">
        <span className="text-muted-foreground uppercase">User: </span>
        <span className="font-bold text-primary">
          {session.user.isAnonymous ? "Guest" : session.user.name}
        </span>
      </div>
      <Button
        onClick={async () => {
          setLoading(true);
          await authClient.signOut();
          await queryClient.invalidateQueries({ queryKey: ["user"] });
          await router.invalidate();
        }}
        disabled={isLoading}
        variant="outline"
        size="sm"
      >
        {isLoading ? "..." : "Logout"}
      </Button>
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
            <UserSection />
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
