import React, { useMemo } from 'react';
import { useAppContext } from '../store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';

export default function Analytics() {
  const { tasks } = useAppContext();

  const completed = tasks.filter(t => t.status === 'completed').length;
  const pending = tasks.filter(t => t.status !== 'completed').length;
  const total = tasks.length;
  
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Generate data for the last 7 days
  const data = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), 6 - i));
    
    return last7Days.map(date => {
      const completedTasksOnDay = tasks.filter(t => 
        t.status === 'completed' && t.deadline && isSameDay(new Date(t.deadline), date)
      );

      const focusHoursOnDay = completedTasksOnDay.reduce((sum, t) => sum + (t.estimatedTime || 0), 0);

      return {
        name: format(date, 'EEE'), // e.g., 'Mon', 'Tue'
        completed: completedTasksOnDay.length,
        focus: focusHoursOnDay,
      };
    });
  }, [tasks]);

  const mostProductiveDay = useMemo(() => {
    if (data.length === 0 || data.every(d => d.completed === 0)) return null;
    return data.reduce((max, d) => d.completed > max.completed ? d : max, data[0]);
  }, [data]);

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center bg-white sticky top-0 py-2 z-10 box-border">
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Success Rate</span>
            <span className="text-3xl font-bold">{completionRate}%</span>
         </div>
         <div className="bg-blue-50 text-blue-900 border border-blue-100 p-5 rounded-2xl shadow-sm">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-wider block mb-1">Tasks Done</span>
            <span className="text-3xl font-bold">{completed} <span className="text-xl text-blue-300">/ {total}</span></span>
         </div>
      </div>

      <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
         <h3 className="font-bold text-gray-800 mb-6">Weekly Performance</h3>
         <div className="h-64 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
               <XAxis 
                 dataKey="name" 
                 axisLine={false} 
                 tickLine={false} 
                 tick={{ fontSize: 12, fill: '#6B7280' }} 
                 dy={10} 
               />
               <YAxis 
                 axisLine={false} 
                 tickLine={false} 
                 tick={{ fontSize: 12, fill: '#6B7280' }} 
                 allowDecimals={false}
               />
               <Tooltip 
                 cursor={{ fill: '#F3F4F6' }}
                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
               />
               <Bar dataKey="completed" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
             </BarChart>
           </ResponsiveContainer>
         </div>
      </div>

      <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl">
        <h3 className="font-bold text-gray-800 mb-2">Productivity History</h3>
        {mostProductiveDay ? (
          <p className="text-sm text-gray-500">
            Your most productive day in the last 7 days was <strong>{mostProductiveDay.name === format(new Date(), 'EEE') ? 'Today' : mostProductiveDay.name}</strong> with {mostProductiveDay.completed} completed tasks.
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            Complete some tasks over the week to see your most productive days!
          </p>
        )}
      </div>

    </div>
  )
}
