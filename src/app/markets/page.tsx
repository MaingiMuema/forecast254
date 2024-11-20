import MarketsList from "@/components/Markets/MarketsList";

export const metadata = {
  title: "Markets | Forecast254",
  description: "Explore and trade in various prediction markets across different categories.",
};

export default function MarketsPage() {
  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-8">
        <MarketsList />
      </div>
    </main>
  );
}