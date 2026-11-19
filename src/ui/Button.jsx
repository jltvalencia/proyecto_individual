import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export function Button({ title, onPress, variant = 'primary' }) {
  const bg = variant === 'danger' ? '#EF4444' : variant === 'secondary' ? '#E5E7EB' : '#2563EB';
  const color = variant === 'secondary' ? '#1F2937' : '#FFFFFF';

  return (
    <TouchableOpacity style={[styles.btn, { backgroundColor: bg }]} onPress={onPress}>
      <Text style={[styles.text, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center' },
  text: { fontWeight: '600', fontSize: 15 },
});