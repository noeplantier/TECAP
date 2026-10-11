import MapView, { Marker, type Region } from 'react-native-maps';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

export type HotspotMarker = {
  id: string;
  title: string;
  subtitle: string;
  latitude: number;
  longitude: number;
  accent: 'pink' | 'gold';
};

type Props = {
  initialRegion: Region;
  markers: HotspotMarker[];
};

export function MapCanvas({ initialRegion, markers }: Props) {
  return (
    <View style={styles.wrapper}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.title}
            description={marker.subtitle}
          >
            <View style={[styles.marker, marker.accent === 'gold' && styles.markerGold]}>
              <Text style={styles.markerText}>✦</Text>
            </View>
          </Marker>
        ))}
      </MapView>
      <View pointerEvents='none' style={styles.privacyBadge}>
        <Text style={styles.privacyText}>Hotspots publics · aucune position individuelle</Text>
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
  map: { flex: 1 },
  marker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pink,
    borderColor: colors.text,
    borderWidth: 2,
  },
  markerGold: { backgroundColor: colors.gold },
  markerText: { color: colors.ivoryText, fontSize: 18, fontWeight: '900' },
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
