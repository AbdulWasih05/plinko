import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/utils';
import Input from './ui/Input';
import Button from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Check, AlertCircle, RefreshCw, Shield, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Verify({ verifyData }) {
  const [inputs, setInputs] = useState({
    serverSeed: '',
    clientSeed: '',
    nonce: '',
    dropColumn: ''
  });
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => {
    if (verifyData) {
      setInputs(verifyData);
      setResult(null);
      setError('');
      setAutoFilled(true);
      setTimeout(() => setAutoFilled(false), 3000);
    }
  }, [verifyData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const params = new URLSearchParams(inputs);
      const response = await fetch(`${API_BASE_URL}/api/verify?${params}`);

      if (!response.ok) throw new Error('Verification failed');

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">
          Enter round details to verify the outcome was fair and deterministic.
        </h3>

        {autoFilled && (
          <div className="flex items-center gap-2 p-3 bg-secondary/10 border border-secondary/20 rounded-lg text-secondary text-sm animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4" />
            Form auto-filled with game round data!
          </div>
        )}
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-300">Server Seed</label>
            <Input
              name="serverSeed"
              value={inputs.serverSeed}
              onChange={handleInputChange}
              placeholder="64-character hex string"
              className="font-mono text-xs"
              required
            />
            {!inputs.serverSeed && (
              <div className="flex items-start gap-2 text-xs text-gray-500 bg-white/5 p-2 rounded">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Use "Verify This Round" after playing to auto-fill, or call the API manually.
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Client Seed</label>
            <Input
              name="clientSeed"
              value={inputs.clientSeed}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Nonce</label>
            <Input
              name="nonce"
              value={inputs.nonce}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Drop Column</label>
            <Input
              type="number"
              name="dropColumn"
              value={inputs.dropColumn}
              onChange={handleInputChange}
              min="0" max="12"
              required
            />
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              variant="neon"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
              {isLoading ? 'Verifying...' : 'Verify Round'}
            </Button>
          </div>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {result && (
        <Card className="border-secondary/20 bg-secondary/5 animate-in fade-in zoom-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary">
              <Check className="w-5 h-5" />
              Verification Successful
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {[
              { label: "Commit Hash", value: result.commitHex },
              { label: "Combined Seed", value: result.combinedSeed },
              { label: "Peg Map Hash", value: result.pegMapHash }
            ].map((item) => (
              <div key={item.label}>
                <div className="font-medium text-gray-400 mb-1">{item.label}</div>
                <div className="font-mono text-xs bg-black/20 p-2 rounded border border-white/5 break-all text-white/80">
                  {item.value}
                </div>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-white/5 p-3 rounded text-center">
                <div className="text-xs text-gray-400 uppercase">Final Bin</div>
                <div className="text-xl font-bold text-white">{result.binIndex}</div>
              </div>
              <div className="bg-white/5 p-3 rounded text-center">
                <div className="text-xs text-gray-400 uppercase">Multiplier</div>
                <div className="text-xl font-bold text-secondary">{result.payoutMultiplier}x</div>
              </div>
            </div>

            {result.path && (
              <div>
                <div className="font-medium text-gray-400 mb-2">Ball Path Replay</div>
                <div className="h-32 overflow-y-auto bg-black/20 rounded border border-white/5 p-2 font-mono text-xs text-gray-400 space-y-1">
                  {result.path.map((step, index) => (
                    <div key={index} className="flex justify-between border-b border-white/5 pb-1 last:border-0">
                      <span>R{step.row}:C{step.column}</span>
                      <span className={step.direction > 0 ? "text-secondary" : "text-primary"}>
                        {step.direction > 0 ? "RIGHT →" : "← LEFT"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}