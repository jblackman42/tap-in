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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
      onClick={onDismiss}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-qpq-guide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-violet-950 text-center mb-4">
          How to play
        </h2>

        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-xs">
              1
            </span>
            <span>Write the funniest answer you can think of to each prompt.</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-xs">
              2
            </span>
            <span>Vote for your favorite answer when two go head-to-head.</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-xs">
              3
            </span>
            <span>Most votes wins. Be funny, be weird, be you.</span>
          </li>
        </ul>

        <button
          type="button"
          className="w-full mt-5 py-2.5 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors"
          onClick={onDismiss}
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
