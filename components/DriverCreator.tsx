
import React, { useState, useMemo } from 'react';
import { Save, User, ArrowLeft, Brain, Cpu, Zap, Activity, BarChart2, Radio, CheckCircle2, ChevronRight, AlertTriangle, Home } from 'lucide-react';
import { Driver } from '../types';
import { saveDriver } from '../services/driverService';
import { supabase } from '../services/supabaseClient';

interface DriverCreatorProps {
  onBack: () => void;
  onSuccess: () => void;
  initialView?: 'LIST' | 'FORM';
}

// ... [Keep existing QUESTION constant and Types] ...
type Domain = 'STRATEGY' | 'TIRE' | 'RACECRAFT' | 'TECHNICAL' | 'MENTAL' | 'ANALYTICAL';

interface Question {
  id: number;
  domain: Domain;
  text: string;
  subText?: string;
  dataContext?: any; 
  options: {
    text: string;
    score: number; 
    explanation?: string; 
  }[];
}

const QUESTIONS: Question[] = [
  // 1. STRATEGIC IQ (25%)
  {
    id: 1,
    domain: 'STRATEGY',
    text: "Safety Car Delta & Restart Offset",
    subText: "Lap 42/57. SC Deployed. You are P3 on Used Hards (12 laps old). P1 & P2 stay out. P4 pits for fresh Softs. Air temp 18°C (Cool). Tire warm-up is critical.",
    options: [
      { text: "Stay out. Track position is king. Defend P3 with cold Hards.", score: 40 },
      { text: "Pit for Used Softs. Sacrifice P3 for P6, betting on 1.5s/lap pace advantage.", score: 85 },
      { text: "Pit for New Mediums. Balance warm-up vs degradation for 15 lap sprint.", score: 100 }, // Optimal balance
      { text: "Ask for 'Time to Catch' metrics on P4's fresh Softs vs my Used Hards.", score: 90 } // Good analytical approach
    ]
  },
  {
    id: 2,
    domain: 'STRATEGY',
    text: "Undercut Protection vs Overcut Potential",
    subText: "Rival in P4 (1.8s behind) pits. You are P3. High degradation track, but hard to overtake. Your tires are entering the 'cliff' phase.",
    options: [
      { text: "Cover immediately (Undercut defense). Hold track position.", score: 95 }, // Standard defense
      { text: "Extend stint (Overcut). Use free air to build tire offset for end of race.", score: 60 }, // Risky on high deg
      { text: "Ignore rival, stick to Plan A target lap.", score: 30 },
      { text: "Push 100% for one lap (In-Lap) then pit to clear the undercut window.", score: 80 }
    ]
  },
  // 2. TIRE MGMT (20%)
  {
    id: 3,
    domain: 'TIRE',
    text: "Carcass vs Surface Temperature",
    subText: "Telemetry shows Front Left Surface Temp optimal (100°C), but Carcass Temp critical (>145°C). High energy corner sequence approaching.",
    options: [
      { text: "Push hard, surface temp is fine.", score: 10 },
      { text: "Back off entry speed to reduce lateral load (Cool Carcass).", score: 100 }, // Correct physics
      { text: "Increase brake bias to front to generate surface heat.", score: 0 }, // Dangerous
      { text: "Open the differential on entry to reduce scrubbing.", score: 70 } // Partial help
    ]
  },
  {
    id: 4,
    domain: 'TIRE',
    text: "Graining Phase Management",
    subText: "Front tires showing signs of graining (rubber tearing/rolling). Understeer increasing.",
    options: [
      { text: "Push through the graining phase to clean the surface.", score: 80 }, // Valid technique if managed well
      { text: "Box immediately, tires are done.", score: 40 },
      { text: "Protect the front axle, reduce steering angle, wait for track evolution.", score: 100 }, // Professional patience
      { text: "Shift brake bias rearward to help rotation.", score: 60 }
    ]
  },
  // 3. RACECRAFT (20%)
  {
    id: 5,
    domain: 'RACECRAFT',
    text: "Energy Deployment (ERS) Defense",
    subText: "Last lap. Battery at 15%. Rival has DRS and 60% Battery. Long straight ahead.",
    options: [
      { text: "Deploy everything at start of straight (0-200kph).", score: 30 }, // Inefficient drag penalty
      { text: "Save for top speed defense (280kph+) to counter DRS.", score: 100 }, // Efficient deployment
      { text: "Deploy in 'K2' mode (Sustained) throughout the lap.", score: 50 },
      { text: "Lift and coast early in corners to regen, sacrifice exit for late straight defense.", score: 80 }
    ]
  },
  {
    id: 6,
    domain: 'RACECRAFT',
    text: "Wet Line Evolution",
    subText: "Track drying. Slick tires fitted. Damp patches offline. Rival defending the dry line.",
    options: [
      { text: "Send it down the inside on the damp patch.", score: 20 }, // Suicide
      { text: "Cross-over maneuver. Brake late outside (dry), cut back inside on exit.", score: 100 }, // Textbook
      { text: "Follow closely and wait for DRS activation.", score: 60 },
      { text: "Drive off-line to cool wet tires.", score: 40 }
    ]
  },
  // 4. TECHNICAL (15%)
  {
    id: 7,
    domain: 'TECHNICAL',
    text: "Aero Balance & Migration",
    subText: "Car has 'Snap Oversteer' on entry, but 'Understeer' mid-corner. Center of Pressure (CoP) migration issue.",
    options: [
      { text: "Stiffen Front Springs to stabilize platform.", score: 90 },
      { text: "Increase Rear Wing angle for more total downforce.", score: 50 }, // Doesn't fix balance shift
      { text: "Move Brake Bias Rearward.", score: 20 }, // Makes entry worse
      { text: "Soften Rear Anti-Roll Bar.", score: 70 }
    ]
  },
  {
    id: 8,
    domain: 'TECHNICAL',
    text: "Differential Settings",
    subText: "Struggling with traction on corner exit. Rear tires overheating.",
    options: [
      { text: "Lock the differential (100%) for max traction.", score: 30 }, // More tire scrub
      { text: "Open the differential (lower %) to allow wheel speed variance.", score: 100 }, // Smoother delivery
      { text: "Increase engine braking.", score: 50 },
      { text: "Soften rear suspension.", score: 80 }
    ]
  },
  // 5. MENTAL (10%)
  {
    id: 9,
    domain: 'MENTAL',
    text: "Cognitive Load Management",
    subText: "Engineer talking during complex braking zone while managing a switch change.",
    options: [
      { text: "Shout 'Shut up!'", score: 40 },
      { text: "Ignore and process later.", score: 60 },
      { text: "Prioritize driving, acknowledge switch on exit, ask for repeat on straight.", score: 100 }, // Professional compartmentalization
      { text: "Try to do it all.", score: 20 }
    ]
  },
  // 6. ANALYTICAL (10%)
  {
    id: 10,
    domain: 'ANALYTICAL',
    text: "Telemetry Trace Analysis",
    subText: "Comparing trace vs Teammate. You lose 0.2s in Turn 4. Your trace shows earlier throttle pickup but lower minimum speed (V-shape). Teammate has later throttle but higher min speed (U-shape).",
    dataContext: [
      { lap: "YOU", throttle: "Early (Apex)", speed: "Low Min", style: "V-Style" },
      { lap: "TEAM", throttle: "Late (Exit)", speed: "High Min", style: "U-Style" }
    ],
    options: [
      { text: "Brake later to match teammate.", score: 30 },
      { text: "Carry more rolling speed, delay throttle (adopt U-shape line).", score: 100 }, // Adaptability
      { text: "Get on throttle even earlier.", score: 10 },
      { text: "Increase entry speed and hope for grip.", score: 20 }
    ]
  }
];


const DriverAssessment: React.FC<DriverCreatorProps> = ({ onBack, onSuccess }) => {
  const [phase, setPhase] = useState<'INTRO' | 'QUIZ' | 'RESULTS'>('INTRO');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({}); 
  const [driverIdentity, setDriverIdentity] = useState({ name: '', team: '', number: '99', color: '#ff0000' });
  const [isSaving, setIsSaving] = useState(false);

  // --- Calculations ---
  
  const calculateStats = useMemo(() => {
    if (Object.keys(answers).length === 0) return null;

    const scores = { STRATEGY: 0, TIRE: 0, RACECRAFT: 0, TECHNICAL: 0, MENTAL: 0, ANALYTICAL: 0 };
    const counts = { ...scores };

    QUESTIONS.forEach(q => {
        if (answers[q.id] !== undefined) {
            scores[q.domain] += answers[q.id];
            // @ts-ignore
            counts[q.domain] += 100; 
        }
    });

    const normalized = {
        STRATEGY: (scores.STRATEGY / counts.STRATEGY) * 100,
        TIRE: (scores.TIRE / counts.TIRE) * 100,
        RACECRAFT: (scores.RACECRAFT / counts.RACECRAFT) * 100,
        TECHNICAL: (scores.TECHNICAL / counts.TECHNICAL) * 100,
        MENTAL: (scores.MENTAL / counts.MENTAL) * 100,
        ANALYTICAL: (scores.ANALYTICAL / counts.ANALYTICAL) * 100,
    };

    const rawPaceScore = (normalized.TECHNICAL * 0.4 + normalized.ANALYTICAL * 0.3 + normalized.RACECRAFT * 0.3);
    const basePace = parseFloat((1 - (rawPaceScore / 100)).toFixed(3));

    return {
        basePace: Math.max(0.05, basePace), 
        consistency: ((normalized.MENTAL * 0.6 + normalized.STRATEGY * 0.4) / 100),
        tyreManagement: ((normalized.TIRE * 0.7 + normalized.ANALYTICAL * 0.3) / 100),
        aggression: ((normalized.RACECRAFT * 0.8 + normalized.MENTAL * 0.2) / 100),
        wetWeatherAbility: ((normalized.ANALYTICAL * 0.5 + normalized.RACECRAFT * 0.5) / 100),
        domains: normalized
    };

  }, [answers]);

  // --- Handlers ---
  const handleAnswer = (score: number) => {
    setAnswers(prev => ({ ...prev, [QUESTIONS[currentQIndex].id]: score }));
  };

  const nextQuestion = () => {
    if (currentQIndex < QUESTIONS.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      setPhase('RESULTS');
    }
  };

  const handleSave = async () => {
    if (!calculateStats) return;
    setIsSaving(true);
    
    // User check handled inside saveDriver service via supabase call usually, but explicit check here is fine
    const payload: Driver = {
        id: `drv_${Date.now()}`,
        name: driverIdentity.name,
        team: driverIdentity.team,
        number: parseInt(driverIdentity.number),
        color: driverIdentity.color,
        // Default State
        position: 0, gapToLeader: 0, currentTyre: 'C3', tyreAge: 0, lapTimes: [], pitStops: 0, status: 'OnTrack',
        // Stats
        basePace: calculateStats.basePace,
        consistency: calculateStats.consistency,
        tyreManagement: calculateStats.tyreManagement,
        aggression: calculateStats.aggression,
        wetWeatherAbility: calculateStats.wetWeatherAbility
    };

    try {
        await saveDriver(payload);
        onSuccess(); // Redirect to List
    } catch (e) {
        console.error(e);
        alert("Failed to save driver. Please try again.");
    } finally {
        setIsSaving(false);
    }
  };

  // --- Views ---

  if (phase === 'INTRO') {
      return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center relative">
            <button onClick={onBack} className="absolute top-6 left-6 text-neutral-500 hover:text-white flex items-center gap-2 uppercase font-bold text-xs tracking-widest">
                <Home size={16} /> Return to Garage
            </button>

            <div className="max-w-2xl space-y-8 animate-in fade-in duration-700">
                <div className="flex justify-center">
                    <Brain size={64} className="text-red-600 animate-pulse" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black italic text-white uppercase tracking-tighter">
                    F1 Competency <span className="text-red-600">Assessment</span>
                </h1>
                <p className="text-neutral-400 text-lg max-w-xl mx-auto leading-relaxed">
                    This is not a character creator. This is a psychometric evaluation of your Race IQ, technical knowledge, and mental resilience. 
                    Your simulation performance will be directly derived from your answers.
                </p>
                
                <div className="bg-neutral-900 border border-neutral-800 p-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="space-y-4">
                        <h3 className="text-neutral-500 font-bold uppercase tracking-widest text-xs border-b border-neutral-800 pb-2">Identity</h3>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-neutral-500">Driver Name</label>
                            <input value={driverIdentity.name} onChange={e => setDriverIdentity({...driverIdentity, name: e.target.value})} className="w-full bg-neutral-950 border border-neutral-800 text-white p-2 font-bold uppercase focus:border-red-600 outline-none" placeholder="Enter Name" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-neutral-500">Team</label>
                            <input value={driverIdentity.team} onChange={e => setDriverIdentity({...driverIdentity, team: e.target.value})} className="w-full bg-neutral-950 border border-neutral-800 text-white p-2 font-bold uppercase focus:border-red-600 outline-none" placeholder="Enter Team" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="space-y-2 flex-1">
                                <label className="text-[10px] uppercase font-bold text-neutral-500">Number</label>
                                <input type="number" value={driverIdentity.number} onChange={e => setDriverIdentity({...driverIdentity, number: e.target.value})} className="w-full bg-neutral-950 border border-neutral-800 text-white p-2 font-mono font-bold focus:border-red-600 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-neutral-500">Color</label>
                                <input type="color" value={driverIdentity.color} onChange={e => setDriverIdentity({...driverIdentity, color: e.target.value})} className="h-10 w-16 bg-transparent cursor-pointer" />
                            </div>
                        </div>
                    </div>
                </div>

                <button 
                    disabled={!driverIdentity.name || !driverIdentity.team}
                    onClick={() => setPhase('QUIZ')}
                    className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black italic uppercase tracking-widest px-10 py-4 text-xl skew-box transition-all"
                >
                    <span className="unskew flex items-center gap-2">Begin Evaluation <ChevronRight /></span>
                </button>
            </div>
        </div>
      )
  }

  // ... [Keep QUIZ and RESULTS phase same but ensure RESULTS button uses handleSave which now navigates] ...
  if (phase === 'QUIZ') {
      const q = QUESTIONS[currentQIndex];
      const hasAnswered = answers[q.id] !== undefined;

      return (
        <div className="min-h-screen bg-neutral-950 flex flex-col p-6">
            <div className="w-full h-1 bg-neutral-900 mb-8">
                <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${((currentQIndex + 1) / QUESTIONS.length) * 100}%` }}></div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
                <div className="w-full mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-red-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                           <Activity size={14} /> Domain: {q.domain}
                        </span>
                        <span className="text-neutral-500 font-mono text-xs">Q{currentQIndex + 1}/{QUESTIONS.length}</span>
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">{q.text}</h2>
                    
                    <div className="bg-neutral-900 border-l-4 border-blue-500 p-6 mb-8 text-neutral-300 font-mono text-sm leading-relaxed">
                        {q.subText}
                    </div>

                    {q.dataContext && (
                        <div className="mb-8 overflow-x-auto">
                            <table className="w-full text-sm text-left text-neutral-400">
                                <thead className="bg-neutral-900 uppercase text-xs font-bold text-neutral-500">
                                    <tr>
                                        <th className="px-4 py-2">Lap/Driver</th>
                                        {/* Dynamic headers based on data keys */}
                                        {Object.keys(q.dataContext[0]).filter(k => k !== 'lap').map(key => (
                                            <th key={key} className="px-4 py-2 capitalize">{key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800">
                                    {q.dataContext.map((d: any, i: number) => (
                                        <tr key={i} className="bg-neutral-900/50">
                                            <td className="px-4 py-2 font-mono text-white">{d.lap}</td>
                                            {Object.keys(d).filter(k => k !== 'lap').map(key => (
                                                <td key={key} className="px-4 py-2 font-mono text-yellow-500">{d[key]}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {q.options.map((opt, idx) => {
                        const selected = answers[q.id] === opt.score;
                        return (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(opt.score)}
                                className={`p-6 text-left border transition-all group ${selected 
                                    ? 'bg-red-600 border-red-600 text-white' 
                                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white'}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center ${selected ? 'border-white' : 'border-neutral-600 group-hover:border-white'}`}>
                                        {selected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <span className="font-bold text-sm uppercase leading-relaxed">{opt.text}</span>
                                </div>
                            </button>
                        )
                    })}
                </div>

                <div className="mt-8 flex justify-end w-full">
                    <button 
                        disabled={!hasAnswered}
                        onClick={nextQuestion}
                        className="bg-white text-black hover:bg-neutral-200 disabled:opacity-0 disabled:translate-y-4 transition-all px-8 py-3 font-black uppercase tracking-widest skew-box"
                    >
                        <span className="unskew flex items-center gap-2">
                            {currentQIndex === QUESTIONS.length - 1 ? 'Complete Assessment' : 'Next Scenario'} <ChevronRight size={16} />
                        </span>
                    </button>
                </div>
            </div>
        </div>
      )
  }

  if (phase === 'RESULTS' && calculateStats) {
      return (
        <div className="min-h-screen bg-neutral-950 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-black italic text-white uppercase">Evaluation Report</h1>
                        <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Subject: {driverIdentity.name}</p>
                    </div>
                    <button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 font-black uppercase tracking-widest skew-box transition-all">
                        <span className="unskew flex items-center gap-2">
                           {isSaving ? <><Cpu className="animate-spin" /> Processing...</> : <><Save /> Sign & Register</>}
                        </span>
                    </button>
                </div>

                {/* Disclaimer */}
                <div className="bg-yellow-900/10 border border-yellow-600/30 p-4 mb-8 flex items-start gap-3 rounded-sm">
                    <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                    <div>
                        <h4 className="text-yellow-500 font-bold uppercase text-xs tracking-widest mb-1">Simulation Disclaimer</h4>
                        <p className="text-neutral-400 text-sm font-mono leading-relaxed">
                            These statistics are generated based solely on your assessment responses. They are a simulation of user inputs and do not reflect the actual real-world performance data of the driver.
                        </p>
                    </div>
                </div>

                {/* Report Content - Same as before */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Stats Card */}
                    <div className="lg:col-span-1 bg-neutral-900 border-t-4 border-red-600 p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-[50px] pointer-events-none"></div>
                        <div className="text-center mb-8">
                             <div className="w-20 h-20 bg-neutral-950 rounded-full mx-auto border-2 border-neutral-800 flex items-center justify-center mb-4">
                                <span className="text-3xl font-black italic text-white">{driverIdentity.number}</span>
                             </div>
                             <h2 className="text-2xl font-bold text-white uppercase">{driverIdentity.name}</h2>
                             <div className="text-red-500 font-bold uppercase text-sm">{driverIdentity.team}</div>
                        </div>

                        <div className="space-y-6">
                             <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase text-neutral-500">
                                   <span>Pace Index</span>
                                   <span className="text-white">{((1 - calculateStats.basePace) * 100).toFixed(0)}</span>
                                </div>
                                <div className="h-2 bg-neutral-950 rounded-full overflow-hidden">
                                   <div className="h-full bg-blue-500" style={{ width: `${(1 - calculateStats.basePace) * 100}%` }}></div>
                                </div>
                             </div>
                             <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase text-neutral-500">
                                   <span>Consistency</span>
                                   <span className="text-white">{(calculateStats.consistency * 100).toFixed(0)}</span>
                                </div>
                                <div className="h-2 bg-neutral-950 rounded-full overflow-hidden">
                                   <div className="h-full bg-green-500" style={{ width: `${calculateStats.consistency * 100}%` }}></div>
                                </div>
                             </div>
                             <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase text-neutral-500">
                                   <span>Aggression</span>
                                   <span className="text-white">{(calculateStats.aggression * 100).toFixed(0)}</span>
                                </div>
                                <div className="h-2 bg-neutral-950 rounded-full overflow-hidden">
                                   <div className="h-full bg-orange-500" style={{ width: `${calculateStats.aggression * 100}%` }}></div>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Domain Breakdown */}
                    <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(calculateStats.domains).map(([domain, rawScore]) => {
                             const score = rawScore as number;
                             return (
                            <div key={domain} className="bg-neutral-900 border border-neutral-800 p-4 flex flex-col items-center justify-center text-center">
                                <div className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-2">{domain}</div>
                                <div className="relative w-20 h-20 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="40" cy="40" r="36" stroke="#171717" strokeWidth="8" fill="none" />
                                        <circle cx="40" cy="40" r="36" stroke={score > 80 ? '#22c55e' : score > 50 ? '#eab308' : '#ef4444'} strokeWidth="8" fill="none" strokeDasharray={`${score * 2.26} 226`} />
                                    </svg>
                                    <span className="absolute text-xl font-bold font-mono text-white">{score.toFixed(0)}</span>
                                </div>
                            </div>
                        )})}
                    </div>
                </div>
            </div>
        </div>
      )
  }

  return null;
};

export default DriverAssessment;
