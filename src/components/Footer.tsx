import { Heart, Shield, Users } from "lucide-react";

export const Footer = () => (
  <footer className="mt-24 border-t border-border/50 bg-background/40 backdrop-blur-md">
    <div className="container py-8">
      <div className="mb-4 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          <span>Your content is private and encrypted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span>Trusted by 2,000+ Indian creators</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5 text-rose-500" />
          <span>Made with love in Bharat</span>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground/60">© 2026 Ruom · All rights reserved</div>
    </div>
  </footer>
);
