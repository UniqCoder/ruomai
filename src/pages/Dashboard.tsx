import { ArrowUpRight, Clock3, FileText, Sparkles, Users, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { TopNav } from "@/components/TopNav";

const summaryCards = [
  { title: "Drafts generated", value: "128", icon: FileText },
  { title: "Recent repurposes", value: "18", icon: Sparkles },
  { title: "Brand voices", value: "04", icon: Wand2 },
  { title: "Saved collaborators", value: "09", icon: Users },
];

const recentOutputs = [
  { format: "Tweet thread", title: "From webinar notes to a scroll-stopping hook", time: "12 min ago" },
  { format: "LinkedIn post", title: "Breaking down a founder lesson into a native post", time: "34 min ago" },
  { format: "Reel script", title: "Turned one long note into a 30-second reel", time: "2 hours ago" },
];

const activeTemplates = [
  "Founder narrative",
  "Launch week thread",
  "Sales objection breakdown",
  "Newsletter opener",
];

export const Dashboard = () => {
  return (
    <div className="min-h-screen text-foreground">
      <TopNav />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Ruom dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.05em]">Your repurposing workspace</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Track what you generated, reuse what worked, and jump back into the repurposer without losing momentum.
            </p>
          </div>
          <Button className="rounded-full">
            <ArrowUpRight className="mr-2 h-4 w-4" />
            New repurpose
          </Button>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(({ title, value, icon: Icon }) => (
            <Card key={title} className="border-border bg-card">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{title}</p>
                  <p className="mt-2 text-3xl font-semibold">{value}</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock3 className="h-5 w-5 text-primary" />
                Recent outputs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentOutputs.map((item) => (
                <div key={item.title} className="flex items-start justify-between gap-4 rounded-xl border border-border/60 p-4">
                  <div>
                    <Badge variant="secondary" className="mb-2">{item.format}</Badge>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.time}</p>
                  </div>
                  <ArrowUpRight className="mt-1 h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Wand2 className="h-5 w-5 text-primary" />
                Saved templates
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {activeTemplates.map((template) => (
                <Badge key={template} variant="outline" className="rounded-full px-3 py-1.5">
                  {template}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
