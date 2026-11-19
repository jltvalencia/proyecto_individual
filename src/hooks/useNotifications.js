import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn('Error configurando notificación:', err);
  }
}

export function useNotifications() {
  const requestPermissions = async () => {
    if (Platform.OS === 'web') return false;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (Platform.OS === 'android') {
        // En Android Oreo+ (API 26+), 5 equivale a IMPORTANCE_MAX
        const androidImportanceMax = 5;
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Recordatorios Académicos',
          importance: androidImportanceMax,
        });
      }
      return finalStatus === 'granted';
    } catch (err) {
      console.warn('Error solicitando permisos de notificación:', err);
      return false;
    }
  };

  // Alerta 30 minutos antes de vencer la actividad
  const scheduleTaskAlert = async (title, dueDateISO) => {
    if (Platform.OS === 'web') return null;
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return null;

      const triggerDate = new Date(new Date(dueDateISO).getTime() - 30 * 60 * 1000);
      if (triggerDate <= new Date()) return null;

      return await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Actividad próxima a vencer',
          body: `"${title}" vence en 30 minutos.`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
    } catch (err) {
      console.warn('Error programando alerta de tarea:', err);
      return null;
    }
  };

  // Alerta semanal 15 minutos antes de entrar a clase (day_of_week: 1=Dom ... 7=Sáb)
  const scheduleClassAlert = async (subject, room, expoWeekday, hour, minute) => {
    if (Platform.OS === 'web') return null;
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return null;

      let alertHour = hour;
      let alertMinute = minute - 15;
      if (alertMinute < 0) {
        alertMinute += 60;
        alertHour = alertHour === 0 ? 23 : alertHour - 1;
      }

      return await Notifications.scheduleNotificationAsync({
        content: {
          title: `📚 Clase en 15 min: ${subject}`,
          body: room ? `Aula: ${room}` : 'Prepárate para entrar a clase.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: expoWeekday,
          hour: alertHour,
          minute: alertMinute,
        },
      });
    } catch (err) {
      console.warn('Error programando alerta de clase:', err);
      return null;
    }
  };

  const cancelAlert = async (notificationId) => {
    if (Platform.OS === 'web' || !notificationId) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (err) {
      console.warn('Error cancelando notificación:', err);
    }
  };

  return { requestPermissions, scheduleTaskAlert, scheduleClassAlert, cancelAlert };
}
