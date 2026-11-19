import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export function TaskItem({ task, subjectName, onToggle, onEdit, onDelete }) {
  const formattedDue = new Date(task.due_date).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.checkbox, task.is_completed && styles.checked]}
        onPress={() => onToggle(task)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.is_completed }}
      >
        {task.is_completed && <Text style={styles.checkMark}>✓</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.content} onPress={() => onEdit(task)}>
        <Text style={[styles.title, task.is_completed && styles.completedText]}>
          {task.title}
        </Text>
        {task.description ? (
          <Text style={[styles.desc, task.is_completed && styles.completedDesc]} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}
        <Text style={styles.sub}>
          {subjectName ? `${subjectName} • ` : ''}Vence: {formattedDue}
        </Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onEdit(task)} style={styles.actionBtn}>
          <Text style={styles.editText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(task.id, task.title)} style={styles.actionBtn}>
          <Text style={styles.delText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checked: { backgroundColor: '#2563EB' },
  checkMark: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  content: { flex: 1, paddingRight: 8 },
  title: { fontSize: 15, fontWeight: '600', color: '#111827' },
  desc: { fontSize: 13, color: '#4B5563', marginTop: 2 },
  completedText: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  completedDesc: { color: '#9CA3AF' },
  sub: { fontSize: 12, color: '#6B7280', marginTop: 3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: { padding: 4 },
  editText: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  delText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
});
