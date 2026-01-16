import React, { useState } from 'react';
import { API_BASE_URL } from './utils/utils';
import PlinkoGame from './components/PlinkoGame';
import Verify from './components/Verify';
import GameLayout from './components/ui/GameLayout';

function App() {
  const [verifyData, setVerifyData] = useState(null);
  const [showVerifier, setShowVerifier] = useState(false);

  const handleVerifyRound = async (gameResult) => {
    console.log('Verify round called with:', gameResult);

    if (gameResult && gameResult.roundId) {
      try {
        console.log('Attempting to reveal server seed for round:', gameResult.roundId);

        // First, reveal the server seed if not already revealed
        const revealResponse = await fetch(`${API_BASE_URL}/api/rounds/${gameResult.roundId}/reveal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (revealResponse.ok) {
          const revealData = await revealResponse.json();
          setVerifyData({
            serverSeed: revealData.serverSeed || '',
            clientSeed: revealData.clientSeed || gameResult.clientSeed || '',
            nonce: revealData.nonce?.toString() || gameResult.nonce?.toString() || '',
            dropColumn: gameResult.dropColumn?.toString() || ''
          });
        } else {
          // If reveal fails, use available data from gameResult
          setVerifyData({
            serverSeed: '',
            clientSeed: gameResult.clientSeed || '',
            nonce: gameResult.nonce?.toString() || '',
            dropColumn: gameResult.dropColumn?.toString() || ''
          });
        }

        setShowVerifier(true);
        setTimeout(() => {
          document.getElementById('verifier-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);

      } catch (error) {
        console.error('Error preparing verification data:', error);
        setVerifyData({
          serverSeed: '',
          clientSeed: gameResult.clientSeed || '',
          nonce: gameResult.nonce?.toString() || '',
          dropColumn: gameResult.dropColumn?.toString() || ''
        });
        setShowVerifier(true);
      }
    }
  };

  const handleCloseVerifier = () => {
    setShowVerifier(false);
    setVerifyData(null);
  };

  return (
    <GameLayout>
      <div className="flex flex-col gap-8">
        <PlinkoGame onVerifyRound={handleVerifyRound} />

        {showVerifier && (
          <div id="verifier-section" className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom duration-500">
            <div className="relative rounded-xl border border-white/10 bg-surface/80 backdrop-blur-xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold bg-gradient-to-r from-secondary to-teal-400 bg-clip-text text-transparent">
                  Round Verification
                </h2>
                <button
                  onClick={handleCloseVerifier}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <Verify verifyData={verifyData} />
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}

export default App;