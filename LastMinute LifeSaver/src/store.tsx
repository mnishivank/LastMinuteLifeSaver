import React, { createContext, useContext, useEffect, useState } from 'react';
import { Task, Goal, Habit } from './types';
import { v4 as uuidv4 } from 'uuid';

interface AppContextType {
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  addTask: (task: Omit<Task, 'id' | 'status' | 'progress'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'streak' | 'completionPercentage'>) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'streak'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);

  // Load from local storage
  useEffect(() => {
    const dTasks = localStorage.getItem('lmls_tasks');
    const dGoals = localStorage.getItem('lmls_goals');
    const dHabits = localStorage.getItem('lmls_habits');
    
    if (dTasks) setTasks(JSON.parse(dTasks));
    else {
      // Mock Data initial load
      setTasks([
        {
          id: uuidv4(),
          title: "Prepare for System Design Interview",
          description: "Review Grokking the System Design Interview chapters.",
          deadline: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days
          estimatedTime: 4,
          status: "pending",
          progress: 20
        },
         {
          id: uuidv4(),
          title: "Submit React Assignment",
          description: "Finalize tests and submit on portal.",
          deadline: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(), // 4 hours
          estimatedTime: 2,
          status: "in-progress",
          progress: 80
        }
      ])
    }

    if (dGoals) setGoals(JSON.parse(dGoals));
    if (dHabits) setHabits(JSON.parse(dHabits));
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('lmls_tasks', JSON.stringify(tasks));
    localStorage.setItem('lmls_goals', JSON.stringify(goals));
    localStorage.setItem('lmls_habits', JSON.stringify(habits));
  }, [tasks, goals, habits]);

  const addTask = (task: Omit<Task, 'id' | 'status' | 'progress'>) => {
    const newTask = { ...task, id: uuidv4(), status: "pending" as const, progress: 0 };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      return next;
    });
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addGoal = (goal: Omit<Goal, 'id' | 'streak' | 'completionPercentage'>) => {
    setGoals(prev => [...prev, { ...goal, id: uuidv4(), streak: 0, completionPercentage: 0 }]);
  };

  const addHabit = (habit: Omit<Habit, 'id' | 'streak'>) => {
    setHabits(prev => [...prev, { ...habit, id: uuidv4(), streak: 0 }]);
  };

  return (
    <AppContext.Provider value={{ tasks, goals, habits, addTask, updateTask, deleteTask, addGoal, addHabit }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
