export function MiniPlayer({ audioRef, playing, progress, lockedIn, togglePlay, seek }: any) {
  return (
    <div className={`fixed top-5 right-5 z-40 invisible md:visible transition-opacity ${lockedIn ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
      <div className="w-35 rounded-full bg-[#1c1c1f]/90 backdrop-blur-md px-6 py-3 space-y-2">
        <div className="flex items-center justify-between text-zinc-300">
          <button onClick={() => seek(-10)} className="cursor-pointer hover:text-white">⏮</button>
          <button onClick={togglePlay} className="text-zinc-100 cursor-pointer hover:scale-150 transition scale-140">
            {playing ? "⏸" : "▶"}
          </button>
          <button onClick={() => seek(10)} className="cursor-pointer hover:text-white">⏭</button>
        </div>
      </div>
      <audio ref={audioRef} src="https://dn710004.ca.archive.org/0/items/M83_2023-04-10/2023-04-10%20Van%20Buren%2C%20Phoenix%2C%20Arizona/13%20-%20Solitude.mp3" preload="metadata" loop />
    </div>
  );
}