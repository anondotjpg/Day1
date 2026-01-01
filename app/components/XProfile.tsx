// components/XProfile.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface XProfileProps {
  username: string;
}

export default function XProfile({ username }: XProfileProps) {
  const router = useRouter();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await fetch("/api/auth/x/disconnect", { method: "POST" });
      router.refresh();
    } catch (error) {
      console.error("Failed to disconnect:", error);
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full">
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5"
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span className="text-white">@{username}</span>
        <span className="w-2 h-2 bg-green-500 rounded-full" title="Connected" />
      </div>
      
      <button
        onClick={handleDisconnect}
        disabled={isDisconnecting}
        className="text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
      >
        {isDisconnecting ? "Disconnecting..." : "Disconnect"}
      </button>
    </div>
  );
}