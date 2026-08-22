import React, { useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { X, Sparkles } from 'lucide-react';

const MASCOT_QUOTES = [
  "Among Us has impostors. Asset Owl has junior dev with write access to prod.",
  "Red is sus. Asset `AST-9042` is susser — it's been `in_repair` for 6 months.",
  "In Among Us you get ejected for venting. In Asset Owl you get ejected for `git push --force`-ing the state machine.",
  "The impostor fakes tasks. Employees fake 'yeah my laptop works fine' to avoid a maintenance ticket.",
  "Among Us ghosts still finish tasks. Asset Owl ghost accounts still hold 14 MacBooks.",
  "Sabotaging the reactor is less scary than someone dropping the assets collection in prod.",
  "Among Us emergency meetings end with an ejection. Ours end with 'let's schedule a follow-up.'",
  "The owl sees everything at night. So does the audit log. That's why nobody vents here.",
  "Crewmates do tasks. Impostors write 'works on my machine' in the PR description.",
  "Among Us has 12 colors and still can't figure out who did what. We have 4 RBAC roles and somehow it's still 'the backend's fault.'",
  "Vents in Among Us are for escaping. `TODO` comments in our codebase are for hiding bodies.",
  "Ejecting the impostor fixes the round. Restarting the prod fixes the bug. Neither teaches you anything.",
  "You've played too much Among Us when every code review starts with 'no offense, but this PR is kinda sus.'",
  "The impostor's kill animation has nothing on an unhandled promise rejection at 3 AM.",
  "In Among Us the body is found in Electrical. In Asset Owl the body is found in the warranty-expiry report."
];

export const AmongUsMascot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % MASCOT_QUOTES.length);
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-5 right-5 z-40 p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg shadow-purple-600/30 transition-all hover:scale-110 flex items-center gap-1.5 text-xs font-bold border border-purple-400/40"
        title="Open Crewmate"
      >
        <Sparkles className="w-4 h-4 text-purple-200" />
        <span className="pr-1">AssetOwl Crewmate</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end pointer-events-auto">
      {/* Speech Bubble / Status Card (Header removed, full purple palette) */}
      {isOpen && (
        <div className="mb-2 w-64 p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-purple-500/30 shadow-2xl shadow-purple-900/20 text-slate-800 dark:text-slate-100 space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200 relative">
          {/* Top-Right Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-lg transition-colors"
            title="Close bubble"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Quote Body */}
          <p
            onClick={handleNextQuote}
            className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors pr-5 pt-0.5"
          >
            "{MASCOT_QUOTES[quoteIndex]}"
          </p>

          {/* Footer Tag blending AssetOwl + Among Us */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-purple-600 dark:text-purple-400 font-bold tracking-tight">
              AssetOwl Crewmate Portal 
            </span>
            <span className="italic hover:underline cursor-pointer text-purple-500 font-medium" onClick={handleNextQuote}>
              One Liners ➔
            </span>
          </div>
        </div>
      )}

      {/* Floating Lottie Mascot Container */}
      <div className="group relative flex items-center">
        {/* Glow backdrop effect */}
        <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-md group-hover:bg-purple-500/30 transition-all" />

        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className="relative cursor-pointer w-20 h-20 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-purple-500/40 hover:border-purple-500 p-1 shadow-xl hover:shadow-purple-500/20 transition-all hover:scale-105 flex items-center justify-center overflow-hidden"
          title="Click to interact with AssetOwl Crewmate"
        >
          <DotLottieReact
            src="/Loading 50 _ Among Us.lottie"
            loop
            autoplay
            className="w-full h-full object-contain"
          />

          {/* Minimize Icon on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-slate-800/80 text-white rounded-full p-0.5 transition-opacity"
            title="Minimize mascot"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AmongUsMascot;
