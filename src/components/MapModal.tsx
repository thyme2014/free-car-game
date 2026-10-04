import React from 'react';
import {
  Compass,
  Crosshair,
  Flag,
  MapPin,
  Navigation,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { Mission } from '../game/types';
import { MISSIONS } from '../game/missions';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  carPosition: [number, number, number];
  carRotationY: number;
  activeMission: Mission | null;
  currentCheckpoint: number;
  onFastTravel: (x: number, z: number) => void;
  onStartMission: (missionId: string) => void;
}

export const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  onClose,
  carPosition,
  carRotationY,
  activeMission,
  currentCheckpoint,
  onFastTravel,
  onStartMission,
}) => {
  if (!isOpen) return null;

  const [carX, , carZ] = carPosition;
  const garageX = 45;
  const garageZ = -42;
  const distToGarage = Math.round(Math.hypot(carX - garageX, carZ - garageZ));

  // Map coordinate transformation: world (-700 to +700 = 1400m span) -> SVG (0 to 100)
  const WORLD_MIN = -700;
  const WORLD_SPAN = 1400;

  const worldToSvg = (wx: number, wz: number) => {
    const cx = ((wx - WORLD_MIN) / WORLD_SPAN) * 100;
    const cy = ((wz - WORLD_MIN) / WORLD_SPAN) * 100;
    return { x: cx, y: cy };
  };

  const carSvg = worldToSvg(carX, carZ);
  const garageSvg = worldToSvg(garageX, garageZ);

  const roadGridLines = [-240, -160, -80, 0, 80, 160, 240];

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const normX = Math.max(0, Math.min(1, clickX / rect.width));
    const normY = Math.max(0, Math.min(1, clickY / rect.height));

    const worldX = Math.round(WORLD_MIN + normX * WORLD_SPAN);
    const worldZ = Math.round(WORLD_MIN + normY * WORLD_SPAN);

    onFastTravel(worldX, worldZ);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">Apex City GPS Satellite Map</h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  LIVE TELEMETRY
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Current Position: <span className="font-mono text-zinc-200">X: {Math.round(carX)}, Z: {Math.round(carZ)}</span> | Click map to Fast-Travel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onFastTravel(garageX, garageZ)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition cursor-pointer shadow-md"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Fast-Travel to Garage ({distToGarage}m)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Map Viewport */}
        <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] my-3 rounded-2xl overflow-hidden border border-zinc-800 bg-[#0c1017] flex items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full cursor-crosshair"
            onClick={handleMapClick}
          >
            {/* Background Grid */}
            <defs>
              <pattern id="smallGrid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#1f2937" strokeWidth="0.1" />
              </pattern>
              <radialGradient id="garageGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect width="100" height="100" fill="#0b0f17" />
            <rect width="100" height="100" fill="url(#smallGrid)" />

            {/* East: Vast Ocean Marina & Coastal Riviera */}
            <rect x="83.5" y="0" width="16.5" height="100" fill="#0284c7" opacity="0.3" />
            <line x1="83.5" y1="0" x2="83.5" y2="100" stroke="#38bdf8" strokeWidth="0.8" opacity="0.8" />
            <line x1="81.4" y1="5" x2="81.4" y2="95" stroke="#64748b" strokeWidth="1.2" />
            {/* 3 Marina Piers */}
            {[38.5, 50, 61.5].map((py, idx) => (
              <g key={idx}>
                <line x1="83.5" y1={py} x2="88" y2={py} stroke="#78350f" strokeWidth="0.9" />
                <rect x="86.5" y={py - 0.8} width="2.2" height="1.6" fill="#f8fafc" rx="0.3" />
              </g>
            ))}
            {/* Lighthouse */}
            <circle cx="87.1" cy="68.5" r="1.5" fill="#ef4444" />
            <circle cx="87.1" cy="68.5" r="3.0" fill="none" stroke="#fef08a" strokeWidth="0.4" strokeDasharray="1 1" />
            <text x="91" y="50" fill="#38bdf8" fontSize="2.2" fontWeight="bold" textAnchor="middle">
              COASTAL RIVIERA
            </text>

            {/* West: Apex International Airport & 1000m Drag Strip */}
            <rect x="11.2" y="14.3" width="3.2" height="71.4" fill="#09090b" stroke="#334155" strokeWidth="0.4" rx="0.5" />
            {/* Runway Dashes */}
            <line x1="12.8" y1="16" x2="12.8" y2="84" stroke="#ffffff" strokeWidth="0.35" strokeDasharray="1.2 1.2" />
            {/* Airport Terminal & Hangars */}
            <rect x="4.2" y="44.2" width="4.5" height="8.5" fill="#334155" rx="0.5" />
            <rect x="5.0" y="55.7" width="3.8" height="5" fill="#1e293b" rx="0.5" />
            <rect x="5.0" y="67.1" width="3.8" height="5" fill="#1e293b" rx="0.5" />
            {/* Control Tower */}
            <circle cx="5.0" cy="37.1" r="1.2" fill="#06b6d4" />
            <text x="12.8" y="11" fill="#38bdf8" fontSize="2.0" fontWeight="bold" textAnchor="middle">
              ✈️ 1000M DRAG RUNWAY
            </text>

            {/* North: Highland Touge Mountain Pass & Summit Overlook */}
            <path
              d="M 25 17 Q 35 12 40 18 T 50 8 T 60 18 T 75 17"
              fill="none"
              stroke="#10b981"
              strokeWidth="1.2"
              strokeDasharray="2 1"
            />
            <circle cx="50" cy="5.7" r="2.2" fill="#064e3b" stroke="#34d399" strokeWidth="0.5" />
            <text x="50" y="4.0" fill="#34d399" fontSize="2.0" fontWeight="bold" textAnchor="middle">
              ⛰️ TOUGE SUMMIT OVERLOOK
            </text>

            {/* South: Megastunt Proving Grounds & Superpark */}
            <rect x="25" y="82" width="50" height="15.7" fill="#881337" opacity="0.35" rx="1.5" stroke="#f43f5e" strokeWidth="0.5" />
            <circle cx="40" cy="90" r="2.5" fill="none" stroke="#fbbf24" strokeWidth="0.8" />
            <circle cx="60" cy="90" r="2.5" fill="none" stroke="#fbbf24" strokeWidth="0.8" />
            <rect x="48" y="85" width="4" height="6" fill="#0284c7" rx="0.5" />
            <text x="50" y="99" fill="#fb7185" fontSize="2.0" fontWeight="bold" textAnchor="middle">
              🔥 MEGASTUNT SUPERPARK
            </text>

            {/* Highway Outer Speed Ring (Radius 280m / 1400m = 20% in SVG) */}
            <circle
              cx="50"
              cy="50"
              r="20"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="0.9"
              opacity="0.6"
            />
            <text x="50" y="72" fill="#38bdf8" fontSize="1.6" fontWeight="bold" textAnchor="middle" opacity="0.8">
              HIGHWAY SPEED RING
            </text>

            {/* City Street Grid Roads */}
            {roadGridLines.map(coord => {
              const svgCoord = ((coord - WORLD_MIN) / WORLD_SPAN) * 100;
              return (
                <g key={coord}>
                  {/* Vertical Roads */}
                  <line
                    x1={svgCoord}
                    y1="32.8"
                    x2={svgCoord}
                    y2="67.2"
                    stroke="#1e293b"
                    strokeWidth="1.2"
                  />
                  {/* Horizontal Roads */}
                  <line
                    x1="32.8"
                    y1={svgCoord}
                    x2="67.2"
                    y2={svgCoord}
                    stroke="#1e293b"
                    strokeWidth="1.2"
                  />
                </g>
              );
            })}

            {/* Downtown Skyscraper District Highlight */}
            <rect x="44" y="44" width="12" height="12" fill="#f59e0b" opacity="0.08" rx="1.5" />
            <text x="50" y="49" fill="#94a3b8" fontSize="1.6" fontWeight="bold" textAnchor="middle">
              CENTRAL PLAZA
            </text>

            {/* APEX TUNING GARAGE [X: 45, Z: -40] */}
            <circle cx={garageSvg.x} cy={garageSvg.y} r="5.5" fill="url(#garageGlow)" />
            <rect
              x={garageSvg.x - 2}
              y={garageSvg.y - 2}
              width="4"
              height="4"
              fill="#f59e0b"
              rx="1"
            />
            <circle cx={garageSvg.x} cy={garageSvg.y} r="3" fill="none" stroke="#fbbf24" strokeWidth="0.4" />
            <text
              x={garageSvg.x}
              y={garageSvg.y - 3.2}
              fill="#fbbf24"
              fontSize="2.2"
              fontWeight="900"
              textAnchor="middle"
            >
              🛠️ APEX GARAGE
            </text>

            {/* Mission Checkpoints (If active mission) */}
            {activeMission && activeMission.checkpoints.length > 0 && (() => {
              const remainingPts = [
                carSvg,
                ...activeMission.checkpoints.slice(currentCheckpoint).map(c => worldToSvg(c.position[0], c.position[2]))
              ];
              const pointsStr = remainingPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
              const fullRouteStr = activeMission.checkpoints.map(c => {
                const p = worldToSvg(c.position[0], c.position[2]);
                return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
              }).join(' ');

              return (
                <g>
                  {/* Full route baseline */}
                  <polyline
                    points={fullRouteStr}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="0.7"
                    strokeDasharray="2 1"
                    opacity="0.45"
                  />
                  {/* Active navigation line from car to next checkpoints */}
                  <polyline
                    points={pointsStr}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.1"
                    strokeDasharray="2.5 1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.95"
                  />
                </g>
              );
            })()}

            {activeMission &&
              activeMission.checkpoints.map((cp, idx) => {
                const cpSvg = worldToSvg(cp.position[0], cp.position[2]);
                const isNext = idx === currentCheckpoint;
                const isPassed = idx < currentCheckpoint;
                return (
                  <g key={cp.id}>
                    <circle
                      cx={cpSvg.x}
                      cy={cpSvg.y}
                      r={isNext ? 2.5 : 1.6}
                      fill={isPassed ? '#10b981' : isNext ? '#e11d48' : '#64748b'}
                      opacity={isPassed ? 0.4 : 0.9}
                    />
                    <text
                      x={cpSvg.x}
                      y={cpSvg.y + 0.6}
                      fill="#ffffff"
                      fontSize="1.2"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {idx + 1}
                    </text>
                  </g>
                );
              })}

            {/* Mission Start Points on the Map */}
            {MISSIONS.map(m => {
              const startSvg = worldToSvg(m.startPosition[0], m.startPosition[2]);
              const isActive = activeMission?.id === m.id;
              return (
                <g
                  key={m.id}
                  className="cursor-pointer hover:opacity-100 opacity-80"
                  onClick={e => {
                    e.stopPropagation();
                    onStartMission(m.id);
                  }}
                >
                  <circle
                    cx={startSvg.x}
                    cy={startSvg.y}
                    r={isActive ? 2.8 : 2.0}
                    fill={isActive ? '#06b6d4' : '#8b5cf6'}
                  />
                  <text
                    x={startSvg.x}
                    y={startSvg.y - 2.5}
                    fill="#c084fc"
                    fontSize="1.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    🏁 {m.title.split(' ')[0]}
                  </text>
                </g>
              );
            })}

            {/* PLAYER CAR POSITION AND LIVE HEADING ARROW */}
            <g transform={`translate(${carSvg.x}, ${carSvg.y}) rotate(${(-carRotationY * 180) / Math.PI})`}>
              {/* Radar wave */}
              <circle cx="0" cy="0" r="3.5" fill="none" stroke="#22d3ee" strokeWidth="0.3" opacity="0.6" />
              {/* Car Body Dot */}
              <circle cx="0" cy="0" r="1.6" fill="#06b6d4" stroke="#ffffff" strokeWidth="0.4" />
              {/* Heading arrow pointing forward (negative Z in world = up) */}
              <polygon points="0,-3.4 -1.4,-0.6 1.4,-0.6" fill="#ffffff" />
            </g>
            <text
              x={carSvg.x}
              y={carSvg.y + 3.8}
              fill="#22d3ee"
              fontSize="1.8"
              fontWeight="bold"
              textAnchor="middle"
            >
              YOU
            </text>
          </svg>

          {/* Compass Rose */}
          <div className="absolute top-3 right-3 p-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-400 flex items-center gap-1 text-[11px] font-mono">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>N: 0°</span>
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2 p-2 rounded-xl bg-zinc-950/90 border border-zinc-800 text-[10px] text-zinc-300">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Your Car</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span>Apex Garage (Tuning)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Missions</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Checkpoints</span>
            </div>
          </div>
        </div>

        {/* Footer Quick Teleport Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 text-xs">
          <span className="text-zinc-400">
            Quick Navigation: Click any road or POI to fast travel instantly.
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => onFastTravel(0, 0)}
              className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition cursor-pointer text-xs"
            >
              City Plaza (0, 0)
            </button>
            <button
              onClick={() => onFastTravel(-520, -450)}
              className="px-2.5 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 transition cursor-pointer text-xs font-semibold"
            >
              ✈️ Airport (-520, -450)
            </button>
            <button
              onClick={() => onFastTravel(0, -580)}
              className="px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 transition cursor-pointer text-xs font-semibold"
            >
              ⛰️ Touge Summit (0, -580)
            </button>
            <button
              onClick={() => onFastTravel(440, 0)}
              className="px-2.5 py-1 rounded-xl bg-sky-950/80 border border-sky-500/40 text-sky-300 hover:bg-sky-900/60 transition cursor-pointer text-xs font-semibold"
            >
              🌊 Coastal Riviera (440, 0)
            </button>
            <button
              onClick={() => onFastTravel(0, 560)}
              className="px-2.5 py-1 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 transition cursor-pointer text-xs font-semibold"
            >
              🔥 Megastunt Arena (0, 560)
            </button>
            <button
              onClick={() => onFastTravel(garageX, garageZ)}
              className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition cursor-pointer font-bold text-xs"
            >
              🛠️ Apex Garage (45, -42)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
