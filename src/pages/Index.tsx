import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Repurposer } from "@/components/Repurposer";

const Index = () => (
  <div className="min-h-screen flex flex-col">
    <TopNav />
    <main className="flex-1">
      <Repurposer />
    </main>
    <Footer />
  </div>
);

export default Index;
