
import { Driver, RaceConfig, RaceState, SimulationResult, PirelliCompound, Circuit, StrategyOption } from '../types';
import { TYRE_COMPOUNDS, DRIVERS_DB } from '../constants';

// Probabilistic helper
const randomNormal = (mean: number, stdDev: number): number => {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdDev + mean;
};

// Calculate single lap time with physics-lite model
const calculateLapTime = (
  driver: Driver,
  compound: PirelliCompound,
  tyreAge: number,
  fuelLoadKg: number,
  trackBasePace: number,
  isRaining: boolean
): number => {
  const tyreModel = TYRE_COMPOUNDS[compound];
  
  // 1. Tyre Physics
  // Deg increases non-linearly after 70% of life
  let degFactor = 1.0;
  if (tyreAge > tyreModel.maxLife * 0.7) {
    degFactor = 1.0 + Math.pow((tyreAge - (tyreModel.maxLife * 0.7)), 1.5) * 0.05;
  }
  
  const tyreDeg = tyreAge * tyreModel.degPerLap * (2.1 - driver.tyreManagement) * degFactor; 
  
  // 2. Fuel Penalty
  const fuelPenalty = fuelLoadKg * 0.035; 
  
  // 3. Driver Variance & Aggression
  // Aggressive drivers can push harder but might be less consistent
  const aggressionBonus = (driver.aggression - 0.5) * -0.1; // High aggression = slightly faster laps
  const pushFactor = Math.random() > 0.9 ? -0.3 + aggressionBonus : 0; 
  const consistency = randomNormal(0, 0.25 * (1.1 - driver.consistency));

  // 4. Cliff
  const cliffPenalty = tyreAge > tyreModel.maxLife ? (tyreAge - tyreModel.maxLife) * 0.8 : 0;

  // 5. Wet Weather Logic
  let rainPenalty = 0;
  if (isRaining) {
      const wetSkillFactor = (1 - driver.wetWeatherAbility); // 0.0 is godlike, 1.0 is bad
      rainPenalty = wetSkillFactor * 1.5; // Up to 1.5s lost per lap purely on skill
  }

  return trackBasePace + driver.basePace + tyreModel.basePaceDelta + tyreDeg + fuelPenalty + cliffPenalty + consistency + pushFactor + rainPenalty;
};

// Calculate theoretical fastest lap for setup screen
export const calculateTheoreticalLap = (
  circuit: Circuit,
  compoundId: PirelliCompound,
  driverId: string
): string => {
  const driver = DRIVERS_DB.find(d => d.id === driverId);
  const tyre = TYRE_COMPOUNDS[compoundId];
  if (!driver || !tyre) return "--:--.---";

  // Qualifying sim (Low fuel, fresh tyres, max push)
  const time = circuit.baseLapTime + driver.basePace + tyre.basePaceDelta;
  
  const min = Math.floor(time / 60);
  const sec = (time % 60).toFixed(3);
  return `${min}:${sec.length < 6 ? '0' + sec : sec}`;
}

// Logic to determine best tyre for current conditions
export const getRecommendedTyre = (rainProb: number, airTemp: number): PirelliCompound => {
    // Rain logic
    if (rainProb >= 0.80) return 'WET';
    if (rainProb >= 0.25) return 'INTER';

    // Dry logic - for fastest single lap time, softest is best
    // In a race stint, this might differ, but for "fastest times" query:
    return 'C5';
};

// Generate data points for the Tyre Degradation Chart
export const getDegradationProjection = (
  currentLap: number,
  totalLaps: number,
  strategies: StrategyOption[]
): any[] => {
  const data: any[] = [];
  
  for (let lap = currentLap; lap <= totalLaps; lap++) {
    const point: any = { lap };
    
    strategies.forEach(strat => {
        // Calculate wear based on strategy pit stops
        let age = 0;
        let compound = 'C3'; // Default fallback
        
        // Very simplified logic for visualization:
        // Assume we just pitted or are about to pit based on the strategy definition
        if (lap < strat.pitLap) {
            // Before pit
            age = (lap - currentLap) + 5; // Assumes current tyres are 5 laps old relative to start of projection
            // Use current compound logic (omitted for brevity, assuming C4 for start of chart)
            compound = strat.targetCompound === 'C3' ? 'C4' : 'C3'; // Inverse of target
        } else {
            // After pit
            age = lap - strat.pitLap;
            compound = strat.targetCompound;
        }

        const tyreModel = TYRE_COMPOUNDS[compound as PirelliCompound];
        if (tyreModel) {
            // Performance percentage (100% is fresh, 0% is dead)
            // Deg per lap is roughly 0.1s. Let's say 1.5s drop off is 0% perf.
            const totalDeg = age * tyreModel.degPerLap;
            let performance = 100 - (totalDeg / 1.5) * 100;
            if (performance < 0) performance = 0;
            
            // Visual bump for pit lap
            if (lap === strat.pitLap) performance = 100;

            point[strat.id] = parseFloat(performance.toFixed(1));
        }
    });

    data.push(point);
  }
  return data;
};

export const runMonteCarloSimulation = (
  initialState: RaceState,
  raceConfig: RaceConfig,
  heroDriverId: string,
  iterations: number = 200
): { results: SimulationResult[], winProb: number, podiumProb: number, avgFinish: number } => {
  
  const results: SimulationResult[] = [];
  const trackBasePace = 85.0; // Normalized for calculation, visual only uses circuit specific
  const isRaining = initialState.rainProbability > 0.3;

  for (let i = 0; i < iterations; i++) {
    // Deep clone state
    const simDrivers = initialState.drivers.map(d => ({ ...d }));
    let currentLap = initialState.currentLap;

    simDrivers.forEach(d => {
       d.gapToLeader += randomNormal(0, 0.2); 
    });

    while (currentLap < raceConfig.totalLaps) {
      currentLap++;
      const fuel = (raceConfig.totalLaps - currentLap) * 1.7; 

      simDrivers.forEach(driver => {
        const tyreModel = TYRE_COMPOUNDS[driver.currentTyre];
        
        // Strategy Logic
        let boxThreshold = tyreModel.maxLife;
        if (driver.id === heroDriverId) {
             boxThreshold = tyreModel.maxLife * 0.95;
        } else {
             boxThreshold = tyreModel.maxLife * (0.9 + Math.random() * 0.2); 
        }

        let pitting = false;
        if (driver.tyreAge > boxThreshold) pitting = true;

        if (pitting) {
          driver.gapToLeader += raceConfig.pitLossSeconds;
          driver.pitStops += 1;
          
          if (driver.currentTyre === 'C5' || driver.currentTyre === 'C4') driver.currentTyre = 'C3';
          else if (driver.currentTyre === 'C3') driver.currentTyre = 'C2';
          else driver.currentTyre = 'C4'; 
          
          driver.tyreAge = 0;
          driver.gapToLeader -= 0.5; 
        } else {
           const lapTime = calculateLapTime(driver, driver.currentTyre, driver.tyreAge, fuel, trackBasePace, isRaining);
           const delta = lapTime - trackBasePace; 
           
           // Aggression Logic for Traffic
           // If gap is small, aggressive drivers lose less time
           driver.gapToLeader += delta;
           
           // Catch up logic (rubber banding for simulation excitement)
           if (driver.gapToLeader > 2 && driver.aggression > 0.9) {
               driver.gapToLeader -= 0.1; 
           }

           driver.tyreAge++;
        }
      });
    }

    simDrivers.sort((a, b) => a.gapToLeader - b.gapToLeader);

    const finalPositions: Record<string, number> = {};
    simDrivers.forEach((d, idx) => {
      finalPositions[d.id] = idx + 1;
    });

    results.push({
      winnerId: simDrivers[0].id,
      podium: simDrivers.slice(0, 3).map(d => d.id),
      finalPositions
    });
  }

  let wins = 0;
  let podiums = 0;
  let totalPos = 0;

  results.forEach(r => {
    if (r.winnerId === heroDriverId) wins++;
    if (r.podium.includes(heroDriverId)) podiums++;
    totalPos += r.finalPositions[heroDriverId];
  });

  return {
    results,
    winProb: (wins / iterations) * 100,
    podiumProb: (podiums / iterations) * 100,
    avgFinish: totalPos / iterations
  };
};

export const generateStrategies = (state: RaceState, config: RaceConfig, driverId: string): StrategyOption[] => {
    const driver = state.drivers.find(d => d.id === driverId);
    if (!driver) return [];

    const remainingLaps = config.totalLaps - state.currentLap;
    const currentTyre = TYRE_COMPOUNDS[driver.currentTyre];
    
    // Calculate optimal pit lap based on tyre life left
    const idealPitLap = state.currentLap + (currentTyre.maxLife - driver.tyreAge - 2); 
    const clampedPitLap = Math.max(state.currentLap + 1, Math.min(idealPitLap, config.totalLaps - 1));

    // Strat A: Aggressive Undercut (Pit Early)
    const strategyA: StrategyOption = {
        id: 'strat_A',
        name: 'Aggressive Undercut',
        stops: driver.pitStops + 1,
        pitLap: Math.max(state.currentLap + 1, clampedPitLap - 3), // Pit 3 laps earlier than ideal
        targetCompound: 'C4', 
        riskLevel: 'High',
        description: `Box Lap ${Math.max(state.currentLap + 1, clampedPitLap - 3)}. Switch to ${TYRE_COMPOUNDS['C4'].name} and attack.`,
        estimatedRaceTime: 0 
    };

    // Strat B: Optimal Strategy (Balanced)
    const strategyB: StrategyOption = {
        id: 'strat_B',
        name: 'Optimal Strategy',
        stops: driver.pitStops + 1,
        pitLap: clampedPitLap,
        targetCompound: 'C3',
        riskLevel: 'Low',
        description: `Box Lap ${clampedPitLap}. Switch to ${TYRE_COMPOUNDS['C3'].name} to go to the end.`,
        estimatedRaceTime: 0
    };

    // Strat C: Rain/Extension (Contextual)
    const strategyC: StrategyOption = {
        id: 'strat_C',
        name: 'Extend for Weather',
        stops: driver.pitStops + 1,
        pitLap: state.currentLap + 10,
        targetCompound: 'INTER',
        riskLevel: 'Medium',
        description: `Stay out until Lap ${state.currentLap + 10} waiting for rain.`,
        estimatedRaceTime: 0
    };
    
    return [strategyA, strategyB, strategyC];
}
