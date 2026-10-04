import React from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Zap } from 'lucide-react';
import { InputState } from '../game/types';

interface TouchControlsProps {
  onInput: (input: Partial<InputState>) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onInput }) => {
  return (
    <div id="touch-controls" className="pointer-events-none absolute inset-x-0 bottom-4 px-3 flex items-end justify-between sm:hidden z-30">
      {/* Steering (Left & Right) */}
      <div className="pointer-events-auto flex items-center gap-2">
        <button
          id="btn-steer-left"
          onMouseDown={() => onInput({ left: true })}
          onMouseUp={() => onInput({ left: false })}
          onTouchStart={(e) => { e.preventDefault(); onInput({ left: true }); }}
          onTouchEnd={(e) => { e.preventDefault(); onInput({ left: false }); }}
          className="w-14 h-14 rounded-2xl bg-zinc-950/90 backdrop-blur-md border border-cyan-800/60 text-white flex flex-col items-center justify-center active:scale-90 active:bg-cyan-600 transition shadow-xl"
          title="Steer Left"
        >
          <ArrowLeft className="w-5 h-5 text-cyan-400" />
          <span className="text-[8px] font-black tracking-wider text-zinc-400 uppercase mt-0.5">STEER</span>
        </button>

        <button
          id="btn-steer-right"
          onMouseDown={() => onInput({ right: true })}
          onMouseUp={() => onInput({ right: false })}
          onTouchStart={(e) => { e.preventDefault(); onInput({ right: true }); }}
          onTouchEnd={(e) => { e.preventDefault(); onInput({ right: false }); }}
          className="w-14 h-14 rounded-2xl bg-zinc-950/90 backdrop-blur-md border border-cyan-800/60 text-white flex flex-col items-center justify-center active:scale-90 active:bg-cyan-600 transition shadow-xl"
          title="Steer Right"
        >
          <ArrowRight className="w-5 h-5 text-cyan-400" />
          <span className="text-[8px] font-black tracking-wider text-zinc-400 uppercase mt-0.5">STEER</span>
        </button>
      </div>

      {/* Nitro Boost, Handbrake, Brake, Gas */}
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
        {/* Nitro Boost */}
        <button
          id="btn-nitro-boost"
          onMouseDown={() => onInput({ boost: true })}
          onMouseUp={() => onInput({ boost: false })}
          onTouchStart={(e) => { e.preventDefault(); onInput({ boost: true }); }}
          onTouchEnd={(e) => { e.preventDefault(); onInput({ boost: false }); }}
          className="w-11 h-13 rounded-2xl bg-cyan-950/90 backdrop-blur-md border border-cyan-500 text-cyan-300 flex flex-col items-center justify-center active:scale-90 active:bg-cyan-500 active:text-white transition shadow-xl"
          title="Nitro Boost"
        >
          <Zap className="w-4 h-4 fill-cyan-400" />
          <span className="text-[8px] font-black tracking-wider text-cyan-300 uppercase mt-0.5">NOS</span>
        </button>

        {/* Handbrake Drift */}
        <button
          id="btn-handbrake"
          onMouseDown={() => onInput({ handbrake: true })}
          onMouseUp={() => onInput({ handbrake: false })}
          onTouchStart={(e) => { e.preventDefault(); onInput({ handbrake: true }); }}
          onTouchEnd={(e) => { e.preventDefault(); onInput({ handbrake: false }); }}
          className="w-11 h-13 rounded-2xl bg-purple-950/90 backdrop-blur-md border border-purple-600 text-purple-200 flex flex-col items-center justify-center active:scale-90 active:bg-purple-600 transition shadow-xl"
          title="Handbrake Drift"
        >
          <span className="font-mono font-black text-[9px] uppercase">DRIFT</span>
        </button>

        {/* Foot Brake / Reverse */}
        <button
          id="btn-brake"
          onMouseDown={() => onInput({ backward: true })}
          onMouseUp={() => onInput({ backward: false })}
          onTouchStart={(e) => { e.preventDefault(); onInput({ backward: true }); }}
          onTouchEnd={(e) => { e.preventDefault(); onInput({ backward: false }); }}
          className="w-13 h-14 rounded-2xl bg-rose-950/90 backdrop-blur-md border border-rose-700 text-rose-200 flex flex-col items-center justify-center active:scale-90 active:bg-rose-600 transition shadow-xl"
          title="Brake / Reverse"
        >
          <ArrowDown className="w-5 h-5 text-rose-400" />
          <span className="text-[8px] font-black tracking-wider text-rose-300 uppercase mt-0.5">BRAKE</span>
        </button>

        {/* Throttle Gas */}
        <button
          id="btn-throttle"
          onMouseDown={() => onInput({ forward: true })}
          onMouseUp={() => onInput({ forward: false })}
          onTouchStart={(e) => { e.preventDefault(); onInput({ forward: true }); }}
          onTouchEnd={(e) => { e.preventDefault(); onInput({ forward: false }); }}
          className="w-13 h-14 rounded-2xl bg-emerald-950/90 backdrop-blur-md border border-emerald-600 text-emerald-200 flex flex-col items-center justify-center active:scale-90 active:bg-emerald-600 transition shadow-xl"
          title="Throttle / Gas"
        >
          <ArrowUp className="w-5 h-5 text-emerald-400" />
          <span className="text-[8px] font-black tracking-wider text-emerald-300 uppercase mt-0.5">GAS</span>
        </button>
      </div>
    </div>
  );
};
