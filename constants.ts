
import { Circuit, TyreConfig, PirelliCompound, Driver } from './types';

export const F1_CIRCUITS: Circuit[] = [
  { id: 'bahrain', name: 'Bahrain International Circuit', location: 'Sakhir', country: 'Bahrain', lengthKm: 5.412, timezone: 'Asia/Bahrain', baseLapTime: 91.0 },
  { id: 'silverstone', name: 'Silverstone Circuit', location: 'Silverstone', country: 'UK', lengthKm: 5.891, timezone: 'Europe/London', baseLapTime: 87.0 },
  { id: 'monaco', name: 'Circuit de Monaco', location: 'Monte Carlo', country: 'Monaco', lengthKm: 3.337, timezone: 'Europe/Paris', baseLapTime: 71.0 },
  { id: 'spa', name: 'Circuit de Spa-Francorchamps', location: 'Stavelot', country: 'Belgium', lengthKm: 7.004, timezone: 'Europe/Brussels', baseLapTime: 104.0 },
  { id: 'monza', name: 'Autodromo Nazionale Monza', location: 'Monza', country: 'Italy', lengthKm: 5.793, timezone: 'Europe/Rome', baseLapTime: 81.0 },
  { id: 'suzuka', name: 'Suzuka International Racing Course', location: 'Suzuka', country: 'Japan', lengthKm: 5.807, timezone: 'Asia/Tokyo', baseLapTime: 89.0 },
  { id: 'cota', name: 'Circuit of the Americas', location: 'Austin, TX', country: 'USA', lengthKm: 5.513, timezone: 'America/Chicago', baseLapTime: 94.0 },
  { id: 'interlagos', name: 'Autódromo José Carlos Pace', location: 'São Paulo', country: 'Brazil', lengthKm: 4.309, timezone: 'America/Sao_Paulo', baseLapTime: 70.0 },
  { id: 'yas_marina', name: 'Yas Marina Circuit', location: 'Abu Dhabi', country: 'UAE', lengthKm: 5.281, timezone: 'Asia/Dubai', baseLapTime: 84.0 },
  { id: 'vegas', name: 'Las Vegas Strip Circuit', location: 'Las Vegas, NV', country: 'USA', lengthKm: 6.201, timezone: 'America/Los_Angeles', baseLapTime: 93.0 },
];

export const TYRE_COMPOUNDS: Record<PirelliCompound, TyreConfig> = {
  'C0': { id: 'C0', name: 'C0-Hard', type: 'Hard', basePaceDelta: 1.2, degPerLap: 0.03, maxLife: 50, color: '#f0f0f0' }, // White
  'C1': { id: 'C1', name: 'C1-Hard', type: 'Hard', basePaceDelta: 1.0, degPerLap: 0.05, maxLife: 42, color: '#f0f0f0' }, // White
  'C2': { id: 'C2', name: 'C2-Medium', type: 'Medium', basePaceDelta: 0.7, degPerLap: 0.07, maxLife: 35, color: '#eab308' }, // Yellow
  'C3': { id: 'C3', name: 'C3-Medium', type: 'Medium', basePaceDelta: 0.4, degPerLap: 0.09, maxLife: 28, color: '#eab308' }, // Yellow
  'C4': { id: 'C4', name: 'C4-Soft', type: 'Soft', basePaceDelta: 0.2, degPerLap: 0.12, maxLife: 22, color: '#ef4444' }, // Red
  'C5': { id: 'C5', name: 'C5-Soft', type: 'Soft', basePaceDelta: 0.0, degPerLap: 0.16, maxLife: 15, color: '#ef4444' }, // Red
  'INTER': { id: 'INTER', name: 'Intermediate', type: 'Inter', basePaceDelta: 5.0, degPerLap: 0.10, maxLife: 30, color: '#22c55e' }, // Green
  'WET': { id: 'WET', name: 'Wet', type: 'Wet', basePaceDelta: 10.0, degPerLap: 0.10, maxLife: 25, color: '#3b82f6' }, // Blue
};

// Simplified Partial<Driver> for DB init, expanded in use
const DB_RAW = [
  { id: 'ver', name: 'Max Verstappen', team: 'Red Bull Racing', number: 1, color: '#3671C6', basePace: 0.0, consistency: 0.98, tyreManagement: 0.98, aggression: 0.95, wetWeatherAbility: 0.99 },
  { id: 'nor', name: 'Lando Norris', team: 'McLaren', number: 4, color: '#FF8000', basePace: 0.05, consistency: 0.95, tyreManagement: 0.94, aggression: 0.85, wetWeatherAbility: 0.92 },
  { id: 'lec', name: 'Charles Leclerc', team: 'Ferrari', number: 16, color: '#E80020', basePace: 0.08, consistency: 0.94, tyreManagement: 0.90, aggression: 0.90, wetWeatherAbility: 0.88 },
  { id: 'pia', name: 'Oscar Piastri', team: 'McLaren', number: 81, color: '#FF8000', basePace: 0.15, consistency: 0.93, tyreManagement: 0.92, aggression: 0.80, wetWeatherAbility: 0.85 },
  { id: 'sai', name: 'Carlos Sainz', team: 'Ferrari', number: 55, color: '#E80020', basePace: 0.18, consistency: 0.95, tyreManagement: 0.93, aggression: 0.88, wetWeatherAbility: 0.89 },
  { id: 'ham', name: 'Lewis Hamilton', team: 'Ferrari', number: 44, color: '#E80020', basePace: 0.12, consistency: 0.97, tyreManagement: 0.99, aggression: 0.85, wetWeatherAbility: 0.98 },
  { id: 'rus', name: 'George Russell', team: 'Mercedes', number: 63, color: '#27F4D2', basePace: 0.20, consistency: 0.92, tyreManagement: 0.90, aggression: 0.92, wetWeatherAbility: 0.87 },
  { id: 'alo', name: 'Fernando Alonso', team: 'Aston Martin', number: 14, color: '#229971', basePace: 0.35, consistency: 0.99, tyreManagement: 0.98, aggression: 0.90, wetWeatherAbility: 0.93 },
  { id: 'alb', name: 'Alex Albon', team: 'Williams', number: 23, color: '#64C4FF', basePace: 0.60, consistency: 0.90, tyreManagement: 0.85, aggression: 0.80, wetWeatherAbility: 0.85 },
  { id: 'tsu', name: 'Yuki Tsunoda', team: 'RB', number: 22, color: '#6692FF', basePace: 0.65, consistency: 0.85, tyreManagement: 0.80, aggression: 0.88, wetWeatherAbility: 0.75 },
];

// Helper to fill missing props for full Driver type compliance if needed
export const DRIVERS_DB: Driver[] = DB_RAW.map(d => ({
    ...d,
    position: 0,
    gapToLeader: 0,
    currentTyre: 'C3',
    tyreAge: 0,
    lapTimes: [],
    pitStops: 0,
    status: 'OnTrack'
}));
