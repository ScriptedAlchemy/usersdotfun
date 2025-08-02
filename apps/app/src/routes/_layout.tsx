import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Footer } from "~/components/footer";
import { Header } from "~/components/header";

export const Route = createFileRoute("/_layout")({
  component: MainLayout,
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
