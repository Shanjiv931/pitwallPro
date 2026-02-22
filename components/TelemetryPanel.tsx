import React from 'react';
import { Driver } from '../types';
import { TYRE_COMPOUNDS } from '../constants';

interface TelemetryPanelProps {
  drivers: Driver[];
  heroId: string;
}

const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ drivers, heroId }) => {
  return (
    <div className="bg-neutral-900 border-t-4 border-red-600 rounded-sm shadow-2xl flex flex-col h-full">
      <div className="bg-neutral-950 px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white uppercase italic tracking-widest skew-box">
          <span className="unskew block">Telemetry Feed</span>
        </h3>
        <span className="text-xs text-red-500 font-mono font-bold flex items-center gap-2 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-red-600"></span>
          LIVE DATA
        </span>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-950 text-neutral-500 font-bold text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Pos</th>
              <th className="px-6 py-4">Driver</th>
              <th className="px-6 py-4 font-mono text-right">Gap</th>
              <th className="px-6 py-4 text-center">Compound</th>
              <th className="px-6 py-4 text-center">Tyre Life</th>
              <th className="px-6 py-4 text-right">Last Lap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {drivers.sort((a,b) => a.position - b.position).map((driver) => {
              const isHero = driver.id === heroId;
              const tyre = TYRE_COMPOUNDS[driver.currentTyre];
              
              // Tire wear calculations
              const wearPercent = Math.min(100, (driver.tyreAge / tyre.maxLife) * 100);
              const remainingLife = Math.max(0, 100 - wearPercent);
              
              // Color logic for wear
              let wearColor = 'bg-green-500';
              if (wearPercent > 70) wearColor = 'bg-yellow-500';
              if (wearPercent > 90) wearColor = 'bg-red-600 animate-pulse';

              return (
                <tr key={driver.id} className={`${isHero ? 'bg-red-900/10 border-l-4 border-red-600' : 'hover:bg-neutral-800/30'} transition-colors`}>
                  <td className={`px-6 py-4 font-bold text-lg ${isHero ? 'text-white' : 'text-neutral-400'}`}>
                    {driver.position}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-1 h-8 skew-box" style={{ backgroundColor: driver.color }}></div>
                      <div>
                        <div className={`font-bold uppercase tracking-wide ${isHero ? 'text-red-500' : 'text-neutral-200'}`}>
                          {driver.name}
                        </div>
                        <div className="text-[10px] text-neutral-500 uppercase font-bold">{driver.team}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-right text-neutral-300">
                    {driver.gapToLeader === 0 ? <span className="text-yellow-500">LEADER</span> : `+${driver.gapToLeader.toFixed(3)}`}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-neutral-800 px-3 py-1.5 rounded border border-neutral-700 shadow-sm min-w-[120px] justify-center">
                       <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: tyre.color }}></div>
                       <span className="font-bold text-xs uppercase text-neutral-200 whitespace-nowrap">{tyre.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-mono">
                    <div className="w-full flex items-center gap-3">
                        <div className="relative flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
                           <div className={`h-full rounded-full transition-all duration-500 ${wearColor}`} style={{ width: `${remainingLife}%` }}></div>
                        </div>
                        <span className={`text-[11px] font-bold w-12 text-right ${wearPercent > 90 ? 'text-red-500' : 'text-neutral-400'}`}>
                            {remainingLife.toFixed(0)}%
                        </span>
                    </div>
                    <span className="text-[10px] text-neutral-600 block mt-1 text-left">{driver.tyreAge} Laps Old</span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-neutral-300">
                    {driver.lapTimes.length > 0 ? driver.lapTimes[driver.lapTimes.length - 1].toFixed(3) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TelemetryPanel;