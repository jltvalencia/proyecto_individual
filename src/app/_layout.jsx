import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#2563EB', headerTitleStyle: { fontWeight: '700' } }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoy',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Horario',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>📚</Text>,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tareas',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>✅</Text>,
        }}
      />
    </Tabs>
  );
}