import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PRODUCTS } from '../data/products';

export default function Home() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 16, padding: 16, gap: 12 }}>
      <Text style={styles.title}>Corner Shop</Text>
      <Text style={styles.subtitle}>Fresh from the neighbourhood, delivered today.</Text>
      {PRODUCTS.map((product) => (
        <Link key={product.id} href={{ pathname: '/product/[id]', params: { id: product.id } }} asChild>
          <Pressable style={styles.card}>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.price}>£{product.price.toFixed(2)}</Text>
          </Pressable>
        </Link>
      ))}
      <View style={{ height: insets.bottom }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFDF8' },
  title: { fontSize: 30, fontWeight: '700' },
  subtitle: { fontSize: 15, color: '#555' },
  card: { padding: 16, borderRadius: 14, backgroundColor: '#F3EEE3', flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '600' },
  price: { fontSize: 16 },
});
