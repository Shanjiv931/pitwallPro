import React from 'react';
import { StrategyReport } from '../types';
import { Cpu, Zap, AlertOctagon, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TYRE_COMPOUNDS } from '../constants';

interface StrategyCardProps {
  report: StrategyReport | null;
  loading: boolean;
}

const StrategyCard: React.FC<StrategyCardProps> = ({ report, loading }) => {
  if (loading) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 p-8 animate-pulse h-full flex flex-col gap-4">
        <div className="h-8 bg-neutral-800 w-1/2"></div>
        <div className="h-32 bg-neutral-800 w-full"></div>
        <div className="h-10 bg-neutral-800 w-full"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 p-8 flex flex-col items-center justify-center h-full text-neutral-600 font-mono">
        <Cpu size={48} className="mb-4 opacity-20" />
        <span className="text-sm tracking-widest uppercase">Awaiting Telemetry</span>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border-l-4 border-l-red-600 border-y border-r border-neutral-800 shadow-2xl h-full flex flex-col overflow-hidden">
      <div className="bg-neutral-950 px-6 py-4 border-b border-neutral-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <Zap className="text-red-500 fill-current" size={20} />
          <h2 className="text-lg font-bold text-white uppercase italic tracking-widest">Strategy Engine</h2>
        </div>
        <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-1 uppercase font-bold tracking-widest border border-neutral-700">
          Gemini Powered
        </span>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-px bg-neutral-800 border border-neutral-800 shrink-0">
          <div className="bg-neutral-900 p-4 flex flex-col items-center justify-center">
            <div className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-2">Win Prob</div>
            <div className={`text-3xl lg:text-4xl font-mono font-bold ${report.winProbability > 20 ? 'text-green-500' : 'text-neutral-300'}`}>
              {report.winProbability.toFixed(1)}<span className="text-lg text-neutral-600">%</span>
            </div>
          </div>
          <div className="bg-neutral-900 p-4 flex flex-col items-center justify-center">
            <div className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-2">Podium Prob</div>
            <div className="text-3xl lg:text-4xl font-mono font-bold text-white">
              {report.podiumProbability.toFixed(1)}<span className="text-lg text-neutral-600">%</span>
            </div>
          </div>
        </div>

        {/* AI Explanation */}
        <div className="bg-neutral-950/50 p-5 border-l-2 border-neutral-700 shrink-0 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
             <Cpu size={64} />
          </div>
          <h4 className="text-red-500 text-[10px] font-bold uppercase mb-3 tracking-widest">Engineer Radio</h4>
          <div className="prose prose-invert prose-sm text-neutral-300 leading-relaxed font-mono text-xs lg:text-sm">
            <ReactMarkdown>{report.explanation}</ReactMarkdown>
          </div>
        </div>

        {/* Strategy List (Explicit Text Display) */}
        <div className="flex flex-col gap-3">
            <h4 className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest border-b border-neutral-800 pb-2">Available Strategies</h4>
            {report.strategies.map((strat, idx) => {
                const isRecommended = idx === 0;
                const compoundConfig = TYRE_COMPOUNDS[strat.targetCompound];
                const compoundName = compoundConfig?.name || strat.targetCompound;
                const compoundColor = compoundConfig?.color || '#fff';

                return (
                 <div key={strat.id} className={`p-3 border-l-4 transition-all relative overflow-hidden ${isRecommended ? 'border-green-500 bg-neutral-800' : 'border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800'}`}>
                    {/* Background accent for recommended */}
                    {isRecommended && <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 rounded-full blur-xl pointer-events-none"></div>}
                    
                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                                {isRecommended && <span className="bg-green-900/40 text-green-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-green-500/30">Primary</span>}
                                <span className="text-white font-bold uppercase italic text-sm">{strat.name}</span>
                            </div>
                            
                            <div className="text-neutral-400 text-xs font-mono leading-tight mb-3">
                                {strat.description}
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-neutral-950 px-2 py-1 rounded border border-neutral-700">
                                    <div className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{color: compoundColor, backgroundColor: compoundColor}}></div>
                                    <span className="text-[10px] font-bold text-neutral-300 uppercase">{compoundName}</span>
                                </div>
                                <span className="text-[10px] font-bold text-neutral-500 uppercase bg-neutral-950 px-2 py-1 rounded border border-neutral-700">
                                    Pit Lap: <span className="text-white">{strat.pitLap}</span>
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-center gap-2 ml-2">
                           {strat.riskLevel === 'High' && <AlertOctagon size={18} className="text-red-500" />}
                           {isRecommended && <CheckCircle size={18} className="text-green-500" />}
                        </div>
                    </div>
                 </div>
                )
            })}
        </div>
      </div>
    </div>
  );
};

export default StrategyCard;