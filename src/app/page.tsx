import FeaturedSections from "@/components/FeaturedSections";
import FeaturedMarkets from "@/components/Markets/FeaturedMarkets";
import TrendingMarkets from "@/components/Markets/TrendingMarkets";
import MarketActivity from "@/components/Markets/MarketActivity";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <FeaturedSections />
      <FeaturedMarkets />
      <TrendingMarkets />
      <MarketActivity />
    </main>
  );
}
