import React from 'react';
import { useAppContext } from '../store';
import { AlertCircle, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { differenceInHours, format } from 'date-fns';

export default function Goals() {
  const { tasks } = useAppContext();
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaysTasks = tasks.filter(t => format(new Date(t.deadline), 'yyyy-MM-dd') === todayStr);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-white sticky top-0 py-2 z-10">
        <h2 className="text-2xl font-bold text-gray-900">Today's Tasks</h2>
      </div>

      <div className="space-y-4">
        {todaysTasks.sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).map(task => {
          const hoursToDeadline = differenceInHours(new Date(task.deadline), new Date());
          const isOverdue = hoursToDeadline < 0 && task.status !== 'completed';
          
          return (
             <div key={task.id} className={clsx("bg-white border p-4 rounded-2xl shadow-sm relative overflow-hidden", isOverdue ? "border-red-200" : "border-gray-100")}>
                {isOverdue && <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 flex-1 pr-4">{task.title}</h3>
                </div>
                
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{task.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
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
             </div>
          )
        })}

        {todaysTasks.length === 0 && (
           <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
             <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
             <p className="text-sm font-medium">No tasks found for today.</p>
           </div>
        )}
      </div>
    </div>
  );
}
