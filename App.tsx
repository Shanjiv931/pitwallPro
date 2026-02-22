
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Activity, Zap, MapPin, Flag, Settings, Clock, Loader2, Calendar, Trophy, Gauge, CloudRain, Thermometer, Database, Plus, Box, Layers, AlertTriangle, XOctagon, Check, Timer as TimerIcon, X, ChevronRight, Award, LogOut, HelpCircle, User } from 'lucide-react';
import { RaceState, RaceConfig, Driver, PirelliCompound, StrategyReport } from './types';
import { TYRE_COMPOUNDS, F1_CIRCUITS } from './constants';
import { runMonteCarloSimulation, generateStrategies, calculateTheoreticalLap, getRecommendedTyre } from './services/simulationEngine';
import { generateStrategyExplanation, fetchRaceConditions } from './services/geminiService';
import { getAllDrivers } from './services/driverService';
import { supabase, signOut } from './services/supabaseClient';
import TelemetryPanel from './components/TelemetryPanel';
import StrategyCard from './components/StrategyCard';
import AnalyticsPanel from './components/ProbabilityChart';
import DriverAssessment from './components/DriverCreator';
import DriverList from './components/DriverList';
import TrackMap3D from './components/TrackMap3D';
import AuthScreen from './components/AuthScreen';
import ContactAdmin from './components/ContactAdmin';
import UserProfile from './components/UserProfile';

// --- Helper Functions ---
const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = (seconds % 60).toFixed(3);
  return `${h}:${m < 10 ? '0' : ''}${m}:${parseFloat(s) < 10 ? '0' : ''}${s}`;
};

const formatGap = (seconds: number) => {
  return seconds > 0 ? `+${seconds.toFixed(3)}s` : '-';
};

// --- Helper Components ---
const SetupScreen: React.FC<{ 
  onStart: (config: any) => void;
  isLoading: boolean;
  onManageDrivers: () => void;
  onAddDriver: () => void;
  onLogout: () => void;
  onContact: () => void;
  onProfile: () => void;
}> = ({ onStart, isLoading, onManageDrivers, onAddDriver, onLogout, onContact, onProfile }) => {
  const [circuitId, setCircuitId] = useState<string>(F1_CIRCUITS[0].id);
  const [driversList, setDriversList] = useState<Driver[]>([]);
  const [driverId, setDriverId] = useState<string>('');
  const [laps, setLaps] = useState<number>(57);
  const [startTyre, setStartTyre] = useState<PirelliCompound>('C3');
  const [raceDate, setRaceDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [weatherData, setWeatherData] = useState<{rainProb: number, airTemp: number, trackTemp: number} | null>(null);

  // Load drivers on mount
  useEffect(() => {
    const loadDrivers = async () => {
      const allDrivers = await getAllDrivers();
      setDriversList(allDrivers);
      // Default to Max (ver) or first available
      if (allDrivers.length > 0 && !driverId) {
          const defaultDriver = allDrivers.find(d => d.id === 'ver') || allDrivers[0];
          setDriverId(defaultDriver.id);
      }
    };
    loadDrivers();
  }, []);

  const circuit = F1_CIRCUITS.find(c => c.id === circuitId) || F1_CIRCUITS[0];
  const driver = driversList.find(d => d.id === driverId);
  const theoreticalLap = driver ? calculateTheoreticalLap(circuit, startTyre, driverId) : "--:--.---";
  
  const recTyre = weatherData ? getRecommendedTyre(weatherData.rainProb, weatherData.airTemp) : null;
  const recTyreConfig = recTyre ? TYRE_COMPOUNDS[recTyre] : null;

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-neutral-950 to-neutral-950"></div>
      
      <div className="bg-neutral-900 border-t-4 border-red-600 w-full max-w-4xl shadow-2xl z-10 grid grid-cols-1 lg:grid-cols-2">
        
        {/* Left Panel: Inputs */}
        <div className="p-8 space-y-8 border-r border-neutral-800">
          <div className="space-y-2 flex justify-between items-start">
            <div>
                <h1 className="text-4xl font-black italic tracking-tighter text-white skew-box inline-block">
                <span className="unskew">PITWALL.PRO</span>
                </h1>
                <p className="text-red-500 font-bold uppercase tracking-widest text-xs">Advanced Strategy Systems</p>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onContact} className="text-neutral-600 hover:text-white transition-colors" title="Contact Support">
                    <HelpCircle size={18} />
                </button>
                <button onClick={onProfile} className="text-neutral-600 hover:text-white transition-colors" title="My Profile">
                    <User size={18} />
                </button>
                <button onClick={onLogout} className="text-neutral-600 hover:text-white transition-colors" title="Logout">
                    <LogOut size={18} />
                </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Circuit */}
            <div className="space-y-2">
               <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={12} /> Circuit Selection
               </label>
               <select 
                  value={circuitId}
                  onChange={(e) => setCircuitId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white p-3 text-sm font-bold uppercase outline-none focus:border-red-600 transition-colors"
               >
                  {F1_CIRCUITS.map(c => <option key={c.id} value={c.id}>{c.country.toUpperCase()} - {c.name}</option>)}
               </select>
            </div>

            {/* Driver */}
            <div className="space-y-2">
               <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <Trophy size={12} /> Driver Grid
               </label>
               
               <div className="space-y-3">
                   <select 
                      value={driverId}
                      onChange={(e) => setDriverId(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-white p-3 text-sm font-bold uppercase outline-none focus:border-red-600 transition-colors"
                   >
                      {driversList.map(d => <option key={d.id} value={d.id}>{d.number} - {d.name} ({d.team})</option>)}
                   </select>

                   <div className="flex gap-2">
                      <button 
                          onClick={onManageDrivers}
                          className="flex-1 group relative overflow-hidden bg-neutral-900 border border-neutral-700 p-2 hover:border-blue-500 transition-all text-center"
                      >
                          <div className="relative flex items-center justify-center gap-2 text-neutral-400 font-bold uppercase text-[10px] tracking-widest group-hover:text-blue-500 transition-colors">
                            <Database size={12} /> View Database
                          </div>
                      </button>
                      <button 
                          onClick={onAddDriver}
                          className="flex-1 group relative overflow-hidden bg-neutral-900 border border-neutral-700 p-2 hover:border-green-500 transition-all text-center"
                      >
                          <div className="relative flex items-center justify-center gap-2 text-neutral-400 font-bold uppercase text-[10px] tracking-widest group-hover:text-green-500 transition-colors">
                            <Plus size={12} /> New Profile
                          </div>
                      </button>
                   </div>
               </div>
            </div>

            {/* Date & Laps Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} /> Race Start
                </label>
                <input 
                  type="datetime-local"
                  value={raceDate}
                  onChange={(e) => setRaceDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white p-3 text-sm font-mono outline-none focus:border-red-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <Flag size={12} /> Laps
                </label>
                <input 
                  type="number"
                  value={isNaN(laps) ? '' : laps}
                  onChange={(e) => setLaps(parseInt(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white p-3 text-sm font-mono outline-none focus:border-red-600"
                />
              </div>
            </div>

            {/* Tyre Selection */}
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={12} /> Starting Compound
               </label>
               <div className="grid grid-cols-4 gap-2">
                  {(['C1', 'C2', 'C3', 'C4', 'C5', 'INTER', 'WET'] as PirelliCompound[]).map(comp => {
                    const tyre = TYRE_COMPOUNDS[comp];
                    if (!tyre) return null;
                    return (
                      <button 
                        key={comp}
                        onClick={() => setStartTyre(comp)}
                        className={`p-2 border text-[10px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-1 ${startTyre === comp ? 'bg-neutral-800 border-white text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}
                      >
                         <span className="block w-2 h-2 rounded-full" style={{background: tyre.color}}></span>
                         {tyre.name.split('-')[0]}
                      </button>
                    )
                  })}
               </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Sim Preview */}
        <div className="bg-neutral-950 p-8 flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] rounded-full pointer-events-none"></div>
           
           <div>
              <h3 className="text-white font-bold uppercase tracking-widest mb-6 border-b border-neutral-800 pb-2">Simulation Preview</h3>
              
              <div className="space-y-6">
                 {/* This section will update once real data is fetched, for now showing dynamic estimates */}
                 <div className="flex justify-between items-center">
                    <span className="text-neutral-500 text-xs font-bold uppercase">Estimated Weather</span>
                    <span className="text-white font-mono text-sm flex items-center gap-2">
                        {weatherData ? 
                          <><Thermometer size={14} /> {weatherData.airTemp}°C <CloudRain size={14} /> {(weatherData.rainProb*100).toFixed(0)}%</> : 
                          <span className="text-neutral-600 italic">Initializing on start...</span>
                        }
                    </span>
                 </div>
                 
                 <div className="flex justify-between items-center">
                    <span className="text-neutral-500 text-xs font-bold uppercase">Theoretical Lap 1</span>
                    <span className="text-red-500 font-mono text-2xl font-bold">{theoreticalLap}</span>
                 </div>

                 <div className="bg-neutral-900 p-4 border border-neutral-800 mt-4">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="w-1 h-8 bg-white skew-box" style={{backgroundColor: driver?.color || '#333'}}></div>
                       <div>
                          <div className="text-white font-bold uppercase">{driver?.name || "Select Driver"}</div>
                          <div className="text-neutral-500 text-[10px] uppercase font-bold">{driver?.team || "-"}</div>
                       </div>
                    </div>
                    <div className="flex gap-2 text-[10px] uppercase font-bold text-neutral-500 mt-2">
                       <span className="bg-neutral-950 px-2 py-1 rounded">Base Pace: {driver?.basePace.toFixed(2) || "-"}</span>
                       <span className="bg-neutral-950 px-2 py-1 rounded">Tyre Mgmt: {(driver?.tyreManagement || 0 * 100).toFixed(0)}%</span>
                    </div>
                 </div>
              </div>
           </div>

           <button 
              onClick={() => onStart({ circuitId, driverId, laps, startTyre, raceDate, allDrivers: driversList })}
              disabled={isLoading || !driver}
              className="mt-8 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black italic uppercase tracking-widest py-4 w-full skew-box group transition-all"
           >
              <span className="unskew flex items-center justify-center gap-3">
                 {isLoading ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" />}
                 Initialize Strategy
              </span>
           </button>
        </div>
      </div>
    </div>
  )
}

// ... [Keep existing advanceRaceState logic as is] ...
const advanceRaceState = (
    prevState: RaceState, 
    config: RaceConfig, 
    heroId: string, 
    requestBox: boolean,
    heroNextTyre: PirelliCompound | null
): { state: RaceState, boxProcessed: boolean } => {
  const nextLap = prevState.currentLap + 1;
  const isRaining = prevState.rainProbability > 0.3;
  let boxProcessed = false;
  
  const nextDrivers = prevState.drivers.map(d => {
    let status = d.status;
    let stops = d.pitStops;
    let newTyreAge = d.tyreAge + 1;
    let currentTyre = d.currentTyre;
    let gapToLeader = d.gapToLeader;
    let lapTimes = [...d.lapTimes];

    // --- HERO LOGIC ---
    if (d.id === heroId) {
        if (status === 'OnTrack' && requestBox) {
            status = 'Pit';
            boxProcessed = true;
            gapToLeader += 4.5; 
        } else if (status === 'Pit') {
            status = 'OnTrack';
            stops += 1;
            newTyreAge = 0;
            if (heroNextTyre) {
                currentTyre = heroNextTyre;
            } else {
                currentTyre = isRaining ? 'INTER' : (d.currentTyre === 'C3' ? 'C2' : 'C3');
            }
            gapToLeader += (config.pitLossSeconds - 4.5);
        }
    } 
    // --- AI LOGIC ---
    else {
        if (status === 'OnTrack') {
             const tyreModel = TYRE_COMPOUNDS[d.currentTyre];
             const variance = (d.number % 5) - 2; 
             const maxLife = tyreModel.maxLife + variance;
             if (d.tyreAge > maxLife) {
                 status = 'Pit';
                 gapToLeader += 4.5; 
             }
        } else if (status === 'Pit') {
             status = 'OnTrack';
             stops += 1;
             newTyreAge = 0;
             let nextTyre = d.currentTyre;
             if (isRaining) nextTyre = 'INTER';
             else {
                if (d.currentTyre === 'C5' || d.currentTyre === 'C4') nextTyre = 'C3';
                else if (d.currentTyre === 'C3') nextTyre = 'C2';
                else nextTyre = 'C4'; 
             }
             currentTyre = nextTyre;
             gapToLeader += (config.pitLossSeconds - 4.5); 
        }
    }

    if (status === 'OnTrack') {
        const aggressionFactor = d.aggression * 0.2; 
        const gapChange = (Math.random() - 0.45 - (aggressionFactor * 0.1)) * 0.8; 
        gapToLeader = Math.max(0, gapToLeader + gapChange);
        const baseLapTime = config.trackLengthKm * 14; 
        const rainPenalty = isRaining ? (1 - d.wetWeatherAbility) * 1.5 : 0;
        lapTimes.push(baseLapTime + (Math.random() * 1.5) + rainPenalty);
    } else {
        const baseLapTime = config.trackLengthKm * 14;
        lapTimes.push(baseLapTime + config.pitLossSeconds);
    }

    return { ...d, status, gapToLeader, tyreAge: newTyreAge, pitStops: stops, currentTyre, lapTimes };
  });

  nextDrivers.sort((a, b) => a.gapToLeader - b.gapToLeader);
  nextDrivers.forEach((d, i) => d.position = i + 1);

  return {
    state: {
        ...prevState,
        currentLap: nextLap,
        drivers: nextDrivers,
        rainProbability: Math.min(1, Math.max(0, prevState.rainProbability + (Math.random() - 0.5) * 0.05))
    },
    boxProcessed
  };
};

const LiveClock: React.FC<{ timezone: string }> = ({ timezone }) => {
  const [time, setTime] = useState("");
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        setTime(formatter.format(now));
      } catch (e) {
        setTime("--:--:--");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [timezone]);
  return <span className="font-mono text-red-500 font-bold tracking-widest">{time}</span>;
}

const RaceResults: React.FC<{ drivers: Driver[], totalLaps: number, onRestart: () => void }> = ({ drivers, totalLaps, onRestart }) => {
  const sortedDrivers = [...drivers].sort((a, b) => a.position - b.position);
  const winner = sortedDrivers[0];
  const processedDrivers = sortedDrivers.map(d => {
      const totalTime = d.lapTimes.reduce((acc, lap) => acc + lap, 0);
      const bestLap = d.lapTimes.length > 0 ? Math.min(...d.lapTimes) : 0;
      return {
          ...d, totalTime, bestLap, gapToWinner: totalTime - (winner.lapTimes.reduce((acc, lap) => acc + lap, 0))
      }
  });
  const bestLapOfRace = processedDrivers.length > 0 ? Math.min(...processedDrivers.filter(d => d.bestLap > 0).map(d => d.bestLap)) : 0;
  return (
    <div className="absolute inset-0 z-[200] bg-neutral-950/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="w-full max-w-5xl bg-neutral-900 border-y-4 border-red-600 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-neutral-800 flex justify-between items-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                <div>
                   <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">RACE CLASSIFICATION</h1>
                   <div className="flex items-center gap-2 mt-2 text-red-500 font-bold uppercase tracking-widest">
                       <Flag size={20} fill="currentColor" /> OFFICIAL RESULTS
                   </div>
                </div>
                <button 
                  onClick={onRestart}
                  className="bg-white text-black hover:bg-neutral-200 px-8 py-3 font-black uppercase tracking-widest skew-box transition-colors"
                >
                    <span className="unskew flex items-center gap-2">Return to Garage <ChevronRight size={16} /></span>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-0">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-neutral-950 text-neutral-500 text-xs font-bold uppercase tracking-widest sticky top-0 z-10">
                        <tr>
                            <th className="p-4 text-center">Pos</th>
                            <th className="p-4">Driver</th>
                            <th className="p-4 text-right">Time/Gap</th>
                            <th className="p-4 text-center">Stops</th>
                            <th className="p-4 text-right">Best Lap</th>
                            <th className="p-4 text-center">Pts</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 text-sm">
                        {processedDrivers.map((driver, index) => {
                             const isFastestLap = driver.bestLap === bestLapOfRace && bestLapOfRace > 0;
                             const pts = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1][index] || 0;
                             const totalPts = pts + (isFastestLap && index < 10 ? 1 : 0);
                             return (
                                <tr key={driver.id} className="hover:bg-neutral-800/50 transition-colors">
                                    <td className="p-4 text-center font-black text-lg text-white w-16">{driver.position}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-8 skew-box" style={{backgroundColor: driver.color}}></div>
                                            <div>
                                                <div className="font-bold uppercase text-white">{driver.name}</div>
                                                <div className="text-[10px] font-bold uppercase text-neutral-500">{driver.team}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-mono text-neutral-300">
                                        {index === 0 ? formatTime(driver.totalTime) : formatGap(driver.gapToWinner)}
                                    </td>
                                    <td className="p-4 text-center font-bold text-neutral-400">{driver.pitStops}</td>
                                    <td className="p-4 text-right font-mono">
                                        <span className={`${isFastestLap ? 'text-purple-400 font-bold' : 'text-neutral-400'}`}>
                                            {driver.bestLap > 0 ? formatTime(driver.bestLap).slice(3) : '--.---'}
                                        </span>
                                        {isFastestLap && <span className="ml-2 text-[10px] bg-purple-900 text-purple-200 px-1 rounded uppercase font-bold">FL</span>}
                                    </td>
                                    <td className="p-4 text-center font-black text-white bg-neutral-800/20">
                                        {totalPts > 0 ? `+${totalPts}` : '-'}
                                    </td>
                                </tr>
                             )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  )
}

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Track Authentication Mode: LOGIN vs REGISTER
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // New Phases: SETUP, RACE, CREATE_DRIVER, DRIVER_LIST, CONTACT, PROFILE
  const [appPhase, setAppPhase] = useState<'SETUP' | 'RACE' | 'CREATE_DRIVER' | 'DRIVER_LIST' | 'CONTACT' | 'PROFILE'>('SETUP');
  const [creatorView, setCreatorView] = useState<'LIST' | 'FORM'>('LIST');
  const [isInitializing, setIsInitializing] = useState(false);
  const [centerView, setCenterView] = useState<'TELEMETRY' | '3D_MAP'>('3D_MAP');
  
  const [raceConfig, setRaceConfig] = useState<RaceConfig | null>(null);
  const [raceState, setRaceState] = useState<RaceState | null>(null);
  const [heroId, setHeroId] = useState<string>('nor');

  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); 
  const [strategyReport, setStrategyReport] = useState<StrategyReport | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const [tyreAlert, setTyreAlert] = useState<string | null>(null);
  const [criticalFailure, setCriticalFailure] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [boxWindowOpen, setBoxWindowOpen] = useState(false);
  const [boxTimer, setBoxTimer] = useState(0);
  const [recommendedBoxTyre, setRecommendedBoxTyre] = useState<PirelliCompound>('C3');

  const simulationInterval = useRef<number | null>(null);
  const boxTimerInterval = useRef<number | null>(null);
  const heroBoxRequestRef = useRef(false);
  const heroNextTyreRef = useRef<PirelliCompound | null>(null);

  useEffect(() => {
      if (supabase) {
          supabase.auth.getSession().then(({ data, error }) => {
              if (error) {
                  // If the refresh token is invalid, sign out to clear it
                  console.warn("Session error:", error.message);
                  supabase.auth.signOut();
                  setSession(null);
              } else {
                  setSession(data.session);
              }
              setAuthLoading(false);
          });
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
              setSession(session);
              if (_event === 'SIGNED_OUT') {
                  setSession(null);
              }
          });
          return () => subscription.unsubscribe();
      } else {
          setAuthLoading(false); 
      }
  }, []);

  const handleManageDrivers = () => {
    setAppPhase('DRIVER_LIST');
  };

  const handleAddDriver = () => {
    setCreatorView('FORM');
    setAppPhase('CREATE_DRIVER');
  };

  const handleLogout = async () => {
      await signOut();
      setSession(null);
      setAuthMode('LOGIN'); // Default to login on normal logout
  };

  const handleAccountDeleted = async () => {
      await signOut();
      setSession(null);
      setAuthMode('REGISTER'); // Switch to register mode after deletion
      setAppPhase('SETUP');
  };

  // ... [Keep existing Box Logic and Race effects] ...
  const handleBoxBox = () => {
    if (!raceState) return;
    const rec = getRecommendedTyre(raceState.rainProbability, raceState.airTemp);
    setRecommendedBoxTyre(rec);
    setBoxWindowOpen(true);
    setBoxTimer(2); 
    setTyreAlert(null);
  };

  useEffect(() => {
    if (boxWindowOpen && boxTimer > 0) {
        boxTimerInterval.current = window.setInterval(() => {
            setBoxTimer(prev => prev - 1);
        }, 1000);
    } else if (boxWindowOpen && boxTimer === 0) {
        if (boxTimerInterval.current) clearInterval(boxTimerInterval.current);
        confirmBox(recommendedBoxTyre, true);
    }
    return () => {
        if (boxTimerInterval.current) clearInterval(boxTimerInterval.current);
    };
  }, [boxWindowOpen, boxTimer, recommendedBoxTyre]);

  const confirmBox = (tyre: PirelliCompound, isAuto: boolean) => {
    setBoxWindowOpen(false);
    heroNextTyreRef.current = tyre;
    heroBoxRequestRef.current = true;
    if (isAuto) {
        const tyreName = TYRE_COMPOUNDS[tyre].name;
        setToastMessage(`Auto-selected ${tyreName} as user never selected.`);
        setTimeout(() => setToastMessage(null), 4000);
    }
  };

  useEffect(() => {
    if (raceState && raceConfig && raceState.currentLap > raceConfig.totalLaps) {
       const timer = setTimeout(() => { setTyreAlert(null); }, 3000);
       return () => clearTimeout(timer);
    }
  }, [raceState?.currentLap, raceConfig?.totalLaps]);

  const handleStartRace = async (params: any) => {
    setIsInitializing(true);
    setHeroId(params.driverId);
    setCriticalFailure(false);
    setTyreAlert(null);
    setBoxWindowOpen(false);
    setHasStarted(false); 
    setIsRunning(false); 
    
    const circuit = F1_CIRCUITS.find(c => c.id === params.circuitId)!;
    const raceDateObj = new Date(params.raceDate);
    const weather = await fetchRaceConditions(circuit, raceDateObj);

    const config: RaceConfig = {
      circuitId: circuit.id,
      trackName: circuit.name,
      totalLaps: params.laps,
      pitLossSeconds: 24.0, 
      trackLengthKm: circuit.lengthKm,
      timezone: circuit.timezone,
      raceDate: raceDateObj
    };

    // Use full passed list
    const activeDrivers = (params.allDrivers) as Driver[];
    
    const qualyResults = activeDrivers.map(d => {
        const variance = (Math.random() * 0.3) - 0.15; 
        const qualyTime = d.basePace + variance;
        return { ...d, qualyTime };
    });

    qualyResults.sort((a, b) => a.qualyTime - b.qualyTime);

    const driversList = qualyResults.map((d, idx) => {
       let pos = idx + 1;
       let gap = idx * 0.5; 
       let tyre = 'C3' as PirelliCompound;
       if (d.id === params.driverId) tyre = params.startTyre;

       return {
          ...d,
          position: pos,
          gapToLeader: gap,
          currentTyre: tyre,
          tyreAge: 3, 
          lapTimes: [],
          pitStops: 0,
          status: 'OnTrack' as const
       };
    });

    const initialState: RaceState = {
      currentLap: 1, 
      drivers: driversList,
      trackTemp: weather.trackTemp,
      airTemp: weather.airTemp,
      rainProbability: weather.rainProb,
      safetyCarProbability: 0.05,
      isVirtualSafetyCar: false,
      isSafetyCar: false
    };

    setRaceConfig(config);
    setRaceState(initialState);
    setAppPhase('RACE');
    setIsInitializing(false);
  };

  // ... [Keep Simulation Loop] ...
  useEffect(() => {
    if (appPhase === 'RACE' && isRunning && raceState && raceConfig && raceState.currentLap <= raceConfig.totalLaps) {
      simulationInterval.current = window.setInterval(() => {
        setRaceState(prev => {
            if (!prev) return null;
            const hero = prev.drivers.find(d => d.id === heroId);
            if (hero) {
                const tyreModel = TYRE_COMPOUNDS[hero.currentTyre];
                if (hero.tyreAge >= tyreModel.maxLife && hero.status === 'OnTrack') {
                    setCriticalFailure(true);
                    setIsRunning(false);
                    return prev;
                }
                if (hero.tyreAge >= tyreModel.maxLife - 3 && hero.status === 'OnTrack') {
                    setTyreAlert("TYRES CRITICAL! BOX NOW!");
                } else {
                    setTyreAlert(null);
                }
            }
            const { state, boxProcessed } = advanceRaceState(prev, raceConfig, heroId, heroBoxRequestRef.current, heroNextTyreRef.current);
            if (boxProcessed) heroBoxRequestRef.current = false;
            return state;
        });
      }, 4000); 
    } else {
      if (simulationInterval.current !== null) window.clearInterval(simulationInterval.current);
    }
    return () => {
      if (simulationInterval.current !== null) window.clearInterval(simulationInterval.current);
    };
  }, [isRunning, raceState?.currentLap, appPhase, raceConfig, heroId]);

  const runStrategyEngine = useCallback(async () => {
    if (!raceState || !raceConfig) return;
    setIsSimulating(true);
    setTimeout(async () => {
        const mcResults = runMonteCarloSimulation(raceState, raceConfig, heroId, 200);
        const strategies = generateStrategies(raceState, raceConfig, heroId);
        const heroDriver = raceState.drivers.find(d => d.id === heroId);
        if (heroDriver) {
             const explanation = await generateStrategyExplanation(raceState, raceConfig, heroDriver, mcResults, strategies);
            setStrategyReport({
                recommendedStrategyId: strategies[0].id,
                strategies,
                simulationCount: 200,
                winProbability: mcResults.winProb,
                podiumProbability: mcResults.podiumProb,
                explanation: explanation,
                lastUpdatedLap: raceState.currentLap
            });
        }
        setIsSimulating(false);
    }, 100);
  }, [raceState, raceConfig, heroId]);

  useEffect(() => {
    if (appPhase === 'RACE' && raceState && (raceState.currentLap % 5 === 0 || !strategyReport)) {
        runStrategyEngine();
    }
  }, [raceState?.currentLap, appPhase]);

  // --- Auth Guard ---
  if (authLoading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center"><Loader2 className="animate-spin text-red-600" size={48} /></div>;
  if (supabase && !session) return <AuthScreen onAuthSuccess={() => {}} initialMode={authMode} />;

  // --- View Controller ---
  if (appPhase === 'CONTACT') {
      return (
          <ContactAdmin onBack={() => setAppPhase('SETUP')} />
      );
  }

  if (appPhase === 'DRIVER_LIST') {
      return (
          <DriverList 
            onBack={() => setAppPhase('SETUP')} 
            onAddNew={() => setAppPhase('CREATE_DRIVER')} 
            onContact={() => setAppPhase('CONTACT')}
          />
      );
  }

  if (appPhase === 'PROFILE') {
      return (
          <UserProfile 
              onBack={() => setAppPhase('SETUP')}
              onLogout={handleLogout}
              onAccountDeleted={handleAccountDeleted}
          />
      )
  }

  if (appPhase === 'CREATE_DRIVER') {
    return (
      <DriverAssessment 
        onBack={() => setAppPhase('SETUP')} 
        onSuccess={() => setAppPhase('DRIVER_LIST')}
        initialView={creatorView}
      />
    );
  }

  if (appPhase === 'SETUP') {
    return (
      <SetupScreen 
        onStart={handleStartRace} 
        isLoading={isInitializing} 
        onManageDrivers={handleManageDrivers}
        onAddDriver={handleAddDriver}
        onLogout={handleLogout}
        onContact={() => setAppPhase('CONTACT')}
        onProfile={() => setAppPhase('PROFILE')}
      />
    );
  }

  if (!raceConfig || !raceState) return null;

  // ... [Keep Race UI Return] ...
  const recommendedTyre = getRecommendedTyre(raceState.rainProbability, raceState.airTemp);
  const recommendedTyreConfig = TYRE_COMPOUNDS[recommendedTyre];
  const heroStatus = raceState.drivers.find(d => d.id === heroId)?.status || 'OnTrack';
  const isPitting = heroStatus === 'Pit';
  const boxPending = heroBoxRequestRef.current;
  const isFinished = raceState.currentLap > raceConfig.totalLaps;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans relative">
      {isFinished && <RaceResults drivers={raceState.drivers} totalLaps={raceConfig.totalLaps} onRestart={() => setAppPhase('SETUP')} />}
      
      {/* Alerts Overlay */}
      {criticalFailure && (
          <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm">
             <div className="bg-neutral-900 border-2 border-red-600 p-8 max-w-lg w-full text-center shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                 <XOctagon size={64} className="mx-auto text-red-600 mb-6 animate-pulse" />
                 <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">CRITICAL TYRE FAILURE</h2>
                 <p className="text-neutral-400 font-mono text-sm mb-8">
                    Your tyre life exceeded the structural limit. The simulation has been terminated to prevent catastrophic failure.
                 </p>
                 <button onClick={() => setAppPhase('SETUP')} className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest px-8 py-3 w-full skew-box">
                    <span className="unskew">Return to Garage</span>
                 </button>
             </div>
          </div>
      )}

      {tyreAlert && !criticalFailure && !boxWindowOpen && (
         <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[90] animate-bounce">
            <div className="bg-yellow-500 text-black px-6 py-3 font-black uppercase tracking-widest flex items-center gap-3 shadow-[0_0_20px_rgba(234,179,8,0.6)] skew-box border-2 border-black">
                <AlertTriangle size={24} className="unskew" />
                <span className="unskew">{tyreAlert}</span>
            </div>
         </div>
      )}

      {toastMessage && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[90] animate-in fade-in slide-in-from-top-4 duration-300">
             <div className="bg-neutral-800 text-white px-6 py-3 font-bold uppercase tracking-widest flex items-center gap-3 shadow-xl border border-neutral-600 rounded">
                 <Box size={18} className="text-blue-400" />
                 {toastMessage}
             </div>
          </div>
      )}

      {/* TYRE SELECTION MODAL */}
      {boxWindowOpen && (
          <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm">
             <div className="bg-neutral-900 border-2 border-white p-6 max-w-3xl w-full shadow-2xl relative">
                 <div className="flex justify-between items-start mb-6">
                     <div>
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">PIT CONFIRMATION</h2>
                        <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-widest mt-1">
                            <TimerIcon size={16} className="animate-pulse" />
                            AUTO-SELECT IN {boxTimer}s
                        </div>
                     </div>
                     <button onClick={() => setBoxWindowOpen(false)} className="text-neutral-500 hover:text-white"><X size={32} /></button>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {(['C1', 'C2', 'C3', 'C4', 'C5', 'INTER', 'WET'] as PirelliCompound[]).map(comp => {
                         const tyre = TYRE_COMPOUNDS[comp];
                         const isRecommended = comp === recommendedBoxTyre;
                         return (
                            <button 
                                key={comp}
                                onClick={() => confirmBox(comp, false)}
                                className={`relative group p-4 border-2 transition-all hover:scale-105 ${isRecommended ? 'border-green-500 bg-green-900/10' : 'border-neutral-700 bg-neutral-800 hover:border-white'}`}
                            >
                                {isRecommended && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Recommended</div>}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-full border-4 border-dashed animate-spin-slow" style={{ borderColor: tyre.color, borderStyle: 'dashed' }}></div>
                                    <div className="text-center">
                                        <div className="font-black text-xl uppercase">{tyre.name.split('-')[0]}</div>
                                        <div className="text-[10px] font-bold uppercase text-neutral-400">{tyre.type}</div>
                                    </div>
                                </div>
                            </button>
                         )
                     })}
                 </div>
                 <div className="mt-6 bg-neutral-950 p-4 border-l-4 border-yellow-500 text-sm text-neutral-400 font-mono">
                     <span className="text-yellow-500 font-bold">STRATEGY NOTE:</span> Current conditions favor {TYRE_COMPOUNDS[recommendedBoxTyre].name}. 
                     Confirm selection immediately.
                 </div>
             </div>
          </div>
      )}

      {/* Main Race Interface Header and Grid */}
      <header className="h-14 border-b border-red-900/30 bg-neutral-950 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <Activity className="text-red-600 animate-pulse" size={20} />
               <h1 className="text-xl font-black italic tracking-tighter text-white">PITWALL<span className="text-red-600">.PRO</span></h1>
            </div>
            <div className="h-8 w-px bg-neutral-800 skew-x-[-12deg]"></div>
            <div className="flex items-center gap-6 text-sm font-bold uppercase tracking-widest text-neutral-500">
                <span className="text-white flex items-center gap-2"><MapPin size={14} className="text-red-600" /> {raceConfig.trackName}</span>
                <span className="flex items-center gap-2"><Clock size={14} className="text-red-600" /> <LiveClock timezone={raceConfig.timezone} /></span>
                <span className="text-white border border-neutral-700 px-2 py-0.5 rounded-sm">{isFinished ? "CHEQUERED FLAG" : `LAP ${raceState.currentLap}/${raceConfig.totalLaps}`}</span>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={runStrategyEngine} disabled={isSimulating || isFinished} className="flex items-center gap-2 px-4 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase tracking-widest border-l-2 border-red-600 transition-colors disabled:opacity-50"><Zap size={14} className={isSimulating ? 'text-yellow-400' : 'text-neutral-400'} /> {isSimulating ? 'Computing...' : 'Update Strategy'}</button>
             {!hasStarted ? (
                 <button onClick={() => { setHasStarted(true); setIsRunning(true); }} className="flex items-center gap-2 px-6 py-1 bg-green-600 hover:bg-green-500 text-white font-black italic uppercase tracking-widest text-sm transition-all skew-box shadow-[0_0_15px_rgba(34,197,94,0.4)]"><span className="unskew flex items-center gap-2"><Flag size={14} fill="currentColor" /> LIGHTS OUT</span></button>
             ) : (
                <button onClick={() => setIsRunning(!isRunning)} disabled={criticalFailure || isFinished} className={`flex items-center gap-2 px-4 py-1 font-bold italic uppercase tracking-widest text-xs transition-all border border-neutral-700 ${isRunning ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed'}`}>{isRunning ? <><Pause size={14} /> PAUSE SIM</> : <><Play size={14} /> RESUME</>}</button>
             )}
            <button onClick={handleBoxBox} disabled={isPitting || boxPending || criticalFailure || boxWindowOpen || isFinished || !isRunning} className={`flex items-center gap-2 px-6 py-1 font-black italic uppercase tracking-widest text-sm transition-all skew-box ${isPitting ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : boxPending ? 'bg-yellow-500 text-black animate-pulse' : tyreAlert ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.8)]' : 'bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 disabled:bg-neutral-800 disabled:text-neutral-600'}`}><span className="unskew flex gap-2 items-center">{isPitting ? "IN PIT LANE" : boxPending ? "BOX CONFIRMED" : <><Box size={16} fill="currentColor" /> BOX THIS LAP</>}</span></button>
            <button onClick={() => setAppPhase('SETUP')} className="text-neutral-500 hover:text-white transition-colors"><Settings size={20} /></button>
        </div>
      </header>

      <main className="p-4 grid grid-cols-12 gap-4 lg:h-[calc(100vh-3.5rem)] lg:overflow-hidden h-auto overflow-y-auto">
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 lg:overflow-y-auto h-auto lg:h-full">
            <div className="flex-1 min-h-[400px]"><StrategyCard report={strategyReport} loading={isSimulating} /></div>
            {/* Environment Card */}
            <div className="bg-neutral-900 border-l-4 border-blue-500 p-4 grid grid-cols-2 gap-y-4 shadow-lg relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 p-4 opacity-5"><CloudRain size={64} /></div>
                <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1 border-b border-neutral-800 pb-2">Track Conditions</div>
                <div><div className="text-[10px] text-neutral-500 font-bold uppercase">Track Temp</div><div className="text-xl font-mono text-white">{raceState.trackTemp.toFixed(1)}°C</div></div>
                <div><div className="text-[10px] text-neutral-500 font-bold uppercase">Air Temp</div><div className="text-xl font-mono text-white">{raceState.airTemp.toFixed(1)}°C</div></div>
                <div><div className="text-[10px] text-neutral-500 font-bold uppercase">Rain Risk</div><div className={`text-xl font-mono ${raceState.rainProbability > 0.4 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>{(raceState.rainProbability * 100).toFixed(0)}%</div></div>
                 <div><div className="text-[10px] text-neutral-500 font-bold uppercase">Fastest Tyre</div><div className="text-sm font-bold text-white uppercase bg-neutral-800 px-2 py-1 rounded inline-block mt-1 border border-neutral-700"><span className="w-2 h-2 rounded-full inline-block mr-2" style={{backgroundColor: recommendedTyreConfig.color}}></span>{recommendedTyreConfig.name.split('-')[1] || recommendedTyreConfig.name}</div></div>
            </div>
        </div>

        <div className="col-span-12 lg:col-span-6 flex flex-col lg:overflow-hidden relative h-[500px] lg:h-full">
            <div className="absolute top-2 right-4 z-20 flex bg-neutral-950 rounded border border-neutral-800">
                <button onClick={() => setCenterView('3D_MAP')} className={`px-3 py-1.5 flex items-center gap-2 text-[10px] font-bold uppercase transition-colors ${centerView === '3D_MAP' ? 'bg-red-600 text-white' : 'text-neutral-500 hover:text-white'}`}><Box size={14} /> Holotable</button>
                <button onClick={() => setCenterView('TELEMETRY')} className={`px-3 py-1.5 flex items-center gap-2 text-[10px] font-bold uppercase transition-colors ${centerView === 'TELEMETRY' ? 'bg-red-600 text-white' : 'text-neutral-500 hover:text-white'}`}><Layers size={14} /> Telemetry</button>
            </div>
            {centerView === 'TELEMETRY' ? (<TelemetryPanel drivers={raceState.drivers} heroId={heroId} />) : (<TrackMap3D drivers={raceState.drivers} heroId={heroId} circuitId={raceConfig.circuitId} isRunning={isRunning} />)}
        </div>

        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-auto lg:h-full">
             <div className="bg-neutral-900 border-t-4 border-neutral-700 h-[300px] lg:h-1/3 p-4 flex flex-col min-h-0">
                 <div className="flex-1 min-h-0 w-full"><AnalyticsPanel simulationResults={runMonteCarloSimulation(raceState, raceConfig, heroId, 50).results} heroId={heroId} strategies={strategyReport?.strategies || []} currentLap={raceState.currentLap} totalLaps={raceConfig.totalLaps} /></div>
             </div>
             <div className="bg-neutral-900 border-t-4 border-neutral-700 h-[400px] lg:h-2/3 p-4 relative overflow-hidden flex flex-col">
                 <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4 shrink-0">Pace Analysis</h3>
                 <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none"><Gauge size={120} /></div>
                 <div className="space-y-4 relative z-10 mt-4 flex-1 overflow-y-auto">
                     <div className="flex justify-between items-end border-b border-neutral-800 pb-2"><span className="text-xs font-bold uppercase text-red-500">Your Last Lap</span><span className="text-2xl font-mono font-bold text-white">{raceState.drivers.find(d => d.id === heroId)?.lapTimes.slice(-1)[0]?.toFixed(3) || '--.---'}</span></div>
                     <div className="flex justify-between items-end border-b border-neutral-800 pb-2"><span className="text-xs font-bold uppercase text-neutral-500">Target Pace</span><span className="text-xl font-mono text-neutral-400">{(raceConfig.trackLengthKm * 14.5).toFixed(3)}</span></div>
                     <div className="flex justify-between items-end"><span className="text-xs font-bold uppercase text-neutral-500">Delta</span><span className="text-lg font-mono text-green-500">-0.245</span></div>
                 </div>
             </div>
        </div>
      </main>
    </div>
  );
};

export default App;
