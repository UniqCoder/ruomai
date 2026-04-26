import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OutputCardProps {
  label: string;
  text: string;
  blurred?: boolean;
}

export const OutputCard = ({ label, text, blurred }: OutputCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative rounded-xl border border-border bg-card p-5 transition-all ${blurred ? "blur-sm pointer-events-none select-none" : "hover:border-primary/30"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-primary">{label}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-7 text-xs gap-1.5"
        >
          {copied ? (<><Check className="h-3 w-3" /> Copied</>) : (<><Copy className="h-3 w-3" /> Copy</>)}
        </Button>
      </div>
      <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{text}</div>
    </div>
  );
};

export const SkeletonCard = () => (
  <div className="rounded-xl border border-border bg-card p-5">
    <div className="h-3 w-24 rounded skeleton-pulse mb-4" />
    <div className="space-y-2">
      <div className="h-3 w-full rounded skeleton-pulse" />
      <div className="h-3 w-11/12 rounded skeleton-pulse" />
      <div className="h-3 w-3/4 rounded skeleton-pulse" />
    </div>
  </div>
);
