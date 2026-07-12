'use client';

import { Radio } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  streamUrl: string;
}

interface ChannelSelectorProps {
  channels: Channel[];
  selectedChannel: Channel;
  onChannelChange: (channel: Channel) => void;
}

export default function ChannelSelector({
  channels,
  selectedChannel,
  onChannelChange,
}: ChannelSelectorProps) {
  return (
    <div className="bg-card rounded-lg p-5 border border-border">
      <h2 className="text-sm font-semibold text-foreground mb-4">Channels</h2>
      <div className="space-y-2">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onChannelChange(channel)}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-3 ${
              selectedChannel.id === channel.id
                ? 'bg-foreground text-background'
                : 'bg-background text-foreground border border-border hover:bg-card'
            }`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                selectedChannel.id === channel.id ? 'bg-background' : 'bg-accent'
              }`}
            ></div>
            {channel.name}
          </button>
        ))}
      </div>
    </div>
  );
}
