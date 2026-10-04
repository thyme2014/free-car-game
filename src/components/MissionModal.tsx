import React, { useState } from 'react';
import { Mission, MissionProgress, TaskItem, VehicleUpgrades } from '../game/types';
import { MISSIONS } from '../game/missions';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  Coins,
  Compass,
  Flag,
  Lock,
  Sparkles,
  Trophy,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMission: (missionId: string) => void;
  onAbandonMission: () => void;
  activeMission: Mission | null;
  completionResult: { progress: MissionProgress; mission: Mission } | null;
  onDismissResult: () => void;
  currentUpgrades?: VehicleUpgrades;
  onEquipUpgrade?: (key: keyof VehicleUpgrades, stage: number) => void;
  tasks?: TaskItem[];
  onClaimTask?: (taskId: string) => void;
  onGoToGarage?: () => void;
}

export const MissionModal: React.FC<MissionModalProps> = ({
  isOpen,
  onClose,
  onStartMission,
  onAbandonMission,
  activeMission,
  completionResult,
  onDismissResult,
  currentUpgrades,
  onEquipUpgrade,
  tasks = [],
  onClaimTask,
  onGoToGarage,
}) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'tasks'>('missions');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [lastAttemptedMission, setLastAttemptedMission] = useState<Mission | null>(null);

  if (!isOpen && !completionResult) return null;

  // Render Mission Complete / Failed summary dialog if available
  if (completionResult) {
    const { progress, mission } = completionResult;
    const isSuccess = progress.status === 'completed';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
          {isSuccess ? (
            <>
              <div className="h-16 w-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 mb-4 animate-bounce">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wide">Mission Accomplished!</h2>
              <p className="text-sm text-zinc-400 mt-1">{mission.title}</p>

              {/* Medal Badge */}
              <div className="mt-4 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black text-sm uppercase tracking-widest flex items-center gap-2 shadow-lg">
                <Award className="w-4 h-4" />
                <span>{progress.medal || 'Gold'} Medal</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 w-full my-6">
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold uppercase text-zinc-400">Total Time</span>
                  <div className="text-lg font-mono font-black text-amber-300">
                    {progress.timeElapsed.toFixed(2)}s
                  </div>
                </div>
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold uppercase text-zinc-400">Top Speed</span>
                  <div className="text-lg font-mono font-black text-cyan-400">
                    {progress.highestSpeed} km/h
                  </div>
                </div>
              </div>

              {/* Reward text */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 w-full text-xs text-zinc-300 mb-6">
                <span className="text-zinc-500 font-bold block mb-1">UNLOCKED REWARD:</span>
                <span className="font-semibold text-emerald-400">
                  {progress.medal === 'gold' ? mission.rewards.gold : progress.medal === 'silver' ? mission.rewards.silver : mission.rewards.bronze}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 mb-4">
                <X className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wide">Mission Failed</h2>
              <p className="text-sm text-zinc-400 mt-2">
                {progress.damageTaken > 25
                  ? 'Vehicle damage exceeded the fragile cargo safety limit!'
                  : 'Time expired before reaching all checkpoints.'}
              </p>
            </>
          )}

          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => {
                onDismissResult();
                onStartMission(mission.id);
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-md transition active:scale-95 cursor-pointer"
            >
              Retry Mission
            </button>
            <button
              onClick={onDismissResult}
              className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm transition active:scale-95 cursor-pointer"
            >
              Continue Free Roam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check upgrade requirement helper
  const checkUpgradeRequirement = (mission: Mission) => {
    if (!mission.requiredUpgrade) return { ok: true };
    if (!currentUpgrades) return { ok: true };

    const { key, minStage, label, isFree } = mission.requiredUpgrade;
    const currentStage = (currentUpgrades[key] as number) || 0;
    const ok = currentStage >= minStage;

    return {
      ok,
      label,
      isFree,
      minStage,
      currentStage,
    };
  };

  const handleAttemptStartMission = (m: Mission) => {
    const req = checkUpgradeRequirement(m);
    if (!req.ok) {
      setLastAttemptedMission(m);
      setWarningMessage(
        `Locked: ${m.title} requires "${req.label}". Visit the Apex Tuning Garage at [X: 45, Z: -40] or click Equip Spec to apply this free tuning spec!`
      );
      return;
    }
    setWarningMessage(null);
    setLastAttemptedMission(null);
    onStartMission(m.id);
    onClose();
  };

  const handleAutoEquipAndStart = (m: Mission) => {
    if (m.requiredUpgrade && onEquipUpgrade) {
      onEquipUpgrade(m.requiredUpgrade.key, m.requiredUpgrade.minStage);
    }
    setWarningMessage(null);
    setLastAttemptedMission(null);
    onStartMission(m.id);
    onClose();
  };

  const uncompletedTasksCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">Missions & Driver Tasks</h2>
              <p className="text-xs text-zinc-400">Complete objectives, meet upgrade specs at the garage & earn credits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pt-3 pb-2 border-b border-zinc-900">
          <button
            onClick={() => {
              setActiveTab('missions');
              setWarningMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'missions'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>Grand Prix Trials ({MISSIONS.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('tasks');
              setWarningMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Driver Tasks ({tasks.length})</span>
            {uncompletedTasksCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black">
                {uncompletedTasksCount}
              </span>
            )}
          </button>

          {onGoToGarage && (
            <button
              onClick={() => {
                onClose();
                onGoToGarage();
              }}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Go to Garage [X: 45, Z: -40]</span>
            </button>
          )}
        </div>

        {/* Warning Banner if locked requirement clicked */}
        {warningMessage && (
          <div className="mt-3 p-3 rounded-xl bg-amber-950/80 border border-amber-600/60 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{warningMessage}</span>
            </div>
            <div className="flex items-center gap-2">
              {lastAttemptedMission && lastAttemptedMission.requiredUpgrade?.isFree && onEquipUpgrade && (
                <button
                  onClick={() => handleAutoEquipAndStart(lastAttemptedMission)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shrink-0 cursor-pointer shadow flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Auto-Equip & Start</span>
                </button>
              )}
              {onGoToGarage && (
                <button
                  onClick={() => {
                    onClose();
                    onGoToGarage();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shrink-0 cursor-pointer shadow"
                >
                  Go to Garage
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 custom-scrollbar">
          {activeTab === 'missions' && (
            <>
              {MISSIONS.map((m) => {
                const isCurrent = activeMission?.id === m.id;
                const req = checkUpgradeRequirement(m);

                return (
                  <div
                    key={m.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                        : req.ok
                        ? 'bg-zinc-900/75 border-zinc-800/90 hover:border-zinc-700'
                        : 'bg-zinc-900/40 border-zinc-800/50 opacity-85'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-base font-black text-white">{m.title}</span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                              m.difficulty === 'Easy'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : m.difficulty === 'Medium'
                                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {m.difficulty}
                          </span>

                          {/* Upgrade Spec Requirement Badge */}
                          {m.requiredUpgrade && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                                req.ok
                                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700'
                                  : 'bg-amber-950/90 text-amber-300 border border-amber-700'
                              }`}
                            >
                              {req.ok ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-amber-400" />}
                              <span>Req: {m.requiredUpgrade.label}</span>
                              {m.requiredUpgrade.isFree && <span className="text-emerald-400 font-black">(FREE)</span>}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-zinc-400 leading-relaxed">{m.description}</p>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Limit: {m.timeLimitSec}s</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{m.checkpoints.length} Checkpoints</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-yellow-400" />
                            <span className="text-yellow-300 font-bold">Reward: ${m.cashReward?.gold.toLocaleString()}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                        {isCurrent ? (
                          <button
                            onClick={onAbandonMission}
                            className="px-4 py-2.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-xs font-bold transition active:scale-95 cursor-pointer"
                          >
                            Abandon
                          </button>
                        ) : req.ok ? (
                          <button
                            onClick={() => handleAttemptStartMission(m)}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-black shadow-md transition active:scale-95 cursor-pointer flex items-center gap-2"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Start Mission</span>
                          </button>
                        ) : req.isFree && onEquipUpgrade ? (
                          <button
                            onClick={() => handleAutoEquipAndStart(m)}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                            title="Equip free spec upgrade and start challenge now"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                            <span>Equip Spec & Start</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAttemptStartMission(m)}
                            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/40 text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                            title="Upgrade required at Apex Garage"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Requires Garage Spec</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-400">Driver Task System:</span>
                  <span className="text-zinc-400 ml-1">
                    Free upgrades (Steering, Drive Chassis, Transmission, Suspension) and Garage visits earn credits!
                  </span>
                </div>
              </div>

              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    task.completed
                      ? 'bg-emerald-950/20 border-emerald-600/40'
                      : 'bg-zinc-900/70 border-zinc-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-black text-white">{task.title}</span>
                        {task.completed ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-900/70 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            COMPLETED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            IN PROGRESS
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{task.description}</p>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-400 mb-1">
                          <span>Progress</span>
                          <span className="font-mono text-zinc-300">
                            {task.progress} / {task.target} {task.unit}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              task.completed ? 'bg-emerald-400' : 'bg-amber-500'
                            }`}
                            style={{
                              width: `${Math.min(100, (task.progress / task.target) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-mono font-black text-yellow-400 flex items-center gap-1 justify-end">
                          <Coins className="w-4 h-4 text-yellow-400" />
                          <span>+${task.rewardCash.toLocaleString()}</span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">+{task.rewardXp} XP</span>
                      </div>

                      {task.completed ? (
                        <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Claimed</span>
                        </div>
                      ) : task.progress >= task.target && onClaimTask ? (
                        <button
                          onClick={() => onClaimTask(task.id)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Claim Reward</span>
                        </button>
                      ) : task.id === 'task_garage_visit' || task.type === 'free_upgrade' ? (
                        onGoToGarage && (
                          <button
                            onClick={() => {
                              onClose();
                              onGoToGarage();
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Go to Garage</span>
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
