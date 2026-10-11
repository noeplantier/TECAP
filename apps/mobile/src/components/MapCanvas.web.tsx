import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import type { HotspotMarker } from './MapCanvas.native';

type Props = {
  initialRegion: { latitude: number; longitude: number };
  markers: HotspotMarker[];
};

export function MapCanvas({ markers }: Props) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        contentContainerStyle={styles.scrollContent}
        maximumZoomScale={2.5}
        minimumZoomScale={1}
        bouncesZoom
      >
        <ScrollView
          contentContainerStyle={styles.canvas}
          maximumZoomScale={2.5}
          minimumZoomScale={1}
        >
          <View style={styles.grid} />
          <Text style={styles.city}>SAINT-BRIEUC · CARTE DÉMO</Text>
          <Text style={[styles.street, styles.streetOne]}>Centre-ville</Text>
          <Text style={[styles.street, styles.streetTwo]}>Zone événementielle</Text>
          <Text style={[styles.street, styles.streetThree]}>Quartier nocturne</Text>
          {markers.map((marker, index) => (
            <Pressable
              key={marker.id}
              accessibilityRole='button'
              accessibilityLabel={`${marker.title}, ${marker.subtitle}`}
              style={[
                styles.marker,
                marker.accent === 'gold' && styles.markerGold,
                { left: 78 + (index % 3) * 135, top: 116 + Math.floor(index / 3) * 70 },
              ]}
            >
              <Text style={styles.markerIcon}>✦</Text>
              <Text style={styles.markerTitle}>{marker.title}</Text>
              <Text style={styles.markerSubtitle}>{marker.subtitle}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>
      <View pointerEvents='none' style={styles.privacyBadge}>
        <Text style={styles.privacyText}>
          Pince / zoom · hotspots agrégés · aucune adresse privée
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 280,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceStrong,
  },
  scrollContent: { minWidth: '100%' },
  canvas: { width: 560, height: 360, backgroundColor: colors.surfaceStrong, position: 'relative' },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
    backgroundColor: '#1B111B',
    borderColor: colors.line,
    borderWidth: 18,
  },
  city: {
    position: 'absolute',
    top: 20,
    left: 20,
    color: colors.gold,
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: '900',
  },
  street: {
    position: 'absolute',
    color: colors.mutedStrong,
    fontSize: 10,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    paddingBottom: 6,
  },
  streetOne: { top: 76, left: 22 },
  streetTwo: { top: 190, left: 260 },
  streetThree: { top: 300, left: 34 },
  marker: {
    position: 'absolute',
    width: 120,
    padding: 8,
    borderRadius: radius.md,
    backgroundColor: colors.pinkWash,
    borderColor: colors.pink,
    borderWidth: 1,
  },
  markerGold: { backgroundColor: colors.goldWash, borderColor: colors.gold },
  markerIcon: { color: colors.pink, fontSize: 18, fontWeight: '900' },
  markerTitle: { color: colors.text, fontSize: 10, fontWeight: '900', marginTop: 2 },
  markerSubtitle: { color: colors.mutedStrong, fontSize: 8, marginTop: 2 },
  privacyBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: colors.overlay,
    borderColor: colors.lineBright,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  privacyText: { color: colors.text, fontSize: 9, fontWeight: '700' },
});
