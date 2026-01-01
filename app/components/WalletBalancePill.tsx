"use client";

import { useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";

const HELIUS_RPC =
  "https://ardine-bydca8-fast-mainnet.helius-rpc.com";

const SOLANA_PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";

interface WalletBalancePillProps {
  walletAddress: string;
}

export function WalletBalancePill({ walletAddress }: WalletBalancePillProps) {
  const [sol, setSol] = useState<number | null>(null);
  const [usd, setUsd] = useState<number | null>(null);

  useEffect(() => {
    const connection = new Connection(HELIUS_RPC);
    const pubkey = new PublicKey(walletAddress);

    let mounted = true;

    async function fetchBalance() {
      try {
        const lamports = await connection.getBalance(pubkey);
        const solBalance = lamports / 1e9;

        const priceRes = await fetch(SOLANA_PRICE_URL);
        const priceJson = await priceRes.json();
        const solPrice = priceJson.solana.usd;

        if (!mounted) return;

        setSol(solBalance);
        setUsd(solBalance * solPrice);
      } catch {}
    }

    fetchBalance();
    const id = setInterval(fetchBalance, 45_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [walletAddress]);

  return (
    <div className="pointer-events-none fixed top-5 left-5 z-40 font-apple">
      <div
        className="
          rounded-2xl
          px-4
          py-2.5
          text-left
        "
      >
        {/* USD value — Apple bold */}
        <div className="text-[26px] font-semibold tracking-tight text-white/95 leading-none">
          {usd !== null ? `$${usd.toFixed(2)}` : "—"}
        </div>

        {/* SOL context — quieter */}
        <div className="mt-0.5 text-[11px] font-medium tracking-wide text-white/50">
          {sol !== null ? `${sol.toFixed(4)} SOL` : "Loading"}
        </div>
      </div>
    </div>
  );
}