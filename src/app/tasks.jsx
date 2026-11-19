import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Modal, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTasks } from '../hooks/useTasks';
import { useSchedule } from '../hooks/useSchedule';
import { UrgentBanner } from '../ui/UrgentBanner';
import { TaskItem } from '../ui/TaskItem';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const toLocalDateStr = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toLocalTimeStr = (d) => {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function TasksScreen() {
  const { tasks, nextUrgentTask, addTask, updateTask, toggleComplete, deleteTask } = useTasks();
  const { classes } = useSchedule();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'completed'

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState(null);
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');

  const pendingCount = useMemo(() => tasks.filter((t) => !t.is_completed).length, [tasks]);
  const completedCount = useMemo(() => tasks.filter((t) => t.is_completed).length, [tasks]);

  const filteredTasks = useMemo(() => {
    if (statusFilter === 'pending') {
      return tasks.filter((t) => !t.is_completed);
    }
    if (statusFilter === 'completed') {
      return tasks.filter((t) => t.is_completed);
    }
    return tasks;
  }, [tasks, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setClassId(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDateStr(toLocalDateStr(tomorrow));
    setTimeStr('18:00');
    setModalVisible(true);
  };

  const openEdit = (task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setClassId(task.class_id || null);
    const d = new Date(task.due_date);
    setDateStr(toLocalDateStr(d));
    setTimeStr(toLocalTimeStr(d));
    setModalVisible(true);
  };

  const confirmDelete = (id, taskTitle) => {
    Alert.alert(
      'Eliminar Actividad',
      `¿Estás seguro de que deseas eliminar "${taskTitle}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteTask(id) },
      ]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Ingresa el título de la actividad.');

    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    if (!year || !month || !day || isNaN(hour) || isNaN(minute)) {
      return Alert.alert('Formato inválido', 'Usa AAAA-MM-DD para fecha y HH:MM para hora.');
    }

    const parsedDate = new Date(year, month - 1, day, hour, minute, 0);
    if (isNaN(parsedDate.getTime())) {
      return Alert.alert('Fecha inválida', 'Verifica los valores de fecha y hora ingresados.');
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      class_id: classId,
      due_date: parsedDate.toISOString(),
    };

    if (editingId) {
      await updateTask(editingId, payload);
    } else {
      await addTask(payload);
    }
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <UrgentBanner task={nextUrgentTask} />
      <Button title="+ Nueva Actividad" onPress={openCreate} />

      {/* Filtros de estado de tareas */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterTab, statusFilter === 'all' && styles.filterTabActive]}
          onPress={() => setStatusFilter('all')}
        >
          <Text style={statusFilter === 'all' ? styles.filterTabTextActive : styles.filterTabText}>
            Todas ({tasks.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, statusFilter === 'pending' && styles.filterTabActive]}
          onPress={() => setStatusFilter('pending')}
        >
          <Text style={statusFilter === 'pending' ? styles.filterTabTextActive : styles.filterTabText}>
            Pendientes ({pendingCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, statusFilter === 'completed' && styles.filterTabActive]}
          onPress={() => setStatusFilter('completed')}
        >
          <Text style={statusFilter === 'completed' ? styles.filterTabTextActive : styles.filterTabText}>
            Completadas ({completedCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, marginTop: 8 }}>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {statusFilter === 'completed'
                ? 'No hay actividades completadas'
                : statusFilter === 'pending'
                ? '¡Genial! No tienes actividades pendientes'
                : 'No hay actividades registradas'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {statusFilter === 'all'
                ? 'Usa el botón "+ Nueva Actividad" para registrar tu primera tarea.'
                : ''}
            </Text>
          </View>
        ) : (
          filteredTasks.map((task) => {
            const subjectName = classes.find((c) => c.id === task.class_id)?.subject;
            return (
              <TaskItem
                key={task.id}
                task={task}
                subjectName={subjectName}
                onToggle={toggleComplete}
                onEdit={openEdit}
                onDelete={confirmDelete}
              />
            );
          })
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingId ? 'Editar Actividad' : 'Nueva Actividad'}</Text>

            <Input label="Título" value={title} onChangeText={setTitle} placeholder="Ej: Taller de Base de Datos" />
            <Input label="Descripción (opcional)" value={description} onChangeText={setDescription} placeholder="Detalles de la entrega..." />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input label="Fecha (AAAA-MM-DD)" value={dateStr} onChangeText={setDateStr} placeholder="2026-11-20" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Hora (HH:MM)" value={timeStr} onChangeText={setTimeStr} placeholder="18:00" />
              </View>
            </View>

            <Text style={styles.label}>Materia vinculada (opcional)</Text>
            <View style={styles.rowWrap}>
              <TouchableOpacity
                style={[styles.chip, classId === null && styles.chipActive]}
                onPress={() => setClassId(null)}
              >
                <Text style={classId === null ? styles.chipTextActive : styles.chipText}>General</Text>
              </TouchableOpacity>
              {classes.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, classId === c.id && styles.chipActive]}
                  onPress={() => setClassId(c.id)}
                >
                  <Text style={classId === c.id ? styles.chipTextActive : styles.chipText}>{c.subject}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <View style={{ flex: 1 }}>
                <Button title="Cancelar" variant="secondary" onPress={() => setModalVisible(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Guardar" onPress={handleSave} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 3,
    marginTop: 14,
    marginBottom: 6,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterTabTextActive: { fontSize: 12, fontWeight: '700', color: '#111827' },
  emptyContainer: { alignItems: 'center', marginTop: 30, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 4, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14, color: '#111827' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#2563EB' },
  chipText: { color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#FFF', fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
});
