import FeaturedSections from "@/components/FeaturedSections";
import FeaturedMarkets from "@/components/Markets/FeaturedMarkets";
import TrendingMarkets from "@/components/Markets/TrendingMarkets";
import OverallActivity from "@/components/Markets/OverallActivity";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <FeaturedSections />
      <TrendingMarkets />
      <FeaturedMarkets />
      <OverallActivity />
    </main>
  );
}
