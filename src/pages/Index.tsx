import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Repurposer } from "@/components/Repurposer";
import { DemoAnimation } from "@/components/DemoAnimation";
import { ComparisonSection } from "@/components/ComparisonSection";
import { PricingSection } from "@/components/PricingSection";

const Index = () => (
  <div className="min-h-screen flex flex-col">
    <TopNav />
    <main className="flex-1">
      <Repurposer />
      <DemoAnimation />
      <ComparisonSection />
      <PricingSection />
    </main>
    <Footer />
  </div>
);

export default Index;
