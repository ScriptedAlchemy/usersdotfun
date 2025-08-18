import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { authClient, useSession } from "~/lib/auth-client";

export function UserSection() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isLoading, setLoading] = useState(false);

  if (isPending) {
    return (
      <div className="text-xs font-mono uppercase text-muted-foreground">
        Loading...
      </div>
    );
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
          const profile = await authClient.near.getProfile();
          console.log("me", profile);
        }}
      >
        test
      </Button>
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
