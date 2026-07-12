import { Trophy } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-foreground" />
          <h1 className="text-xl font-bold text-foreground">
            FIFA World Cup
          </h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-md border border-border">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Live</span>
        </div>
      </div>
    </header>
  );
}
