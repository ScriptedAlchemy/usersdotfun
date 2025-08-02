import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Footer } from "~/components/footer";
import { Header } from "~/components/header";

export const Route = createFileRoute("/_layout")({
  component: MainLayout,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
});

function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
