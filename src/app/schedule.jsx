import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Modal, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSchedule } from '../hooks/useSchedule';
import { ClassCard } from '../ui/ClassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const DAYS = [
  { label: 'Lun', value: 2 },
  { label: 'Mar', value: 3 },
  { label: 'Mié', value: 4 },
  { label: 'Jue', value: 5 },
  { label: 'Vie', value: 6 },
  { label: 'Sáb', value: 7 },
  { label: 'Dom', value: 1 },
];

const FILTER_DAYS = [
  { label: 'Todos', value: 0 },
  ...DAYS,
];

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function ScheduleScreen() {
  const { classes, addClass, updateClass, deleteClass } = useSchedule();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedDayFilter, setSelectedDayFilter] = useState(0);

  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(2);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [color, setColor] = useState(COLORS[0]);

  const sortedAndFilteredClasses = useMemo(() => {
    let list = [...classes];
    if (selectedDayFilter > 0) {
      list = list.filter((c) => c.day_of_week === selectedDayFilter);
    }
    return list.sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) {
        // Ordenar Lun(2) a Dom(1) o por día
        const orderA = a.day_of_week === 1 ? 8 : a.day_of_week;
        const orderB = b.day_of_week === 1 ? 8 : b.day_of_week;
        return orderA - orderB;
      }
      return (a.start_time || '').localeCompare(b.start_time || '');
    });
  }, [classes, selectedDayFilter]);

  const openCreate = () => {
    setEditingId(null);
    setSubject('');
    setRoom('');
    setDayOfWeek(selectedDayFilter > 0 ? selectedDayFilter : 2);
    setStartTime('08:00');
    setEndTime('10:00');
    setColor(COLORS[0]);
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setSubject(item.subject);
    setRoom(item.room || '');
    setDayOfWeek(item.day_of_week);
    setStartTime(item.start_time ? item.start_time.slice(0, 5) : '08:00');
    setEndTime(item.end_time ? item.end_time.slice(0, 5) : '10:00');
    setColor(item.color || COLORS[0]);
    setModalVisible(true);
  };

  const confirmDelete = (id, subjectName) => {
    Alert.alert(
      'Eliminar Clase',
      `¿Estás seguro de que deseas eliminar la clase "${subjectName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteClass(id) },
      ]
    );
  };

  const handleSave = async () => {
    if (!subject.trim()) return Alert.alert('Error', 'Ingresa el nombre de la materia.');

    const payload = {
      subject: subject.trim(),
      room: room.trim() || null,
      day_of_week: dayOfWeek,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
      color,
    };

    if (editingId) {
      await updateClass(editingId, payload);
    } else {
      await addClass(payload);
    }
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Button title="+ Agregar Clase" onPress={openCreate} />

      {/* Selector de días para filtrar el horario */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
        {FILTER_DAYS.map((d) => (
          <TouchableOpacity
            key={d.value}
            style={[styles.filterChip, selectedDayFilter === d.value && styles.filterChipActive]}
            onPress={() => setSelectedDayFilter(d.value)}
          >
            <Text style={selectedDayFilter === d.value ? styles.filterChipTextActive : styles.filterChipText}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }}>
        {sortedAndFilteredClasses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No hay clases registradas</Text>
            <Text style={styles.emptySubtitle}>
              {selectedDayFilter > 0
                ? 'No tienes clases para el día seleccionado.'
                : 'Usa el botón "+ Agregar Clase" para registrar tus materias.'}
            </Text>
          </View>
        ) : (
          sortedAndFilteredClasses.map((item) => (
            <ClassCard key={item.id} item={item} onEdit={openEdit} onDelete={confirmDelete} />
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingId ? 'Editar Clase' : 'Nueva Clase'}</Text>

            <Input label="Materia" value={subject} onChangeText={setSubject} placeholder="Ej: Programación Móvil" />
            <Input label="Aula (opcional)" value={room} onChangeText={setRoom} placeholder="Ej: Lab 4" />

            <Text style={styles.label}>Día de la semana</Text>
            <View style={styles.rowWrap}>
              {DAYS.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.chip, dayOfWeek === d.value && styles.chipActive]}
                  onPress={() => setDayOfWeek(d.value)}
                >
                  <Text style={dayOfWeek === d.value ? styles.chipTextActive : styles.chipText}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input label="Inicio (HH:MM)" value={startTime} onChangeText={setStartTime} placeholder="08:00" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Fin (HH:MM)" value={endTime} onChangeText={setEndTime} placeholder="10:00" />
              </View>
            </View>

            <Text style={styles.label}>Color identificador</Text>
            <View style={styles.rowWrap}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorSelected]}
                  onPress={() => setColor(c)}
                />
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
  filterScroll: { marginTop: 12, marginBottom: 12, maxHeight: 40 },
  filterContainer: { flexDirection: 'row', gap: 8 },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  filterChipActive: { backgroundColor: '#2563EB' },
  filterChipText: { color: '#4B5563', fontWeight: '600', fontSize: 13 },
  filterChipTextActive: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  emptyContainer: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 4 },
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
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorSelected: { borderWidth: 3, borderColor: '#111827' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
});
