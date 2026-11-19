import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Modal, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTasks } from '../hooks/useTasks';
import { useSchedule } from '../hooks/useSchedule';
import { UrgentBanner } from '../ui/UrgentBanner';
import { ClassCard } from '../ui/ClassCard';
import { TaskItem } from '../ui/TaskItem';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const DAYS_NAMES = ['', 'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

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

export default function HomeScreen() {
  const { tasks, nextUrgentTask, loading: loadingTasks, fetchTasks, addTask, updateTask, toggleComplete, deleteTask } = useTasks();
  const { classes, loading: loadingClasses, fetchClasses, addClass, updateClass, deleteClass } = useSchedule();

  // Fecha y día actual local
  const now = useMemo(() => new Date(), []);
  const todayExpoDay = now.getDay() + 1; // 1=Dom ... 7=Sáb
  const todayName = DAYS_NAMES[todayExpoDay];
  const formattedDate = now.toLocaleDateString([], { day: 'numeric', month: 'short' });

  const todaysClasses = classes.filter((c) => c.day_of_week === todayExpoDay);
  const pendingTasks = tasks.filter((t) => !t.is_completed).slice(0, 4);

  // Modal rápido para editar/crear tarea desde Hoy
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [taskEditingId, setTaskEditingId] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskClassId, setTaskClassId] = useState(null);
  const [taskDateStr, setTaskDateStr] = useState('');
  const [taskTimeStr, setTaskTimeStr] = useState('');

  // Modal rápido para editar/crear clase desde Hoy
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [classEditingId, setClassEditingId] = useState(null);
  const [classSubject, setClassSubject] = useState('');
  const [classRoom, setClassRoom] = useState('');
  const [classDayOfWeek, setClassDayOfWeek] = useState(todayExpoDay);
  const [classStartTime, setClassStartTime] = useState('08:00');
  const [classEndTime, setClassEndTime] = useState('10:00');
  const [classColor, setClassColor] = useState(COLORS[0]);

  const onRefresh = () => {
    fetchTasks();
    fetchClasses();
  };

  // Acciones de Tarea en Hoy
  const openEditTask = (task) => {
    setTaskEditingId(task.id);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskClassId(task.class_id || null);
    const d = new Date(task.due_date);
    setTaskDateStr(toLocalDateStr(d));
    setTaskTimeStr(toLocalTimeStr(d));
    setTaskModalVisible(true);
  };

  const openCreateTaskQuick = () => {
    setTaskEditingId(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskClassId(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTaskDateStr(toLocalDateStr(tomorrow));
    setTaskTimeStr('18:00');
    setTaskModalVisible(true);
  };

  const handleSaveTask = async () => {
    if (!taskTitle.trim()) return Alert.alert('Error', 'Ingresa el título de la actividad.');
    const [year, month, day] = taskDateStr.split('-').map(Number);
    const [hour, minute] = taskTimeStr.split(':').map(Number);
    if (!year || !month || !day || isNaN(hour) || isNaN(minute)) {
      return Alert.alert('Error', 'Fecha u hora en formato inválido.');
    }
    const parsedDate = new Date(year, month - 1, day, hour, minute, 0);
    const payload = {
      title: taskTitle.trim(),
      description: taskDesc.trim() || null,
      class_id: taskClassId,
      due_date: parsedDate.toISOString(),
    };
    if (taskEditingId) {
      await updateTask(taskEditingId, payload);
    } else {
      await addTask(payload);
    }
    setTaskModalVisible(false);
  };

  const confirmDeleteTask = (id, title) => {
    Alert.alert(
      'Eliminar Actividad',
      `¿Deseas eliminar la actividad "${title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteTask(id) },
      ]
    );
  };

  // Acciones de Clase en Hoy
  const openEditClass = (item) => {
    setClassEditingId(item.id);
    setClassSubject(item.subject);
    setClassRoom(item.room || '');
    setClassDayOfWeek(item.day_of_week);
    setClassStartTime(item.start_time ? item.start_time.slice(0, 5) : '08:00');
    setClassEndTime(item.end_time ? item.end_time.slice(0, 5) : '10:00');
    setClassColor(item.color || COLORS[0]);
    setClassModalVisible(true);
  };

  const openCreateClassForToday = () => {
    setClassEditingId(null);
    setClassSubject('');
    setClassRoom('');
    setClassDayOfWeek(todayExpoDay);
    setClassStartTime('08:00');
    setClassEndTime('10:00');
    setClassColor(COLORS[0]);
    setClassModalVisible(true);
  };

  const handleSaveClass = async () => {
    if (!classSubject.trim()) return Alert.alert('Error', 'Ingresa el nombre de la materia.');
    const payload = {
      subject: classSubject.trim(),
      room: classRoom.trim() || null,
      day_of_week: classDayOfWeek,
      start_time: `${classStartTime}:00`,
      end_time: `${classEndTime}:00`,
      color: classColor,
    };
    if (classEditingId) {
      await updateClass(classEditingId, payload);
    } else {
      await addClass(payload);
    }
    setClassModalVisible(false);
  };

  const confirmDeleteClass = (id, subject) => {
    Alert.alert(
      'Eliminar Clase',
      `¿Deseas eliminar la clase "${subject}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteClass(id) },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loadingTasks || loadingClasses} onRefresh={onRefresh} />}
    >
      {/* Banner de fecha actual */}
      <View style={styles.todayBanner}>
        <Text style={styles.todayTitle}>Hoy es {todayName}</Text>
        <Text style={styles.todaySubtitle}>{formattedDate}</Text>
      </View>

      <Text style={styles.sectionTitle}>Actividad más urgente</Text>
      <UrgentBanner task={nextUrgentTask} />

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Clases de hoy ({todaysClasses.length})</Text>
        <TouchableOpacity onPress={() => router.push('/schedule')}>
          <Text style={styles.linkText}>Ver horario completo →</Text>
        </TouchableOpacity>
      </View>

      {todaysClasses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.empty}>No tienes clases programadas para hoy ({todayName}).</Text>
          <TouchableOpacity style={styles.quickAddBtn} onPress={openCreateClassForToday}>
            <Text style={styles.quickAddText}>+ Agregar clase para hoy</Text>
          </TouchableOpacity>
        </View>
      ) : (
        todaysClasses.map((item) => (
          <ClassCard
            key={item.id}
            item={item}
            onEdit={openEditClass}
            onDelete={confirmDeleteClass}
          />
        ))
      )}

      <View style={[styles.sectionHeaderRow, { marginTop: 18 }]}>
        <Text style={styles.sectionTitle}>Próximas tareas pendientes</Text>
        <TouchableOpacity onPress={() => router.push('/tasks')}>
          <Text style={styles.linkText}>Ver todas →</Text>
        </TouchableOpacity>
      </View>

      {pendingTasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.empty}>No hay actividades pendientes por realizar.</Text>
          <TouchableOpacity style={styles.quickAddBtn} onPress={openCreateTaskQuick}>
            <Text style={styles.quickAddText}>+ Registrar nueva actividad</Text>
          </TouchableOpacity>
        </View>
      ) : (
        pendingTasks.map((task) => {
          const subject = classes.find((c) => c.id === task.class_id)?.subject;
          return (
            <TaskItem
              key={task.id}
              task={task}
              subjectName={subject}
              onToggle={toggleComplete}
              onEdit={openEditTask}
              onDelete={confirmDeleteTask}
            />
          );
        })
      )}

      {/* Modal Editar/Crear Tarea en Hoy */}
      <Modal visible={taskModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{taskEditingId ? 'Editar Actividad' : 'Nueva Actividad'}</Text>
            <Input label="Título" value={taskTitle} onChangeText={setTaskTitle} placeholder="Ej: Proyecto Final" />
            <Input label="Descripción (opcional)" value={taskDesc} onChangeText={setTaskDesc} placeholder="Detalles..." />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input label="Fecha (AAAA-MM-DD)" value={taskDateStr} onChangeText={setTaskDateStr} placeholder="2026-11-20" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Hora (HH:MM)" value={taskTimeStr} onChangeText={setTaskTimeStr} placeholder="18:00" />
              </View>
            </View>
            <View style={styles.modalActions}>
              <View style={{ flex: 1 }}>
                <Button title="Cancelar" variant="secondary" onPress={() => setTaskModalVisible(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Guardar" onPress={handleSaveTask} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Editar/Crear Clase en Hoy */}
      <Modal visible={classModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{classEditingId ? 'Editar Clase' : 'Nueva Clase para Hoy'}</Text>
            <Input label="Materia" value={classSubject} onChangeText={setClassSubject} placeholder="Ej: Matemáticas" />
            <Input label="Aula (opcional)" value={classRoom} onChangeText={setClassRoom} placeholder="Ej: Aula 10" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input label="Inicio (HH:MM)" value={classStartTime} onChangeText={setClassStartTime} placeholder="08:00" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Fin (HH:MM)" value={classEndTime} onChangeText={setClassEndTime} placeholder="10:00" />
              </View>
            </View>
            <View style={styles.modalActions}>
              <View style={{ flex: 1 }}>
                <Button title="Cancelar" variant="secondary" onPress={() => setClassModalVisible(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Guardar" onPress={handleSaveClass} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  todayBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  todayTitle: { fontSize: 16, fontWeight: '700', color: '#1E40AF' },
  todaySubtitle: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  linkText: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  empty: { color: '#6B7280', fontSize: 14, marginBottom: 8, textAlign: 'center' },
  quickAddBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  quickAddText: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14, color: '#111827' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
});
