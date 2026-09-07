import { motion } from "framer-motion";
import { X, Check, Sparkles, Crown, Zap, Target, Globe, Bot, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const comparisonData = [
  {
    feature: "Content Approach",
    generic: "One-size-fits-all content",
    ruom: "Platform-native optimization",
    icon: Target,
  },
  {
    feature: "Tone & Voice",
    generic: "Corporate/formal tone",
    ruom: "Indian creator voice",
    icon: Globe,
  },
  {
    feature: "Engagement Strategy",
    generic: "No engagement strategy",
    ruom: "Psychological triggers built-in",
    icon: Zap,
  },
  {
    feature: "Content Quality",
    generic: "Generic examples",
    ruom: "Specific, actionable content",
    icon: Sparkles,
  },
  {
    feature: "Human Touch",
    generic: "AI-detectable patterns",
    ruom: "Human-like imperfection",
    icon: Bot,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

export const ComparisonSection = () => {
  return (
    <section className="py-24 md:py-32 relative isolate overflow-hidden">
      {/* ambient glows, layered over the fluid field */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/[0.06] rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/[0.06] rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container max-w-5xl px-4 relative z-10">
        {/* Header */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/25 mb-6 backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Why RUOM Wins</span>
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Not just another
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-amber-400">
              AI tool
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See why 2,000+ Indian creators choose RUOM over generic AI tools
          </p>
        </motion.div>

        {/* Comparison table */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="relative rounded-3xl border border-border/60 bg-card/40 backdrop-blur-md shadow-2xl shadow-black/40 overflow-hidden"
        >
          {/* spotlight on the RUOM column */}
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden md:block w-1/3 bg-gradient-to-b from-primary/[0.08] via-primary/[0.04] to-transparent border-l border-primary/15" />
          <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          {/* Table header */}
          <div className="relative hidden md:grid grid-cols-3 gap-4 px-7 py-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground border-b border-border/60 bg-white/[0.02]">
            <div>Feature</div>
            <div className="text-center">Generic AI (ChatGPT/Claude)</div>
            <div className="text-center text-primary flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              RUOM AI
            </div>
          </div>

          {/* Rows */}
          {comparisonData.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.feature}
                variants={rowVariants}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className="group relative grid md:grid-cols-3 gap-3 md:gap-4 items-center px-5 md:px-7 py-5 border-b border-border/40 last:border-b-0 hover:bg-white/[0.025] transition-colors"
              >
                {/* Feature */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/15 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">{item.feature}</span>
                </div>

                {/* Generic AI */}
                <div className="flex items-center gap-3 md:justify-center">
                  <div className="p-1.5 rounded-full bg-destructive/15 shrink-0">
                    <X className="h-4 w-4 text-destructive" />
                  </div>
                  <span className="text-foreground/60 text-sm line-through decoration-destructive/40 md:no-underline">
                    {item.generic}
                  </span>
                </div>

                {/* RUOM */}
                <div className="relative flex items-center gap-3 md:justify-center md:px-4 py-2 md:py-0 rounded-xl md:rounded-none">
                  <motion.div
                    className="p-1.5 rounded-full bg-emerald-500/20 shrink-0"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Check className="h-4 w-4 text-emerald-400" />
                  </motion.div>
                  <span className="font-medium text-emerald-400 text-sm">
                    {item.ruom}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-16 text-center"
        >
          <motion.div
            className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-card/50 backdrop-blur-md rounded-2xl border border-primary/25 shadow-lg shadow-primary/5"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-600 border-2 border-background flex items-center justify-center text-xs font-bold text-white"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  {String.fromCharCode(64 + i)}
                </motion.div>
              ))}
            </div>
            <div className="text-left">
              <p className="font-semibold">Join 2,000+ creators who switched</p>
              <p className="text-sm text-muted-foreground">No credit card required. Instant drafts, no trial wall.</p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-5 h-11 rounded-xl bg-gradient-to-r from-primary to-orange-600 text-primary-foreground text-sm font-semibold glow-orange"
            >
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
