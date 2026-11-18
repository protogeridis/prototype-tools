import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getProduct } from '../../data/products';

const DELIVERY = 2.5;

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const product = getProduct(id);
  if (!product) return <Text>Nothing to check out</Text>;
  const total = product.price + DELIVERY;
  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + 16 }]}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.close}>Close</Text>
      </Pressable>
      <Text style={styles.title}>Review your order</Text>
      <View style={styles.row}><Text>{product.name}</Text><Text>£{product.price.toFixed(2)}</Text></View>
      <View style={styles.row}><Text>Delivery</Text><Text>£{DELIVERY.toFixed(2)}</Text></View>
      <View style={styles.row}><Text style={styles.bold}>Total</Text><Text style={styles.bold}>£{total.toFixed(2)}</Text></View>
      <View style={{ flex: 1 }} />
      <Pressable style={styles.button} onPress={() => router.push({ pathname: '/checkout/done', params: { total: total.toFixed(2) } })}>
        <Text style={styles.buttonLabel}>Place order</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 14, backgroundColor: '#FFFDF8' },
  close: { fontSize: 16, color: '#2F5D3A' },
  title: { fontSize: 24, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  bold: { fontWeight: '700' },
  button: { padding: 16, borderRadius: 100, backgroundColor: '#2F5D3A', alignItems: 'center' },
  buttonLabel: { color: 'white', fontSize: 16, fontWeight: '600' },
});
