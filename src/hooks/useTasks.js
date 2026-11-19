import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './useSupabase';
import { useNotifications } from './useNotifications';

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { scheduleTaskAlert, cancelAlert } = useNotifications();

  // Carga inicial en useEffect
  useEffect(() => {
    let isCurrent = true;

    supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true })
      .then(({ data, error }) => {
        if (!isCurrent) return;
        if (!error && data) {
          setTasks(data);
        } else if (error) {
          console.warn('Error fetching tasks:', error.message);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isCurrent) return;
        console.error('Error fetching tasks:', err);
        setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  // Recarga manual (Pull-to-refresh)
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true });

      if (!error && data) {
        setTasks(data);
      } else if (error) {
        console.warn('Error fetching tasks:', error.message);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // CREATE
  const addTask = async (newTask) => {
    const notificationId = await scheduleTaskAlert(newTask.title, newTask.due_date);

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...newTask, notification_id: notificationId }])
      .select()
      .single();

    if (!error && data) {
      setTasks((prev) =>
        [...prev, data].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      );
    }
    return { data, error };
  };

  // UPDATE
  const updateTask = async (id, changes) => {
    const current = tasks.find((t) => t.id === id);
    if (!current) return;

    let notification_id = current.notification_id;
    const nextTitle = changes.title ?? current.title;
    const nextDueDate = changes.due_date ?? current.due_date;
    const nextCompleted = changes.is_completed ?? current.is_completed;

    if (!nextCompleted && (changes.due_date || changes.title)) {
      await cancelAlert(current.notification_id);
      notification_id = await scheduleTaskAlert(nextTitle, nextDueDate);
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({ ...changes, notification_id })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setTasks((prev) =>
        prev
          .map((t) => (t.id === id ? data : t))
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      );
    }
    return { data, error };
  };

  // UPDATE (Completar / Reactivar)
  const toggleComplete = async (task) => {
    const nextStatus = !task.is_completed;
    let notification_id = null;

    if (nextStatus) {
      await cancelAlert(task.notification_id);
    } else {
      notification_id = await scheduleTaskAlert(task.title, task.due_date);
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({ is_completed: nextStatus, notification_id })
      .eq('id', task.id)
      .select()
      .single();

    if (!error && data) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data : t)));
    }
  };

  // DELETE
  const deleteTask = async (id) => {
    const target = tasks.find((t) => t.id === id);
    await cancelAlert(target?.notification_id);

    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // Tarea pendiente que vence primero (las tareas ya vienen ordenadas por due_date ASC)
  const nextUrgentTask = useMemo(() => {
    return tasks.find((t) => !t.is_completed) || null;
  }, [tasks]);

  return {
    tasks,
    loading,
    nextUrgentTask,
    fetchTasks,
    addTask,
    updateTask,
    toggleComplete,
    deleteTask,
  };
}
