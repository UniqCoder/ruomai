import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CandidateScoreResult } from "@/lib/ml/scoringModel";
import { Sparkles, CheckCircle2, AlertTriangle, ArrowUpRight, BarChart3, HelpCircle } from "lucide-react";

interface ScoreBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: CandidateScoreResult | null;
  platformLabel: string;
  candidateTitle?: string;
}

export const ScoreBreakdownModal: React.FC<ScoreBreakdownModalProps> = ({
  open,
  onOpenChange,
  evaluation,
  platformLabel,
  candidateTitle,
}) => {
  if (!evaluation) return null;

  const { score, rating5, features, topPositiveSignals, topNegativeSignals, summaryFeedback } = evaluation;

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (s >= 50) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-rose-500 bg-rose-500/10 border-rose-500/20";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-md bg-primary/10 text-primary">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold">
                ML Content Scorer & Explainability Engine
              </DialogTitle>
              <DialogDescription className="text-xs">
                Quantitative NLP Feature Extraction & Logistic Regression Quality Prediction
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Top Score Summary Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-border bg-muted/40 gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {platformLabel} {candidateTitle ? `• ${candidateTitle}` : ""}
              </div>
              <div className="text-sm font-medium text-foreground">
                {score >= 80 ? "🔥 High-Engagement Candidate" : score >= 50 ? "⚡ Moderate Potential" : "⚠️ Needs Optimization"}
              </div>
              <div className="text-xs text-muted-foreground">
                Predicted conversion & reach rating: <span className="font-bold text-foreground">{rating5} / 5.0</span>
              </div>
            </div>

            <div className={`flex flex-col items-center justify-center px-5 py-2.5 rounded-xl border ${getScoreColor(score)}`}>
              <div className="text-3xl font-extrabold tracking-tight">{score}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider">Quality Score</div>
            </div>
          </div>

          {/* Key Metric Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-border bg-card">
              <div className="text-[11px] text-muted-foreground mb-1">🪝 Hook Strength</div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                {features.hook_has_question || features.hook_has_number || features.hook_is_contrarian ? (
                  <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Strong</>
                ) : (
                  <><AlertTriangle className="h-4 w-4 text-amber-500" /> Weak</>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {features.hook_is_contrarian ? "Contrarian pattern" : features.hook_has_number ? "Data anchor" : "Standard"}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-card">
              <div className="text-[11px] text-muted-foreground mb-1">📖 Readability</div>
              <div className="text-sm font-bold">
                {features.flesch_reading_ease} <span className="text-xs font-normal text-muted-foreground">/ 100</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Grade {features.flesch_kincaid_grade.toFixed(1)} level
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-card">
              <div className="text-[11px] text-muted-foreground mb-1">🎯 Actionable CTA</div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                {features.cta_present ? (
                  <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Present</>
                ) : (
                  <><AlertTriangle className="h-4 w-4 text-rose-500" /> Missing</>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {features.cta_present ? "High conversion" : "No closing action"}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-card">
              <div className="text-[11px] text-muted-foreground mb-1">🇮🇳 Hinglish Ratio</div>
              <div className="text-sm font-bold">
                {features.code_mix_ratio}%
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {features.code_mix_ratio > 0 ? "Natural Indic markers" : "Pure English"}
              </div>
            </div>
          </div>

          {/* Feature Importance & Model Weights Explanation */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Feature Contributions to Score
            </h4>

            <div className="space-y-2">
              {topPositiveSignals.map((sig) => (
                <div key={sig.feature} className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">+</span>
                    <span className="font-medium text-foreground">{sig.label}</span>
                  </div>
                  <span className="font-mono text-emerald-600 font-semibold">+{sig.impact}</span>
                </div>
              ))}

              {topNegativeSignals.map((sig) => (
                <div key={sig.feature} className="flex items-center justify-between p-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-500 font-bold">-</span>
                    <span className="font-medium text-foreground">{sig.label}</span>
                  </div>
                  <span className="font-mono text-rose-500 font-semibold">{sig.impact}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Recommendations */}
          {summaryFeedback.length > 0 && (
            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
              <div className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <ArrowUpRight className="h-3.5 w-3.5" />
                AI Optimization Feedback
              </div>
              <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                {summaryFeedback.map((tip, idx) => (
                  <li key={idx} className="leading-relaxed">{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Full Extracted Feature Inspection Accordion */}
          <details className="text-xs border border-border rounded-lg p-3 bg-muted/20">
            <summary className="cursor-pointer font-medium text-foreground hover:text-primary">
              View All 20 Quantitative Extracted Features
            </summary>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 font-mono text-[11px]">
              <div>Words: <span className="text-foreground font-bold">{features.word_count}</span></div>
              <div>Chars: <span className="text-foreground font-bold">{features.char_count}</span></div>
              <div>Sentences: <span className="text-foreground font-bold">{features.sentence_count}</span></div>
              <div>Avg Sent Length: <span className="text-foreground font-bold">{features.avg_sentence_length}</span></div>
              <div>Line Breaks: <span className="text-foreground font-bold">{features.line_count}</span></div>
              <div>Bullets: <span className="text-foreground font-bold">{features.bullet_point_count}</span></div>
              <div>Hashtags: <span className="text-foreground font-bold">{features.hashtag_count}</span></div>
              <div>Emojis: <span className="text-foreground font-bold">{features.emoji_count}</span></div>
              <div>Length Fitness: <span className="text-foreground font-bold">{features.platform_length_fitness}</span></div>
              <div>Buzzwords: <span className="text-foreground font-bold">{features.buzzword_penalty}</span></div>
              <div>Flesch Ease: <span className="text-foreground font-bold">{features.flesch_reading_ease}</span></div>
              <div>Grade Level: <span className="text-foreground font-bold">{features.flesch_kincaid_grade}</span></div>
            </div>
          </details>
        </div>
      </DialogContent>
    </Dialog>
  );
};
