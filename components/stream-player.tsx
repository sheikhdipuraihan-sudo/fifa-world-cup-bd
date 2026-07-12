'use client';

import { useEffect, useRef, useState } from 'react';
import HLS from 'hls.js';
import { Maximize, Minimize } from 'lucide-react';

interface StreamPlayerProps {
  streamUrl: string;
  channelName: string;
}

export default function StreamPlayer({ streamUrl, channelName }: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<HLS | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    // Check if HLS is supported
    if (HLS.isSupported()) {
      const hls = new HLS({
        debug: false,
        enableWorker: true,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(HLS.Events.MANIFEST_PARSED, () => {
        console.log('[HLS] Manifest parsed');
        video.play().catch((err) => {
          console.log('[HLS] Play error:', err.message);
        });
      });

      hls.on(HLS.Events.ERROR, (event, data) => {
        console.error('[HLS] Error:', data);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      video.src = streamUrl;
      video.play().catch((err) => {
        console.log('[Video] Play error:', err.message);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [streamUrl]);

  const handleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (error) {
      console.error('[Fullscreen] Error:', error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div ref={containerRef} className="aspect-video bg-black relative group">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Crect fill='%23000' width='1920' height='1080'/%3E%3Ctext x='50%25' y='50%25' font-size='72' fill='%2300d4ff' text-anchor='middle' dominant-baseline='middle' font-family='Arial'%3ELIVE%3C/text%3E%3C/svg%3E"
      />
      <div className="absolute top-4 left-4 bg-red-500 px-3 py-1 rounded-full">
        <p className="text-white font-bold text-sm">LIVE</p>
      </div>
      <div className="absolute bottom-4 left-4 bg-black/50 px-4 py-2 rounded">
        <p className="text-white text-sm font-medium">{channelName}</p>
      </div>
      
      {/* Fullscreen Button */}
      <button
        onClick={handleFullscreen}
        className="absolute top-4 right-4 bg-white/80 hover:bg-white text-black p-2 rounded transition-colors opacity-0 group-hover:opacity-100"
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? (
          <Minimize size={20} />
        ) : (
          <Maximize size={20} />
        )}
      </button>
    </div>
  );
}
