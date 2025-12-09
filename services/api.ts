import { StatusResponse, Trade, EquityPoint, FrontendStatus } from '../types';

const BACKEND_URL = 'http://127.0.0.1:8001/api';
const USE_MOCK = false; // Set to true to use mock data

// Transform backend StatusResponse to FrontendStatus
const transformStatusResponse = (data: StatusResponse): FrontendStatus => {
  return {
    ...data,
    position_status: data.position as any,
    live_pnl_points: data.pnl_points,
    live_pnl_money: data.pnl_money,
    today_pnl: data.today_pnl_money,
    max_drawdown: data.max_drawdown_pct,
    current_trailing_stop: data.current_stop,
    lot_size: 15, // Default lot size for BANKNIFTY
  };
};

// Transform backend EquityPoint to frontend format
const transformEquityPoint = (data: any): EquityPoint => {
  return {
    id: data.id,
    time: data.time,
    equity: data.equity,
  };
};

// Transform backend Trade to frontend format (add id if missing)
const transformTrade = (data: Trade, index?: number): Trade => {
  return {
    ...data,
    id: data.id || `TRD-${index || Date.now()}`,
  };
};

// Real API calls
const fetchFromBackend = async <T>(endpoint: string): Promise<T> => {
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`Failed to fetch from backend ${endpoint}:`, error);
    throw error;
  }
};

export const fetchStatus = async (): Promise<FrontendStatus> => {
  if (USE_MOCK) {
    return mockFetchStatus();
  }
  
  try {
    const data = await fetchFromBackend<StatusResponse>('/status');
    return transformStatusResponse(data);
  } catch (error) {
    console.log('Falling back to mock data for status');
    return mockFetchStatus();
  }
};

export const fetchTrades = async (): Promise<Trade[]> => {
  if (USE_MOCK) {
    return mockFetchTrades();
  }
  
  try {
    const data = await fetchFromBackend<Trade[]>('/trades');
    return data.map(transformTrade);
  } catch (error) {
    console.log('Falling back to mock data for trades');
    return mockFetchTrades();
  }
};

export const fetchEquityCurve = async (): Promise<EquityPoint[]> => {
  if (USE_MOCK) {
    return mockFetchEquityCurve();
  }
  
  try {
    const data = await fetchFromBackend<any[]>('/equity_curve');
    return data.map(transformEquityPoint);
  } catch (error) {
    console.log('Falling back to mock data for equity curve');
    return mockFetchEquityCurve();
  }
};

// --- MOCK DATA FALLBACK ---

const mockFetchStatus = async (): Promise<FrontendStatus> => {
  await new Promise(r => setTimeout(r, 100));
  return {
    symbol: 'BANKNIFTY',
    timeframe: '15m',
    position: 'FLAT',
    lots: 0,
    entry_time: null,
    entry_price: null,
    current_price: 44500.0,
    pnl_points: 0.0,
    pnl_money: 0.0,
    today_pnl_money: 0.0,
    winrate: 65.0,
    max_drawdown_pct: 12.5,
    tp_reached: false,
    current_stop: null,
    position_status: 'FLAT',
    live_pnl_points: 0.0,
    live_pnl_money: 0.0,
    today_pnl: 0.0,
    max_drawdown: 12.5,
    current_trailing_stop: null,
    lot_size: 15,
  };
};

const mockFetchTrades = async (): Promise<Trade[]> => {
  await new Promise(r => setTimeout(r, 100));
  const mockTrades: Trade[] = [];
  for (let i = 20; i > 0; i--) {
    const entryTime = new Date(Date.now() - i * 3600 * 1000);
    const exitTime = new Date(entryTime.getTime() + 15 * 60000);
    mockTrades.push({
      id: `TRD-${1000 + i}`,
      symbol: 'BANKNIFTY',
      timeframe: '15m',
      direction: Math.random() > 0.5 ? 'LONG' : 'SHORT',
      entry_time: entryTime.toISOString(),
      entry_price: 44000 + Math.random() * 1000,
      exit_time: exitTime.toISOString(),
      exit_price: 44000 + Math.random() * 1000,
      pnl_points: Math.random() > 0.35 ? 50 : -30,
      pnl_money: Math.random() > 0.35 ? 750 : -450,
      reason: 'TSL',
    });
  }
  return mockTrades;
};

const mockFetchEquityCurve = async (): Promise<EquityPoint[]> => {
  await new Promise(r => setTimeout(r, 100));
  const curve: EquityPoint[] = [];
  let equity = 100000;
  for (let i = 0; i < 20; i++) {
    equity += Math.random() > 0.35 ? 750 : -450;
    curve.push({
      time: new Date(Date.now() - (20 - i) * 3600 * 1000).toISOString(),
      equity: equity,
    });
  }
  return curve;
};
