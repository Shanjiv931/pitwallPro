
export type PirelliCompound = 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'INTER' | 'WET';

export interface TyreConfig {
  id: PirelliCompound;
  name: string; // e.g. "C3 - Soft"
  type: 'Soft' | 'Medium' | 'Hard' | 'Inter' | 'Wet';
  basePaceDelta: number; // Seconds delta relative to C0 (Hardest)
  degPerLap: number; // Seconds lost per lap of age
  maxLife: number; // Laps before cliff
  color: string;
}

export interface Circuit {
  id: string;
  name: string;
  location: string;
  country: string;
  lengthKm: number;
  timezone: string; // IANA timezone string e.g. "Europe/London"
  image?: string;
  baseLapTime: number; // Approximate pole lap in seconds
}

export interface Driver {
  id: string;
  name: string;
  team: string;
  color: string;
  number: number;
  // State
  position: number;
  gapToLeader: number; // Seconds
  currentTyre: PirelliCompound;
  tyreAge: number;
  lapTimes: number[];
  pitStops: number;
  status: 'OnTrack' | 'Pit' | 'DNF';
  // Performance
  basePace: number; // Skill modifier (lower is better)
  consistency: number; // 0-1
  tyreManagement: number; // 0-1 (1 is best)
  aggression: number; // 0-1 (High = better overtaking/gap closing)
  wetWeatherAbility: number; // 0-1 (High = less time lost in rain)
  userId?: string;
}

export interface RaceConfig {
  circuitId: string;
  trackName: string;
  totalLaps: number;
  pitLossSeconds: number; // Time lost in pit lane
  trackLengthKm: number;
  timezone: string;
  raceDate: Date;
}

export interface RaceState {
  currentLap: number;
  drivers: Driver[];
  trackTemp: number;
  airTemp: number;
  rainProbability: number;
  safetyCarProbability: number;
  isVirtualSafetyCar: boolean;
  isSafetyCar: boolean;
}

export interface StrategyOption {
  id: string;
  name: string;
  stops: number;
  pitLap: number;
  targetCompound: PirelliCompound;
  estimatedRaceTime: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  description: string;
}

export interface SimulationResult {
  winnerId: string;
  podium: string[];
  finalPositions: Record<string, number>;
}

export interface StrategyReport {
  recommendedStrategyId: string;
  strategies: StrategyOption[];
  simulationCount: number;
  winProbability: number;
  podiumProbability: number;
  explanation: string; // From Gemini
  lastUpdatedLap: number;
}