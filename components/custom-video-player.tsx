'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import HLS from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  PictureInPicture2,
} from 'lucide-react';

interface CustomVideoPlayerProps {
  streamUrl: string;
  channelName: string;
}

interface Quality {
  name: string;
  bitrate: number;
  height: number;
}

export default function CustomVideoPlayer({ streamUrl, channelName }: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<HLS | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number | 'auto'>('auto');
  const [buffered, setBuffered] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (HLS.isSupported()) {
      const hls = new HLS({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(HLS.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels.map((level, index) => ({
          name: `${level.height}p`,
          bitrate: level.bitrate,
          height: level.height,
        }));
        setQualities(levels);
        video.play().catch((err) => {
          console.log('[HLS] Play error:', err.message);
        });
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
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

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  }, []);

  const handleMute = useCallback(() => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const handleProgressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  const handleFullscreen = useCallback(async () => {
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
  }, [isFullscreen]);

  const handlePictureInPicture = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('[PiP] Error:', error);
    }
  }, []);

  const handlePlaybackSpeed = useCallback((speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  }, []);

  const handleQualityChange = useCallback((qualityIndex: number | 'auto') => {
    if (!hlsRef.current) return;
    if (qualityIndex === 'auto') {
      hlsRef.current.currentLevel = -1;
    } else {
      hlsRef.current.currentLevel = qualityIndex;
    }
    setCurrentQuality(qualityIndex);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.buffered.length > 0) {
        const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        setBuffered((bufferedEnd / videoRef.current.duration) * 100);
      }
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'f':
          handleFullscreen();
          break;
        case 'm':
          handleMute();
          break;
        case 'p':
          handlePictureInPicture();
          break;
        case 'arrowright':
          videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 5, duration);
          break;
        case 'arrowleft':
          videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 5, 0);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(Math.min(volume + 0.1, 1));
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(Math.max(volume - 0.1, 0));
          break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handlePlayPause, handleFullscreen, handleMute, handlePictureInPicture, volume, duration]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className="aspect-video bg-black relative group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) setShowControls(false);
      }}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Crect fill='%23000' width='1920' height='1080'/%3E%3Ctext x='50%25' y='50%25' font-size='72' fill='%2300d4ff' text-anchor='middle' dominant-baseline='middle' font-family='Arial'%3ELIVE%3C/text%3E%3C/svg%3E"
      />
      <div className="absolute top-4 left-4 bg-red-500 px-3 py-1 rounded-full z-10">
        <p className="text-white font-bold text-sm">LIVE</p>
      </div>
      <div className="absolute top-4 left-24 bg-black/50 px-4 py-2 rounded z-10">
        <p className="text-white text-sm font-medium">{channelName}</p>
      </div>
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute bottom-16 left-0 right-0 px-4 group/progress">
          <div className="relative h-1 bg-white/20 rounded-full cursor-pointer hover:h-2 transition-all">
            <div className="absolute h-full bg-white/40 rounded-full" style={{ width: `${buffered}%` }} />
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleProgressChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button onClick={handlePlayPause} className="p-2 hover:bg-white/20 rounded transition-colors">
              {isPlaying ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white" />}
            </button>
            <div className="flex items-center gap-2 group/volume">
              <button onClick={handleMute} className="p-2 hover:bg-white/20 rounded transition-colors">
                {isMuted ? <VolumeX size={20} className="text-white" /> : <Volume2 size={20} className="text-white" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-20 transition-all opacity-0 group-hover/volume:opacity-100 cursor-pointer"
              />
            </div>
            <span className="text-white text-xs ml-2 font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative group/settings">
              <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-white/20 rounded transition-colors">
                <Settings size={20} className="text-white" />
              </button>
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg overflow-hidden min-w-max border border-white/20">
                  <div className="p-2 border-b border-white/20">
                    <p className="text-white text-xs font-semibold mb-2">Speed</p>
                    {[0.5, 1, 1.5, 2].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => { handlePlaybackSpeed(speed); setShowSettings(false); }}
                        className={`w-full text-left px-3 py-1 text-xs rounded transition-colors ${playbackSpeed === speed ? 'bg-blue-500 text-white' : 'text-white/70 hover:bg-white/10'}`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={handlePictureInPicture} className="p-2 hover:bg-white/20 rounded transition-colors">
              <PictureInPicture2 size={20} className="text-white" />
            </button>
            <button onClick={handleFullscreen} className="p-2 hover:bg-white/20 rounded transition-colors">
              {isFullscreen ? <Minimize size={20} className="text-white" /> : <Maximize size={20} className="text-white" />}
            </button>
          </div>
        </div>
      </div>
      {!isPlaying && (
        <button onClick={handlePlayPause} className="absolute inset-0 flex items-center justify-center hover:bg-black/20 transition-colors group">
          <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center group-hover:bg-white/40 transition-colors">
            <Play size={32} className="text-white ml-1" />
          </div>
        </button>
      )}
    </div>
  );
}
