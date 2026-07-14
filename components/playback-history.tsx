'use client';

import { useEffect, useState } from 'react';
import { Clock, Trash2 } from 'lucide-react';

interface PlaybackRecord {
  channelId: string;
  channelName: string;
  timestamp: number;
}

interface PlaybackHistoryProps {
  onSelectChannel?: (channelId: string) => void;
}

const STORAGE_KEY = 'fifa_playback_history';

export default function PlaybackHistory({ onSelectChannel }: PlaybackHistoryProps) {
  const [history, setHistory] = useState<PlaybackRecord[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load playback history:', error);
    }
  }, []);

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear playback history:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (!mounted || history.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recently Watched
        </h2>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="p-1 hover:bg-muted rounded transition-colors"
            title="Clear history"
          >
            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {history.slice(0, 5).map((record) => (
          <button
            key={`${record.channelId}-${record.timestamp}`}
            onClick={() => onSelectChannel?.(record.channelId)}
            className="w-full px-4 py-3 rounded-lg text-left transition-all hover:bg-muted border border-border hover:border-foreground/20"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground truncate">{record.channelName}</p>
              <span className="text-xs text-muted-foreground ml-2 shrink-0">{formatTime(record.timestamp)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
