import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Switch, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { loadSettings, saveSettings, getSettings } from '../utils/settings';
import { hapticMedium } from '../utils/haptics';

export default function SettingsScreen({ navigation }) {
  const [soundEnabled,  setSoundEnabled]  = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  useEffect(() => {
    loadSettings().then(s => {
      setSoundEnabled(s.soundEnabled);
      setHapticEnabled(s.hapticEnabled);
    });
  }, []);

  const toggleSound = async (val) => {
    setSoundEnabled(val);
    await saveSettings({ soundEnabled: val });
    hapticMedium();
  };

  const toggleHaptic = async (val) => {
    setHapticEnabled(val);
    await saveSettings({ hapticEnabled: val });
    // Damos um haptic ANTES de desligar para o usuário sentir
    if (!val) hapticMedium();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d1a" />
      <LinearGradient colors={['#0d0d1a','#111128','#0a1628']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚙️  OPÇÕES</Text>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.body}>

        {/* Som */}
        <LinearGradient colors={['#14143a','#0f1e48']} style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardIcon}>🔊</Text>
              <View>
                <Text style={styles.cardTitle}>Sons</Text>
                <Text style={styles.cardDesc}>Efeitos sonoros durante o jogo</Text>
              </View>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={toggleSound}
              trackColor={{ false: '#2a2a4a', true: COLORS.accent }}
              thumbColor={soundEnabled ? '#fff' : '#aaa'}
            />
          </View>
        </LinearGradient>

        {/* Vibração */}
        <LinearGradient colors={['#14143a','#0f1e48']} style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardIcon}>📳</Text>
              <View>
                <Text style={styles.cardTitle}>Vibração (Haptic)</Text>
                <Text style={styles.cardDesc}>Feedback tátil ao mover e encaixar peças</Text>
              </View>
            </View>
            <Switch
              value={hapticEnabled}
              onValueChange={toggleHaptic}
              trackColor={{ false: '#2a2a4a', true: COLORS.success }}
              thumbColor={hapticEnabled ? '#fff' : '#aaa'}
            />
          </View>
        </LinearGradient>

        {/* Controles - info */}
        <LinearGradient colors={['#14143a','#0f1e48']} style={styles.card}>
          <Text style={styles.sectionTitle}>🕹️  Controles — Modo Clássico</Text>
          <View style={styles.controls}>
            {[
              ['SWIPE ← →',  'Mover a peça'],
              ['TAP',        'Girar 90°'],
              ['SWIPE ↓ lento', 'Descer devagar'],
              ['SWIPE ↓ rápido', 'Hard drop (cai na hora)'],
              ['Botões',     'Fallback abaixo do tabuleiro'],
            ].map(([k, v]) => (
              <View key={k} style={styles.ctrlRow}>
                <View style={styles.ctrlKey}><Text style={styles.ctrlKeyTxt}>{k}</Text></View>
                <Text style={styles.ctrlVal}>{v}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <LinearGradient colors={['#14143a','#0f1e48']} style={styles.card}>
          <Text style={styles.sectionTitle}>🧠  Controles — Modo Puzzle</Text>
          <View style={styles.controls}>
            {[
              ['ARRASTAR',  'Segurar e mover a peça'],
              ['SOLTAR',    'Encaixar na posição'],
              ['Verde',     'Posição válida'],
              ['Vermelho',  'Posição inválida'],
            ].map(([k, v]) => (
              <View key={k} style={styles.ctrlRow}>
                <View style={styles.ctrlKey}><Text style={styles.ctrlKeyTxt}>{k}</Text></View>
                <Text style={styles.ctrlVal}>{v}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0d1a' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8,
  },
  backBtn: { padding: 8 },
  backTxt: { color: COLORS.accent, fontSize: 15, fontWeight: 'bold' },
  title: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', letterSpacing: 2 },

  body: { flex: 1, paddingHorizontal: 16, paddingTop: 8, gap: 12 },

  card: {
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#1e2d5a',
    gap: 12,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardIcon: { fontSize: 28 },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: 'bold' },
  cardDesc: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },

  sectionTitle: { color: COLORS.text, fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  controls: { gap: 7 },
  ctrlRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ctrlKey: {
    backgroundColor: '#0f3460', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4, minWidth: 110,
  },
  ctrlKeyTxt: { color: COLORS.accent, fontSize: 11, fontWeight: 'bold' },
  ctrlVal: { color: COLORS.textSecondary, fontSize: 12, flex: 1 },
});
