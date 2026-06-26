import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { differenceInHours, format } from 'date-fns';
import { Clock, CheckCircle2, PlayCircle, BarChart3, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Task } from '../types';
import { clsx } from 'clsx';
import confetti from 'canvas-confetti';

function DashboardTaskProgress({ task }: { task: Task }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (task.status !== 'in-progress') return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [task.status]);

  let progress = task.progress || 0;
  if (task.status === 'in-progress' || task.status === 'paused') {
    const estSeconds = (task.estimatedTime || 1) * 3600;
    let elapsed = task.timeElapsed || 0;
    if (task.status === 'in-progress' && task.startedAt) {
      elapsed += Math.max(0, Math.floor((Date.now() - new Date(task.startedAt).getTime()) / 1000));
    }
    progress = Math.min(100, Math.floor((elapsed / estSeconds) * 100));
  }

  return (
    <>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all" style={{width: `${progress}%`}}></div>
      </div>
      <span className="text-[10px] text-gray-400 mt-1 block">{progress}% Complete</span>
    </>
  );
}

function TaskTimerDisplay({ task }: { task: Task }) {
  const [, setTick] = useState(0);
  const { updateTask } = useAppContext();

  useEffect(() => {
    if (task.status !== 'in-progress') return;
    const interval = setInterval(() => {
      const currentElapsed = (task.timeElapsed || 0) + Math.max(0, Math.floor((Date.now() - new Date(task.startedAt!).getTime()) / 1000));
      const estSecs = (task.estimatedTime || 1) * 3600;
      
      if (currentElapsed >= estSecs) {
         updateTask(task.id, {
           status: 'completed',
           progress: 100,
           timeElapsed: currentElapsed,
           completedAt: new Date().toISOString()
         });
         confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } else {
         setTick(t => t + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [task.status, task.timeElapsed, task.estimatedTime, task.startedAt, task.id, updateTask]);

  const estSeconds = (task.estimatedTime || 1) * 3600;
  let elapsed = task.timeElapsed || 0;
  if (task.status === 'in-progress' && task.startedAt) {
    elapsed += Math.max(0, Math.floor((Date.now() - new Date(task.startedAt).getTime()) / 1000));
  }

  const isOverTime = elapsed >= estSeconds;
  const diff = Math.abs(estSeconds - elapsed);
  
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  
  let timeStr = "";
  if (h > 0) timeStr += `${h}:`;
  timeStr += `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return (
    <div className={clsx("flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md", isOverTime ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600")}>
      <Timer className="w-3 h-3" />
      <span>{isOverTime ? "+" : "-"}{timeStr}</span>
    </div>
  );
}

export default function Dashboard() {
  const { tasks, updateTask } = useAppContext();
  const [insight, setInsight] = useState<string>("Loading your personalized insight...");

  // Metrics
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaysCompletedTasks = tasks.filter(t => t.status === 'completed' && format(new Date(t.deadline), 'yyyy-MM-dd') === todayStr);
  
  // Sort pending by nearest deadline
  const upcomingTasks = [...pendingTasks].sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const getRiskColor = (task: any) => {
    const hoursLeft = differenceInHours(new Date(task.deadline), new Date());
    if (hoursLeft < 12) return "text-red-500 bg-red-50";
    if (hoursLeft < 48) return "text-amber-500 bg-amber-50";
    return "text-green-500 bg-green-50";
  };

  useEffect(() => {
    fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: pendingTasks, completedTasks: tasks.filter(t => t.status==='completed')})
    })
    .then(r => r.json())
    .then(data => {
      if (data.insights?.insight) {
        setInsight(data.insights.insight);
      } else {
        setInsight("Focus on knocking out the tasks with the nearest deadlines first today. You can do this!");
      }
    })
    .catch(() => setInsight("Focus on knocking out the tasks with the nearest deadlines first today. You can do this!"));
  }, []);

  return (
    <div className="p-6 space-y-8">
      {/* Greeting & Quick Stats */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">Good {new Date().getHours() < 12 ? 'Morning' : 'Evening'}, Pro.</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex flex-col items-center justify-center text-center">
          <div className="bg-blue-100 p-2 rounded-full mb-2">
            <CheckCircle2 className="w-6 h-6 text-blue-600" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{todaysCompletedTasks.length}</span>
          <span className="text-xs font-medium text-gray-500">Completed today</span>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="bg-slate-100 p-2 rounded-full mb-2">
               <Clock className="w-6 h-6 text-slate-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{pendingTasks.length}</span>
            <span className="text-xs font-medium text-gray-500">Pending tasks</span>
        </div>
      </div>

      {/* AI Coach Suggestion */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
        <div className="flex items-center gap-2 mb-3 z-10 relative">
          <span className="bg-blue-500/20 text-blue-300 text-[10px] uppercase font-bold tracking-wider py-1 px-2 rounded-full border border-blue-500/30">AI Coach</span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed z-10 relative">
          {insight}
        </p>
      </div>

      {/* Action Zone */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900">Up Next</h3>
          <Link to="/tasks" className="text-sm text-blue-600 font-medium hover:underline">View all</Link>
        </div>
        
        {upcomingTasks.slice(0,3).map(task => {
           const hoursLeft = differenceInHours(new Date(task.deadline), new Date());
           return (
             <div key={task.id} className="bg-white border text-left border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start mb-2">
                 <h4 className="font-semibold text-gray-900">{task.title}</h4>
                 <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${getRiskColor(task)}`}>
                   {hoursLeft < 0 ? 'Overdue' : format(new Date(task.deadline), "MMM d, h:mm a")}
                 </span>
               </div>
               
               <div className="flex items-center gap-2 mb-2">
                 {task.status === 'in-progress' && <TaskTimerDisplay task={task} />}
                 <span className={task.status === 'in-progress' ? 'hidden' : 'text-xs text-gray-500 font-medium'}>
                   {task.estimatedTime ? (task.estimatedTime < 1 ? `${Math.round(task.estimatedTime * 60)}m` : `${task.estimatedTime}h`) : '1h'} est.
                 </span>
               </div>

               <div className="flex items-center justify-between mt-2">
                 <div className="flex-1 mr-4">
                   <DashboardTaskProgress task={task} />
                 </div>
                 <div className="flex gap-2">
                   <button onClick={() => {
                     updateTask(task.id, { status: 'completed', progress: 100, completedAt: new Date().toISOString() });
                     confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                   }} className="bg-green-100 text-green-700 text-xs font-semibold py-1.5 px-2 rounded-lg hover:bg-green-200 transition">
                     <CheckCircle2 className="w-4 h-4" />
                   </button>
                   {task.status === 'in-progress' ? (
                     <button onClick={() => {
                       const elapsed = Math.floor((Date.now() - new Date(task.startedAt!).getTime()) / 1000);
                       updateTask(task.id, { status: 'paused', timeElapsed: (task.timeElapsed || 0) + Math.max(0, elapsed) });
                     }} className="bg-amber-100 text-amber-700 text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-amber-200 transition">
                       Pause
                     </button>
                   ) : (
                     <button onClick={() => {
                       updateTask(task.id, { status: 'in-progress', startedAt: new Date().toISOString() });
                     }} className="bg-blue-600 text-white text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-blue-700 transition shadow-sm">
                       {task.status === 'paused' ? 'Continue' : 'Start'}
                     </button>
                   )}
                 </div>
               </div>
             </div>
           )
        })}

        {upcomingTasks.length === 0 && (
           <div className="text-center py-8 text-gray-400">
             <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
             <p className="text-sm">You are all caught up!</p>
           </div>
        )}
      </div>

      {todaysCompletedTasks.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="font-bold text-lg text-gray-900">Completed Today</h3>
          {todaysCompletedTasks.map(task => (
            <div key={task.id} className="bg-gray-50 border text-left border-gray-100 p-4 rounded-xl flex items-center justify-between opacity-75">
               <div className="flex flex-col">
                 <h4 className="font-medium text-gray-700 line-through">{task.title}</h4>
                 <span className="text-[10px] text-gray-500 mt-0.5">
                   Completed at {task.completedAt ? format(new Date(task.completedAt), "h:mm a") : format(new Date(), "h:mm a")}
                 </span>
               </div>
               <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
