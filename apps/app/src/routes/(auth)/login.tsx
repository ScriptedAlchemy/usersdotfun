import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth-client";

export const Route = createFileRoute("/(auth)/login")({
  component: LoginForm,
});

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleAnonymousSignIn = async () => {
    setIsLoading(true);
    authClient.signIn.anonymous(
      undefined,
      {
        onError: (ctx) => {
          console.error("Anonymous sign in failed:", ctx);
          setIsLoading(false);
        },
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: ["user"] });
          navigate({ to: "/" });
        },
      }
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
        <p className="text-gray-600 mb-4">
          To access the dashboard, you need to sign in or continue as a guest.
        </p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleAnonymousSignIn}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Signing in..." : "Continue as Guest"}
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center max-w-md">
        As a guest, you can view the dashboard but some features may be limited.
        Create an account for full access.
      </p>
    </div>
  );
}
