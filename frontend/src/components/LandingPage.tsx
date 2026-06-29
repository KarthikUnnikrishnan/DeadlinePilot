import React, { useState } from 'react';
import { Compass, Sparkles, ShieldAlert, Clock, ArrowRight, Activity, Zap, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  const [activeStep, setActiveStep] = useState(0);

  const demoSteps = [
    {
      title: "1. Input Monolith Task",
      input: "Develop Frontend Authentication Interface",
      detail: "Define the high-level objective and set the deadline date.",
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: "2. AI Task Breakdown",
      subtasks: [
        { name: "Design Login & SignUp Forms", time: "45m" },
        { name: "Configure JWT & Session Persistence", time: "60m" },
        { name: "Implement Password Validation & Error Alerts", time: "30m" },
        { name: "Verify Responsive Mobile Layouts", time: "30m" }
      ],
      detail: "Gemini splits the task into subtasks and estimates focus times.",
      color: "from-indigo-500 to-purple-600"
    },
    {
      title: "3. Smart Energy Schedule",
      slots: [
        { slot: "09:00 - 09:45", title: "Design Login & SignUp Forms", tag: "Peak Hours" },
        { slot: "09:55 - 10:55", title: "Configure JWT & Session Persistence", tag: "Focus Slot" },
        { slot: "11:05 - 11:35", title: "Implement Password Validation", tag: "Focus Slot" }
      ],
      detail: "Items are placed within wake/sleep slots, respecting peak cognitive cycles.",
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "4. Risk & Panic Defense",
      status: "🚨 PANIC MODE AUTO-TRIGGERED",
      reason: "Deadline is under 24 hours away! Schedule compressed: breaks set to 0m, low priority tasks suspended, focus limit raised to 12h.",
      detail: "Cockpit risk monitor secures completion using dynamic schedule compression.",
      color: "from-red-500 to-rose-600"
    }
  ];

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden text-slate-100 bg-[#070b13] px-4 md:px-8 py-12 md:py-16 z-10 selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Decorative Grid Backings */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b05_1px,transparent_1px),linear-gradient(to_bottom,#1e293b05_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute -top-40 right-1/4 w-[500px] h-[400px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[450px] h-[450px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Grid Hero Layout */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center gap-12 lg:gap-16 z-20">
        
        {/* Navigation / Header Brand */}
        <div className="flex justify-between items-center w-full pb-6 border-b border-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/10 border border-indigo-500/25 rounded-2xl">
              <Compass className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <span className="text-lg font-black text-white tracking-tight uppercase">DeadlinePilot</span>
              <span className="ml-2 text-[9px] font-bold px-2 py-0.5 bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 rounded-md">V2.0</span>
            </div>
          </div>
          
          <button 
            onClick={onLaunch}
            className="flex items-center gap-1.5 py-1.5 px-4 bg-slate-900/40 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            Launch Flight Deck <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hero Copywriting */}
        <div className="text-center max-w-3xl mx-auto space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="inline-flex items-center gap-1.5 py-1 px-3 bg-gradient-to-r from-indigo-550/10 to-purple-550/10 border border-indigo-500/20 rounded-full text-[10px] md:text-xs text-indigo-400 font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Autonomous Flight Path Scheduling
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
            Pilot Your Workloads.<br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Defeat Deadlines.
            </span>
          </h1>
          
          <p className="text-xs md:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            DeadlinePilot decomposes complex tasks, monitors completion risks, and adjusts schedules dynamically, ensuring you arrive on time.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <button
              onClick={onLaunch}
              className="py-3 px-8 bg-gradient-to-r from-indigo-600 via-indigo-650 to-purple-650 hover:from-indigo-550 hover:to-purple-550 text-white font-extrabold rounded-2xl text-sm transition-all shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/35 hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              Enter Dashboard Deck
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Core Pillars Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-6">
          
          {/* Feature 1: AI Task Breakdown */}
          <div className="group glass-card rounded-3xl p-6 border border-slate-800/70 hover:border-indigo-500/30 transition-all hover:bg-slate-900/10 hover:-translate-y-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm md:text-base font-bold text-white mb-2">AI Task Breakdown</h3>
            <p className="text-xs text-slate-455 leading-relaxed">
              Monolithic plans can be intimidating. Our scheduler breaks tasks down into sequential, time-estimated checklists automatically.
            </p>
          </div>

          {/* Feature 2: Smart Scheduling */}
          <div className="group glass-card rounded-3xl p-6 border border-slate-800/70 hover:border-purple-500/30 transition-all hover:bg-slate-900/10 hover:-translate-y-1">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm md:text-base font-bold text-white mb-2">Smart Scheduling</h3>
            <p className="text-xs text-slate-455 leading-relaxed">
              Injects subtasks into customized daily timelines. Integrates peak performance slots and buffers to maximize cognitive focus.
            </p>
          </div>

          {/* Feature 3: Risk Detection */}
          <div className="group glass-card rounded-3xl p-6 border border-slate-800/70 hover:border-amber-500/30 transition-all hover:bg-slate-900/10 hover:-translate-y-1">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm md:text-base font-bold text-white mb-2">Risk Detection</h3>
            <p className="text-xs text-slate-455 leading-relaxed">
              Analyzes your task volume against actual waking hours. Signals workload risks as Safe, Medium, High, or Critical.
            </p>
          </div>

          {/* Feature 4: Panic Mode */}
          <div className="group glass-card rounded-3xl p-6 border border-slate-800/70 hover:border-red-500/30 transition-all hover:bg-slate-900/10 hover:-translate-y-1">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-5 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="text-sm md:text-base font-bold text-white mb-2">Panic Mode</h3>
            <p className="text-xs text-slate-455 leading-relaxed">
              Auto-triggers when deadlines fall below 24 hours. Compresses schedules, removes breaks, and focus-locks high priority items.
            </p>
          </div>

        </div>

        {/* Interactive Pilot Sandbox Simulator */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-800/80">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Simulator Column Left */}
            <div className="lg:col-span-5 space-y-5">
              <span className="text-[10px] font-bold py-1 px-3 bg-purple-550/15 text-purple-400 border border-purple-500/20 rounded-full uppercase tracking-wider">
                System Simulator
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                Interactive Schedule Compiler
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Step through the automated sequence below to see how DeadlinePilot orchestrates schedules on the fly.
              </p>
              
              <div className="flex flex-col gap-2 pt-2">
                {demoSteps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all text-xs font-semibold cursor-pointer ${
                      activeStep === idx 
                        ? 'bg-slate-900 border-indigo-500/40 text-indigo-400 shadow-md shadow-indigo-500/5' 
                        : 'bg-slate-950/20 border-slate-900 text-slate-500 hover:text-slate-350 hover:bg-slate-900/30'
                    }`}
                  >
                    <span>{step.title}</span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${activeStep === idx ? 'translate-x-1 text-indigo-400' : 'opacity-0'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Simulator Column Right (Visual Monitor) */}
            <div className="lg:col-span-7 h-72 bg-slate-955/80 rounded-2xl border border-slate-850 p-6 flex flex-col justify-between overflow-hidden relative shadow-inner">
              <div className="absolute top-0 right-0 p-3">
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-indigo-500 tracking-wider uppercase border border-indigo-500/25 bg-indigo-500/5 px-2 py-0.5 rounded">
                  <Zap className="w-2.5 h-2.5" /> Compiler View
                </span>
              </div>
              
              {/* Dynamic screen output based on active step */}
              <div className="flex-1 flex flex-col justify-center animate-in fade-in duration-300">
                {activeStep === 0 && (
                  <div className="space-y-4 max-w-md animate-in fade-in duration-300">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Input Queue</span>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
                      <span className="font-mono text-xs md:text-sm text-slate-200">{demoSteps[0].input}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{demoSteps[0].detail}</p>
                  </div>
                )}

                {activeStep === 1 && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">AI Breakdown Output</span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {demoSteps[1].subtasks?.map((sub, i) => (
                        <div key={i} className="flex justify-between items-center bg-indigo-950/10 border border-indigo-950/20 px-3 py-1.5 rounded-lg text-[10px] md:text-xs">
                          <span className="text-indigo-350 font-medium">{sub.name}</span>
                          <span className="text-slate-500 font-mono bg-slate-900 px-1.5 py-0.5 rounded">{sub.time}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">{demoSteps[1].detail}</p>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Smart Time Allocation</span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {demoSteps[2].slots?.map((slot, i) => (
                        <div key={i} className="flex justify-between items-center bg-purple-950/10 border border-purple-950/20 px-3 py-1.5 rounded-lg text-[10px] md:text-xs">
                          <span className="text-purple-355 font-medium">{slot.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-purple-400 font-mono text-[9px] bg-purple-500/10 px-1.5 rounded border border-purple-550/10">{slot.tag}</span>
                            <span className="text-slate-500 font-mono text-[10px]">{slot.slot}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">{demoSteps[2].detail}</p>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Critical Risk Control</span>
                    <div className="bg-red-500/5 border border-red-500/20 p-3.5 rounded-xl text-[10px] md:text-xs space-y-1.5">
                      <h4 className="text-red-400 font-bold flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 animate-pulse" /> {demoSteps[3].status}
                      </h4>
                      <p className="text-red-300/90 leading-relaxed font-mono text-[10px]">{demoSteps[3].reason}</p>
                    </div>
                    <p className="text-[11px] text-slate-400">{demoSteps[3].detail}</p>
                  </div>
                )}
              </div>
              
              {/* Footer controller inside sandbox */}
              <div className="flex justify-between items-center border-t border-slate-900 pt-3">
                <span className="text-[10px] font-bold text-slate-550">Active: Step {activeStep + 1} of 4</span>
                <button
                  onClick={() => setActiveStep((prev) => (prev + 1) % 4)}
                  className="py-1 px-3 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  Next Step <ChevronRight className="w-3 h-3" />
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
