import React, { useEffect, useState } from 'react';
import { fetchEquityCurve } from '../services/api';
import { EquityPoint } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function ChartPage() {
  const [equity, setEquity] = useState<EquityPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Polling Effect
  useEffect(() => {
    const loadData = async () => {
      try {
        const equityData = await fetchEquityCurve();
        setEquity(equityData);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Failed to fetch equity data", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial load
    loadData();

    // Poll every 2 seconds
    const intervalId = setInterval(loadData, 2000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans pb-10">
      {/* Header */}
      <header className="bg-black border-b border-white/10 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(115,0,189,0.5)]" style={{ backgroundColor: '#7300BD' }}>
              📈
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Equity Curve <span style={{ color: '#7300BD' }}>Charts</span></h1>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse bg-green-500"></span>
              <span className="text-green-500 font-medium tracking-wide">LIVE</span>
            </div>
            <div>Last Update: {lastUpdated.toLocaleTimeString()}</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-96 text-slate-500">
            Loading charts...
          </div>
        ) : (
          <div className="space-y-8">
            {/* Equity Curve Chart */}
            <div className="bg-[#0a0a0a] p-6 rounded-lg border border-white/10 shadow-lg">
              <h2 className="text-lg font-bold text-white mb-4">Equity Curve</h2>
              {equity.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={equity} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#64748b"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(time) => {
                        try {
                          return new Date(time).toLocaleTimeString();
                        } catch {
                          return time;
                        }
                      }}
                    />
                    <YAxis 
                      stroke="#64748b"
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Equity (₹)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #7300BD',
                        borderRadius: '6px'
                      }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: any) => {
                        if (typeof value === 'number') {
                          return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
                        }
                        return value;
                      }}
                      labelFormatter={(label) => {
                        try {
                          return new Date(label).toLocaleString();
                        } catch {
                          return label;
                        }
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="equity" 
                      stroke="#7300BD" 
                      dot={false}
                      strokeWidth={2}
                      isAnimationActive={true}
                      name="Equity Value"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-96 flex items-center justify-center text-slate-500">
                  No data available
                </div>
              )}
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Total Points</div>
                <div className="text-2xl font-bold text-slate-200">{equity.length}</div>
              </div>
              <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Current Equity</div>
                <div className="text-2xl font-bold text-green-500">
                  {equity.length > 0 ? equity[equity.length - 1].equity.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-'}
                </div>
              </div>
              <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Highest Equity</div>
                <div className="text-2xl font-bold text-green-500">
                  {equity.length > 0 ? Math.max(...equity.map(e => e.equity)).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-'}
                </div>
              </div>
              <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Lowest Equity</div>
                <div className="text-2xl font-bold text-red-500">
                  {equity.length > 0 ? Math.min(...equity.map(e => e.equity)).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-'}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ChartPage;
