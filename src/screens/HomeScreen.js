import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, layout } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

const TypewriterText = ({ text, style, delay = 0, speed = 30 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setStarted(true);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    const interval = setInterval(() => {
      setDisplayedText((prev) => {
        if (prev.length < text.length) {
          return text.slice(0, prev.length + 1);
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, speed);

    return () => clearInterval(interval);
  }, [started, text, speed]);

  return <Text style={style}>{displayedText}</Text>;
};

function MenuButton({ label, sublabel, icon, onPress, delay = 0 }) {
  return (
    <Animated.View entering={FadeInUp.duration(600).delay(delay)} style={styles.menuBtnContainer}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.menuBtn,
          pressed && styles.menuBtnPressed
        ]}
      >
        <LinearGradient
          colors={[colors.gameSurface, '#121212']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.menuBtnGradient}
        >
          <View style={styles.menuBtnInner}>
            <View style={styles.menuBtnLeft}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name={icon} size={28} color={colors.gameAccent} />
              </View>
              <View>
                <Text style={styles.menuBtnLabel}>{label}</Text>
                {sublabel && <Text style={styles.menuBtnSub}>{sublabel}</Text>}
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background Ambience */}
      <View style={styles.ambienceTop} />

      <View style={styles.content}>
        {/* Header / Stats Placeholder */}
        <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
          {/* Online status removed */}
        </Animated.View>

        {/* Hero Section */}
        <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.hero}>
          <Text style={styles.heroOverline}>WELCOME TO THE ARENA</Text>
          <View style={styles.titleWrapper}>
            <Text style={styles.titleMain}>DERIV'S GOT</Text>
            <Text style={[styles.titleMain, { color: colors.gameAccent }]}>TALENT</Text>
          </View>
          <TypewriterText
            text="Build your strategy. Deploy your bots. Conquer the leaderboard."
            style={styles.subtitle}
            delay={1000}
            speed={40}
          />
        </Animated.View>

        {/* Action Menu */}
        <View style={styles.menu}>
          <MenuButton
            label="THE WORKSHOP"
            sublabel="Design & Build"
            icon="hammer-wrench"
            delay={400}
            onPress={() => navigation.navigate('Builder')}
          />
          <MenuButton
            label="DEPLOY"
            sublabel="Go Live on Stage"
            icon="rocket-launch"
            delay={500}
            onPress={() => navigation.navigate('Deployment', { strategy: null })}
          />
          <MenuButton
            label="LEADERBOARD"
            sublabel="Hall of Fame"
            icon="trophy"
            delay={600}
            onPress={() => navigation.navigate('Leaderboard')}
          />
        </View>

        {/* Footer */}
        <Animated.View entering={FadeInUp.duration(600).delay(800)} style={styles.footerContainer}>
          <Text style={styles.footerVersion}>built by BlackLotus for Deriv</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gameBg,
  },
  ambienceTop: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.gameAccent,
    opacity: 0.15,
    transform: [{ scaleX: 1.5 }],
    blurRadius: 50, // Note: blurRadius applies to images usually, for Views use elevation or similar if supported, or just opacity
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 180, // Lowered content
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  statusText: {
    ...typography.micro,
    color: colors.success,
    letterSpacing: 1,
  },
  hero: {
    marginBottom: spacing.xl,
  },
  heroOverline: {
    ...typography.kicker,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  titleWrapper: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  titleMain: {
    fontFamily: 'Poppins_900Black', // Assumed from previous file
    fontSize: 36,
    lineHeight: 40,
    color: '#FFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    maxWidth: '80%',
    height: 66, // Reserve height to prevent layout shift during typing
  },
  menu: {
    gap: spacing.md,
    flex: 1,
    justifyContent: 'center',
  },
  menuBtnContainer: {
    marginBottom: spacing.md,
  },
  menuBtn: {
    borderRadius: radius.md,
    backgroundColor: colors.gameSurface,
    borderWidth: 1,
    borderColor: colors.gameBorder,
    shadowColor: colors.gameAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  menuBtnPressed: {
    transform: [{ scale: 0.98 }],
    borderColor: colors.gameAccent,
  },
  menuBtnGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  menuBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 68, 79, 0.1)', // Deriv Red low opacity
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 79, 0.2)',
  },
  menuBtnLabel: {
    ...typography.h3,
    color: '#FFF',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuBtnSub: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  footerContainer: {
    alignItems: 'center',
  },
  footerVersion: {
    ...typography.micro,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
  },
});
