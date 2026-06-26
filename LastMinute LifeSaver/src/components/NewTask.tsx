import React, { useState } from 'react';
import { useAppContext } from '../store';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Sparkles, Mic, MicOff } from 'lucide-react';

import { format } from 'date-fns';

export default function NewTask() {
  const { addTask } = useAppContext();
  const navigate = useNavigate();
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const currentTimeStr = format(new Date(), 'HH:mm');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('1');
  const [estimatedUnit, setEstimatedUnit] = useState('hours');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [subtasks, setSubtasks] = useState<any[]>([]);

  const toggleListen = () => {
    if (isListening) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Microphone not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      try {
        setTitle('Parsing spoken input...');
        const res = await fetch('/api/parse-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        if (data.parsedTask) {
          setTitle(data.parsedTask.title || '');
          if (data.parsedTask.description) setDescription(data.parsedTask.description);
          if (data.parsedTask.deadlineDate) setDeadlineDate(data.parsedTask.deadlineDate);
          if (data.parsedTask.deadlineTime) setDeadlineTime(data.parsedTask.deadlineTime);
          if (data.parsedTask.estimatedTime) {
            if (data.parsedTask.estimatedTime < 1) {
              setEstimatedAmount(Math.round(data.parsedTask.estimatedTime * 60).toString());
              setEstimatedUnit('minutes');
            } else {
              setEstimatedAmount(data.parsedTask.estimatedTime.toString());
              setEstimatedUnit('hours');
            }
          }
        }
      } catch (e: any) {
        console.error("Parse error:", e);
        setTitle(transcript); // fallback
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleGenerateBreakdown = async () => {
    if (!title) return alert("Enter a title first.");
    setIsGenerating(true);
    let estHours = parseFloat(estimatedAmount) || 1;
    if (estimatedUnit === 'minutes') estHours = estHours / 60;

    try {
      const res = await fetch('/api/breakdown', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ taskTitle: title, duration: estHours.toString() })
      });
      const data = await res.json();
      if (data.error) {
         throw new Error(data.error);
      }
      if (data.subtasks) {
         setSubtasks(data.subtasks);
         let desc = "AI Generated Breakdown:\n";
         data.subtasks.forEach((s: any, i: number) => {
           desc += `${i+1}. ${s.title} (${s.duration}) - ${s.description}\n`;
         });
         setDescription(prev => prev ? `${prev}\n\n${desc}` : desc);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Failed to generate breakdown: ${e.message || 'Rate limit exceeded or server error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!title || !deadlineDate || !deadlineTime) return alert("Please fill required fields (Title, Date, Time).");
    
    // Combine date and time to ISO string
    const d = new Date(`${deadlineDate}T${deadlineTime}:00`);
    if (d.getTime() < new Date().getTime()) {
      return alert("Please select a future date and time.");
    }
    
    let est = parseFloat(estimatedAmount) || 1;
    if (estimatedUnit === 'minutes') est = est / 60;
    
    addTask({
      title,
      description,
      deadline: d.toISOString(),
      estimatedTime: est
    });
    
    navigate(-1);
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-4 py-4 flex items-center border-b border-gray-100">
         <button onClick={() => navigate(-1)} className="p-2 mr-2 bg-gray-50 rounded-full text-gray-600">
            <ArrowLeft className="w-5 h-5" />
         </button>
         <h2 className="text-xl font-bold flex-1">New Task</h2>
         <button onClick={handleSave} className="bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 shadow-md">
            <Save className="w-4 h-4" />
            Save
         </button>
      </div>

      <div className="p-6 space-y-5">
         {/* Voice Input Highlight */}
         <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
           <div>
             <h3 className="font-semibold text-blue-900 text-sm">Quick Voice Add</h3>
             <p className="text-xs text-blue-600 mt-0.5">Dictate the title, time, and details naturally</p>
           </div>
           <button 
             onClick={toggleListen}
             className={`p-3 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse shadow-md' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}`}
           >
             {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
           </button>
         </div>

         <div>
           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Task Title *</label>
           <div className="relative">
             <input 
               type="text" 
               value={title} 
               onChange={e => setTitle(e.target.value)} 
               className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition" 
               placeholder="e.g. Prepare for Interview" 
             />
           </div>
         </div>

         <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Duration</label>
               <input 
                 type="number" 
                 value={estimatedAmount} 
                 onChange={e => setEstimatedAmount(e.target.value)} 
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition" 
                 placeholder="e.g. 1" 
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Unit</label>
               <select 
                 value={estimatedUnit} 
                 onChange={e => setEstimatedUnit(e.target.value)}
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition appearance-none"
               >
                 <option value="minutes">Minutes</option>
                 <option value="hours">Hours</option>
               </select>
             </div>
         </div>

         <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date *</label>
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
               className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition" 
             />
           </div>
           <div>
             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Time *</label>
             <input 
               type="time" 
               value={deadlineTime} 
               min={deadlineDate === todayStr ? currentTimeStr : undefined}
               onChange={e => setDeadlineTime(e.target.value)} 
               className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition" 
             />
           </div>
         </div>

         <div>
           <div className="flex items-center justify-between mb-2">
             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
             <button type="button" onClick={handleGenerateBreakdown} disabled={isGenerating} className="text-xs text-blue-600 font-bold flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition">
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3 text-blue-500" />}
                {isGenerating ? "Analyzing..." : "AI Breakdown"}
             </button>
           </div>
           <textarea 
             value={description} 
             onChange={e => setDescription(e.target.value)} 
             className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition min-h-[120px]" 
             placeholder="Notes or breakdown..." 
           />
         </div>
      </div>
    </div>
  )
}
