import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const TopNav = () => {
  const { pathname } = useLocation();
  const { user, signOut, loading } = useAuth();
  const linkCls = (active: boolean) =>
    `text-sm transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 group">
          <span className="text-xl font-bold tracking-tight">Ruom</span>
          <span className="h-2 w-2 rounded-full bg-primary group-hover:scale-125 transition-transform" />
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/" className={linkCls(pathname === "/")}>Repurpose</Link>
          <Link to="/pricing" className={linkCls(pathname === "/pricing")}>Pricing</Link>
          {!loading && user && (
            <>
              <Link to="/dashboard" className={linkCls(pathname === "/dashboard")}>Dashboard</Link>
              <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Logout
              </button>
            </>
          )}
          {!loading && !user && (
            <>
              <Link to="/login" className={linkCls(pathname === "/login")}>Login</Link>
              <Link to="/signup" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
