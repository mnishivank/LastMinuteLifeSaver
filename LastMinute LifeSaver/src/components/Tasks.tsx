import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { differenceInHours, format } from 'date-fns';
import { Pen, Trash2, Plus, Clock, AlertCircle, X, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { Task } from '../types';

function QuickEditModal({ task, onClose }: { task: Task, onClose: () => void }) {
  const { updateTask } = useAppContext();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  
  const initialEstAmount = task.estimatedTime ? (task.estimatedTime < 1 ? Math.round(task.estimatedTime * 60).toString() : task.estimatedTime.toString()) : '1';
  const initialEstUnit = task.estimatedTime && task.estimatedTime < 1 ? 'minutes' : 'hours';
  const [estimatedAmount, setEstimatedAmount] = useState(initialEstAmount);
  const [estimatedUnit, setEstimatedUnit] = useState(initialEstUnit);

  const [deadlineDate, setDeadlineDate] = useState(format(new Date(task.deadline), 'yyyy-MM-dd'));
  const [deadlineTime, setDeadlineTime] = useState(format(new Date(task.deadline), 'HH:mm'));

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const currentTimeStr = format(new Date(), 'HH:mm');

  const handleSave = () => {
    let est = parseFloat(estimatedAmount) || 1;
    if (estimatedUnit === 'minutes') est = est / 60;

    updateTask(task.id, {
      title,
      description,
      estimatedTime: est,
      deadline: new Date(`${deadlineDate}T${deadlineTime}:00`).toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Edit Task</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date</label>
               <input 
                 type="date" 
                 value={deadlineDate} 
                 min={todayStr}
                 onChange={e => {
                   setDeadlineDate(e.target.value);
                   if (e.target.value === todayStr && deadlineTime < currentTimeStr) {
                     setDeadlineTime(currentTimeStr);
                   }
                 }} 
                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400" 
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Time</label>
               <input 
                 type="time" 
                 value={deadlineTime} 
                 min={deadlineDate === todayStr ? currentTimeStr : undefined}
                 onChange={e => setDeadlineTime(e.target.value)} 
                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400" 
               />
             </div>
           </div>
          <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Duration</label>
               <input 
                 type="number" 
                 value={estimatedAmount} 
                 onChange={e => setEstimatedAmount(e.target.value)} 
                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400" 
                 placeholder="e.g. 1" 
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Unit</label>
               <select 
                 value={estimatedUnit} 
                 onChange={e => setEstimatedUnit(e.target.value)}
                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400 appearance-none bg-white"
               >
                 <option value="minutes">Minutes</option>
                 <option value="hours">Hours</option>
               </select>
             </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition">Save</button>
        </div>
      </div>
    </div>
  )
}

export default function Tasks() {
  const { tasks, deleteTask, updateTask } = useAppContext();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-white sticky top-0 py-2 z-10">
        <h2 className="text-2xl font-bold text-gray-900">All Tasks</h2>
        <div className="flex items-center gap-3">
          <Link to="/tasks/new" className="bg-blue-600 text-white p-2 rounded-xl shadow-md hover:bg-blue-700 transition">
            <Plus className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.filter(t => t.status !== 'completed').sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).map(task => {
          const hoursToDeadline = differenceInHours(new Date(task.deadline), new Date());
          const isOverdue = hoursToDeadline < 0 && task.status !== 'completed';
          
          return (
             <div key={task.id} className={clsx("bg-white border p-4 rounded-2xl shadow-sm relative overflow-hidden", isOverdue ? "border-red-200" : "border-gray-100")}>
                {isOverdue && <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 flex-1 pr-4">{task.title}</h3>
                </div>
                
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{task.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                      {isOverdue ? "Overdue" : format(new Date(task.deadline), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={task.status === 'in-progress' ? 'hidden' : ''}>
                      {task.estimatedTime ? (task.estimatedTime < 1 ? `${Math.round(task.estimatedTime * 60)}m` : `${task.estimatedTime}h`) : '1h'} est.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                   <div className="flex gap-2">
                     {task.status === 'in-progress' ? (
                       <button onClick={() => {
                         const elapsed = Math.floor((Date.now() - new Date(task.startedAt!).getTime()) / 1000);
                         updateTask(task.id, { status: 'paused', timeElapsed: (task.timeElapsed || 0) + Math.max(0, elapsed) });
                       }} className="bg-amber-100 text-amber-700 text-xs font-semibold py-1.5 px-4 rounded-lg hover:bg-amber-200 transition">
                         Pause
                       </button>
                     ) : task.status === 'completed' ? (
                       <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-semibold py-1.5 px-3 rounded-lg">
                         Completed
                       </span>
                     ) : null}
                   </div>

                   <div className="flex gap-2">
                     <button onClick={() => setEditingTask(task)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg transition">
                       <Pen className="w-4 h-4" />
                     </button>
                     <button onClick={() => setDeletingTaskId(task.id)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-lg transition">
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                </div>
             </div>
          )
        })}

        {tasks.filter(t => t.status !== 'completed').length === 0 && (
           <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
             <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
             <p className="text-sm font-medium">No pending tasks found.</p>
             <p className="text-xs mt-1">Tap the plus icon to create one.</p>
           </div>
        )}
      </div>

      {editingTask && <QuickEditModal task={editingTask} onClose={() => setEditingTask(null)} />}
      
      {deletingTaskId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Task</h3>
              <p className="text-sm text-gray-500">Are you sure you want to delete this task? This action cannot be undone.</p>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button onClick={() => setDeletingTaskId(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition">Cancel</button>
              <button onClick={() => {
                deleteTask(deletingTaskId);
                setDeletingTaskId(null);
              }} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
