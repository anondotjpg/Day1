"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 📖 High-signal focus quotes
 */
const QUOTES = [
  { text: "Focus is about saying no.", author: "Steve Jobs" },
  {
    text: "Waste no more time arguing what a good person should be. Be one.",
    author: "Marcus Aurelius",
  },
  {
    text: "We suffer more often in imagination than in reality.",
    author: "Seneca",
  },
  {
    text: "You have to expect things of yourself before you can do them.",
    author: "Michael Jordan",
  },
  {
    text: "Everything negative — pressure, challenges — is an opportunity.",
    author: "Kobe Bryant",
  },
  {
    text: "You do not rise to the level of your goals. You fall to the level of your systems.",
    author: "James Clear",
  },
  {
    text: "If you want to be better, do the things others don’t.",
    author: "Michael Phelps",
  },
];

export function FocusQuoteLoop() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % QUOTES.length);
    }, 21200); // 21.2 seconds for a slow, calm pace
    return () => clearInterval(id);
  }, []);

  const quote = QUOTES[index];

  return (
    <div className="relative h-14 mb-6 flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{
            duration: 1.2,
            ease: [0.22, 1, 0.36, 1], // Apple-style easing
          }}
          className="text-center"
        >
          <div className="text-sm sm:text-[17px] font-light tracking-tight text-zinc-300">
            “{quote.text}”
          </div>
          <div className="mt-0.5 text-[11px] tracking-wide text-zinc-500 uppercase">
            — {quote.author}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}