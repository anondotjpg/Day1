"use client";

import { useRef, useState, useEffect } from "react";
import { LockInModal } from "./components/LockInModal";
import { MiniPlayer } from "./components/MiniPlayer";
import { YearGrid } from "./components/YearGrid";
import { FocusQuoteLoop } from "./components/FocusQuoteLoop";
import { WalletBalancePill } from "./components/WalletBalancePill";

export default function Home() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lockedIn, setLockedIn] = useState(true);

  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000) - 1;

  const startAudio = async () => {
    if (audioRef.current) {
      await audioRef.current.play();
      setPlaying(true);
      setLockedIn(true);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !lockedIn) return;
    playing ? audioRef.current.pause() : audioRef.current.play();
    setPlaying(!playing);
  };

  const seek = (delta: number) => {
    if (audioRef.current && lockedIn) audioRef.current.currentTime += delta;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => setProgress((audio.currentTime / audio.duration) * 100 || 0);
    audio.addEventListener("timeupdate", update);
    return () => audio.removeEventListener("timeupdate", update);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0b0b0d] px-4 py-8 flex flex-col items-center justify-center">
      <WalletBalancePill walletAddress="2i5RNHQFmiEWFqwvmRsGK6iaV6YqiW3WqzJkArRinXiQ" />

      {!lockedIn && <LockInModal onConfirm={startAudio} />}
      
      <MiniPlayer 
        audioRef={audioRef} 
        playing={playing} 
        progress={progress} 
        lockedIn={lockedIn} 
        togglePlay={togglePlay} 
        seek={seek} 
      />

      <h1 className="text-xl sm:text-2xl lg:text-5xl font-light text-zinc-500 mb-6 tracking-wide hidden">
        2026
      </h1>

      <div className="absolute bottom-10 w-80 hidden">
        <FocusQuoteLoop />
      </div>

      <a
        href="https://pump.fun/board"
        target="_blank"
        rel="noopener noreferrer"
        className="
          fixed
          bottom-5
          left-5
          z-40
          overflow-hidden
          transition
          hover:scale-[1.04]
          active:scale-[0.98]
        "
      >
        <img
          src="/pill.png"
          alt="Pump.fun"
          className="h-10 w-10 object-contain"
        />
      </a>

      <YearGrid dayOfYear={dayOfYear} />
    </div>
  );
}