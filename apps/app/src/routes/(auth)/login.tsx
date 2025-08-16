import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth-client";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/(auth)/login")({
  component: LoginForm,
  validateSearch: searchSchema,
});

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [nearLoading, setNearLoading] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  // Check wallet connection status
  const accountId = typeof window !== "undefined" && (window as any).near?.accountId() || null;

  const handleAnonymousSignIn = async () => {
    setIsLoading(true);
    authClient.signIn.anonymous(undefined, {
      onError: (ctx) => {
        console.error("Anonymous sign in failed:", ctx);
        setIsLoading(false);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["user"] });
        navigate({ to: redirect || "/" });
      },
    });
  };

  const handleWalletConnect = async () => {
    setNearLoading(true);

    try {
      await (window as any).near.requestSignIn({ 
        contractId: "social.near" 
      }, {
        onPending: (context: any) => {
          switch (context.step) {
            case 'popup_opening':
              toast.info("Opening wallet popup...");
              break;
            case 'waiting_for_user':
              toast.info("Please complete authentication in the popup");
              break;
            case 'processing_result':
              toast.info("Processing authentication result...");
              break;
          }
        },
        onSuccess: (result: any) => {
          toast.success(`Wallet connected: ${result.accountId}`);
          setNearLoading(false);
          // UI will re-render and show "Sign in with NEAR" button
        },
        onError: (error: any) => {
          console.error("Wallet connection failed:", error);
          toast.error(
            error.type === "popup_blocked" 
              ? "Please allow popups and try again"
              : "Failed to connect wallet"
          );
          setNearLoading(false);
        }
      });
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast.error("Failed to connect to NEAR wallet");
      setNearLoading(false);
    }
  };

  const handleNearSignIn = async () => {
    setNearLoading(true);

    authClient.signIn.near({
      recipient: typeof window !== "undefined" ? window.location.origin : "localhost:3000"
    }, {
      onError: (ctx) => {
        console.error("NEAR sign in failed:", ctx);
        toast.error(
          ctx instanceof Error ? ctx.message : "Authentication failed"
        );
        setNearLoading(false);
      },
      onSuccess: async () => {
        toast.success(`Signed in as: ${accountId}`);
        await queryClient.invalidateQueries({ queryKey: ["user"] });
        navigate({ to: redirect || "/" });
      },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
        <p className="text-gray-600 mb-4">
          Sign in with your NEAR wallet for full access, or continue as a guest
          to explore.
        </p>
      </div>

      <div className="space-y-3">
        {!accountId ? (
          <Button
            onClick={handleWalletConnect}
            disabled={nearLoading}
            className="w-full"
            variant="default"
          >
            {nearLoading ? "Connecting Wallet..." : "Connect NEAR Wallet"}
          </Button>
        ) : (
          <Button
            onClick={handleNearSignIn}
            disabled={nearLoading}
            className="w-full"
            variant="default"
          >
            {nearLoading ? "Signing in..." : `Sign in with NEAR (${accountId})`}
          </Button>
        )}

        <Button
          onClick={handleAnonymousSignIn}
          disabled={isLoading}
          className="w-full"
          variant="outline"
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
