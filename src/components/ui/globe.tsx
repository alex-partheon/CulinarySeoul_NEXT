'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GlobeProps {
  className?: string;
}

export function Globe({ className }: GlobeProps) {
  return (
    <div className={cn("relative w-full h-full flex items-center justify-center", className)}>
      {/* Globe Container */}
      <div className="relative w-[400px] h-[400px] lg:w-[500px] lg:h-[500px]">
        {/* Animated Globe */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-slate-900/20 via-amber-500/10 to-slate-800/20 animate-spin-slow">
          <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-slate-900/30 via-transparent to-amber-500/20" />
          <div className="absolute inset-4 rounded-full bg-gradient-to-r from-slate-900/10 via-transparent to-slate-900/10" />
        </div>
        
        {/* Grid Lines */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {/* Horizontal lines */}
          <div className="absolute inset-x-0 top-1/4 h-px bg-gradient-to-r from-transparent via-slate-700/30 to-transparent" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-slate-700/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-1/4 h-px bg-gradient-to-r from-transparent via-slate-700/30 to-transparent" />
          
          {/* Vertical lines */}
          <div className="absolute inset-y-0 left-1/4 w-px bg-gradient-to-b from-transparent via-slate-700/30 to-transparent" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-slate-700/40 to-transparent" />
          <div className="absolute inset-y-0 right-1/4 w-px bg-gradient-to-b from-transparent via-slate-700/30 to-transparent" />
        </div>
        
        {/* Location Dots */}
        <div className="absolute inset-0">
          {/* Seoul - Main Hub */}
          <div className="absolute top-[30%] left-[70%] animate-pulse">
            <div className="relative">
              <div className="w-3 h-3 bg-amber-500 rounded-full shadow-lg shadow-amber-500/50" />
              <div className="absolute inset-0 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
            </div>
          </div>
          
          {/* Other Cities */}
          <div className="absolute top-[35%] left-[75%] w-2 h-2 bg-amber-400/70 rounded-full animate-pulse delay-100" />
          <div className="absolute top-[25%] left-[25%] w-2 h-2 bg-amber-400/70 rounded-full animate-pulse delay-200" />
          <div className="absolute top-[40%] left-[40%] w-2 h-2 bg-amber-400/70 rounded-full animate-pulse delay-300" />
          <div className="absolute top-[60%] left-[80%] w-2 h-2 bg-amber-400/70 rounded-full animate-pulse delay-400" />
          <div className="absolute top-[70%] left-[20%] w-2 h-2 bg-amber-400/70 rounded-full animate-pulse delay-500" />
        </div>
        
        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Connection paths from Seoul to other cities */}
          <path
            d="M 280 120 Q 200 100 300 140"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="1"
            opacity="0.5"
            className="animate-draw-line"
          />
          <path
            d="M 280 120 Q 150 150 100 100"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="1"
            opacity="0.5"
            className="animate-draw-line delay-100"
          />
          <path
            d="M 280 120 Q 200 200 160 160"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="1"
            opacity="0.5"
            className="animate-draw-line delay-200"
          />
        </svg>
        
        {/* Center Glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
        </div>
      </div>
      
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-slate-900/10 rounded-full blur-3xl animate-float delay-1000" />
      </div>
    </div>
  );
}