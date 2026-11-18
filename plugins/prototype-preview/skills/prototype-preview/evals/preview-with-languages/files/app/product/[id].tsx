import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getProduct } from '../../data/products';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const product = getProduct(id);
  if (!product) return <Text>Product not found</Text>;
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>
      <Text style={styles.title}>{product.name}</Text>
      <Text style={styles.body}>{product.description}</Text>
      <Text style={styles.price}>£{product.price.toFixed(2)}</Text>
      <View style={{ flex: 1 }} />
      <Pressable style={styles.button} onPress={() => router.push({ pathname: '/checkout', params: { id: product.id } })}>
        <Text style={styles.buttonLabel}>Buy now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 12, backgroundColor: '#FFFDF8' },
  back: { fontSize: 16, color: '#2F5D3A' },
  title: { fontSize: 26, fontWeight: '700' },
  body: { fontSize: 16, color: '#444' },
  price: { fontSize: 20, fontWeight: '600' },
  button: { padding: 16, borderRadius: 100, backgroundColor: '#2F5D3A', alignItems: 'center' },
  buttonLabel: { color: 'white', fontSize: 16, fontWeight: '600' },
});
