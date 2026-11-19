import { useState, useEffect, useCallback } from 'react';
import { supabase } from './useSupabase';
import { useNotifications } from './useNotifications';

export function useSchedule() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { scheduleClassAlert, cancelAlert } = useNotifications();

  const parseHourMinute = (time) => {
    if (!time) return { hour: 8, minute: 0 };
    const [h, m] = time.split(':').map(Number);
    return { hour: isNaN(h) ? 8 : h, minute: isNaN(m) ? 0 : m };
  };

  // Carga inicial en useEffect
  useEffect(() => {
    let isCurrent = true;

    supabase
      .from('classes')
      .select('*')
      .order('start_time', { ascending: true })
      .then(({ data, error }) => {
        if (!isCurrent) return;
        if (!error && data) {
          setClasses(data);
        } else if (error) {
          console.warn('Error fetching classes:', error.message);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isCurrent) return;
        console.error('Error fetching classes:', err);
        setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  // Recarga manual (Pull-to-refresh)
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('start_time', { ascending: true });

      if (!error && data) {
        setClasses(data);
      } else if (error) {
        console.warn('Error fetching classes:', error.message);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // CREATE
  const addClass = async (newClass) => {
    const { hour, minute } = parseHourMinute(newClass.start_time);
    const notificationId = await scheduleClassAlert(
      newClass.subject,
      newClass.room || '',
      newClass.day_of_week,
      hour,
      minute
    );

    const { data, error } = await supabase
      .from('classes')
      .insert([{ ...newClass, notification_id: notificationId }])
      .select()
      .single();

    if (!error && data) {
      setClasses((prev) =>
        [...prev, data].sort((a, b) => a.start_time.localeCompare(b.start_time))
      );
    }
    return { data, error };
  };

  // UPDATE
  const updateClass = async (id, changes) => {
    const current = classes.find((c) => c.id === id);
    if (!current) return;

    await cancelAlert(current.notification_id);

    const merged = { ...current, ...changes };
    const { hour, minute } = parseHourMinute(merged.start_time);
    const notification_id = await scheduleClassAlert(
      merged.subject,
      merged.room || '',
      merged.day_of_week,
      hour,
      minute
    );

    const { data, error } = await supabase
      .from('classes')
      .update({ ...changes, notification_id })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setClasses((prev) =>
        prev
          .map((c) => (c.id === id ? data : c))
          .sort((a, b) => a.start_time.localeCompare(b.start_time))
      );
    }
    return { data, error };
  };

  // DELETE
  const deleteClass = async (id) => {
    const target = classes.find((c) => c.id === id);
    await cancelAlert(target?.notification_id);

    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (!error) {
      setClasses((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return { classes, loading, fetchClasses, addClass, updateClass, deleteClass };
}
