import { Fragment, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Check, Zap, FileText, Twitter, Linkedin, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  { id: "input", label: "Paste Content", icon: FileText },
  { id: "processing", label: "AI Repurposing", icon: Sparkles },
  { id: "output", label: "Get Results", icon: Zap },
];

const demoContent = `Just finished recording my podcast episode about building habits that stick. The key insight: small consistent actions beat big sporadic efforts every time.`;

const demoOutputs = {
  twitter: [
    "1/5 Small actions > Big efforts. Every. Single. Time. 🧵",
    "2/5 Just recorded a podcast episode on habit building. Here's what I learned 👇",
    "3/5 Most people think habits need massive effort. Wrong. They need consistency.",
    "4/5 One push-up daily beats 50 once a week. One sentence beats none.",
    "5/5 Start small. Stay consistent. Watch compound interest work its magic. ✨",
  ],
  linkedin: `Just recorded a podcast episode that challenged everything I thought I knew about habits.

The counterintuitive truth? Small, consistent actions outperform massive sporadic efforts every single time.

Think about it:
• 10 minutes of daily reading > 5 hours once a month
• One thoughtful LinkedIn post weekly > 10 rushed ones daily
• 15 minutes of focused work > 2 hours of distracted effort

The magic isn't in the intensity. It's in the consistency.

What's one small habit you're building right now? 👇`,
  instagram: `POV: You finally understand why your "big efforts" never stuck 🤯

Small daily actions >>> Big monthly pushes

Swipe for the truth bomb that changed everything ➡️

#habitbuilding #productivity #personalgrowth #contentcreator #indianpodcast #consistencywins`,
};

const platformTabs = [
  { key: "twitter", icon: Twitter, label: "Twitter" },
  { key: "linkedin", icon: Linkedin, label: "LinkedIn" },
  { key: "instagram", icon: Instagram, label: "Instagram" },
] as const;

export const DemoAnimation = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState<"twitter" | "linkedin" | "instagram">("twitter");

  useEffect(() => {
    const timer = setInterval(() => setCurrentStep((prev) => (prev + 1) % steps.length), 3500);
    return () => clearInterval(timer);
  }, []);

  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">Your content</div>
              <p className="text-sm leading-relaxed text-foreground/90">{demoContent}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary font-medium">Casual</span>
              <span className="px-3 py-1 rounded-full bg-secondary/80 border border-border/60 text-foreground/80">5 formats</span>
              <span className="px-3 py-1 rounded-full bg-secondary/80 border border-border/60 text-foreground/80">English</span>
            </div>
          </motion.div>
        );
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="relative">
              <motion.div
                className="absolute -inset-5 rounded-full bg-primary/25 blur-2xl"
                animate={{ opacity: [0.35, 0.75, 0.35], scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              <motion.div
                className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/40"
                animate={{ scale: [1, 1.07, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Sparkles className="h-9 w-9 text-white" />
              </motion.div>
            </div>
            <p className="mt-7 text-sm font-medium text-foreground">AI is repurposing your content</p>
            <div className="flex gap-1.5 mt-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            <div className="inline-flex gap-1 p-1 rounded-xl bg-background/70 border border-border/60">
              {platformTabs.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === key
                      ? "bg-primary/15 text-primary shadow-inner"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20">
                  <Check className="h-2.5 w-2.5 text-emerald-500" />
                </span>
                Generated for {activeTab}
              </div>
              <div className="text-sm leading-relaxed">
                {activeTab === "twitter" && (
                  <div className="space-y-2">
                    {demoOutputs.twitter.map((tweet, i) => (
                      <div key={i} className="p-2.5 bg-card rounded-lg border border-border/50 text-xs text-foreground/85 hover:border-primary/30 transition-colors">
                        {tweet}
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "linkedin" && (
                  <div className="text-xs text-foreground/85 whitespace-pre-wrap">{demoOutputs.linkedin}</div>
                )}
                {activeTab === "instagram" && (
                  <div className="text-xs text-foreground/85 whitespace-pre-wrap">{demoOutputs.instagram}</div>
                )}
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="relative isolate py-24 md:py-32">
      {/* soft glow anchoring the demo, layered over the fluid field */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 -z-10 w-[720px] h-[480px] rounded-full bg-primary/[0.07] blur-3xl" />

      <div className="container max-w-5xl px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Live demo</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              From idea to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-amber-400">
                5 platforms
              </span>
              <br />
              in 10 seconds
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Watch how Ruom transforms one piece of content into platform-perfect posts
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isDone = index < currentStep;

              return (
                <Fragment key={step.id}>
                  {index > 0 && (
                    <div className="relative h-px w-8 sm:w-16 bg-border/80 overflow-hidden rounded-full">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-primary"
                        initial={false}
                        animate={{ width: index <= currentStep ? "100%" : "0%" }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  )}
                  <motion.div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-primary to-orange-500 text-primary-foreground border-primary/50 shadow-lg shadow-primary/30"
                        : isDone
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "bg-card/60 text-muted-foreground border-border/60 backdrop-blur-sm"
                    }`}
                    animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                    transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
                    {isDone && <Check className="h-3.5 w-3.5 ml-0.5" />}
                  </motion.div>
                </Fragment>
              );
            })}
          </div>

          {/* Demo Card */}
          <div className="relative max-w-xl mx-auto">
            <div className="absolute -inset-3 rounded-[32px] bg-gradient-to-r from-primary/15 via-orange-500/10 to-primary/15 blur-2xl opacity-70 -z-10" />
            <div className="rounded-3xl border border-primary/20 bg-card/80 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
              <div className="h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

              <div className="p-6 md:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {getStepContent()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* CTA */}
              <div className="px-6 md:px-8 pb-6 md:pb-8">
                <Button
                  className="w-full h-12 gap-2 text-base font-semibold bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 text-primary-foreground border-0 glow-orange"
                  size="lg"
                  onClick={() => window.location.href = "/"}
                >
                  <Zap className="h-4 w-4" />
                  Try It Yourself
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-border/60 gap-6 sm:gap-0 mt-14 max-w-3xl mx-auto"
          >
            {[
              { value: "10 sec", label: "Per repurpose" },
              { value: "5 platforms", label: "Supported" },
              { value: "2,000+", label: "Happy creators" },
            ].map((stat, i) => (
              <div key={i} className="text-center px-6">
                <div className="text-3xl md:text-4xl font-bold whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
