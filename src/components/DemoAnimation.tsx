import { useState, useEffect } from "react";
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

export const DemoAnimation = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState<"twitter" | "linkedin" | "instagram">("twitter");

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= 2) {
          setTimeout(() => setCurrentStep(0), 3000);
          return prev;
        }
        return prev + 1;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs text-muted-foreground mb-2">Your content</div>
              <p className="text-sm leading-relaxed">{demoContent}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 bg-primary/10 rounded-full">Casual</span>
              <span className="px-2 py-1 bg-secondary rounded-full">5 formats</span>
              <span className="px-2 py-1 bg-secondary rounded-full">English</span>
            </div>
          </motion.div>
        );
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center justify-center py-8"
          >
            <div className="relative">
              <motion.div
                className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Sparkles className="h-8 w-8 text-primary" />
              </motion.div>
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/10"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            </div>
            <p className="mt-4 text-sm font-medium">AI is repurposing your content...</p>
            <div className="flex gap-1 mt-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <div className="flex gap-2 mb-3">
              {[
                { key: "twitter", icon: Twitter, label: "Twitter" },
                { key: "linkedin", icon: Linkedin, label: "LinkedIn" },
                { key: "instagram", icon: Instagram, label: "Instagram" },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                    activeTab === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Check className="h-3 w-3 text-emerald-500" />
                Generated for {activeTab}
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {activeTab === "twitter" && (
                  <div className="space-y-2">
                    {demoOutputs.twitter.map((tweet, i) => (
                      <div key={i} className="p-2 bg-background rounded border border-border/50 text-xs">
                        {tweet}
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "linkedin" && (
                  <div className="text-xs">{demoOutputs.linkedin}</div>
                )}
                {activeTab === "instagram" && (
                  <div className="text-xs">{demoOutputs.instagram}</div>
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
    <section className="py-20 md:py-32 bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="container max-w-5xl px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              From idea to <span className="text-primary">5 platforms</span>
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
          <div className="flex items-center justify-center gap-4 mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.id} className="flex items-center gap-4">
                  <motion.div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : isCompleted
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                    animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
                    {isCompleted && <Check className="h-3.5 w-3.5 ml-1" />}
                  </motion.div>
                  {index < steps.length - 1 && (
                    <motion.div
                      className="w-8 h-0.5 bg-border"
                      animate={isCompleted ? { backgroundColor: "hsl(var(--primary))" } : {}}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Demo Card */}
          <div className="max-w-xl mx-auto">
            <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
              <div className="p-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20" />
              
              <div className="p-6">
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
              <div className="px-6 pb-6">
                <Button 
                  className="w-full gap-2" 
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
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-8 mt-12"
          >
            {[
              { value: "10 sec", label: "Per repurpose" },
              { value: "5 platforms", label: "Supported" },
              { value: "2,000+", label: "Happy creators" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
