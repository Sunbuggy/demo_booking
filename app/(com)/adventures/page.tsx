import { AdventuresDashboard } from './components/adventures-dashboard';

export default function AdventuresPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Adventures Dashboard</h1>
      <AdventuresDashboard />
    </div>
  );
}
