import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameEngine } from './game/GameEngine';
import {
  CameraView,
  DriverProfile,
  GraphicsQuality,
  Mission,
  MissionProgress,
  TaskItem,
  TimeOfDay,
  VehicleState,
  VehicleUpgrades,
  VisualTheme,
} from './game/types';
import { CAR_PRESETS } from './game/cars';
import { INITIAL_TASKS } from './game/missions';
import { GuideMode } from './game/effects';
import { HUD } from './components/HUD';
import { GarageModal } from './components/GarageModal';
import { MissionModal } from './components/MissionModal';
import { MapModal } from './components/MapModal';
import { TelemetryModal } from './components/TelemetryModal';
import { TouchControls } from './components/TouchControls';
import { DriverAuthModal } from './components/DriverAuthModal';
import { awardDriverXp, getStoredDriverProfile, saveDriverProfile } from './game/driverProfile';
import { soundEngine } from './game/audio';
import { CheckCircle2, Sparkles, Volume2 } from 'lucide-react';

const DEFAULT_UPGRADES: VehicleUpgrades = {
  steeringImprovement: 0,
  driveChassis: 0,
  suspensionStage: 0,
  transmission: 0,
  drivetrainType: 'stock',
  turboStage: 0,
  engineSwap: 0,
  exhaustStage: 0,
  engineStage: 0,
  tireCompound: 'stock',
  nitroStage: 0,
  weightReduction: 0,
  brakesStage: 0,
  neonColor: '#000000',
  neonUnderglow: '#000000',
  carbonParts: false,
  caliperColor: '#dc2626',
};

const TASKS_STORAGE_KEY = 'apex_driver_tasks_v2';

function getStoredTasks(): TaskItem[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Could not read stored tasks:', e);
  }
  return INITIAL_TASKS;
}

function saveStoredTasks(tasks: TaskItem[]) {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.warn('Could not save tasks:', e);
  }
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Driver Account & Profile State
  const [driverProfile, setDriverProfile] = useState<DriverProfile>(() => getStoredDriverProfile());
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>('balanced');
  const [fps, setFps] = useState<number>(60);

  // Tasks State
  const [tasks, setTasks] = useState<TaskItem[]>(() => getStoredTasks());
  const [taskNotification, setTaskNotification] = useState<{ title: string; rewardCash: number; rewardXp: number } | null>(null);

  // Live vehicle telemetry state
  const [vehicleState, setVehicleState] = useState<VehicleState>({
    speedKmh: 0,
    speedMph: 0,
    rpm: 900,
    gear: 1,
    isNeutral: false,
    isReverse: false,
    throttle: 0,
    brake: 0,
    handbrake: false,
    steerAngle: 0,
    driftAngle: 0,
    isDrifting: false,
    driftScore: 0,
    driftMultiplier: 1,
    boostPressure: 0,
    nitro: 100,
    maxNitro: 100,
    isBoosting: false,
    damage: 0,
    wheelSlip: [0, 0, 0, 0],
    suspensionCompression: [0, 0, 0, 0],
    headlightsOn: false,
    isAirborne: false,
    isNearGarage: false,
    carPosition: [0, 0.45, 0],
    carRotationY: 0,
  });

  const [missionProgress, setMissionProgress] = useState<MissionProgress | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraView>('chase');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [visualTheme, setVisualTheme] = useState<VisualTheme>('photoreal');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasInteractedAudio, setHasInteractedAudio] = useState<boolean>(false);

  // Modals state
  const [isGarageOpen, setIsGarageOpen] = useState<boolean>(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState<boolean>(false);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState<boolean>(false);
  const [guideMode, setGuideMode] = useState<GuideMode>('mission');
  const [isRacingLineEnabled, setIsRacingLineEnabled] = useState<boolean>(true);
  const [currentCarId, setCurrentCarId] = useState<string>('apex_gt');
  const [currentColor, setCurrentColor] = useState<string>(CAR_PRESETS.apex_gt.defaultColor);
  const [currentUpgrades, setCurrentUpgrades] = useState<VehicleUpgrades>(DEFAULT_UPGRADES);
  const [isAutomatic, setIsAutomatic] = useState<boolean>(true);
  const [completionResult, setCompletionResult] = useState<{ progress: MissionProgress; mission: Mission } | null>(null);

  // Helper to complete task
  const completeTask = (taskId: string) => {
    setTasks((prevTasks) => {
      const idx = prevTasks.findIndex((t) => t.id === taskId);
      if (idx === -1 || prevTasks[idx].completed) return prevTasks;

      const targetTask = prevTasks[idx];
      const updated = [...prevTasks];
      updated[idx] = {
        ...targetTask,
        completed: true,
        progress: targetTask.target,
      };

      saveStoredTasks(updated);

      // Award Cash and XP
      setDriverProfile((prev) => {
        const withXp = awardDriverXp(prev, targetTask.rewardXp);
        const withCash = {
          ...withXp,
          cash: (withXp.cash || 0) + targetTask.rewardCash,
          stats: {
            ...withXp.stats,
            tasksCompleted: (withXp.stats.tasksCompleted || 0) + 1,
          },
        };
        saveDriverProfile(withCash);
        return withCash;
      });

      // Show toast
      setTaskNotification({
        title: targetTask.title,
        rewardCash: targetTask.rewardCash,
        rewardXp: targetTask.rewardXp,
      });
      setTimeout(() => {
        setTaskNotification(null);
      }, 4500);

      return updated;
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    const engine = new GameEngine(containerRef.current, currentCarId);
    engineRef.current = engine;

    engine.setOnStateUpdate((state, mission, currentFps) => {
      setVehicleState(state);
      setMissionProgress(mission);
      if (currentFps !== undefined) {
        setFps(currentFps);
      }
      setCameraMode(engine.cameraMode);

      // Dynamic task progress checks
      if (state.isNearGarage) {
        completeTask('task_garage_visit');
      }
      if (state.speedKmh >= 210) {
        completeTask('task_highway_speed');
      }
      if (state.driftScore >= 3500) {
        completeTask('task_drift_chain');
      }
    });

    engine.setOnMissionFinished((progress, mission) => {
      setCompletionResult({ progress, mission });
      if (progress.status === 'completed') {
        const medal = progress.medal || 'bronze';
        const earnedCash = mission.cashReward ? mission.cashReward[medal] : 2500;
        const xpReward = progress.medal === 'gold' ? 350 : progress.medal === 'silver' ? 220 : 120;
        setDriverProfile((prev) => {
          const updated = awardDriverXp(prev, xpReward);
          updated.cash = (updated.cash || 0) + earnedCash;
          updated.stats.missionsCompleted += 1;
          if (progress.medal === 'gold') updated.stats.goldMedals += 1;
          saveDriverProfile(updated);
          return { ...updated };
        });
      }
    });

    engine.setOnRivalDefeated((tier, streak) => {
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.5 },
      });

      setDriverProfile((prev) => {
        const updated = awardDriverXp(prev, tier.rewardXp);
        updated.cash = (updated.cash || 0) + tier.rewardCash;
        updated.stats.missionsCompleted += 1;
        saveDriverProfile(updated);
        return { ...updated };
      });

      setTaskNotification({
        title: `🏆 RIVAL DEFEATED: ${tier.name}! (Streak: ${streak})`,
        rewardCash: tier.rewardCash,
        rewardXp: tier.rewardXp,
      });

      setTimeout(() => {
        setTaskNotification(null);
      }, 5500);
    });

    engine.setOnCarSwitched((carId) => {
      setCurrentCarId(carId);
      const preset = CAR_PRESETS[carId];
      if (preset) {
        setCurrentColor(preset.defaultColor);
      }
      if (engine.carUpgrades[carId]) {
        setCurrentUpgrades(engine.carUpgrades[carId]);
      }
    });

    engine.start();

    // Hotkey listener for Garage, Map, and Telemetry
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.code === 'KeyG' && !isGarageOpen && !isMissionsOpen && !isMapOpen && !isAuthOpen && !isTelemetryOpen) {
        setIsGarageOpen(true);
      }
      if (e.code === 'KeyN' && !isGarageOpen && !isMissionsOpen && !isMapOpen && !isAuthOpen && !isTelemetryOpen) {
        setIsMapOpen(true);
      }
      if (e.code === 'KeyT' && !isGarageOpen && !isMissionsOpen && !isMapOpen && !isAuthOpen) {
        setIsTelemetryOpen((prev) => !prev);
      }
      if (e.code === 'Escape') {
        setIsTelemetryOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      engine.destroy();
    };
  }, []);

  // Handle first user interaction to unlock Web Audio API
  const handleUserInteract = () => {
    if (!hasInteractedAudio) {
      soundEngine.init();
      soundEngine.resume();
      setHasInteractedAudio(true);
    }
  };

  const handleCycleCamera = () => {
    handleUserInteract();
    if (engineRef.current) {
      engineRef.current.cycleCamera();
      setCameraMode(engineRef.current.cameraMode);
    }
  };

  const handleCycleTime = () => {
    handleUserInteract();
    if (engineRef.current) {
      const times: TimeOfDay[] = ['day', 'sunset', 'night', 'dawn'];
      const next = times[(times.indexOf(timeOfDay) + 1) % times.length];
      engineRef.current.setTimeOfDay(next);
      setTimeOfDay(next);
    }
  };

  const handleSelectTime = (tod: TimeOfDay) => {
    handleUserInteract();
    if (engineRef.current) {
      engineRef.current.setTimeOfDay(tod);
      setTimeOfDay(tod);
    }
  };

  const handleSelectTheme = (theme: VisualTheme) => {
    handleUserInteract();
    if (engineRef.current) {
      engineRef.current.setVisualTheme(theme);
      setVisualTheme(theme);
    }
  };

  const handleCycleTheme = () => {
    handleUserInteract();
    if (engineRef.current) {
      const themes: VisualTheme[] = ['photoreal', 'cyberpunk', 'tokyo_drift', 'desert_run', 'synthwave'];
      const next = themes[(themes.indexOf(visualTheme) + 1) % themes.length];
      engineRef.current.setVisualTheme(next);
      setVisualTheme(next);
    }
  };

  const handleResetCar = () => {
    handleUserInteract();
    engineRef.current?.resetCar();
  };

  const handleToggleMute = () => {
    handleUserInteract();
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleSelectCar = (carId: string) => {
    handleUserInteract();
    setCurrentCarId(carId);
    const preset = CAR_PRESETS[carId];
    if (preset) {
      setCurrentColor(preset.defaultColor);
      engineRef.current?.switchCar(carId, preset.defaultColor);
      if (engineRef.current?.carUpgrades[carId]) {
        setCurrentUpgrades(engineRef.current.carUpgrades[carId]);
      }
    }
  };

  const handleSelectColor = (colorHex: string) => {
    setCurrentColor(colorHex);
    engineRef.current?.setCarColor(colorHex);
  };

  const handleUpdateUpgrades = (newUpgrades: VehicleUpgrades) => {
    setCurrentUpgrades(newUpgrades);
    engineRef.current?.setCarUpgrades(currentCarId, newUpgrades);

    // Evaluate upgrade tasks
    if (newUpgrades.steeringImprovement && newUpgrades.steeringImprovement > 0) {
      completeTask('task_free_steering');
    }
    if (newUpgrades.driveChassis && newUpgrades.driveChassis > 0) {
      completeTask('task_free_chassis');
    }
    if (newUpgrades.transmission && newUpgrades.transmission > 0) {
      completeTask('task_free_transmission');
    }
    if (newUpgrades.turboStage && newUpgrades.turboStage > 0) {
      completeTask('task_turbo_kit');
    }
    if (newUpgrades.drivetrainType && newUpgrades.drivetrainType !== 'stock') {
      completeTask('task_drivetrain_swap');
    }
    if (newUpgrades.engineStage && newUpgrades.engineStage > 0) {
      completeTask('task_paid_engine');
    }
  };

  const handleDeductCash = (amount: number): boolean => {
    const current = driverProfile.cash || 0;
    if (current < amount) return false;

    setDriverProfile((prev) => {
      const updated = {
        ...prev,
        cash: (prev.cash || 0) - amount,
      };
      saveDriverProfile(updated);
      return updated;
    });
    return true;
  };

  const handleToggleTransmission = () => {
    if (engineRef.current) {
      engineRef.current.toggleTransmission();
      setIsAutomatic(!isAutomatic);
    }
  };

  const handleStartMission = (missionId: string) => {
    handleUserInteract();
    engineRef.current?.startMission(missionId);
    setIsMissionsOpen(false);
  };

  const handleCycleGraphics = () => {
    handleUserInteract();
    const next: GraphicsQuality =
      graphicsQuality === 'balanced' ? 'performance' :
      graphicsQuality === 'performance' ? 'ultra' : 'balanced';
    setGraphicsQuality(next);
    engineRef.current?.setGraphicsQuality(next);
  };

  const handleAbandonMission = () => {
    engineRef.current?.abandonMission();
    setMissionProgress(null);
    setIsMissionsOpen(false);
  };

  const handleToggleRacingLine = () => {
    if (engineRef.current) {
      const mode = engineRef.current.toggleRacingLine();
      setGuideMode(mode);
      setIsRacingLineEnabled(mode !== 'off');
    }
  };

  return (
    <main
      id="apex-driving-app"
      className="relative w-screen h-screen overflow-hidden bg-black select-none"
      onClick={handleUserInteract}
    >
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} id="canvas-container" className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Audio Enable Prompt Banner on fresh load */}
      {!hasInteractedAudio && (
        <div className="pointer-events-none absolute top-28 left-1/2 -translate-x-1/2 bg-zinc-950/90 border border-zinc-700 text-zinc-200 text-xs font-semibold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md animate-pulse z-20">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <span>Click anywhere or press W to start realistic sound effects</span>
        </div>
      )}

      {/* Task Completion Floating Toast */}
      {taskNotification && (
        <div className="pointer-events-none absolute top-20 right-4 z-40 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="bg-zinc-950/95 border-2 border-emerald-500/80 rounded-2xl p-4 shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center gap-3 backdrop-blur-md">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                Driver Task Completed!
              </span>
              <h4 className="text-sm font-black text-white">{taskNotification.title}</h4>
              <div className="flex items-center gap-3 mt-1 text-xs font-mono font-bold">
                <span className="text-yellow-400">+${taskNotification.rewardCash.toLocaleString()} Cash</span>
                <span className="text-cyan-400">+{taskNotification.rewardXp} XP</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HUD Telemetry and Instrument Cluster */}
      <HUD
        state={vehicleState}
        missionProgress={missionProgress}
        cameraMode={cameraMode}
        timeOfDay={timeOfDay}
        visualTheme={visualTheme}
        graphicsQuality={graphicsQuality}
        fps={fps}
        currentCarId={currentCarId}
        driverProfile={driverProfile}
        onOpenAuth={() => setIsAuthOpen(true)}
        onCycleGraphics={handleCycleGraphics}
        onSelectCar={handleSelectCar}
        onSelectTime={handleSelectTime}
        onSelectTheme={handleSelectTheme}
        onCycleCamera={handleCycleCamera}
        onSelectCamera={(mode) => {
          handleUserInteract();
          engineRef.current?.setCameraMode(mode);
          setCameraMode(mode);
        }}
        onRecenterCamera={() => {
          handleUserInteract();
          engineRef.current?.recenterCurrentCamera();
        }}
        onLookBack={() => {
          handleUserInteract();
          engineRef.current?.lookBack();
        }}
        onCycleTime={handleCycleTime}
        onCycleTheme={handleCycleTheme}
        onResetCar={handleResetCar}
        onOpenGarage={() => setIsGarageOpen(true)}
        onOpenMissions={() => setIsMissionsOpen(true)}
        onOpenMap={() => setIsMapOpen(true)}
        onOpenTelemetry={() => setIsTelemetryOpen(true)}
        onRotateOrbit={(az, pol) => engineRef.current?.rotateOrbit(az, pol)}
        onSetOrbitAngle={(preset) => engineRef.current?.setOrbitViewAngle(preset)}
        onFastTravelToGarage={() => engineRef.current?.teleportToGarage()}
        onTeleportToRival={() => engineRef.current?.teleportToRival()}
        onAdvanceRival={() => engineRef.current?.advanceRivalTier()}
        isRacingLineEnabled={isRacingLineEnabled}
        guideMode={guideMode}
        onToggleRacingLine={handleToggleRacingLine}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Driver License & Sign-In Modal */}
      <DriverAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        driverProfile={driverProfile}
        onUpdateProfile={(p) => setDriverProfile(p)}
      />

      {/* On-Screen Touch Controls for Mobile / Tablets */}
      <TouchControls onInput={(input) => engineRef.current?.setInput(input)} />

      {/* Garage Vehicle Customizer & Upgrades Modal */}
      <GarageModal
        isOpen={isGarageOpen}
        onClose={() => setIsGarageOpen(false)}
        currentCarId={currentCarId}
        currentColor={currentColor}
        onSelectCar={handleSelectCar}
        onSelectColor={handleSelectColor}
        isAutomatic={isAutomatic}
        onToggleTransmission={handleToggleTransmission}
        upgrades={currentUpgrades}
        onUpdateUpgrades={handleUpdateUpgrades}
        isNearGarage={vehicleState.isNearGarage}
        onTeleportToGarage={() => engineRef.current?.teleportToGarage()}
        driverCash={driverProfile.cash}
        onDeductCash={handleDeductCash}
      />

      {/* Missions Selection and Completion Modal */}
      <MissionModal
        isOpen={isMissionsOpen}
        onClose={() => setIsMissionsOpen(false)}
        onStartMission={handleStartMission}
        onAbandonMission={handleAbandonMission}
        activeMission={engineRef.current?.activeMission || null}
        completionResult={completionResult}
        onDismissResult={() => {
          setCompletionResult(null);
          engineRef.current?.abandonMission();
          setMissionProgress(null);
        }}
        currentUpgrades={currentUpgrades}
        onEquipUpgrade={(key, stage) => {
          const next = { ...currentUpgrades, [key]: stage };
          handleUpdateUpgrades(next);
        }}
        tasks={tasks}
        onClaimTask={completeTask}
        onGoToGarage={() => {
          setIsMissionsOpen(false);
          setIsGarageOpen(true);
        }}
      />

      {/* GPS World Map & Navigation Modal */}
      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        carPosition={vehicleState.carPosition}
        carRotationY={vehicleState.carRotationY}
        activeMission={engineRef.current?.activeMission || null}
        currentCheckpoint={missionProgress?.currentCheckpoint || 0}
        onFastTravel={(x, z) => engineRef.current?.teleportCar(x, z)}
        onStartMission={(id) => {
          handleStartMission(id);
          setIsMapOpen(false);
        }}
      />

      {/* 60-Second Driving Telemetry Performance Dashboard */}
      <TelemetryModal
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
        getTelemetryData={() => engineRef.current?.getTelemetryData() || []}
        getTelemetrySummary={() =>
          engineRef.current?.getTelemetrySummary() || {
            maxSpeed: 0,
            avgSpeed: 0,
            peakRpm: 0,
            avgThrottle: 0,
            fullThrottlePct: 0,
            hardBrakingPct: 0,
            recordedSeconds: 0,
            sampleCount: 0,
          }
        }
        onResetTelemetry={() => engineRef.current?.resetTelemetry()}
        onExportCsv={() => engineRef.current?.exportTelemetryCsv() || ''}
      />
    </main>
  );
}
