import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { getClassicHighScores, getPuzzleHighScores } from '../utils/storage';
import { loadSettings } from '../utils/settings';
import { loadSounds } from '../utils/sounds';
import { hapticLight } from '../utils/haptics';

const { width: SW } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [classicBest, setClassicBest] = useState(0);
  const [puzzleBest, setPuzzleBest]   = useState(0);

  // Animações de entrada
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Carregar configurações e sons na abertura do app
    loadSettings();
    loadSounds();

    (async () => {
      const cs = await getClassicHighScores();
      const ps = await getPuzzleHighScores();
      setClassicBest(cs[0]?.score || 0);
      setPuzzleBest(ps[0]?.score || 0);
    })();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, speed: 6, bounciness: 8, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const go = (screen, params) => {
    hapticLight();
    navigation.navigate(screen, params);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d1a" />

      <LinearGradient colors={['#0d0d1a', '#111128', '#0a1628']} style={StyleSheet.absoluteFill} />
      <FloatingBlocks glowAnim={glowAnim} />

      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoIconRow}>
            {/* Mini blocos decorativos */}
            {[COLORS.I, COLORS.T, COLORS.O, COLORS.L].map((c, i) => (
              <View key={i} style={[styles.logoDot, { backgroundColor: c }]} />
            ))}
          </View>
          <Text style={styles.title}>BLOCK PUZZLE</Text>
          <Text style={styles.subtitle}>Encaixe · Limpe · Vença</Text>
        </View>

        <View style={styles.highlightRow}>
          {['Sem internet', 'Partidas rápidas', 'Controles simples'].map((label) => (
            <View key={label} style={styles.highlightChip}>
              <Text style={styles.highlightText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Modo Clássico */}
        <ModeCard
          gradient={['#1a0a2e', '#0f1e4a']}
          borderColor={COLORS.accent}
          emoji="🕹️"
          title="CLÁSSICO"
          description="Peças caem do topo. Gire e encaixe para eliminar linhas!"
          tips={['SWIPE ← → mover', 'TAP girar', 'SWIPE ↓ hard drop']}
          best={classicBest}
          onPlay={() => go('LevelSelect', { mode: 'classic' })}
          btnColor={COLORS.accent}
        />

        {/* Modo Puzzle */}
        <ModeCard
          gradient={['#0a1e1a', '#0a2a20']}
          borderColor={COLORS.success}
          emoji="🧠"
          title="PUZZLE"
          description="Arraste peças no tabuleiro. Preencha linhas e colunas para pontuar!"
          tips={['ARRASTE para posicionar', 'Combos dão bônus', 'Preencha tudo!']}
          best={puzzleBest}
          onPlay={() => go('LevelSelect', { mode: 'puzzle' })}
          btnColor={COLORS.success}
        />

        {/* Botões de apoio */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => go('Scores')}>
            <Text style={styles.secondaryIcon}>🏆</Text>
            <Text style={styles.secondaryTxt}>Recordes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => go('Settings')}>
            <Text style={styles.secondaryIcon}>⚙️</Text>
            <Text style={styles.secondaryTxt}>Opções</Text>
          </TouchableOpacity>
        </View>

        <LinearGradient colors={['#1f1145', '#0f2445']} style={styles.banner}>
          <Text style={styles.bannerTitle}>✨ Perfeito para jogar em qualquer pausa</Text>
          <Text style={styles.bannerSub}>Sessões curtas, progressão contínua e muito desafio.</Text>
        </LinearGradient>

        <Text style={styles.footer}>Funciona 100% offline · Progresso salvo</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

function FloatingBlocks({ glowAnim }) {
  const lift = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });
  const fade = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.45],
  });

  const blocks = [
    { left: '8%', top: '10%', color: COLORS.I, size: 14 },
    { right: '9%', top: '20%', color: COLORS.O, size: 12 },
    { left: '15%', bottom: '25%', color: COLORS.T, size: 11 },
    { right: '12%', bottom: '18%', color: COLORS.L, size: 13 },
  ];

  return (
    <View pointerEvents="none" style={styles.floatingLayer}>
      {blocks.map((b, i) => (
        <Animated.View
          key={i}
          style={[
            styles.floatingDot,
            b,
            {
              opacity: fade,
              width: b.size,
              height: b.size,
              transform: [{ translateY: lift }],
            },
          ]}
        />
      ))}
    </View>
  );
}

function ModeCard({ gradient, borderColor, emoji, title, description, tips, best, onPlay, btnColor }) {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const press = () => {
    Animated.sequence([
      Animated.timing(pressAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(pressAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPlay();
  };
  return (
    <Animated.View style={{ transform: [{ scale: pressAnim }], width: '100%' }}>
      <LinearGradient colors={gradient} style={[styles.card, { borderColor }]}>
        <View style={styles.cardTop}>
          <Text style={styles.cardEmoji}>{emoji}</Text>
          <View style={styles.cardMid}>
            <Text style={[styles.cardTitle, { color: borderColor }]}>{title}</Text>
            <Text style={styles.cardDesc}>{description}</Text>
          </View>
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: borderColor }]}
            onPress={press}
            activeOpacity={0.8}
          >
            <Text style={styles.playBtnTxt}>JOGAR</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tipsRow}>
          {tips.map((t, i) => (
            <View key={i} style={[styles.tipChip, { borderColor: borderColor + '60' }]}>
              <Text style={[styles.tipTxt, { color: borderColor }]}>{t}</Text>
            </View>
          ))}
        </View>
        {best > 0 && (
          <Text style={styles.bestTxt}>🏅 Recorde: {best.toLocaleString()} pts</Text>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0d1a' },
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'space-evenly',
    paddingHorizontal: 16,
  },

  // Logo
  logoArea: { alignItems: 'center', gap: 6 },
  logoIconRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  logoDot: { width: 18, height: 18, borderRadius: 4 },
  title: {
    fontSize: 36, fontWeight: 'bold', color: COLORS.text,
    letterSpacing: 5, textAlign: 'center',
  },
  subtitle: { color: COLORS.textSecondary, fontSize: 12, letterSpacing: 3 },
  highlightRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 2 },
  highlightChip: {
    borderWidth: 1, borderColor: '#2e4f8a', backgroundColor: '#101f37',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  highlightText: { color: '#9cc3ff', fontSize: 10, fontWeight: '700' },

  // Card
  card: {
    width: '100%', borderRadius: 18, borderWidth: 1.5,
    padding: 14, gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardEmoji: { fontSize: 38 },
  cardMid: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', letterSpacing: 2 },
  cardDesc: { color: COLORS.textSecondary, fontSize: 11, marginTop: 3, lineHeight: 16 },
  playBtn: {
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12,
    alignItems: 'center',
  },
  playBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },

  tipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tipChip: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  tipTxt: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  bestTxt: { color: COLORS.warning, fontSize: 11, fontWeight: 'bold' },

  // Secondary buttons
  row: { flexDirection: 'row', gap: 12, width: '100%' },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.surface, borderRadius: 14,
    paddingVertical: 13, borderWidth: 1, borderColor: '#2a3a6a',
  },
  secondaryIcon: { fontSize: 20 },
  secondaryTxt: { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },

  banner: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3a4e85',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  bannerTitle: { color: '#ffffff', fontWeight: '800', fontSize: 12, letterSpacing: 0.4 },
  bannerSub: { color: '#b0c7ff', fontSize: 10 },

  footer: { color: '#2a3a5a', fontSize: 10 },
  floatingLayer: { ...StyleSheet.absoluteFillObject },
  floatingDot: {
    position: 'absolute',
    borderRadius: 4,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
});
