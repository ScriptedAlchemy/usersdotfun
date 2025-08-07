export function Footer() {
  return (
    <footer className="border-t-2 border-border bg-background relative z-10">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
            © {new Date().getFullYear()} <span className="text-primary font-bold">USERSDOTFUN</span> // ALL RIGHTS RESERVED
          </div>
          {/* <div className="flex gap-6 text-xs font-mono uppercase tracking-wide">
            <span className="text-muted-foreground">
              SYSTEM <span className="text-primary">ONLINE</span>
            </span>
            <span className="text-muted-foreground">
              VERSION <span className="text-primary">1.0.0</span>
            </span>
          </div> */}
        </div>
      </div>
    </footer>
  );
}
