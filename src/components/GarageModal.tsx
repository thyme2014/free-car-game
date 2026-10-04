import React, { useState } from 'react';
import { CarConfig, VehicleUpgrades, TireCompound } from '../game/types';
import { CAR_PRESETS } from '../game/cars';
import {
  Activity,
  AlertTriangle,
  Car,
  Check,
  Cog,
  Coins,
  Disc,
  Feather,
  Flame,
  Gauge,
  Layers,
  MapPin,
  Navigation,
  Palette,
  Shield,
  Sliders,
  Sparkles,
  Wind,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

interface GarageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCarId: string;
  currentColor: string;
  onSelectCar: (carId: string) => void;
  onSelectColor: (colorHex: string) => void;
  isAutomatic: boolean;
  onToggleTransmission: () => void;
  upgrades: VehicleUpgrades;
  onUpdateUpgrades: (upgrades: VehicleUpgrades) => void;
  isNearGarage?: boolean;
  onTeleportToGarage?: () => void;
  driverCash?: number;
  onDeductCash?: (amount: number) => boolean;
}

type TabType = 'fleet' | 'upgrades' | 'visuals';

export const GarageModal: React.FC<GarageModalProps> = ({
  isOpen,
  onClose,
  currentCarId,
  currentColor,
  onSelectCar,
  onSelectColor,
  isAutomatic,
  onToggleTransmission,
  upgrades,
  onUpdateUpgrades,
  isNearGarage = true,
  onTeleportToGarage,
  driverCash = 5000,
  onDeductCash,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('fleet');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentConfig: CarConfig = CAR_PRESETS[currentCarId] || CAR_PRESETS.apex_gt;

  const applyUpgrade = <K extends keyof VehicleUpgrades>(
    key: K,
    value: VehicleUpgrades[K],
    cost: number = 0,
    isFree: boolean = false
  ) => {
    // If not near garage, require visiting garage first
    if (!isNearGarage) {
      setStatusMessage('⚠️ You must drive into the Apex Garage service bay at [X: 45, Z: -42] to install tuning upgrades!');
      return;
    }

    if (!isFree && cost > 0) {
      if (onDeductCash) {
        const ok = onDeductCash(cost);
        if (!ok) {
          setStatusMessage(`❌ Insufficient Funds! You need $${cost.toLocaleString()} (Balance: $${driverCash.toLocaleString()}). Complete missions to earn cash.`);
          return;
        }
      }
      setStatusMessage(`✅ Installed paid upgrade! -$${cost.toLocaleString()} cash deducted.`);
    } else {
      setStatusMessage(`✅ Installed complimentary upgrade for FREE! ($0)`);
    }

    onUpdateUpgrades({
      ...upgrades,
      [key]: value,
    });
  };

  const neonColors = [
    { label: 'Off', value: '#000000' },
    { label: 'Cyan Pulse', value: '#06b6d4' },
    { label: 'Cyber Pink', value: '#ec4899' },
    { label: 'Amber Gold', value: '#f59e0b' },
    { label: 'Acid Emerald', value: '#10b981' },
    { label: 'Electric Violet', value: '#8b5cf6' },
  ];

  const caliperColors = [
    { label: 'Factory Silver', value: '#94a3b8' },
    { label: 'Brembo Red', value: '#dc2626' },
    { label: 'Acid Yellow', value: '#eab308' },
    { label: 'Electric Blue', value: '#2563eb' },
    { label: 'Neon Cyan', value: '#06b6d4' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">Apex Tuning Garage & Workshop</h2>
                {isNearGarage ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    SERVICE BAY ACTIVE
                  </span>
                ) : (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    OUTSIDE GARAGE
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Garage Location: <span className="text-zinc-200 font-mono">X: 45, Z: -42</span> &bull; Free mechanical upgrades & paid race packages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Cash Balance Display */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 font-mono font-black text-xs sm:text-sm">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>${driverCash.toLocaleString()}</span>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Garage Proximity Notice Banner */}
        {!isNearGarage && (
          <div className="mt-3 p-3 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                To install upgrades, you need to go to the Apex Garage service bay at <strong>[X: 45, Z: -42]</strong>.
              </span>
            </div>
            {onTeleportToGarage && (
              <button
                onClick={() => {
                  onTeleportToGarage();
                  setStatusMessage('🚀 Teleported directly into the Apex Garage Service Bay!');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition cursor-pointer shrink-0 shadow-sm flex items-center gap-1"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Fast-Travel to Garage</span>
              </button>
            )}
          </div>
        )}

        {/* Status Toast Message */}
        {statusMessage && (
          <div className="mt-2 px-3 py-2 bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
            <span>{statusMessage}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-zinc-400 hover:text-white text-xs cursor-pointer ml-2"
            >
              &times;
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-3 pb-2 border-b border-zinc-800/60">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'fleet'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Vehicle Fleet ({Object.keys(CAR_PRESETS).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('upgrades')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'upgrades'
                ? 'bg-cyan-500 text-zinc-950 shadow-md'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Workshop Upgrades (Free & Paid)</span>
          </button>

          <button
            onClick={() => setActiveTab('visuals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'visuals'
                ? 'bg-pink-500 text-zinc-950 shadow-md'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Paint & Styling</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1 custom-scrollbar">
          {/* TAB 1: FLEET SELECTION */}
          {activeTab === 'fleet' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Select Active Vehicle</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.values(CAR_PRESETS).map(car => {
                    const isSelected = car.id === currentCarId;
                    return (
                      <div
                        key={car.id}
                        onClick={() => onSelectCar(car.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/10'
                            : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{car.category}</span>
                            <h4 className="text-sm font-black text-white">{car.name}</h4>
                          </div>
                          {isSelected && (
                            <span className="p-1 rounded-lg bg-amber-500 text-zinc-950">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 my-2 text-[11px] text-zinc-400">
                          <div className="flex justify-between">
                            <span>0-100 KM/H:</span>
                            <span className="font-mono font-bold text-zinc-200">{car.acceleration}s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Drivetrain:</span>
                            <span className="font-mono font-bold text-zinc-200">{car.driveType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Top Speed:</span>
                            <span className="font-mono font-bold text-zinc-200">{car.topSpeedKmh} KM/H</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERFORMANCE UPGRADES */}
          {activeTab === 'upgrades' && (
            <div className="space-y-5">
              <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-2xl flex flex-wrap items-center justify-between text-xs gap-2">
                <span className="text-cyan-300 font-bold">
                  Vehicle on Lift: <span className="text-white font-black">{currentConfig.name}</span>
                </span>
                <span className="text-emerald-400 text-[11px] font-bold">
                  ✨ Steering, Drive Chassis, Transmission, and Suspension are 100% FREE!
                </span>
              </div>

              {/* ---------------- SECTION A: 100% FREE UPGRADES ---------------- */}
              <div className="border border-emerald-500/40 rounded-2xl p-4 bg-emerald-950/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black">
                      COMPLIMENTARY WORKSHOP SPEC
                    </span>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Free Mechanical Upgrades ($0 Cost)
                    </h4>
                  </div>
                  <span className="text-[11px] text-emerald-300 font-mono font-bold">ALL 4 CATEGORIES FREE</span>
                </div>

                {/* 1. Free Steering Improvement */}
                <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-xs font-black text-white block">Steering Improvement & Rack Ratio</span>
                        <span className="text-[10px] text-zinc-400">Sharper turn-in response and extended drift angle lock</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      FREE UPGRADE
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { stage: 0, title: 'Stock Steering', desc: 'Standard factory turn ratio' },
                      { stage: 1, title: 'Sport Quick-Ratio', desc: '+25% Responsiveness & return centering' },
                      { stage: 2, title: 'Pro Drift Angle Kit', desc: '60° Steering lock & counter-steer assist' },
                    ].map(opt => (
                      <button
                        key={opt.stage}
                        onClick={() => applyUpgrade('steeringImprovement', opt.stage as 0 | 1 | 2, 0, true)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          (upgrades.steeringImprovement || 0) === opt.stage
                            ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-sm'
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">{opt.title}</span>
                          <span className="text-[10px] font-bold text-emerald-400 font-mono">$0</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Free Drive Chassis Bracing */}
                <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-xs font-black text-white block">Drive Chassis Bracing & Torsional Rigidity</span>
                        <span className="text-[10px] text-zinc-400">Eliminates chassis flex, roll oscillation, and high-speed instability</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      FREE UPGRADE
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { stage: 0, title: 'Stock Monocoque', desc: 'Factory unbraced chassis' },
                      { stage: 1, title: 'Strut Tower Braces', desc: 'Front/rear aluminum bracing (-40% flex)' },
                      { stage: 2, title: 'Full Tubular Cage', desc: 'Rollcage & seam-welded underbody chassis' },
                    ].map(opt => (
                      <button
                        key={opt.stage}
                        onClick={() => applyUpgrade('driveChassis', opt.stage as 0 | 1 | 2, 0, true)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          (upgrades.driveChassis || 0) === opt.stage
                            ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-sm'
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">{opt.title}</span>
                          <span className="text-[10px] font-bold text-emerald-400 font-mono">$0</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Free Suspension & Coilovers */}
                <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-xs font-black text-white block">Suspension Stiffness & Anti-Roll Bars</span>
                        <span className="text-[10px] text-zinc-400">Lowers center of mass and keeps all four wheels planted without bouncing</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      FREE UPGRADE
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { stage: 0, title: 'Stock Ride Height', desc: 'Factory dampening' },
                      { stage: 1, title: 'Sport Coilovers', desc: '-30mm Ride, stiffer springs' },
                      { stage: 2, title: 'Track Spec', desc: '-55mm, high roll resistance' },
                      { stage: 3, title: 'Slammed Stance', desc: 'Ultra-low aerodynamic profile' },
                    ].map(opt => (
                      <button
                        key={opt.stage}
                        onClick={() => applyUpgrade('suspensionStage', opt.stage as 0 | 1 | 2 | 3, 0, true)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          upgrades.suspensionStage === opt.stage
                            ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-sm'
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">{opt.title}</span>
                          <span className="text-[10px] font-bold text-emerald-400 font-mono">$0</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ---------------- SECTION B: PAID PERFORMANCE UPGRADES ---------------- */}
              <div className="border border-zinc-800 rounded-2xl p-4 bg-zinc-900/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-black">
                      PAID RACE UPGRADES
                    </span>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Premium Upgrades (Requires In-Game Cash)
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Wallet: ${driverCash.toLocaleString()}
                  </span>
                </div>

                {/* 1. Paid Transmission & Gearing */}
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <div>
                        <span className="text-xs font-black text-white block">Performance Transmission & Gearbox</span>
                        <span className="text-[10px] text-zinc-400">Paid upgrade: Faster shift times, closer gear ratios, and launch control</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { stage: 0, title: 'Stock OEM', cost: 0, desc: 'Factory H-Pattern' },
                      { stage: 1, title: 'Sport Close-Ratio', cost: 3800, desc: '120ms quick shifts' },
                      { stage: 2, title: 'Race Sequential', cost: 8500, desc: '50ms dogbox flat-shifts' },
                      { stage: 3, title: 'Dual-Clutch Paddle', cost: 14000, desc: '20ms instant paddle shifts' },
                    ].map(opt => (
                      <button
                        key={opt.stage}
                        onClick={() => applyUpgrade('transmission', opt.stage as 0 | 1 | 2 | 3, opt.cost, opt.cost === 0)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          (upgrades.transmission || 0) === opt.stage
                            ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm'
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">{opt.title}</span>
                          <span className={`text-[10px] font-mono font-black ${opt.cost === 0 ? 'text-zinc-500' : 'text-cyan-400'}`}>
                            {opt.cost === 0 ? 'Stock' : `$${opt.cost.toLocaleString()}`}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Drivetrain Conversion & Differentials */}
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cog className="w-4 h-4 text-amber-400" />
                      <div>
                        <span className="text-xs font-black text-white block">Drivetrain Conversion & Differentials</span>
                        <span className="text-[10px] text-zinc-400">Swap drive wheels and install drift or race limited-slip differentials</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'stock', title: `Stock (${currentConfig.driveType})`, cost: 0, desc: 'Factory configuration' },
                      { id: 'rwd', title: 'Pro Drift RWD', cost: 4500, desc: '100% Rear drive + 2-Way locked diff' },
                      { id: 'awd', title: 'Race ATTESA AWD', cost: 7500, desc: '4-Wheel launch grip & vectoring' },
                      { id: 'fwd', title: 'Touge FWD Spec', cost: 3200, desc: 'Lightweight front pull + Helical LSD' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => applyUpgrade('drivetrainType', opt.id as any, opt.cost, opt.cost === 0)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          (upgrades.drivetrainType || 'stock') === opt.id
                            ? 'bg-amber-500/20 border-amber-400 text-white shadow-sm'
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">{opt.title}</span>
                          <span className={`text-[10px] font-mono font-black ${opt.cost === 0 ? 'text-zinc-500' : 'text-amber-400'}`}>
                            {opt.cost === 0 ? 'Stock' : `$${opt.cost.toLocaleString()}`}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Turbocharger & Forced Induction Kits */}
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-sky-400" />
                      <div>
                        <span className="text-xs font-black text-white block">Turbocharger Kits & Anti-Lag (ALS)</span>
                        <span className="text-[10px] text-zinc-400">High-boost spooling, blow-off valve flutter, and anti-lag pops</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { stage: 0, title: 'Stock NA/Turbo', cost: 0, desc: 'Factory boost curve' },
                      { stage: 1, title: 'Single Ball-Bearing', cost: 4200, desc: '+0.9 bar, rapid spool at 2,400 RPM' },
                      { stage: 2, title: 'Twin-Turbo High-Flow', cost: 9000, desc: '+1.5 bar, massive top-end power' },
                      { stage: 3, title: 'Pro Anti-Lag ALS', cost: 16500, desc: '+2.2 bar continuous boost + ALS backfires' },
                    ].map(opt => (
                      <button
                        key={opt.stage}
                        onClick={() => applyUpgrade('turboStage', opt.stage as 0 | 1 | 2 | 3, opt.cost, opt.cost === 0)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          (upgrades.turboStage || 0) === opt.stage
                            ? 'bg-sky-500/20 border-sky-400 text-white shadow-sm'
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">{opt.title}</span>
                          <span className={`text-[10px] font-mono font-black ${opt.cost === 0 ? 'text-zinc-500' : 'text-sky-400'}`}>
                            {opt.cost === 0 ? 'Stock' : `$${opt.cost.toLocaleString()}`}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Crate Engine Swaps */}
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <div>
                        <span className="text-xs font-black text-white block">Crate Engine Swaps</span>
                        <span className="text-[10px] text-zinc-400">Complete crate motor replacement with higher RPM redlines and distinct notes</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { stage: 0, title: 'Factory Engine', cost: 0, desc: 'Original chassis motor' },
                      { stage: 1, title: '2.0L Turbo High-Cam', cost: 6500, desc: '8,500 RPM, -40kg, +20% power' },
                      { stage: 2, title: '3.8L Twin-Turbo VR38', cost: 14000, desc: '8,800 RPM monster dyno torque' },
                      { stage: 3, title: '6.5L Quad-Cam V12', cost: 25000, desc: '11,000 RPM Italian supercar wail (+75%)' },
                    ].map(opt => (
                      <button
                        key={opt.stage}
                        onClick={() => applyUpgrade('engineSwap', opt.stage as 0 | 1 | 2 | 3, opt.cost, opt.cost === 0)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          (upgrades.engineSwap || 0) === opt.stage
                            ? 'bg-orange-500/20 border-orange-400 text-white shadow-sm'
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">{opt.title}</span>
                          <span className={`text-[10px] font-mono font-black ${opt.cost === 0 ? 'text-zinc-500' : 'text-orange-400'}`}>
                            {opt.cost === 0 ? 'Stock' : `$${opt.cost.toLocaleString()}`}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Performance Exhaust & Anti-Lag */}
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-xs font-black text-white block">Exhaust System & Flame Spitters</span>
                        <span className="text-[10px] text-zinc-400">Titanium piping, reduced backpressure, and backfire flame bursts</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { stage: 0, title: 'Factory Exhaust', cost: 0, desc: 'OEM catalytic & muffler' },
                      { stage: 1, title: 'Titanium Cat-Back', cost: 2800, desc: '-15kg, deeper tone & pops' },
                      { stage: 2, title: 'Straight-Pipe Anti-Lag', cost: 6200, desc: '-30kg, loud backfires & flames' },
                    ].map(opt => (
                      <button
                        key={opt.stage}
                        onClick={() => applyUpgrade('exhaustStage', opt.stage as 0 | 1 | 2, opt.cost, opt.cost === 0)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          (upgrades.exhaustStage || 0) === opt.stage
                            ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-sm'
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">{opt.title}</span>
                          <span className={`text-[10px] font-mono font-black ${opt.cost === 0 ? 'text-zinc-500' : 'text-emerald-400'}`}>
                            {opt.cost === 0 ? 'Stock' : `$${opt.cost.toLocaleString()}`}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Engine Stage & ECU Remap */}
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-400" />
                      <div>
                        <span className="text-xs font-black text-white block">Engine Stage & ECU Remap</span>
                        <span className="text-[10px] text-zinc-400">Boosts horsepower and top-end RPM acceleration</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { stage: 0, title: 'Stock OEM', cost: 0, desc: 'Factory tune' },
                      { stage: 1, title: 'Stage 1 ECU', cost: 2500, desc: '+15% Torque' },
                      { stage: 2, title: 'Stage 2 Turbo', cost: 6000, desc: '+32% Boost' },
                      { stage: 3, title: 'Stage 3 Forged', cost: 12500, desc: '+55% Race Power' },
                    ].map(opt => (
                      <button
                        key={opt.stage}
                        onClick={() => applyUpgrade('engineStage', opt.stage as 0 | 1 | 2 | 3, opt.cost, opt.cost === 0)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          upgrades.engineStage === opt.stage
                            ? 'bg-rose-500/20 border-rose-500 text-white shadow-sm'
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">{opt.title}</span>
                          <span className={`text-[10px] font-mono font-black ${opt.cost === 0 ? 'text-zinc-500' : 'text-rose-400'}`}>
                            {opt.cost === 0 ? 'Stock' : `$${opt.cost.toLocaleString()}`}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tire Compound & Grip */}
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Disc className="w-4 h-4 text-cyan-400" />
                      <div>
                        <span className="text-xs font-black text-white block">Tire Compound & Grip Tuning</span>
                        <span className="text-[10px] text-zinc-400">Pacejka lateral friction and drift score multipliers</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'stock', title: 'Street Stock', cost: 0, desc: 'Balanced grip' },
                      { id: 'sport', title: 'Sport Radial', cost: 1800, desc: '+18% Lateral grip' },
                      { id: 'race_slicks', title: 'Race Slicks', cost: 4500, desc: '+42% Track traction' },
                      { id: 'drift_pro', title: 'Drift Pro', cost: 3500, desc: '2.5x Drift Score' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => applyUpgrade('tireCompound', opt.id as TireCompound, opt.cost, opt.cost === 0)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          upgrades.tireCompound === opt.id
                            ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-sm'
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">{opt.title}</span>
                          <span className={`text-[10px] font-mono font-black ${opt.cost === 0 ? 'text-zinc-500' : 'text-cyan-400'}`}>
                            {opt.cost === 0 ? 'Stock' : `$${opt.cost.toLocaleString()}`}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nitro NOS & Weight Reduction */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Nitro */}
                  <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-black text-white">Nitro NOS Bottle Kit</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { stage: 0, title: 'Stock', cost: 0, desc: '100 NOS' },
                        { stage: 1, title: 'Stage 1', cost: 2200, desc: '150 NOS' },
                        { stage: 2, title: 'Dual Stage', cost: 5000, desc: '200 NOS' },
                      ].map(opt => (
                        <button
                          key={opt.stage}
                          onClick={() => applyUpgrade('nitroStage', opt.stage as 0 | 1 | 2, opt.cost, opt.cost === 0)}
                          className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                            upgrades.nitroStage === opt.stage
                              ? 'bg-amber-500/20 border-amber-500 text-white'
                              : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white">{opt.title}</span>
                          </div>
                          <span className="text-[9px] font-mono font-black text-amber-400 block">
                            {opt.cost === 0 ? 'Stock' : `$${opt.cost}`}
                          </span>
                          <span className="text-[9px] text-zinc-400">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weight Reduction */}
                  <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Feather className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-black text-white">Weight Reduction</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { stage: 0, title: 'OEM Curb', cost: 0, desc: 'Factory' },
                        { stage: 1, title: 'Strip', cost: 3000, desc: '-120 kg' },
                        { stage: 2, title: 'Dry Carbon', cost: 8500, desc: '-260 kg' },
                      ].map(opt => (
                        <button
                          key={opt.stage}
                          onClick={() => applyUpgrade('weightReduction', opt.stage as 0 | 1 | 2, opt.cost, opt.cost === 0)}
                          className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                            upgrades.weightReduction === opt.stage
                              ? 'bg-purple-500/20 border-purple-500 text-white'
                              : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white">{opt.title}</span>
                          </div>
                          <span className="text-[9px] font-mono font-black text-purple-400 block">
                            {opt.cost === 0 ? 'Stock' : `$${opt.cost}`}
                          </span>
                          <span className="text-[9px] text-zinc-400">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VISUALS & STYLING */}
          {activeTab === 'visuals' && (
            <div className="space-y-6">
              {/* Automotive Paint Swatches */}
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-xs font-black text-white block">High-Gloss Automotive Finish</span>
                    <span className="text-[11px] text-zinc-400">Multi-coat reflective clearcoat finish</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {currentConfig.colors.map(colorHex => {
                    const isSelected = currentColor.toLowerCase() === colorHex.toLowerCase();
                    return (
                      <button
                        key={colorHex}
                        onClick={() => onSelectColor(colorHex)}
                        className={`h-11 w-11 rounded-2xl transition-transform cursor-pointer border-2 relative flex items-center justify-center ${
                          isSelected ? 'border-white scale-110 shadow-lg shadow-black/50' : 'border-zinc-700 hover:scale-105'
                        }`}
                        style={{ backgroundColor: colorHex }}
                        title={colorHex}
                      >
                        {isSelected && <Check className="w-5 h-5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Neon Underglow Kit */}
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-pink-400" />
                  <div>
                    <span className="text-xs font-black text-white block">Chassis Neon Underglow Kit</span>
                    <span className="text-[11px] text-zinc-400">Vibrant ground-effect illumination tubes</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {neonColors.map(neon => {
                    const isSelected = (upgrades.neonUnderglow || '#000000').toLowerCase() === neon.value.toLowerCase();
                    return (
                      <button
                        key={neon.value}
                        onClick={() => onUpdateUpgrades({ ...upgrades, neonUnderglow: neon.value })}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? 'bg-zinc-800 border-white text-white shadow-md'
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-zinc-700"
                          style={{ backgroundColor: neon.value === '#000000' ? '#27272a' : neon.value }}
                        />
                        <span className="text-[10px] font-bold">{neon.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brake Calipers Color & Carbon Fiber Panels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Caliper Color */}
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                  <span className="text-xs font-black text-white block mb-2">Brembo Brake Calipers</span>
                  <div className="grid grid-cols-5 gap-2">
                    {caliperColors.map(cal => {
                      const isSelected = (upgrades.caliperColor || '#dc2626').toLowerCase() === cal.value.toLowerCase();
                      return (
                        <button
                          key={cal.value}
                          onClick={() => onUpdateUpgrades({ ...upgrades, caliperColor: cal.value })}
                          className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                            isSelected ? 'bg-zinc-800 border-white' : 'bg-zinc-950/60 border-zinc-800'
                          }`}
                          title={cal.label}
                        >
                          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: cal.value }} />
                          <span className="text-[9px] font-bold text-zinc-300 truncate w-full">{cal.label.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Carbon Fiber Package Toggle */}
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-white block">Exposed Carbon Fiber Bodywork</span>
                    <span className="text-[10px] text-zinc-400">Lightweight woven carbon on hood & aero wing</span>
                  </div>
                  <button
                    onClick={() => onUpdateUpgrades({ ...upgrades, carbonParts: !upgrades.carbonParts })}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                      upgrades.carbonParts
                        ? 'bg-amber-500 text-zinc-950 shadow-md'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {upgrades.carbonParts ? 'ACTIVE' : 'STOCK'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Transmission Mode Settings Bar */}
          <div className="flex items-center justify-between p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
            <div>
              <span className="text-xs font-black text-white block">Transmission Gearbox Mode</span>
              <span className="text-[11px] text-zinc-400">
                {isAutomatic
                  ? 'Automatic Transmission (Smooth auto-shifting with kickdown)'
                  : 'Manual Transmission (Use Q / E to shift gears)'}
              </span>
            </div>
            <button
              onClick={onToggleTransmission}
              className={`px-5 py-2 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer ${
                isAutomatic
                  ? 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-sm'
                  : 'bg-amber-600 text-white hover:bg-amber-500 shadow-sm'
              }`}
            >
              {isAutomatic ? 'Automatic (AT)' : 'Manual (MT)'}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-400 hidden sm:inline">
            Active: <span className="text-white">{currentConfig.name}</span> &bull; {currentConfig.driveType}
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-lg transition active:scale-95 cursor-pointer"
          >
            Drive Vehicle Now
          </button>
        </div>
      </div>
    </div>
  );
};
