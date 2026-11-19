import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function UrgentBanner({ task }) {
  const [currentTimestamp] = useState(() => Date.now());

  if (!task) {
    return (
      <View style={[styles.card, styles.okCard]}>
        <Text style={styles.okTitle}>🎉 Sin entregas urgentes</Text>
        <Text style={styles.subtitle}>Todas tus actividades pendientes están bajo control.</Text>
      </View>
    );
  }

  const dueDate = new Date(task.due_date);
  const isOverdue = dueDate.getTime() < currentTimestamp;
  const due = dueDate.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.card, isOverdue ? styles.overdueCard : styles.urgentCard]}>
      <Text style={[styles.badge, isOverdue && styles.overdueBadge]}>
        {isOverdue ? '⚠️ ACTIVIDAD VENCIDA' : '⏰ VENCE PRIMERO'}
      </Text>
      <Text style={styles.title}>{task.title}</Text>
      <Text style={[styles.dueText, isOverdue && styles.overdueText]}>
        {isOverdue ? `Venció: ${due}` : `Límite: ${due}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 14, marginBottom: 16 },
  urgentCard: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' },
  overdueCard: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FDBA74' },
  okCard: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#6EE7B7' },
  badge: { fontSize: 11, fontWeight: '800', color: '#DC2626', marginBottom: 4 },
  overdueBadge: { color: '#C2410C' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  dueText: { fontSize: 13, color: '#B91C1C', marginTop: 4, fontWeight: '500' },
  overdueText: { color: '#9A3412' },
  okTitle: { fontSize: 16, fontWeight: '700', color: '#065F46' },
  subtitle: { fontSize: 13, color: '#047857', marginTop: 2 },
});
