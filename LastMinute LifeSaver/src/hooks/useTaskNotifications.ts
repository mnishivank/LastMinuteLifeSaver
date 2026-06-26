import { useEffect, useRef } from 'react';
import { differenceInMinutes } from 'date-fns';
import toast from 'react-hot-toast';
import { useAppContext } from '../store';

export function useTaskNotifications() {
  const { tasks } = useAppContext();
  const notifiedTasks = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Load previously notified tasks from local storage to prevent spam on reload
    const stored = localStorage.getItem('lmls_notified_tasks');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          notifiedTasks.current = new Set(parsed);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const isEnabled = localStorage.getItem('lmls_alerts_enabled') === 'true';
      if (!isEnabled) {
        return;
      }

      let hasNewNotifications = false;

      tasks.forEach((task) => {
        if (task.status === 'completed') return;

        const minutesToDeadline = differenceInMinutes(new Date(task.deadline), new Date());
        
        // Notify if deadline is within 30 minutes and we haven't notified yet
        if (minutesToDeadline <= 30 && minutesToDeadline >= 0 && !notifiedTasks.current.has(task.id)) {
          toast(`Task Deadline Approaching! "${task.title}" is due in ${minutesToDeadline} minutes!`, {
            icon: '⚠️',
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            },
          });
          
          notifiedTasks.current.add(task.id);
          hasNewNotifications = true;
        }
      });

      if (hasNewNotifications) {
        localStorage.setItem('lmls_notified_tasks', JSON.stringify(Array.from(notifiedTasks.current)));
      }

    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [tasks]);
}
