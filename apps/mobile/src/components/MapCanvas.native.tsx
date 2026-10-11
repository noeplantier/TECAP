import MapView, { Marker, type Region } from 'react-native-maps';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, glow, radius } from '../theme';
import type { MapCanvasProps, MapMarker } from './mapTypes';

export type { MapMarker } from './mapTypes';

const categoryIcon: Record<MapMarker['category'], string> = {
  tecap_event: '♛',
  bar: '🍸',
  restaurant: '🍽',
  club: '✦',
  concert: '♫',
  hotspot: '◎',
  user_plan: '♡',
};

export function MapCanvas({ initialRegion, markers, onMarkerPress, height = 360 }: MapCanvasProps) {
  const region: Region = {
    latitude: initialRegion.latitude,
    longitude: initialRegion.longitude,
    latitudeDelta: initialRegion.latitudeDelta ?? 0.12,
    longitudeDelta: initialRegion.longitudeDelta ?? 0.12,
  };
  return (
    <View style={[styles.wrapper, { height }]}>
      <MapView
        style={styles.map}
        initialRegion={region}
        mapType='mutedStandard'
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.name}
            description={marker.subtitle}
            onPress={() => onMarkerPress?.(marker)}
          >
            <Pressable
              accessibilityRole='button'
              accessibilityLabel={`${marker.name}, ${marker.subtitle}`}
              onPress={() => onMarkerPress?.(marker)}
              style={[
                styles.marker,
                marker.accent === 'gold' && styles.markerGold,
                marker.accent === 'magenta' && styles.markerMagenta,
              ]}
            >
              <Text style={styles.markerIcon}>{categoryIcon[marker.category]}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{marker.participantCount}</Text>
              </View>
            </Pressable>
          </Marker>
        ))}
      </MapView>
      <View pointerEvents='none' style={styles.mapOverlay} />
      <View pointerEvents='none' style={styles.privacyBadge}>
        <Text style={styles.privacyText}>Hotspots publics · aucune position individuelle</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.lineBright,
    borderWidth: 1,
    ...glow.pink,
  },
  map: { flex: 1 },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,3,8,0.08)',
  },
  marker: {
    minWidth: 42,
    height: 42,
    paddingHorizontal: 7,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pinkElectric,
    borderColor: colors.pinkLight,
    borderWidth: 2,
    shadowColor: colors.pinkElectric,
    shadowOpacity: 0.85,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  markerGold: {
    backgroundColor: colors.goldHot,
    borderColor: colors.goldWhite,
    shadowColor: colors.goldHot,
  },
  markerMagenta: { backgroundColor: colors.magentaDeep, borderColor: colors.hotPink },
  markerIcon: { color: colors.text, fontSize: 17, fontWeight: '900' },
  countBadge: {
    position: 'absolute',
    right: -8,
    top: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
    borderColor: colors.text,
    borderWidth: 1,
  },
  countText: { color: colors.text, fontSize: 9, fontWeight: '900' },
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
