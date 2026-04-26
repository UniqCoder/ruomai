import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export const UpgradeModal = ({ open, onClose }: UpgradeModalProps) => (
  <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="sm:max-w-md border-primary/30">
      <DialogHeader>
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <DialogTitle className="text-center text-xl">You've used your 5 free repurposes</DialogTitle>
        <DialogDescription className="text-center pt-2">
          Upgrade to <span className="text-primary font-semibold">Creator — ₹399/month</span> for unlimited repurposes, tone memory, and Hindi output.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2 mt-4">
        <Button className="w-full bg-primary hover:bg-primary/90 glow-orange h-11">Upgrade Now</Button>
        <Button variant="ghost" className="w-full" onClick={onClose}>Maybe Later</Button>
      </div>
    </DialogContent>
  </Dialog>
);
