import React from 'react';

const Loader = () => {
    return (
        <div className="flex flex-col items-center justify-center mt-32 space-y-8">
            <div className="relative w-24 h-24">
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2c3e50" />
                            <stop offset="100%" stopColor="#e67e22" />
                        </linearGradient>
                    </defs>
                    {/* Infinity / Hourglass Abstract Path */}
                    <path
                        d="M30,30 Q50,50 70,30 T70,70 T30,70 T30,30"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="1"
                        className="animate-draw-slow"
                    />
                    {/* Outer Ring */}
                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-ink/20" />

                    {/* Center Dot Pulse */}
                    <circle cx="50" cy="50" r="2" className="fill-royal animate-ping" />
                </svg>

                {/* Rotating Segment */}
                <div className="absolute inset-0 border-t-2 border-royal/20 rounded-full animate-spin-slow"></div>
            </div>

            {/* Elegant Text */}
            <div className="flex flex-col items-center space-y-2">
                <span className="font-serif text-ink/80 text-xs tracking-[0.4em] uppercase animate-pulse">Consulting</span>
                <span className="font-serif italic text-ink/40 text-[10px] tracking-widest">The Archive of Human Thought</span>
            </div>

            <style>{`
                .animate-draw-slow {
                    stroke-dasharray: 200;
                    stroke-dashoffset: 200;
                    animation: draw 3s ease-in-out infinite alternate;
                }
                @keyframes draw {
                    0% { stroke-dashoffset: 200; }
                    100% { stroke-dashoffset: 0; }
                }
                .animate-spin-slow {
                    animation: spin 8s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default Loader;
