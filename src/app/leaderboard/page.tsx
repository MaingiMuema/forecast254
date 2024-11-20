import { Metadata } from 'next';
import LeaderboardPage from '@/components/Leaderboard/LeaderboardPage';

export const metadata: Metadata = {
  title: 'Leaderboard | Forecast254',
  description: 'See the top predictors and market makers on Forecast254',
};

export default function Page() {
  return <LeaderboardPage />;
}
