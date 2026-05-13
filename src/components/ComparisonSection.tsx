import { motion } from "framer-motion";
import { X, Check, Sparkles, Crown, Zap, Target, Globe, Bot } from "lucide-react";

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
      staggerChildren: 0.15,
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
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Why RUOM Wins</span>
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Not just another
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500">
              AI tool
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See why 2,000+ Indian creators choose RUOM over generic AI tools
          </p>
        </motion.div>

        {/* Comparison Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="space-y-4"
        >
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-3 gap-4 px-6 py-4 text-sm font-medium text-muted-foreground">
            <div>Feature</div>
            <div className="text-center">Generic AI (ChatGPT/Claude)</div>
            <div className="text-center text-primary">RUOM AI</div>
          </div>

          {/* Comparison Rows */}
          {comparisonData.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.feature}
                variants={rowVariants}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative grid md:grid-cols-3 gap-4 items-center p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                  {/* Feature */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-semibold">{item.feature}</span>
                  </div>

                  {/* Generic AI */}
                  <div className="flex items-center gap-3 md:justify-center p-3 md:p-0 rounded-lg bg-destructive/5 md:bg-transparent">
                    <div className="p-1.5 rounded-full bg-destructive/20">
                      <X className="h-4 w-4 text-destructive" />
                    </div>
                    <span className="text-muted-foreground text-sm">{item.generic}</span>
                  </div>

                  {/* RUOM */}
                  <div className="flex items-center gap-3 md:justify-center p-3 md:p-0 rounded-lg bg-emerald-500/10 md:bg-transparent border border-emerald-500/20 md:border-0">
                    <motion.div
                      className="p-1.5 rounded-full bg-emerald-500/20"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Check className="h-4 w-4 text-emerald-500" />
                    </motion.div>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400 text-sm">
                      {item.ruom}
                    </span>
                  </div>
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
            className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 rounded-2xl border border-primary/20"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 border-2 border-background flex items-center justify-center text-xs font-bold text-white"
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
              <p className="text-sm text-muted-foreground">No credit card required • 5 free repurposes</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
