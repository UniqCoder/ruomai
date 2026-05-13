import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { PricingSection } from "@/components/PricingSection";

const Pricing = () => (
  <div className="min-h-screen flex flex-col">
    <TopNav />
    <main className="flex-1">
      <PricingSection />
    </main>
    <Footer />
  </div>
);

export default Pricing;
