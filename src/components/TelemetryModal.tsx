import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Activity,
  Download,
  Gauge,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { TelemetryPoint } from '../game/types';

interface TelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  getTelemetryData: () => TelemetryPoint[];
  getTelemetrySummary: () => {
    maxSpeed: number;
    avgSpeed: number;
    peakRpm: number;
    avgThrottle: number;
    fullThrottlePct: number;
    hardBrakingPct: number;
    recordedSeconds: number;
    sampleCount: number;
  };
  onResetTelemetry: () => void;
  onExportCsv: () => string;
}

export const TelemetryModal: React.FC<TelemetryModalProps> = ({
  isOpen,
  onClose,
  getTelemetryData,
  getTelemetrySummary,
  onResetTelemetry,
  onExportCsv,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // View & Interactive States
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showSpeed, setShowSpeed] = useState<boolean>(true);
  const [showThrottle, setShowThrottle] = useState<boolean>(true);
  const [showRpm, setShowRpm] = useState<boolean>(true);
  const [showBrake, setShowBrake] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<TelemetryPoint | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 820,
    height: 380,
  });

  // Telemetry buffer cache in state for smooth rendering & freeze inspection
  const [dataPoints, setDataPoints] = useState<TelemetryPoint[]>([]);
  const [summary, setSummary] = useState({
    maxSpeed: 0,
    avgSpeed: 0,
    peakRpm: 0,
    avgThrottle: 0,
    fullThrottlePct: 0,
    hardBrakingPct: 0,
    recordedSeconds: 0,
    sampleCount: 0,
  });

  // Responsive dimensions via ResizeObserver
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 300) {
          const targetHeight = Math.max(300, Math.min(460, Math.round(width * 0.42)));
          setDimensions({ width, height: targetHeight });
        }
      }
    });

    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [isOpen]);

  // Polling loop for live telemetry updates while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const updateSnapshot = () => {
      if (!isPaused) {
        setDataPoints(getTelemetryData());
        setSummary(getTelemetrySummary());
      }
    };

    updateSnapshot();
    const interval = window.setInterval(updateSnapshot, 100); // 10 Hz refresh
    return () => clearInterval(interval);
  }, [isOpen, isPaused, getTelemetryData, getTelemetrySummary]);

  // Export CSV handler
  const handleExport = () => {
    const csvContent = onExportCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `apex_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset handler
  const handleReset = () => {
    onResetTelemetry();
    setDataPoints([]);
    setHoveredPoint(null);
    setSummary({
      maxSpeed: 0,
      avgSpeed: 0,
      peakRpm: 0,
      avgThrottle: 0,
      fullThrottlePct: 0,
      hardBrakingPct: 0,
      recordedSeconds: 0,
      sampleCount: 0,
    });
  };

  // Render D3 Line Chart
  useEffect(() => {
    if (!isOpen || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 28, right: 62, bottom: 42, left: 62 };
    const innerWidth = Math.max(100, width - margin.left - margin.right);
    const innerHeight = Math.max(100, height - margin.top - margin.bottom);

    // Filter points in the -60s to 0s window
    const pts = dataPoints.length > 0 ? dataPoints : [];

    // Base Scales
    // X-Axis: Fixed 60-second window from -60 to 0 (Now)
    const xScale = d3.scaleLinear().domain([-60, 0]).range([0, innerWidth]);

    // Left Y-Axis: Speed (km/h)
    const maxSpeedData = d3.max(pts, (d) => d.speedKmh) || 160;
    const speedMax = Math.max(140, Math.ceil(maxSpeedData / 40) * 40);
    const speedScale = d3.scaleLinear().domain([0, speedMax]).range([innerHeight, 0]);

    // Right Y-Axis: Throttle & Brake (0 to 100%)
    const pctScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

    // RPM Scale (Mapped across the inner height)
    const maxRpmData = d3.max(pts, (d) => d.rpm) || 7500;
    const rpmMax = Math.max(7500, Math.ceil(maxRpmData / 1000) * 1000);
    const rpmScale = d3.scaleLinear().domain([0, rpmMax]).range([innerHeight, 0]);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Definitions for gradients and glow filters
    const defs = svg.append('defs');

    // Speed Area Gradient
    const speedGrad = defs
      .append('linearGradient')
      .attr('id', 'telemetry-speed-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    speedGrad.append('stop').attr('offset', '0%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.28);
    speedGrad.append('stop').attr('offset', '100%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.0);

    // Throttle Area Gradient
    const throttleGrad = defs
      .append('linearGradient')
      .attr('id', 'telemetry-throttle-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    throttleGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.2);
    throttleGrad.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.0);

    // Grid Lines
    const xGrid = d3
      .axisBottom(xScale)
      .ticks(10)
      .tickSize(-innerHeight)
      .tickFormat(() => '');
    g.append('g')
      .attr('class', 'grid x-grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xGrid)
      .selectAll('line')
      .attr('stroke', '#27272a')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-opacity', 0.65);

    const yGrid = d3
      .axisLeft(speedScale)
      .ticks(5)
      .tickSize(-innerWidth)
      .tickFormat(() => '');
    g.append('g')
      .attr('class', 'grid y-grid')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#27272a')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-opacity', 0.65);

    // Hide outer domain bounds of grids
    g.selectAll('.grid .domain').remove();

    // Axes
    // Bottom X-Axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(6)
      .tickFormat((d) => (d === 0 ? 'NOW' : `${d}s`));
    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);
    xAxisGroup.select('.domain').attr('stroke', '#3f3f46');
    xAxisGroup.selectAll('.tick text').attr('fill', '#a1a1aa').attr('font-size', '11px').attr('font-family', 'monospace');
    xAxisGroup.selectAll('.tick line').attr('stroke', '#52525b');

    // Left Y-Axis: Speed (km/h)
    const yAxisLeft = d3.axisLeft(speedScale).ticks(5).tickFormat((d) => `${d}`);
    const yAxisLeftGroup = g.append('g').call(yAxisLeft);
    yAxisLeftGroup.select('.domain').attr('stroke', '#06b6d4');
    yAxisLeftGroup.selectAll('.tick text').attr('fill', '#22d3ee').attr('font-size', '11px').attr('font-family', 'monospace');
    yAxisLeftGroup.selectAll('.tick line').attr('stroke', '#0891b2');

    // Left Y-Axis Title
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -48)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#06b6d4')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('font-family', 'monospace')
      .text('SPEED (KM/H)');

    // Right Y-Axis: Throttle / Brake (%)
    const yAxisRight = d3.axisRight(pctScale).ticks(5).tickFormat((d) => `${d}%`);
    const yAxisRightGroup = g
      .append('g')
      .attr('transform', `translate(${innerWidth},0)`)
      .call(yAxisRight);
    yAxisRightGroup.select('.domain').attr('stroke', '#10b981');
    yAxisRightGroup.selectAll('.tick text').attr('fill', '#34d399').attr('font-size', '11px').attr('font-family', 'monospace');
    yAxisRightGroup.selectAll('.tick line').attr('stroke', '#059669');

    // Right Y-Axis Title
    g.append('text')
      .attr('transform', 'rotate(90)')
      .attr('y', -innerWidth - 50)
      .attr('x', innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#10b981')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('font-family', 'monospace')
      .text('THROTTLE (%)');

    // Line and Area Generators
    if (pts.length >= 2) {
      // 1. Speed Area & Line (Cyan)
      if (showSpeed) {
        const speedArea = d3
          .area<TelemetryPoint>()
          .x((d) => xScale(d.relativeTime))
          .y0(innerHeight)
          .y1((d) => speedScale(d.speedKmh))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(pts)
          .attr('fill', 'url(#telemetry-speed-gradient)')
          .attr('d', speedArea);

        const speedLine = d3
          .line<TelemetryPoint>()
          .x((d) => xScale(d.relativeTime))
          .y((d) => speedScale(d.speedKmh))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(pts)
          .attr('fill', 'none')
          .attr('stroke', '#06b6d4')
          .attr('stroke-width', 2.5)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .attr('d', speedLine);
      }

      // 2. Throttle Area & Line (Emerald)
      if (showThrottle) {
        const throttleArea = d3
          .area<TelemetryPoint>()
          .x((d) => xScale(d.relativeTime))
          .y0(innerHeight)
          .y1((d) => pctScale(d.throttle))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(pts)
          .attr('fill', 'url(#telemetry-throttle-gradient)')
          .attr('d', throttleArea);

        const throttleLine = d3
          .line<TelemetryPoint>()
          .x((d) => xScale(d.relativeTime))
          .y((d) => pctScale(d.throttle))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(pts)
          .attr('fill', 'none')
          .attr('stroke', '#10b981')
          .attr('stroke-width', 2.2)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .attr('d', throttleLine);
      }

      // 3. RPM Line (Amber Gold)
      if (showRpm) {
        const rpmLine = d3
          .line<TelemetryPoint>()
          .x((d) => xScale(d.relativeTime))
          .y((d) => rpmScale(d.rpm))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(pts)
          .attr('fill', 'none')
          .attr('stroke', '#f59e0b')
          .attr('stroke-width', 2.0)
          .attr('stroke-dasharray', '4,2')
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .attr('d', rpmLine);
      }

      // 4. Optional Brake Line (Rose / Red)
      if (showBrake) {
        const brakeLine = d3
          .line<TelemetryPoint>()
          .x((d) => xScale(d.relativeTime))
          .y((d) => pctScale(d.brake))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(pts)
          .attr('fill', 'none')
          .attr('stroke', '#f43f5e')
          .attr('stroke-width', 2.0)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .attr('d', brakeLine);
      }
    } else {
      // Empty state notice
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2 - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#71717a')
        .attr('font-size', '14px')
        .attr('font-family', 'sans-serif')
        .attr('font-weight', '500')
        .text('Gathering driving telemetry...');

      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2 + 14)
        .attr('text-anchor', 'middle')
        .attr('fill', '#52525b')
        .attr('font-size', '12px')
        .attr('font-family', 'sans-serif')
        .text('Drive your vehicle to visualize speed, throttle, and RPM curves over the last 60 seconds');
    }

    // Interactive Scrubber & Crosshair Overlay
    const bisectTime = d3.bisector<TelemetryPoint, number>((d) => d.relativeTime).center;

    const crosshairGroup = g.append('g').attr('class', 'crosshair').style('display', 'none');

    // Vertical guide line
    const verticalLine = crosshairGroup
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#e4e4e7')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '3,3');

    // Focal highlight dots
    const speedDot = crosshairGroup
      .append('circle')
      .attr('r', 5)
      .attr('fill', '#06b6d4')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    const throttleDot = crosshairGroup
      .append('circle')
      .attr('r', 5)
      .attr('fill', '#10b981')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    const rpmDot = crosshairGroup
      .append('circle')
      .attr('r', 4.5)
      .attr('fill', '#f59e0b')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.8);

    // Transparent mouse capture surface
    const overlay = g
      .append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair');

    overlay
      .on('mouseenter', () => {
        if (pts.length > 0) crosshairGroup.style('display', null);
      })
      .on('mouseleave', () => {
        crosshairGroup.style('display', 'none');
        setHoveredPoint(null);
      })
      .on('mousemove', (event: MouseEvent) => {
        if (pts.length === 0) return;
        const [mx] = d3.pointer(event);
        const relX = xScale.invert(mx);
        const idx = bisectTime(pts, relX);
        const selected = pts[Math.min(pts.length - 1, Math.max(0, idx))];

        if (selected) {
          const cx = xScale(selected.relativeTime);
          verticalLine.attr('x1', cx).attr('x2', cx);

          if (showSpeed) {
            speedDot.style('display', null).attr('cx', cx).attr('cy', speedScale(selected.speedKmh));
          } else {
            speedDot.style('display', 'none');
          }

          if (showThrottle) {
            throttleDot.style('display', null).attr('cx', cx).attr('cy', pctScale(selected.throttle));
          } else {
            throttleDot.style('display', 'none');
          }

          if (showRpm) {
            rpmDot.style('display', null).attr('cx', cx).attr('cy', rpmScale(selected.rpm));
          } else {
            rpmDot.style('display', 'none');
          }

          setHoveredPoint(selected);
        }
      });
  }, [dimensions, dataPoints, isOpen, showSpeed, showThrottle, showRpm, showBrake]);

  if (!isOpen) return null;

  return (
    <div
      id="telemetry-dashboard-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col gap-4 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-wider uppercase text-white">
                  Telemetry Performance Dashboard
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                    isPaused
                      ? 'bg-amber-950/80 border-amber-500/50 text-amber-400'
                      : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                  }`}
                >
                  {isPaused ? 'Data Frozen' : 'Live 60s Stream'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                D3 Multi-Channel Dynamics: Speed (km/h), Throttle (%), and Engine RPM over the last 60 seconds
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="telemetry-pause-btn"
              onClick={() => setIsPaused(!isPaused)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer ${
                isPaused
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
              title={isPaused ? 'Resume live recording' : 'Freeze data to inspect curves'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'Resume' : 'Freeze'}</span>
            </button>

            <button
              id="telemetry-export-btn"
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold transition active:scale-95 cursor-pointer"
              title="Export 60-second telemetry as CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              id="telemetry-reset-btn"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold transition active:scale-95 cursor-pointer"
              title="Reset 60s telemetry buffer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              id="telemetry-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer"
              title="Close Telemetry (ESC or T)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Performance Statistics Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <div className="bg-zinc-900/80 border border-cyan-500/30 rounded-xl p-3 flex flex-col">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Peak Speed</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-cyan-300">
              {summary.maxSpeed} <span className="text-xs font-normal text-zinc-400">km/h</span>
            </span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex flex-col">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Average Speed</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-zinc-200">
              {summary.avgSpeed} <span className="text-xs font-normal text-zinc-500">km/h</span>
            </span>
          </div>

          <div className="bg-zinc-900/80 border border-emerald-500/30 rounded-xl p-3 flex flex-col">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Avg Throttle</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-300">
              {summary.avgThrottle}%
            </span>
          </div>

          <div className="bg-zinc-900/80 border border-emerald-500/30 rounded-xl p-3 flex flex-col">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">WOT (Full Gas)</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-300">
              {summary.fullThrottlePct}% <span className="text-xs font-normal text-zinc-400">time</span>
            </span>
          </div>

          <div className="bg-zinc-900/80 border border-amber-500/30 rounded-xl p-3 flex flex-col">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Peak Engine RPM</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-300">
              {summary.peakRpm.toLocaleString()} <span className="text-xs font-normal text-zinc-500">RPM</span>
            </span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex flex-col">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Heavy Braking</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-rose-400">
              {summary.hardBrakingPct}% <span className="text-xs font-normal text-zinc-500">time</span>
            </span>
          </div>
        </div>

        {/* Telemetry D3 Line Chart Container */}
        <div className="flex flex-col gap-2">
          {/* Legend and Channel Toggle Badges */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                id="telemetry-toggle-speed"
                onClick={() => setShowSpeed(!showSpeed)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-bold text-xs transition cursor-pointer ${
                  showSpeed
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-600'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>SPEED (km/h)</span>
              </button>

              <button
                id="telemetry-toggle-throttle"
                onClick={() => setShowThrottle(!showThrottle)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-bold text-xs transition cursor-pointer ${
                  showThrottle
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-600'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>THROTTLE (%)</span>
              </button>

              <button
                id="telemetry-toggle-rpm"
                onClick={() => setShowRpm(!showRpm)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-bold text-xs transition cursor-pointer ${
                  showRpm
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-600'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>RPM (0 - 9k)</span>
              </button>

              <button
                id="telemetry-toggle-brake"
                onClick={() => setShowBrake(!showBrake)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-bold text-xs transition cursor-pointer ${
                  showBrake
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-600'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>BRAKE (%)</span>
              </button>
            </div>

            <div className="text-[11px] font-mono text-zinc-500">
              Hover cursor over chart to scrub timeline (-60s to Now)
            </div>
          </div>

          {/* D3 Canvas Card */}
          <div
            ref={containerRef}
            className="w-full bg-zinc-900/60 border border-zinc-800/90 rounded-xl overflow-hidden relative"
          >
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              className="w-full block"
            />

            {/* Floating Scrubber HUD Readout */}
            {hoveredPoint && (
              <div className="absolute top-2 left-18 bg-zinc-950/95 border border-zinc-700/80 rounded-xl p-2.5 px-3 shadow-xl backdrop-blur-md flex items-center gap-4 text-xs font-mono">
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase">Time Offset</span>
                  <span className="text-white font-black">{hoveredPoint.relativeTime}s</span>
                </div>

                <div className="w-px h-6 bg-zinc-800" />

                <div className="flex flex-col">
                  <span className="text-[9px] text-cyan-400 font-bold uppercase">Speed</span>
                  <span className="text-cyan-300 font-black">{hoveredPoint.speedKmh} km/h</span>
                </div>

                <div className="w-px h-6 bg-zinc-800" />

                <div className="flex flex-col">
                  <span className="text-[9px] text-emerald-400 font-bold uppercase">Throttle</span>
                  <span className="text-emerald-300 font-black">{hoveredPoint.throttle}%</span>
                </div>

                <div className="w-px h-6 bg-zinc-800" />

                <div className="flex flex-col">
                  <span className="text-[9px] text-amber-400 font-bold uppercase">RPM</span>
                  <span className="text-amber-300 font-black">{hoveredPoint.rpm.toLocaleString()}</span>
                </div>

                <div className="w-px h-6 bg-zinc-800" />

                <div className="flex flex-col">
                  <span className="text-[9px] text-purple-400 font-bold uppercase">Gear</span>
                  <span className="text-purple-300 font-black">
                    {hoveredPoint.gear === 0 ? 'N' : hoveredPoint.gear === -1 ? 'R' : `G${hoveredPoint.gear}`}
                  </span>
                </div>

                {hoveredPoint.brake > 0 && (
                  <>
                    <div className="w-px h-6 bg-zinc-800" />
                    <div className="flex flex-col">
                      <span className="text-[9px] text-rose-400 font-bold uppercase">Brake</span>
                      <span className="text-rose-300 font-black">{hoveredPoint.brake}%</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Driving Performance Guidance Footer */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3 text-xs text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-zinc-200">Performance Pro Tip:</strong> Look for steep throttle application upon corner exit and smooth RPM ramp-up without sudden drops to maximize lap times.
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500 whitespace-nowrap">
            Toggle with Key [T] or Telemetry Button
          </span>
        </div>
      </div>
    </div>
  );
};
