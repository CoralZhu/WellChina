import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Shadow } from '../../constants/theme';

export function SOSButton() {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.btn} onPress={() => router.push('/sos')} activeOpacity={0.85}>
      <Text style={styles.label}>SOS</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.sosRed,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.strong,
  },
  label: { color: Colors.white, fontWeight: '900', fontSize: FontSize.sm, letterSpacing: 0.5 },
});
