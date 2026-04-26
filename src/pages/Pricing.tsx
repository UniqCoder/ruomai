import { Check } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    features: ["5 repurposes/month", "3 formats", "Watermarked output"],
    cta: "Start Free",
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
  {
    name: "Pro",
    price: "₹999",
    period: "/month",
    features: ["Unlimited repurposes", "Brand voice training", "3 team seats", "Bulk upload"],
    cta: "Go Pro",
    highlight: false,
  },
];

const Pricing = () => (
  <div className="min-h-screen flex flex-col">
    <TopNav />
    <main className="flex-1 container max-w-5xl py-16">
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Simple pricing for creators</h1>
        <p className="mt-4 text-muted-foreground">Pay for what you actually use. Cancel anytime.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`relative rounded-2xl border bg-card p-6 flex flex-col ${
              t.highlight ? "border-primary shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]" : "border-border"
            }`}
          >
            {t.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                MOST POPULAR
              </span>
            )}
            <h3 className="text-lg font-semibold">{t.name}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-bold">{t.price}</span>
              <span className="text-muted-foreground text-sm">{t.period}</span>
            </div>
            <ul className="mt-6 space-y-3 flex-1">
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
        ))}
      </div>
    </main>
    <Footer />
  </div>
);

export default Pricing;
