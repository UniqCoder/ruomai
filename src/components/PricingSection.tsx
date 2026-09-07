import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlobCard } from "@/components/ui/BlobCard";

const tiers = [
  {
    name: "Starter",
    price: "₹0",
    period: "forever",
    features: ["Core repurposing flow", "3 formats", "Watermarked output"],
    cta: "Start Starter",
    highlight: false,
  },
  {
    name: "Creator",
    price: "₹399",
    period: "/month",
    features: ["50 repurposes/month", "All formats", "Tone memory", "Hindi output", "No watermark"],
    cta: "Upgrade to Creator",
    highlight: true,
  },
];

// Same vivid orange fluid/glow palette on every card; the MOST POPULAR
// badge is what sets Creator apart.
const CARD_COLORS = {
  lightColors: ["#ff3000", "#fc6a0f", "#e87f22", "#ffb385"],
  darkColors: ["#8c4a0f", "#e87f22", "#e87f22", "#ffb385"],
  glowColors: ["#ffb385", "#e8c9a0", "#ffd6bb", "#d4713d", "#ffb385"],
};

export const PricingSection = () => (
  <section className="container max-w-4xl py-16">
    <div className="text-center mb-14">
      <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Simple pricing for creators</h2>
      <p className="mt-4 text-muted-foreground">Pay for what you actually use. Cancel anytime.</p>
    </div>

    <div className="grid gap-8 md:grid-cols-2 items-start">
      {tiers.map((t) => {
        return (
          <div key={t.name} className="relative">
            {t.highlight && (
              <span className="absolute -top-3 left-1/2 z-20 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                MOST POPULAR
              </span>
            )}
            <BlobCard
              header={
                <>
                  <h3 className="text-lg font-semibold">{t.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{t.price}</span>
                    <span className="text-muted-foreground text-sm">{t.period}</span>
                  </div>
                </>
              }
              lightColors={CARD_COLORS.lightColors}
              darkColors={CARD_COLORS.darkColors}
              glowColors={CARD_COLORS.glowColors}
            >
              <div className="p-6">
                <ul className="space-y-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${t.highlight ? "text-primary" : "text-muted-foreground"}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`mt-6 w-full h-11 ${
                    t.highlight ? "bg-primary hover:bg-primary/90 text-primary-foreground glow-orange" : "bg-secondary hover:bg-secondary/80 text-foreground"
                  }`}
                >
                  {t.cta}
                </Button>
              </div>
            </BlobCard>
          </div>
        );
      })}
    </div>
  </section>
);
