import React from 'react';
import { cn } from '../../lib/utils';
import { Gamepad2, ShieldCheck, Wallet } from 'lucide-react';

export default function GameLayout({ children, className }) {
    return (
        <div className={cn("min-h-screen bg-background text-white font-sans selection:bg-primary/30 relative overflow-hidden", className)}>
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03] pointer-events-none" />

            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[130px] rounded-full pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-[800px] h-[600px] bg-secondary/5 blur-[150px] rounded-full pointer-events-none" />

            {/* Header */}
            <header className="relative z-50 border-b border-white/5 backdrop-blur-md sticky top-0 bg-background/50">
                <div className="container mx-auto px-6 h-18 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25 ring-1 ring-white/10 group cursor-pointer hover:scale-105 transition-transform">
                            <Gamepad2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-xl tracking-tight leading-none text-white">Plinko<span className="text-primary ml-0.5">Cosmic</span></span>
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Provably Fair</span>
                        </div>
                    </div>

                    <nav className="flex items-center gap-1">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="hidden sm:inline">Fairness</span>
                        </button>


                        <div className="h-6 w-px bg-white/10 mx-2" />

                        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                            <div className="p-1.5 rounded-md bg-secondary/20">
                                <Wallet className="w-4 h-4 text-secondary" />
                            </div>
                            <div className="flex flex-col items-end leading-none">
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Balance</span>
                                <span className="font-mono font-bold text-white">$10,250.00</span>
                            </div>
                            <button className="ml-2 px-3 py-1 text-xs font-bold bg-secondary hover:bg-secondary/90 text-white rounded transition-colors shadow-lg shadow-secondary/20">
                                WALLET
                            </button>
                        </div>
                    </nav>
                </div>
            </header>

            <main className="relative z-10 container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
