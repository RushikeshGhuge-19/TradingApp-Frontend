import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchEquityCurve } from './services/api';
import { EquityPoint } from './types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from 'recharts';

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  isUp: boolean;
}

function ChartPage() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [equity, setEquity] = useState<EquityPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Convert equity points to candles (group by 30m intervals matching backend)
  const generateCandles = (equityData: EquityPoint[]) => {
    if (equityData.length < 2) return [];
    
    const candleList: Candle[] = [];
    const groupSize = Math.max(2, Math.floor(equityData.length / 8)); // Show ~8 candles
    
    for (let i = 0; i < equityData.length; i += groupSize) {
      const group = equityData.slice(i, Math.min(i + groupSize, equityData.length));
      if (group.length === 0) continue;
      
      const open = group[0].equity;
      const close = group[group.length - 1].equity;
      const high = Math.max(...group.map(e => e.equity));
      const low = Math.min(...group.map(e => e.equity));
      const timeStr = new Date(group[group.length - 1].time).toLocaleTimeString();
      
      // Candle is bullish if close > open, bearish if close < open
      const isUp = close > open;
      
      candleList.push({
        time: timeStr,
        open,
        high,
        low,
        close,
        isUp,
      });
    }
    return candleList;
  };

  // Polling Effect
  useEffect(() => {
    const loadData = async () => {
      try {
        const equityData = await fetchEquityCurve();
        
        // Filter to only show data up to current time (IST timezone)
        const now = new Date();
        const filteredEquity = equityData.filter(point => {
          const pointTime = new Date(point.time);
          return pointTime <= now;
        });
        
        setEquity(filteredEquity);
        const newCandles = generateCandles(filteredEquity);
        setCandles(newCandles);
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(115,0,189,0.5)]" style={{ backgroundColor: '#7300BD' }}>
                📈
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">Equity Curve <span style={{ color: '#7300BD' }}>Charts</span></h1>
            </div>
            <Link to="/" className="text-xs font-medium text-slate-400 hover:text-white transition border-l border-white/10 pl-4">
              ← Dashboard
            </Link>
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
            {/* Candlestick Chart */}
            <div className="bg-[#0a0a0a] p-6 rounded-lg border border-white/10 shadow-lg">
              <h2 className="text-lg font-bold text-white mb-4">Equity Candles</h2>
              {candles.length > 0 ? (
                <div className="w-full h-96 overflow-x-auto">
                  <svg width={Math.max(600, candles.length * 80)} height={400} className="mx-auto">
                    {/* Grid */}
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width={Math.max(600, candles.length * 80)} height={400} fill="url(#grid)" opacity="0.1"/>
                    
                    {/* Calculate price range */}
                    {(() => {
                      const allPrices = candles.flatMap(c => [c.open, c.high, c.low, c.close]);
                      const minPrice = Math.min(...allPrices);
                      const maxPrice = Math.max(...allPrices);
                      const priceRange = maxPrice - minPrice || 1;
                      const padding = 40;
                      const chartHeight = 400 - 2 * padding;
                      
                      return (
                        <>
                          {/* Y-axis labels */}
                          <text x="10" y="30" fill="#64748b" fontSize="12">{maxPrice.toFixed(0)}</text>
                          <text x="10" y={padding + chartHeight / 2} fill="#64748b" fontSize="12">{((maxPrice + minPrice) / 2).toFixed(0)}</text>
                          <text x="10" y={padding + chartHeight + 15} fill="#64748b" fontSize="12">{minPrice.toFixed(0)}</text>
                          
                          {/* Candles */}
                          {candles.map((candle, idx) => {
                            const x = 60 + idx * 70;
                            const scale = chartHeight / priceRange;
                            const yHigh = padding + (maxPrice - candle.high) * scale;
                            const yLow = padding + (maxPrice - candle.low) * scale;
                            const yOpen = padding + (maxPrice - candle.open) * scale;
                            const yClose = padding + (maxPrice - candle.close) * scale;
                            const bodyTop = Math.min(yOpen, yClose);
                            const bodyBottom = Math.max(yOpen, yClose);
                            const bodyHeight = Math.max(bodyBottom - bodyTop, 2);
                            const color = candle.isUp ? '#10b981' : '#ef4444';
                            
                            return (
                              <g key={idx}>
                                {/* Wick */}
                                <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1" opacity="0.6"/>
                                {/* Body */}
                                <rect
                                  x={x - 20}
                                  y={bodyTop}
                                  width={40}
                                  height={bodyHeight}
                                  fill={color}
                                  opacity="0.8"
                                  stroke={color}
                                  strokeWidth="1"
                                />
                                {/* Time label */}
                                <text
                                  x={x}
                                  y={padding + chartHeight + 20}
                                  textAnchor="middle"
                                  fill="#64748b"
                                  fontSize="11"
                                  transform={`rotate(45, ${x}, ${padding + chartHeight + 20})`}
                                >
                                  {candle.time.split(':').slice(0, 2).join(':')}
                                </text>
                              </g>
                            );
                          })}
                          
                          {/* Axes */}
                          <line x1="40" y1={padding} x2="40" y2={padding + chartHeight} stroke="#475569" strokeWidth="1"/>
                          <line x1="40" y1={padding + chartHeight} x2={Math.max(600, candles.length * 80)} y2={padding + chartHeight} stroke="#475569" strokeWidth="1"/>
                        </>
                      );
                    })()}
                  </svg>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center text-slate-500">
                  No candle data available
                </div>
              )}
            </div>

            {/* Equity Curve Chart (below candles) */}
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
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Total Candles</div>
                <div className="text-2xl font-bold text-slate-200">{candles.length}</div>
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
