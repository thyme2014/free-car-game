import React from 'react';
import { CameraView, DriverProfile, GraphicsQuality, MissionProgress, TimeOfDay, VehicleState, VisualTheme } from '../game/types';
import { CAR_PRESETS } from '../game/cars';
import {
  Activity,
  Camera,
  Car,
  Check,
  ChevronDown,
  Compass,
  Cpu,
  Crown,
  Eye,
  Flag,
  Flame,
  MapPin,
  Moon,
  Mountain,
  Navigation,
  Radio,
  RotateCcw,
  RotateCw,
  Shield,
  Sliders,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Trophy,
  User,
  UserCheck,
  Volume2,
  VolumeX,
  Wrench,
  Zap,
} from 'lucide-react';

interface HUDProps {
  state: VehicleState;
  missionProgress: MissionProgress | null;
  cameraMode: CameraView;
  timeOfDay: TimeOfDay;
  visualTheme: VisualTheme;
  graphicsQuality: GraphicsQuality;
  fps?: number;
  currentCarId: string;
  driverProfile: DriverProfile;
  onOpenAuth: () => void;
  onCycleGraphics: () => void;
  onSelectCar: (carId: string) => void;
  onSelectTime: (time: TimeOfDay) => void;
  onSelectTheme: (theme: VisualTheme) => void;
  onCycleCamera: () => void;
  onCycleTime: () => void;
  onCycleTheme: () => void;
  onResetCar: () => void;
  onOpenGarage: () => void;
  onOpenMissions: () => void;
  onOpenMap?: () => void;
  onSelectCamera?: (mode: CameraView) => void;
  onRecenterCamera?: () => void;
  onLookBack?: () => void;
  onRotateOrbit?: (deltaAzimuth: number, deltaPolar?: number) => void;
  onSetOrbitAngle?: (preset: 'front' | 'rear' | 'left' | 'right' | 'top') => void;
  onFastTravelToGarage?: () => void;
  onTeleportToRival?: () => void;
  onAdvanceRival?: () => void;
  isRacingLineEnabled?: boolean;
  guideMode?: 'all' | 'opponent' | 'mission' | 'off';
  onToggleRacingLine?: () => void;
  onOpenTelemetry?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  state,
  missionProgress,
  cameraMode,
  timeOfDay,
  visualTheme,
  graphicsQuality,
  fps = 60,
  currentCarId,
  driverProfile,
  onOpenAuth,
  onCycleGraphics,
  onSelectCar,
  onSelectTime,
  onSelectTheme,
  onCycleCamera,
  onCycleTime,
  onCycleTheme,
  onResetCar,
  onOpenGarage,
  onOpenMissions,
  onOpenMap,
  onSelectCamera,
  onRecenterCamera,
  onLookBack,
  onRotateOrbit,
  onSetOrbitAngle,
  onFastTravelToGarage,
  onTeleportToRival,
  onAdvanceRival,
  isRacingLineEnabled = true,
  guideMode = 'all',
  onToggleRacingLine,
  onOpenTelemetry,
  isMuted,
  onToggleMute,
}) => {
  const [isCameraMenuOpen, setIsCameraMenuOpen] = React.useState(false);

  const CAMERA_OPTIONS: { id: CameraView; label: string; desc: string }[] = [
    { id: 'chase', label: 'Chase View', desc: 'Dynamic chase cam with 360° orbit look' },
    { id: 'firstPerson', label: '1st Person Cockpit', desc: 'Driver seat interior view with steering wheel & digital gauges' },
    { id: 'hood', label: 'Hood Cam', desc: 'Front bonnet view with wide field of view' },
    { id: 'bumper', label: 'Front Bumper', desc: 'Low asphalt speed view with 360° look' },
    { id: 'orbit360', label: '360° Free Orbit', desc: 'Dedicated orbital inspector camera' },
    { id: 'topDown', label: 'Top-Down Aerial', desc: 'Overhead bird-eye perspective' },
  ];

  const currentConfig = CAR_PRESETS[currentCarId] || CAR_PRESETS.apex_gt;
  const maxRpm = currentConfig.maxRpm || 8500;
  const rpmRatio = Math.min(1, Math.max(0, state.rpm / maxRpm));
  const isRedline = rpmRatio > 0.9;

  const rival = state.rivalState;
  const nextXp = driverProfile.nextLevelXp || Math.max(800, driverProfile.level * 800);
  const xpRatio = Math.min(1, Math.max(0, driverProfile.xp / nextXp));

  let gearLabel = `${state.gear}`;
  if (state.isReverse) gearLabel = 'R';
  else if (state.isNeutral) gearLabel = 'N';

  const timeIcons = {
    day: <Sun className="w-3.5 h-3.5 text-amber-400" />,
    sunset: <Sunset className="w-3.5 h-3.5 text-orange-400" />,
    night: <Moon className="w-3.5 h-3.5 text-indigo-400" />,
    dawn: <Sunrise className="w-3.5 h-3.5 text-pink-400" />,
  };

  const themeIcons: Record<VisualTheme, React.ReactNode> = {
    photoreal: <Eye className="w-3.5 h-3.5 text-sky-400" />,
    cyberpunk: <Sparkles className="w-3.5 h-3.5 text-pink-400" />,
    tokyo_drift: <Zap className="w-3.5 h-3.5 text-amber-400" />,
    desert_run: <Mountain className="w-3.5 h-3.5 text-orange-400" />,
    synthwave: <Radio className="w-3.5 h-3.5 text-fuchsia-400" />,
  };

  const themeLabels: Record<VisualTheme, string> = {
    photoreal: 'Photoreal',
    cyberpunk: 'Cyberpunk',
    tokyo_drift: 'Tokyo Drift',
    desert_run: 'Desert Run',
    synthwave: 'Synthwave',
  };

  return (
    <div id="game-hud" className="pointer-events-none absolute inset-0 select-none overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="absolute top-0 inset-x-0 p-2.5 sm:p-4 flex items-center justify-between gap-2">
        {/* Left: Branding & Environment Selectors */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="bg-zinc-950/85 backdrop-blur-md border border-zinc-800 rounded-xl px-3 py-1.5 sm:py-2 flex items-center gap-2 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-white font-black tracking-wider text-xs sm:text-sm uppercase">Apex Horizon</h1>
            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-400 border border-zinc-700">
              PRO 3D
            </span>
          </div>

          {/* Time of Day Switcher */}
          <div className="pointer-events-auto bg-zinc-950/85 backdrop-blur-md border border-zinc-800 rounded-xl p-1 flex items-center gap-1 shadow-lg">
            {(['day', 'sunset', 'night', 'dawn'] as TimeOfDay[]).map(tod => (
              <button
                key={tod}
                onClick={() => onSelectTime(tod)}
                className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  timeOfDay === tod
                    ? 'bg-zinc-800 text-white shadow'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
                title={`Switch to ${tod} (Hotkey T)`}
              >
                {timeIcons[tod]}
                <span className="hidden lg:inline capitalize text-[10px]">{tod}</span>
              </button>
            ))}
          </div>

          {/* Visual Theme Switcher */}
          <div className="pointer-events-auto bg-zinc-950/85 backdrop-blur-md border border-zinc-800 rounded-xl p-1 hidden sm:flex items-center gap-1 shadow-lg">
            {(['photoreal', 'cyberpunk', 'tokyo_drift', 'desert_run', 'synthwave'] as VisualTheme[]).map(th => (
              <button
                key={th}
                onClick={() => onSelectTheme(th)}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  visualTheme === th
                    ? 'bg-zinc-800 text-white shadow border border-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
                title={`Visual Theme: ${themeLabels[th]} (Hotkey V)`}
              >
                {themeIcons[th]}
                <span className="hidden md:inline">{themeLabels[th]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center: Mission Tracker */}
        {missionProgress && missionProgress.status === 'active' && (
          <div className="bg-zinc-950/90 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] rounded-2xl px-3 sm:px-5 py-1.5 sm:py-2 flex items-center gap-3 sm:gap-5 backdrop-blur-md animate-in fade-in">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold tracking-widest text-cyan-400">CP</span>
              <span className="text-sm sm:text-base font-black text-white">
                #{missionProgress.currentCheckpoint + 1}
              </span>
            </div>
            <div className="h-6 w-px bg-zinc-800" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold tracking-widest text-amber-400">Time</span>
              <span className="text-sm sm:text-base font-mono font-black text-amber-300">
                {missionProgress.timeElapsed.toFixed(1)}s
              </span>
            </div>
            {state.damage > 0 && (
              <>
                <div className="h-6 w-px bg-zinc-800" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-rose-400">Dmg</span>
                  <span className={`text-sm sm:text-base font-mono font-black ${state.damage > 20 ? 'text-rose-500 animate-pulse' : 'text-zinc-300'}`}>
                    {state.damage}%
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Right: Actions Menu */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {/* Driver License & Sign-In Button */}
          <button
            id="hud-driver-btn"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-black shadow-md transition active:scale-95 cursor-pointer"
            title="Driver Profile & Sign-In (Track records, medals & account)"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">{driverProfile.callsign}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-zinc-950 font-black">
              L{driverProfile.level}
            </span>
          </button>

          {/* Performance Mode & FPS Indicator */}
          <button
            id="hud-graphics-btn"
            onClick={onCycleGraphics}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-xl border text-xs font-bold shadow-md transition active:scale-95 cursor-pointer ${
              graphicsQuality === 'performance'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : graphicsQuality === 'balanced'
                ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                : 'bg-purple-950/80 border-purple-500/50 text-purple-300'
            }`}
            title={`Graphics Mode: ${graphicsQuality.toUpperCase()} (Click to toggle Performance / Balanced / Ultra)`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono font-black">{fps} FPS</span>
          </button>

          <button
            id="hud-missions-btn"
            onClick={onOpenMissions}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
            title="Missions & Challenges"
          >
            <Flag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Missions</span>
          </button>

          {onOpenMap && (
            <button
              id="hud-map-btn"
              onClick={onOpenMap}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-cyan-300 border border-cyan-500/30 text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
              title="GPS World Map (Find Apex Garage & Checkpoints)"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Map</span>
            </button>
          )}

          <button
            id="hud-garage-btn"
            onClick={onOpenGarage}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold shadow-md transition active:scale-95 cursor-pointer ${
              state.isNearGarage
                ? 'bg-amber-500 text-zinc-950 font-black border border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.6)] animate-pulse'
                : 'bg-zinc-900/90 hover:bg-zinc-800 text-amber-300 border border-amber-500/30'
            }`}
            title="Garage & Upgrades (Press G)"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Garage</span>
            {state.isNearGarage && <span className="text-[9px] bg-black/30 px-1 rounded">BAY</span>}
          </button>

          {onOpenTelemetry && (
            <button
              id="hud-telemetry-btn"
              onClick={onOpenTelemetry}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-cyan-300 border border-cyan-500/40 text-xs font-bold shadow-md transition active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.18)]"
              title="Driving Telemetry & D3 Line Chart Analysis (Press T)"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Telemetry</span>
            </button>
          )}

          {/* Camera View Switcher Dropdown */}
          <div className="relative">
            <button
              id="hud-cam-btn"
              onClick={() => setIsCameraMenuOpen(!isCameraMenuOpen)}
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border shadow-md transition active:scale-95 cursor-pointer ${
                cameraMode === 'orbit360'
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}
              title={`Camera: ${cameraMode} (Click to choose view, press [C] to cycle, drag screen for 360°)`}
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono font-bold hidden sm:inline uppercase">
                {cameraMode === 'firstPerson' ? '1st Person' : cameraMode === 'orbit360' ? '360° Orbit' : cameraMode}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {isCameraMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-950/95 border border-cyan-500/40 rounded-2xl p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400 border-b border-zinc-800/80 mb-1 flex items-center justify-between">
                  <span>Camera Modes</span>
                  <span className="text-zinc-500 font-mono">[C] Cycle</span>
                </div>
                <div className="space-y-1">
                  {CAMERA_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        if (onSelectCamera) onSelectCamera(opt.id);
                        else onCycleCamera();
                        setIsCameraMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-start justify-between transition cursor-pointer ${
                        cameraMode === opt.id
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                          : 'hover:bg-zinc-900 text-zinc-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>{opt.label}</span>
                          {opt.id === 'orbit360' && (
                            <span className="text-[9px] px-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                              Dedicated 360°
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-normal leading-tight mt-0.5">
                          {opt.desc}
                        </div>
                      </div>
                      {cameraMode === opt.id && <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />}
                    </button>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-400 px-2 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Look Around 360°:</span>
                    <span className="text-zinc-300 font-mono">Drag Mouse</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recenter View:</span>
                    <span className="text-zinc-300 font-mono">Double-Click / [V]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rear View:</span>
                    <span className="text-zinc-300 font-mono">Hold [B]</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {onToggleRacingLine && (
            <button
              id="hud-racing-line-btn"
              onClick={onToggleRacingLine}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-bold shadow-md transition active:scale-95 cursor-pointer ${
                guideMode === 'all'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : guideMode === 'opponent'
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  : guideMode === 'mission'
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-500 border-zinc-700'
              }`}
              title="Toggle Dynamic Racing & Opponent Guide Line (Key G)"
            >
              <Navigation className={`w-3.5 h-3.5 ${guideMode === 'opponent' ? 'text-purple-400' : guideMode === 'mission' ? 'text-cyan-400' : 'text-emerald-400'}`} />
              <span className="hidden sm:inline font-black text-[10px]">
                {guideMode === 'all' ? 'GUIDE: ALL' : guideMode === 'opponent' ? 'RIVAL CHASE' : guideMode === 'mission' ? 'MISSION' : 'GUIDE: OFF'}
              </span>
              <span className={`w-2 h-2 rounded-full ${
                guideMode === 'all' ? 'bg-emerald-400 animate-pulse' :
                guideMode === 'opponent' ? 'bg-purple-400 animate-pulse' :
                guideMode === 'mission' ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-600'
              }`} />
            </button>
          )}

          <button
            id="hud-sound-btn"
            onClick={onToggleMute}
            className="p-1.5 sm:p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 shadow-md transition active:scale-95 cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            id="hud-reset-btn"
            onClick={onResetCar}
            className="p-1.5 sm:p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 shadow-md transition active:scale-95 cursor-pointer"
            title="Reset Position (Press R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Top Level Bar & Computer Car Rival Duel Progression */}
      <div className="pointer-events-auto absolute top-14 sm:top-15 inset-x-0 mx-auto z-30 flex flex-col items-center gap-1.5 px-3 max-w-4xl">
        {/* Top Level Bar */}
        <div className="w-full bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-2 px-3 sm:px-4 shadow-xl flex items-center justify-between gap-3">
          {/* Driver Level Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 font-black">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs tracking-wider">LEVEL {driverProfile.level}</span>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase hidden md:inline px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
              {driverProfile.licenseClass}
            </span>
          </div>

          {/* XP Progression Bar */}
          <div className="flex-1 min-w-[120px] max-w-md">
            <div className="flex justify-between items-center text-[10px] font-bold mb-1">
              <span className="text-zinc-300">Driver Experience</span>
              <span className="font-mono text-cyan-400">{driverProfile.xp} / {nextXp} XP ({Math.round(xpRatio * 100)}%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(xpRatio * 100)}%` }}
              />
            </div>
          </div>

          {/* Cash Balance */}
          <div className="shrink-0 font-mono text-xs sm:text-sm font-black text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
            ${(driverProfile.cash || 0).toLocaleString()}
          </div>
        </div>

        {/* Rival Computer Car Duel Bar */}
        {rival && (
          <div className={`w-full bg-zinc-950/90 backdrop-blur-md border rounded-2xl p-2 px-3 sm:px-4 shadow-xl transition-all ${
            rival.status === 'defeated'
              ? 'border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              : 'border-zinc-800'
          }`}>
            <div className="flex items-center justify-between gap-2 text-xs font-bold mb-1.5">
              <div className="flex items-center gap-2 truncate">
                <span className="text-[10px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300">
                  ⚔️ Computer Rival
                </span>
                <span className="text-white font-extrabold truncate text-xs sm:text-sm">{rival.name}</span>
                <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">({rival.speedKmh} km/h)</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {rival.status === 'defeated' ? (
                  <span className="text-xs font-black text-amber-400 flex items-center gap-1 animate-bounce">
                    <Crown className="w-3.5 h-3.5" /> DEFEATED!
                  </span>
                ) : (
                  <span className={`text-[11px] font-mono font-bold flex items-center gap-1 px-2 py-0.5 rounded ${
                    rival.isPlayerAhead
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                  }`}>
                    {rival.isPlayerAhead ? `+${rival.distanceToPlayer}m Ahead` : `-${rival.distanceToPlayer}m Behind`}
                  </span>
                )}

                {onTeleportToRival && rival.status !== 'defeated' && (
                  <button
                    onClick={onTeleportToRival}
                    className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 transition cursor-pointer active:scale-95"
                    title="Teleport next to Computer Car to battle"
                  >
                    Duel Rival
                  </button>
                )}

                {onAdvanceRival && rival.status === 'defeated' && (
                  <button
                    onClick={onAdvanceRival}
                    className="text-[10px] font-black px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black shadow-lg transition cursor-pointer active:scale-95"
                  >
                    Next Challenger ➔
                  </button>
                )}
              </div>
            </div>

            {/* Duel Battle Score Progress Bar */}
            <div className="flex items-center gap-2.5">
              <div className="flex-1 h-3 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${
                    rival.status === 'defeated'
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_12px_#f59e0b]'
                      : 'bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400'
                  }`}
                  style={{ width: `${rival.battleProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-zinc-300 shrink-0">
                {rival.battleScore} / {rival.targetScore} PTS ({rival.battleProgress}%)
              </span>
            </div>

            {/* Battle Objective Hints */}
            <div className="flex items-center justify-between text-[9px] font-medium text-zinc-400 mt-1">
              <span className="text-zinc-500 truncate mr-2">
                {rival.status === 'defeated'
                  ? 'Computer car defeated! Click Next Challenger to advance streak'
                  : 'Race Ahead (+40/s) • Drift combos (100% score) • Pass rival'}
              </span>
              <span className="text-amber-400 font-bold shrink-0">
                Reward: +${rival.rewardCash.toLocaleString()} • +{rival.rewardXp} XP
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick 10-Car Selector Strip on top center */}
      <div className="pointer-events-auto absolute top-40 sm:top-44 inset-x-0 flex justify-center px-2 sm:px-4">
        <div className="bg-zinc-950/85 backdrop-blur-md border border-zinc-800/90 rounded-2xl p-1.5 flex items-center gap-1.5 shadow-2xl overflow-x-auto max-w-full custom-scrollbar">
          {Object.values(CAR_PRESETS).map((car, idx) => {
            const isSelected = car.id === currentCarId;
            const keyLabel = idx === 9 ? '0' : `${idx + 1}`;
            return (
              <button
                key={car.id}
                onClick={() => onSelectCar(car.id)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-left transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  isSelected
                    ? 'bg-amber-500 text-zinc-950 font-black shadow-[0_0_18px_rgba(245,158,11,0.5)] scale-102'
                    : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80'
                }`}
                title={`Switch to ${car.name} (Key [${keyLabel}])`}
              >
                <span className={`text-[9px] sm:text-[10px] font-mono px-1 py-0.2 rounded font-black ${
                  isSelected ? 'bg-black/25 text-black' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {keyLabel}
                </span>
                <span className="text-xs font-bold">{car.name}</span>
                <span className={`text-[10px] hidden xl:inline ${isSelected ? 'text-zinc-900 font-bold' : 'text-zinc-500'}`}>
                  {car.driveType}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Garage Service Bay Proximity Alert */}
      {state.isNearGarage && (
        <div className="pointer-events-auto absolute top-28 left-1/2 -translate-x-1/2 z-30 animate-in fade-in">
          <button
            onClick={onOpenGarage}
            className="px-4 sm:px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(245,158,11,0.7)] flex items-center gap-2 border border-amber-300 animate-pulse hover:scale-105 transition cursor-pointer"
          >
            <Wrench className="w-4 h-4 text-zinc-950" />
            <span>APEX GARAGE SERVICE BAY ACTIVE - CLICK OR PRESS [G] TO UPGRADE</span>
          </button>
        </div>
      )}

      {/* 360 Camera Controls Bar */}
      {cameraMode === 'orbit360' ? (
        <div className="pointer-events-auto absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 bg-zinc-950/90 backdrop-blur-md border border-cyan-500/50 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.3)] z-20 animate-in fade-in">
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold px-1 border-r border-zinc-800">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-mono">360° Free Orbit</span>
          </div>

          {onRotateOrbit && (
            <button
              onClick={() => onRotateOrbit(-0.35)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition active:scale-95 cursor-pointer text-xs flex items-center gap-1"
              title="Rotate Camera Left"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[10px]">Left</span>
            </button>
          )}

          {onSetOrbitAngle && (
            <div className="flex items-center gap-1">
              {(['rear', 'front', 'left', 'right', 'top'] as const).map((angle) => (
                <button
                  key={angle}
                  onClick={() => onSetOrbitAngle(angle)}
                  className="px-2 py-1 rounded-lg bg-zinc-900/80 hover:bg-cyan-950 text-zinc-400 hover:text-cyan-300 border border-zinc-800 hover:border-cyan-800 transition text-[10px] font-bold uppercase cursor-pointer"
                >
                  {angle}
                </button>
              ))}
            </div>
          )}

          {onRotateOrbit && (
            <button
              onClick={() => onRotateOrbit(0.35)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition active:scale-95 cursor-pointer text-xs flex items-center gap-1"
              title="Rotate Camera Right"
            >
              <span className="hidden md:inline text-[10px]">Right</span>
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}

          {onSelectCamera && (
            <button
              onClick={() => onSelectCamera('chase')}
              className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] transition active:scale-95 cursor-pointer ml-1"
              title="Return to Driving Chase Camera"
            >
              Drive Mode
            </button>
          )}

          <span className="text-[10px] text-zinc-500 hidden lg:inline pl-1 border-l border-zinc-800">
            Drag screen to look 360°
          </span>
        </div>
      ) : (
        <div className="pointer-events-auto absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/90 rounded-2xl px-3 py-1.5 flex items-center gap-2 shadow-xl z-20">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-300 pr-1.5 border-r border-zinc-800">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-mono uppercase text-zinc-300">
              {cameraMode === 'firstPerson' ? '1st Person Driver' : cameraMode === 'chase' ? 'Chase' : cameraMode === 'hood' ? 'Hood' : cameraMode === 'bumper' ? 'Bumper' : 'Top-Down'}
            </span>
            <span className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-400 hidden md:inline">360° Look</span>
          </div>

          {onRecenterCamera && (
            <button
              onClick={onRecenterCamera}
              className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[10px] font-bold transition active:scale-95 cursor-pointer flex items-center gap-1"
              title="Recenter Camera Look (Key [V] or Double-Click screen)"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>Center [V]</span>
            </button>
          )}

          {onLookBack && (
            <button
              onMouseDown={onLookBack}
              onMouseUp={onRecenterCamera}
              onTouchStart={onLookBack}
              onTouchEnd={onRecenterCamera}
              className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[10px] font-bold transition active:scale-95 cursor-pointer flex items-center gap-1"
              title="Hold to Look Back (Key [B])"
            >
              <span>Rear View [B]</span>
            </button>
          )}

          {onSelectCamera && (
            <button
              onClick={() => onSelectCamera('orbit360')}
              className="px-2 py-1 rounded-lg bg-zinc-900/60 hover:bg-cyan-950 text-zinc-400 hover:text-cyan-300 border border-zinc-800 text-[10px] transition cursor-pointer hidden md:inline"
              title="Switch to dedicated 360 free orbit camera"
            >
              360° Free Orbit
            </button>
          )}

          <span className="text-[10px] text-zinc-500 hidden xl:inline pl-1 border-l border-zinc-800">
            Drag to look 360° &bull; Double-click to center
          </span>
        </div>
      )}

      {/* Drift Notification Banner */}
      {state.isDrifting && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest px-5 py-1.5 rounded-full shadow-[0_0_20px_rgba(219,39,119,0.5)] border border-pink-300/50">
            DRIFT {state.driftAngle}° &times; {state.driftMultiplier.toFixed(1)}
          </div>
          <span className="text-yellow-300 font-mono font-black text-2xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] mt-1">
            +{state.driftScore} PTS
          </span>
        </div>
      )}

      {/* Bottom Center-Right: Dashboard Cluster */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-end gap-2.5 sm:gap-4">
        {/* Secondary Telemetry: Nitro NOS & Boost & Damage */}
        <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800/90 rounded-2xl p-3 sm:p-3.5 flex flex-col gap-2.5 shadow-2xl">
          {/* Nitro NOS Gauge */}
          <div>
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-1">
              <span className="flex items-center gap-1 text-cyan-400">
                <Zap className="w-3 h-3 fill-cyan-400" />
                NITRO [SHIFT]
              </span>
              <span className={`font-mono ${state.isBoosting ? 'text-cyan-300 animate-pulse font-black' : 'text-zinc-400'}`}>
                {state.nitro} / {state.maxNitro || 100}
              </span>
            </div>
            <div className="w-28 sm:w-32 h-2 bg-zinc-800 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  state.isBoosting
                    ? 'bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                    : 'bg-cyan-600'
                }`}
                style={{ width: `${(state.nitro / (state.maxNitro || 100)) * 100}%` }}
              />
            </div>
          </div>

          {/* Turbo Boost Gauge */}
          <div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              <span>Turbo Spool</span>
              <span className="font-mono text-amber-400">{state.boostPressure} BAR</span>
            </div>
            <div className="w-28 sm:w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-75"
                style={{ width: `${Math.min(100, (state.boostPressure / 1.5) * 100)}%` }}
              />
            </div>
          </div>

          {/* Chassis Health */}
          <div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              <span>Chassis</span>
              <span className={`font-mono ${state.damage > 50 ? 'text-rose-400 font-black' : 'text-zinc-300'}`}>
                {100 - state.damage}%
              </span>
            </div>
            <div className="w-28 sm:w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  state.damage > 50 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${100 - state.damage}%` }}
              />
            </div>
          </div>

          {/* Indicators */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[10px] font-bold">
            <span className={`px-2 py-0.5 rounded text-[9px] ${state.headlightsOn ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'bg-zinc-900 text-zinc-600'}`}>
              BEAMS
            </span>
            <span className={`px-2 py-0.5 rounded text-[9px] ${state.isAirborne ? 'bg-amber-950 text-amber-300 border border-amber-700 animate-pulse' : 'bg-zinc-900 text-zinc-600'}`}>
              AIRBORNE
            </span>
          </div>
        </div>

        {/* Main Speedometer & Tachometer Cluster */}
        <div className="relative w-40 h-40 sm:w-52 sm:h-52 bg-zinc-950/90 backdrop-blur-md border-2 border-zinc-800 rounded-full p-4 flex flex-col items-center justify-center shadow-2xl">
          {/* Circular SVG Tachometer Arc */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="transparent"
              stroke="#27272a"
              strokeWidth="5"
              strokeDasharray="210 276"
              strokeLinecap="round"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="transparent"
              stroke={isRedline ? '#ef4444' : rpmRatio > 0.7 ? '#f59e0b' : '#06b6d4'}
              strokeWidth="5"
              strokeDasharray={`${rpmRatio * 210} 276`}
              strokeLinecap="round"
              className="transition-all duration-75"
            />
          </svg>

          {/* Speed Number & Units */}
          <div className="flex flex-col items-center z-10">
            <span className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-white drop-shadow-md">
              {state.speedKmh}
            </span>
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 -mt-1">
              KM / H
            </span>
          </div>

          {/* Gear Indicator Badge */}
          <div className="mt-1 z-10 flex items-center gap-2">
            <span className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-sm sm:text-base text-cyan-400 shadow-inner">
              {gearLabel}
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono text-zinc-400">
              {state.rpm} RPM
            </span>
          </div>

          {/* Redline Shift Light */}
          {isRedline && (
            <div className="absolute top-4 sm:top-5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest animate-ping">
              SHIFT
            </div>
          )}
        </div>
      </div>

      {/* Bottom Left: Controls Legend */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 pointer-events-none hidden md:flex flex-col gap-1.5 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-3 text-xs text-zinc-400 shadow-xl">
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono font-bold text-[10px]">W/A/S/D</kbd>
          <span>Drive & Steer</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-zinc-700 font-mono font-bold text-[10px]">SHIFT</kbd>
          <span className="text-cyan-400 font-bold">Nitro Boost</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono font-bold text-[10px]">SPACE</kbd>
          <span>Handbrake Drift</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700 font-mono font-bold text-[10px]">1 - 0</kbd>
          <span>Switch 10 Cars (0 = Hornet)</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono font-bold text-[10px]">C</kbd>
          <span>Camera (360° Orbit / Chase / Hood)</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700 font-mono font-bold text-[10px]">G / M</kbd>
          <span>Garage / World Map & GPS</span>
        </div>
      </div>
    </div>
  );
};
