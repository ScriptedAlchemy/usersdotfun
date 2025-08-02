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
        className={`w-2 h-2 rounded-full ${
          isConnected ? "bg-green-500" : "bg-red-500"
        }`}
        title={isConnected ? "WebSocket Connected" : "WebSocket Disconnected"}
      />
      <span className="text-sm text-muted-foreground">
        {isConnected ? "Connected" : "Disconnected"}
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
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <span className="text-muted-foreground">Welcome, </span>
        <span className="font-medium">{session.user.name}</span>
        {session.user.isAnonymous && (
          <span className="text-muted-foreground ml-1">(Anonymous)</span>
        )}
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
        {isLoading ? "Signing out..." : "Sign Out"}
      </Button>
    </div>
  );
}

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-6 text-sm font-medium">
            <Link
              to="/"
              activeProps={{
                className: "text-foreground",
              }}
              inactiveProps={{
                className:
                  "text-muted-foreground hover:text-foreground transition-colors",
              }}
            >
              Home
            </Link>
            <Link
              to="/workflows"
              activeProps={{
                className: "text-foreground",
              }}
              inactiveProps={{
                className:
                  "text-muted-foreground hover:text-foreground transition-colors",
              }}
            >
              Workflows
            </Link>
            <Link
              to="/queues"
              activeProps={{
                className: "text-foreground",
              }}
              inactiveProps={{
                className:
                  "text-muted-foreground hover:text-foreground transition-colors",
              }}
            >
              Queues
            </Link>
          </div>
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
