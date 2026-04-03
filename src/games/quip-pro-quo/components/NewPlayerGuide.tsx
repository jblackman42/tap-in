"use client";

import { useEffect } from "react";

interface NewPlayerGuideProps {
  onDismiss: () => void;
}

export function NewPlayerGuide({ onDismiss }: NewPlayerGuideProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm px-6"
      onClick={onDismiss}
    >
      <div
        className="bg-surface-lowest border-4 border-foreground wobbly-br-1 p-7 max-w-sm w-full shadow-[12px_12px_0px_0px_#006970] animate-qpq-guide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-headline font-bold text-foreground text-center mb-5 uppercase tracking-tighter">
          How to play
        </h2>

        <ul className="space-y-4 text-sm font-body text-foreground">
          <li className="flex gap-3">
            <span className="shrink-0 w-8 h-8 rounded-xl bg-[#ff3d91] border-2 border-foreground text-white font-headline font-bold flex items-center justify-center text-xs">
              1
            </span>
            <span>Write the funniest answer you can think of to each prompt.</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-8 h-8 rounded-xl bg-secondary border-2 border-foreground text-white font-headline font-bold flex items-center justify-center text-xs">
              2
            </span>
            <span>Vote for your favorite answer when two go head-to-head.</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-8 h-8 rounded-xl bg-tertiary-container border-2 border-foreground text-foreground font-headline font-bold flex items-center justify-center text-xs">
              3
            </span>
            <span>Most votes wins. Be funny, be weird, be you.</span>
          </li>
        </ul>

        <button
          type="button"
          className="w-full mt-6 py-3 bg-primary text-white font-headline font-bold uppercase tracking-wider border-4 border-foreground wobbly-br-2 shadow-[6px_6px_0px_0px_#3f0019] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          onClick={onDismiss}
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
