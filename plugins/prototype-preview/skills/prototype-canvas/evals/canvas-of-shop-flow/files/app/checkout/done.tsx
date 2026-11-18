import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function DoneScreen() {
  const { total } = useLocalSearchParams<{ total: string }>();
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Order placed</Text>
      <Text style={styles.body}>We charged £{total}. Your order arrives this evening.</Text>
      <Pressable style={styles.button} onPress={() => router.dismissAll()}>
        <Text style={styles.buttonLabel}>Back to the shop</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 16, justifyContent: 'center', backgroundColor: '#FFFDF8' },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 16, color: '#444', textAlign: 'center' },
  button: { padding: 16, borderRadius: 100, backgroundColor: '#2F5D3A', alignItems: 'center' },
  buttonLabel: { color: 'white', fontSize: 16, fontWeight: '600' },
});
