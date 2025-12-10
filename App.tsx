import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SummaryCards from './components/SummaryCards';
import OpenPositionPanel from './components/OpenPositionPanel';
import ChartsSection from './components/ChartsSection';
import TradeHistoryTable from './components/TradeHistoryTable';
import { fetchStatus, fetchTrades, fetchEquityCurve } from './services/api';
import { StatusResponse, Trade, EquityPoint } from './types';

function App() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [equity, setEquity] = useState<EquityPoint[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Polling Effect
  useEffect(() => {
    const loadData = async () => {
      try {
        const [statusData, tradesData, equityData] = await Promise.all([
          fetchStatus(),
          fetchTrades(),
          fetchEquityCurve()
        ]);
        
        setStatus(statusData);
        setTrades(tradesData);
        setEquity(equityData);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial load
    loadData();

    // Poll every 1 second to simulate real-time socket behavior
    const intervalId = setInterval(loadData, 1000);

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
                A
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">AlgoStrategy <span style={{ color: '#7300BD' }}>Pro</span></h1>
            </div>
            <nav className="flex items-center gap-4 border-l border-white/10 pl-4">
              <Link to="/" className="text-xs font-medium text-slate-400 hover:text-white transition">Dashboard</Link>
              <Link to="/charts" className="text-xs font-medium text-slate-400 hover:text-white transition">Charts</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse bg-green-500"></span>
                <span className="text-green-500 font-medium tracking-wide">SYSTEM ONLINE</span>
             </div>
             <div>Last Update: {lastUpdated.toLocaleTimeString()}</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64 text-slate-500">
             Loading Strategy Engine...
          </div>
        ) : (
          <>
            <SummaryCards status={status} />
            <OpenPositionPanel status={status} />
            
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
               <ChartsSection equityData={equity} tradeData={trades} />
            </div>

            <TradeHistoryTable trades={trades} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;