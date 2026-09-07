import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface OutputCardProps {
  label: string;
  formatKey?: string;
  text: string;
  /** multi-part outputs (e.g. tweet threads) render as stacked blocks */
  blocks?: string[];
  blurred?: boolean;
}

export const OutputCard = ({ label, text, blocks }: OutputCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{label}</span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5 transition-colors ${
            copied
              ? "text-emerald-400 bg-emerald-500/10"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {blocks && blocks.length > 0 ? (
        <div className="space-y-2.5">
          {blocks.map((block, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/60 bg-background/60 px-4 py-3.5 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed transition-colors hover:border-primary/25"
            >
              {block}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {text}
        </div>
      )}
    </div>
  );
};;

export const SkeletonCard = () => (
  <div className="rounded-2xl border border-border/70 bg-card/80 p-5">
    <div className="flex items-center justify-between mb-4">
      <div className="h-3 w-24 rounded skeleton-pulse" />
      <div className="h-5 w-20 rounded-full skeleton-pulse" />
    </div>
    <div className="space-y-2">
      <div className="h-3 w-full rounded skeleton-pulse" />
      <div className="h-3 w-11/12 rounded skeleton-pulse" />
      <div className="h-3 w-3/4 rounded skeleton-pulse" />
    </div>
  </div>
);
