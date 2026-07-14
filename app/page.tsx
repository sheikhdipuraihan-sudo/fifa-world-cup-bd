'use client';

import { useState } from 'react';
import Header from '@/components/header';
import CustomVideoPlayer from '@/components/custom-video-player';
import ChannelSelector from '@/components/channel-selector';
import MatchSchedule from '@/components/match-schedule';
import LiveChat from '@/components/live-chat';

const channels = [
  {
    id: 'somoy',
    name: 'Somoy TV',
    streamUrl: 'https://live.thebosstv.com:30443/dwlive/Somoy-TV/chunks.m3u8',
  },
  {
    id: 'btv',
    name: 'BTV',
    streamUrl: 'https://owrcovcrpy.gpcdn.net/bpk-tv/1709/output/index.m3u8',
  },
];

export default function Page() {
  const [selectedChannel, setSelectedChannel] = useState(channels[0]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <LiveChat />
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stream */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg overflow-hidden border border-border">
              <CustomVideoPlayer streamUrl={selectedChannel.streamUrl} channelName={selectedChannel.name} />
            </div>

            {/* Channel Selector */}
            <div className="mt-6">
              <ChannelSelector channels={channels} selectedChannel={selectedChannel} onChannelChange={setSelectedChannel} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <MatchSchedule />
          </div>
        </div>
      </div>
    </main>
  );
}
