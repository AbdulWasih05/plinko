import React, { useState, useEffect, useCallback } from 'react';
import PlinkoAnimation from './PlinkoAnimation';
import { formatCents, generateClientSeed, API_BASE_URL } from '../utils/utils';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import Button from './ui/Button';
import { Volume2, VolumeX, Settings, Play, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function PlinkoGame({ onVerifyRound }) {
  const [dropColumn, setDropColumn] = useState(6);
  const [betAmount, setBetAmount] = useState('1.00');
  const [clientSeed, setClientSeed] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [roundId, setRoundId] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [easterEggActive, setEasterEggActive] = useState({ tilt: false });

  // Initialize client seed
  useEffect(() => {
    setClientSeed(generateClientSeed());
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (isLoading || isAnimating) return;
      const key = event.key.toLowerCase();

      if (key === 'm') setIsMuted(prev => !prev);
      if (key === 't') setEasterEggActive(prev => ({ ...prev, tilt: !prev.tilt }));

      if (key === 'arrowleft') {
        event.preventDefault();
        setDropColumn(prev => Math.max(0, prev - 1));
      } else if (key === 'arrowright') {
        event.preventDefault();
        setDropColumn(prev => Math.min(12, prev + 1));
      } else if (key === ' ') {
        event.preventDefault();
        handleDropBall();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isLoading, isAnimating]);

  const handleDropBall = async () => {
    if (isLoading || isAnimating) return;

    setIsLoading(true);
    setGameResult(null);
    setShowResults(false);

    try {
      const commitResponse = await fetch(`${API_BASE_URL}/api/rounds/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!commitResponse.ok) throw new Error('Failed to create round commitment');

      const commitData = await commitResponse.json();
      setRoundId(commitData.roundId);

      const betCents = Math.round(parseFloat(betAmount) * 100);
      const startResponse = await fetch(`${API_BASE_URL}/api/rounds/${commitData.roundId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSeed,
          betCents,
          dropColumn,
        }),
      });

      if (!startResponse.ok) throw new Error('Failed to start round');

      const result = await startResponse.json();
      setGameResult(result);
      setIsAnimating(true);

    } catch (error) {
      console.error('Error playing round:', error);
      alert('Failed to play round. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false);
    setShowResults(true);
    if (roundId) {
      fetch(`${API_BASE_URL}/api/rounds/${roundId}/reveal`, { method: 'POST' }).catch(console.error);
    }
  }, [roundId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 max-w-7xl mx-auto">
      {/* Main Game Board */}
      <Card className="order-2 lg:order-1 min-h-[500px] lg:h-[700px] relative border-primary/20 bg-background/50 overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

        {/* Game Stats Overlay */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <div className="bg-surface/80 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-gray-400 border border-white/5">
            RTP: 99.0%
          </div>
        </div>

        <div className="w-full h-full flex items-center justify-center p-4">
          {/* Passing path and isAnimating to trigger physics */}
          <PlinkoAnimation
            pegMap={gameResult?.pegMap}
            path={gameResult?.path}
            isAnimating={isAnimating}
            onAnimationComplete={handleAnimationComplete}
            dropColumn={dropColumn}
            isMuted={isMuted}
            tiltAngle={easterEggActive.tilt ? (Math.random() - 0.5) * 10 : 0}
          />
        </div>

        {/* Drop Column Indicator (Visual Helper if needed, but Physics will show ball) */}
      </Card>

      {/* Sidebar Controls */}
      <Card className="order-1 lg:order-2 h-fit border-white/5 bg-surface/30 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Controls</CardTitle>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="ghost">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bet Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Bet Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full bg-background/50 border border-white/10 rounded-lg py-2 pl-7 pr-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all font-mono"
              />
            </div>
            <div className="flex gap-2">
              {['1.00', '5.00', '10.00', 'Max'].map(amt => (
                <button
                  key={amt}
                  onClick={() => amt !== 'Max' && setBetAmount(amt)}
                  className="flex-1 py-1 text-xs rounded bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Drop Position */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="font-medium text-gray-400">Drop Position</label>
              <span className="font-mono text-primary">{dropColumn}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0} max={12}
                value={dropColumn}
                onChange={(e) => setDropColumn(parseInt(e.target.value))}
                className="flex-1 accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Results Overlay within Sidebar if needed, or Main Panel */}
          {gameResult && showResults && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 animate-in fade-in zoom-in">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs uppercase tracking-wider text-gray-500">Result</span>
                <span className={cn("text-lg font-bold", gameResult.winAmount > gameResult.betCents ? "text-secondary" : "text-gray-300")}>
                  {gameResult.payoutMultiplier}x
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Win Amount</span>
                <span className="font-mono text-white">{formatCents(gameResult.winAmount)}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 h-8 text-xs border-dashed"
                onClick={() => onVerifyRound(gameResult)}
              >
                Verify Round
              </Button>
            </div>
          )}

          {/* Main Action */}
          <Button
            variant="neon"
            size="lg"
            className="w-full relative overflow-hidden group"
            onClick={handleDropBall}
            disabled={isLoading || isAnimating}
          >
            <span className="relative z-10 flex items-center gap-2">
              {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
              {isLoading ? 'Preparing...' : isAnimating ? 'Dropping...' : 'DROP BALL'}
            </span>
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-[-100%] transition-transform duration-700 rotate-45" />
          </Button>

          {/* Client Seed */}
          <div className="pt-4 border-t border-white/5">
            <label className="text-xs text-gray-500 mb-1 block">Client Seed</label>
            <div className="flex gap-2">
              <input
                value={clientSeed}
                onChange={(e) => setClientSeed(e.target.value)}
                className="flex-1 bg-background/50 border border-white/10 rounded px-2 py-1 text-xs text-gray-400 font-mono"
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setClientSeed(generateClientSeed())}>
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}