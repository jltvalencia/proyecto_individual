import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const DAYS = ['', 'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function ClassCard({ item, onEdit, onDelete }) {
  return (
    <View style={[styles.card, { borderLeftColor: item.color || '#2563EB' }]}>
      <View style={styles.info}>
        <Text style={styles.subject}>{item.subject}</Text>
        <Text style={styles.meta}>
          {DAYS[item.day_of_week] || ''} • {item.start_time ? item.start_time.slice(0, 5) : ''} - {item.end_time ? item.end_time.slice(0, 5) : ''}
          {item.room ? ` • Aula ${item.room}` : ''}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn}>
          <Text style={styles.editText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item.id, item.subject)} style={styles.actionBtn}>
          <Text style={styles.deleteText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  info: { flex: 1, paddingRight: 8 },
  subject: { fontSize: 16, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 13, color: '#6B7280', marginTop: 3 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { padding: 4 },
  editText: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  deleteText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
});
