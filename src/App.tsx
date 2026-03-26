import { useState, useEffect } from 'react';

type GameMode = 'increasing' | 'decreasing' | 'equal';
type GameState = 'menu' | 'playing' | 'results';

interface GameData {
  intervals: number[];
  totalTime: number;
}

function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [mode, setMode] = useState<GameMode | null>(null);
  const [pressCount, setPressCount] = useState(0);
  const [intervals, setIntervals] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [lastPressTime, setLastPressTime] = useState<number | null>(null);
  const [isReset, setIsReset] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  const TOTAL_PRESSES = 16;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        
        if (gameState === 'menu') return;
        if (gameState === 'results') return;
        
        const now = performance.now();
        
        // Mobile detection
        if (window.innerWidth < 768) {
          setShowMobileWarning(true);
          return;
        }
        
        if (pressCount === 0) {
          // First press
          setStartTime(now);
          setLastPressTime(now);
          setPressCount(1);
          return;
        }
        
        const interval = now - lastPressTime!;
        
        // Validate interval based on mode
        let isValid = true;
        
        if (mode === 'equal') {
          // Mode 3: Must be > 500ms and <= 1500ms
          if (interval <= 500 || interval > 1500) {
            isValid = false;
            setResetMessage('间隔必须在0.5秒到1.5秒之间！');
          }
        }
        
        if (isValid && intervals.length > 0) {
          const lastInterval = intervals[intervals.length - 1];
          
          if (mode === 'increasing') {
            // Mode 1: Must be strictly increasing
            if (interval <= lastInterval) {
              isValid = false;
              setResetMessage('间隔必须递增！');
            }
          } else if (mode === 'decreasing') {
            // Mode 2: Must be strictly decreasing
            if (interval >= lastInterval) {
              isValid = false;
              setResetMessage('间隔必须递减！');
            }
          }
        }
        
        if (!isValid) {
          // Reset game
          setIsReset(true);
          setTimeout(() => setIsReset(false), 500);
          setPressCount(0);
          setIntervals([]);
          setStartTime(null);
          setLastPressTime(null);
          return;
        }
        
        // Valid press
        setIntervals([...intervals, interval]);
        setLastPressTime(now);
        setPressCount(pressCount + 1);
        
        // Check if game complete
        if (pressCount + 1 === TOTAL_PRESSES) {
          const totalTime = now - startTime!;
          setGameData({
            intervals: [...intervals, interval],
            totalTime,
          });
          setGameState('results');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, pressCount, intervals, lastPressTime, mode, startTime]);
  
  // Auto-hide reset message
  useEffect(() => {
    if (resetMessage) {
      const timer = setTimeout(() => setResetMessage(''), 1500);
      return () => clearTimeout(timer);
    }
  }, [resetMessage]);
  
  // Auto-hide mobile warning
  useEffect(() => {
    if (showMobileWarning) {
      const timer = setTimeout(() => setShowMobileWarning(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showMobileWarning]);

  const startGame = (selectedMode: GameMode) => {
    setMode(selectedMode);
    setGameState('playing');
    setPressCount(0);
    setIntervals([]);
    setStartTime(null);
    setLastPressTime(null);
    setGameData(null);
  };

  const backToMenu = () => {
    setGameState('menu');
    setMode(null);
    setPressCount(0);
    setIntervals([]);
  };

  const calculateScore = () => {
    if (!gameData) return 0;
    const vals = gameData.intervals;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / vals.length;
    const stdDev = Math.sqrt(variance);
    
    // 使用变异系数(CV)计算分数，CV = 标准差/平均值
    // CV越小说明间隔越均匀，分数越高
    // CV=0时满分100分，CV每增加1%扣2分
    const cv = stdDev / mean;
    // 使用指数衰减来提高区分度
    // cv=0 → 100分, cv=0.05(5%) → ~90分, cv=0.15(15%) → ~55分, cv=0.3(30%) → ~20分
    const score = Math.round(100 * Math.exp(-cv * 5));
    return Math.max(0, Math.min(100, score));
  };

  const getScoreRating = (score: number) => {
    if (score >= 95) return { text: '神级!', color: 'text-purple-400' };
    if (score >= 85) return { text: '大师!', color: 'text-emerald-400' };
    if (score >= 70) return { text: '优秀!', color: 'text-cyan-400' };
    if (score >= 55) return { text: '良好', color: 'text-yellow-400' };
    if (score >= 40) return { text: '及格', color: 'text-orange-400' };
    return { text: '继续加油', color: 'text-red-400' };
  };

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(3) + 's';
  };

  // Menu Screen
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4 tracking-tight">
          空格计时挑战
        </h1>
        <p className="text-slate-400 mb-12 text-lg">按空格键16次，考验你的时间感知！</p>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl w-full">
          <ModeCard
            title="单调递增"
            description="每次间隔必须比上一次长"
            icon="📈"
            color="from-emerald-500 to-cyan-500"
            onClick={() => startGame('increasing')}
          />
          <ModeCard
            title="单调递减"
            description="每次间隔必须比上一次短"
            icon="📉"
            color="from-rose-500 to-orange-500"
            onClick={() => startGame('decreasing')}
          />
          <ModeCard
            title="等间隔挑战"
            description="尽量让每次间隔相等（0.5~1.5秒）"
            icon="⚖️"
            color="from-indigo-500 to-purple-500"
            onClick={() => startGame('equal')}
          />
        </div>
        
        <p className="text-slate-500 mt-12 text-sm">
          按下空格键开始游戏
        </p>
      </div>
    );
  }

  // Results Screen
  if (gameState === 'results' && gameData) {
    const maxInterval = Math.max(...gameData.intervals);
    const minInterval = Math.min(...gameData.intervals);
    const avgInterval = gameData.intervals.reduce((a, b) => a + b, 0) / gameData.intervals.length;
    const variance = gameData.intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / gameData.intervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgInterval; // 变异系数
    const score = mode === 'equal' ? calculateScore() : null;
    const rating = score !== null ? getScoreRating(score) : null;
    
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl shadow-black/50">
          <h2 className="text-3xl font-bold text-white text-center mb-2">
            {mode === 'increasing' ? '递增挑战完成!' : mode === 'decreasing' ? '递减挑战完成!' : '等间隔挑战完成!'}
          </h2>
          <p className="text-slate-400 text-center mb-6">总时间: {formatTime(gameData.totalTime)}</p>
          
          {score !== null && (
            <div className="text-center mb-6">
              <div className="inline-flex flex-col items-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-slate-700"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(score / 100) * 351.86} 351.86`}
                      className={score >= 85 ? 'text-purple-400' : score >= 70 ? 'text-emerald-400' : score >= 55 ? 'text-yellow-400' : score >= 40 ? 'text-orange-400' : 'text-red-400'}
                      style={{ transition: 'stroke-dasharray 1s ease-out' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">{score}</span>
                  </div>
                </div>
                <span className={`text-xl font-semibold mt-2 ${rating?.color}`}>
                  {rating?.text}
                </span>
              </div>
              
              {/* 详细统计数据 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 bg-slate-700/50 rounded-xl p-4">
                <div className="text-center">
                  <div className="text-slate-400 text-xs mb-1">平均间隔</div>
                  <div className="text-white font-mono">{(avgInterval * 1000).toFixed(1)}ms</div>
                </div>
                <div className="text-center">
                  <div className="text-slate-400 text-xs mb-1">标准差</div>
                  <div className="text-white font-mono">{(stdDev * 1000).toFixed(1)}ms</div>
                </div>
                <div className="text-center">
                  <div className="text-slate-400 text-xs mb-1">波动率(CV)</div>
                  <div className="text-white font-mono">{(cv * 100).toFixed(1)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-slate-400 text-xs mb-1">间隔范围</div>
                  <div className="text-white font-mono">{((minInterval) * 1000).toFixed(0)}~{((maxInterval) * 1000).toFixed(0)}ms</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-300 mb-4">各次间隔时间</h3>
            <div className="space-y-2">
              {gameData.intervals.map((interval, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-slate-500 text-sm w-8">#{index + 1}</span>
                  <div className="flex-1 bg-slate-700 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full flex items-center justify-end pr-2"
                      style={{
                        width: `${(interval / maxInterval) * 100}%`,
                        animation: `growWidth 0.5s ease-out ${index * 0.05}s both`
                      }}
                    >
                      <span className="text-xs text-white font-medium">
                        {formatTime(interval)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 pt-2 border-t border-slate-700">
                <span className="text-slate-400 text-sm w-8 font-semibold">总</span>
                <div className="flex-1 bg-slate-700 rounded-full h-8 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full flex items-center justify-end pr-3"
                    style={{
                      width: '100%',
                      animation: `growWidth 0.5s ease-out ${gameData.intervals.length * 0.05}s both`
                    }}
                  >
                    <span className="text-sm text-white font-bold">
                      总时间: {formatTime(gameData.totalTime)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={backToMenu}
                className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors text-sm"
              >
                返回
              </button>
              <button
                onClick={() => startGame(mode!)}
                className="flex-1 py-3 px-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors text-sm"
              >
                再玩一次
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Playing Screen
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      {/* Reset Toast */}
      {resetMessage && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-xl font-semibold animate-pulse">
          重置! {resetMessage}
        </div>
      )}
      
      {/* Mobile Warning */}
      {showMobileWarning && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-amber-500/90 text-white px-6 py-3 rounded-xl font-semibold">
          请使用电脑版游戏！
        </div>
      )}
      
      {/* Back Button */}
      <button
        onClick={backToMenu}
        className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
      >
        <span>←</span> 返回
      </button>
      
      {/* Mode Indicator */}
      <div className="absolute top-6 right-6 text-slate-400">
        {mode === 'increasing' && '📈 单调递增'}
        {mode === 'decreasing' && '📉 单调递减'}
        {mode === 'equal' && '⚖️ 等间隔挑战'}
      </div>
      
      {/* Main Counter */}
      <div className={`relative ${isReset ? 'animate-shake' : ''}`}>
        <div className="w-64 h-64 rounded-full border-8 flex items-center justify-center transition-colors duration-200"
          style={{
            borderColor: isReset ? '#ef4444' : pressCount === 0 ? '#475569' : '#6366f1',
            backgroundColor: isReset ? 'rgba(239, 68, 68, 0.1)' : pressCount === 0 ? 'rgba(71, 85, 105, 0.1)' : 'rgba(99, 102, 241, 0.1)'
          }}
        >
          <div className="text-center">
            <div className="text-7xl font-bold text-white mb-2">
              {pressCount}
            </div>
            <div className="text-slate-400 text-lg">
              / {TOTAL_PRESSES}
            </div>
          </div>
        </div>
        
        {/* Progress Ring */}
        <svg className="absolute top-0 left-0 w-full h-full -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-slate-700"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${(pressCount / TOTAL_PRESSES) * 753.98} 753.98`}
            className="text-indigo-500 transition-all duration-200"
            style={{ filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.5))' }}
          />
        </svg>
      </div>
      
      {/* Current Interval */}
      <div className="mt-8 text-center">
        {pressCount > 0 && intervals.length > 0 && (
          <div className="mb-4">
            <p className="text-slate-500 text-sm mb-1">上次间隔</p>
            <p className={`text-3xl font-bold ${isReset ? 'text-red-400' : 'text-cyan-400'}`}>
              {formatTime(intervals[intervals.length - 1])}
            </p>
          </div>
        )}
        
        {pressCount === 0 && (
          <p className="text-slate-500 text-lg mb-4">
            按下<span className="text-white font-bold mx-2">空格键</span>开始
          </p>
        )}
      </div>
      
      {/* Instructions */}
      <div className="mt-12 bg-slate-800/50 rounded-xl p-4 max-w-md">
        <p className="text-slate-400 text-sm text-center">
          {mode === 'increasing' && '✅ 每次间隔必须比上一次长'}
          {mode === 'decreasing' && '✅ 每次间隔必须比上一次短'}
          {mode === 'equal' && '✅ 每次间隔尽量相等，且必须在 0.5~1.5秒之间'}
        </p>
        {mode === 'equal' && (
          <p className="text-amber-400/80 text-xs text-center mt-2">
            ⚠️ 间隔超出 0.5~1.5秒将导致重置
          </p>
        )}
      </div>
      
      {/* Pulse indicator for first press */}
      {pressCount === 0 && (
        <div className="mt-8 flex items-center gap-2 text-slate-500 animate-pulse">
          <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
          等待第一次按键...
        </div>
      )}
    </div>
  );
}

interface ModeCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onClick: () => void;
}

function ModeCard({ title, description, icon, color, onClick }: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl p-6 bg-slate-800 hover:bg-slate-700 transition-all duration-200 hover:scale-105 text-left"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity`} />
      <div className="relative">
        <span className="text-4xl mb-4 block">{icon}</span>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color} transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left`} />
    </button>
  );
}

export default App;
