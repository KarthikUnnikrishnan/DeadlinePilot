import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { TaskDashboard } from './components/TaskDashboard';
import { LandingPage } from './components/LandingPage';
import { Compass, BookOpen } from 'lucide-react';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const isLanding = location.pathname === '/landing';

  const handleLaunch = () => {
    localStorage.setItem('deadlinepilot_has_visited', 'true');
    navigate('/');
  };

  const handleToggleView = () => {
    if (isLanding) {
      navigate('/');
    } else {
      navigate('/landing');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] flex flex-col selection:bg-indigo-600/30 selection:text-indigo-200 relative">
      {/* Decorative background grid and blurs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b05_1px,transparent_1px),linear-gradient(to_bottom,#1e293b05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating Demo Navigation Header (Only visible on dashboard to return to Landing, and vice versa) */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button
          onClick={handleToggleView}
          className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-300 hover:text-white transition-all shadow-lg cursor-pointer"
        >
          {isLanding ? (
            <>
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              Go to Deck
            </>
          ) : (
            <>
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              Landing Info
            </>
          )}
        </button>
      </div>

      {/* Main content with page transition styles */}
      <main className="flex-1 relative z-10 flex flex-col justify-between">
        <Routes>
          <Route path="/" element={
            <div className="animate-in fade-in duration-300">
              <TaskDashboard />
            </div>
          } />
          <Route path="/landing" element={
            <div className="animate-in fade-in duration-300">
              <LandingPage onLaunch={handleLaunch} />
            </div>
          } />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950/20 text-center relative z-10">
        <p className="text-[10px] md:text-xs text-slate-550">
          DeadlinePilot &copy; {new Date().getFullYear()} - Navigating your productivity checkpoints. Built with FastAPI & React.
        </p>
      </footer>
    </div>
  );
}

export default App;

