import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, CartesianGrid } from 'recharts';
import { SimulationResult, StrategyOption } from '../types';
import { getDegradationProjection } from '../services/simulationEngine';

interface AnalyticsPanelProps {
  simulationResults: SimulationResult[];
  heroId: string;
  strategies: StrategyOption[];
  currentLap: number;
  totalLaps: number;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ simulationResults, heroId, strategies, currentLap, totalLaps }) => {
  const [activeTab, setActiveTab] = useState<'distribution' | 'wear'>('distribution');

  // 1. Distribution Data
  const distData = useMemo(() => {
      const positionCounts: Record<number, number> = {};
      for (let i = 1; i <= 20; i++) positionCounts[i] = 0;
      simulationResults.forEach(res => {
        const pos = res.finalPositions[heroId];
        if (pos) positionCounts[pos] = (positionCounts[pos] || 0) + 1;
      });
      return Object.keys(positionCounts).map(pos => ({
        position: `P${pos}`,
        count: positionCounts[parseInt(pos)]
      })).slice(0, 10);
  }, [simulationResults, heroId]);

  // 2. Degradation Data
  const degData = useMemo(() => {
      return getDegradationProjection(currentLap, totalLaps, strategies);
  }, [currentLap, totalLaps, strategies]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 shadow-xl h-full flex flex-col w-full">
       <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-2 shrink-0">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Analytics Dashboard</h3>
            <div className="flex gap-2">
                <button 
                    onClick={() => setActiveTab('distribution')}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'distribution' ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-500 hover:text-white'}`}
                >
                    Distribution
                </button>
                <button 
                    onClick={() => setActiveTab('wear')}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'wear' ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-500 hover:text-white'}`}
                >
                    Tyre Projections
                </button>
            </div>
       </div>

       {/* CRITICAL FIX: Ensure parent of ResponsiveContainer has defined height and width */}
       <div className="flex-1 w-full min-h-0" style={{ minHeight: '200px' }}>
         <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'distribution' ? (
                <BarChart data={distData}>
                    <XAxis dataKey="position" tick={{ fill: '#a3a3a3', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                        cursor={{fill: '#1e293b'}}
                        contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#334155', color: '#f5f5f5' }}
                        itemStyle={{ color: '#f5f5f5' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {distData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index < 3 ? '#6366f1' : '#475569'} />
                        ))}
                    </Bar>
                </BarChart>
            ) : (
                <LineChart data={degData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="lap" type="number" domain={['dataMin', 'dataMax']} tick={{ fill: '#a3a3a3', fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#a3a3a3', fontSize: 10 }} label={{ value: 'Performance %', angle: -90, position: 'insideLeft', fill: '#666', fontSize: 10 }} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#334155', color: '#f5f5f5' }} 
                        itemStyle={{ color: '#f5f5f5' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px', color: '#d4d4d4' }} />
                    
                    {strategies.map((strat, index) => {
                        // Color mapping for tyre compounds
                        let color = '#fff';
                        if (strat.targetCompound.includes('Soft') || strat.targetCompound === 'C4' || strat.targetCompound === 'C5') color = '#ef4444'; // Red
                        else if (strat.targetCompound.includes('Medium') || strat.targetCompound === 'C2' || strat.targetCompound === 'C3') color = '#eab308'; // Yellow
                        else if (strat.targetCompound === 'INTER') color = '#22c55e'; // Green
                        else if (strat.targetCompound === 'WET') color = '#3b82f6'; // Blue
                        else color = '#e5e5e5'; // Hard

                        return (
                            <Line 
                                key={strat.id}
                                type="monotone"
                                dataKey={strat.id}
                                name={`${strat.name} (${strat.targetCompound})`}
                                stroke={index === 0 ? color : index === 1 ? '#888' : '#444'}
                                strokeWidth={2}
                                dot={false}
                            />
                        )
                    })}
                </LineChart>
            )}
         </ResponsiveContainer>
       </div>
    </div>
  );
};

export default AnalyticsPanel;