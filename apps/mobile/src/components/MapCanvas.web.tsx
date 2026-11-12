import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { colors, glow, radius } from '../theme';
import type { MapCanvasProps, MapMarker } from './mapTypes';

const categoryIcon: Record<MapMarker['category'], string> = {
  tecap_event: '♛',
  bar: '🍸',
  restaurant: '🍽',
  club: '✦',
  concert: '♫',
  hotspot: '◎',
  user_plan: '♡',
};

const categoryClass: Record<MapMarker['accent'], string> = {
  pink: 'tecap-marker-pink',
  gold: 'tecap-marker-gold',
  magenta: 'tecap-marker-magenta',
};

function installTecapMapStyles() {
  if (document.getElementById('tecap-leaflet-styles')) return;
  const style = document.createElement('style');
  style.id = 'tecap-leaflet-styles';
  style.textContent = `
    .tecap-map-root img.leaflet-tile { max-width: none !important; max-height: none !important; }
    .tecap-map-root .leaflet-tile-pane, .tecap-map-root .leaflet-tile-container { position: absolute; }
    .tecap-map-root .leaflet-control-zoom { border: 1px solid ${colors.pink}; box-shadow: 0 0 18px ${colors.pinkGlow}; }
    .tecap-map-root .leaflet-control-zoom a { background: ${colors.surface}; color: ${colors.text}; border-color: ${colors.line}; }
    .tecap-map-root .leaflet-control-zoom a:hover { background: ${colors.surfaceSoft}; color: ${colors.gold}; }
    .tecap-map-root .leaflet-control-attribution { background: ${colors.overlay}; color: ${colors.muted}; }
    .tecap-map-root .leaflet-control-attribution a { color: ${colors.pink}; }
    .tecap-map-root .leaflet-tile-pane { filter: grayscale(1) brightness(.72); }
    .tecap-map-root .leaflet-tooltip { background: ${colors.surface}; border: 1px solid ${colors.pink}; color: ${colors.text}; box-shadow: 0 0 16px ${colors.pinkGlow}; }
    .tecap-map-root .leaflet-tooltip-top:before { border-top-color: ${colors.pink}; }
    .tecap-leaflet-marker { background: transparent; border: 0; }
    .tecap-marker-shell { width: 46px; height: 46px; border-radius: 24px; display: grid; place-items: center; position: relative; box-sizing: border-box; font-size: 17px; color: ${colors.text}; font-weight: 900; border: 2px solid ${colors.text}; background: ${colors.pink}; box-shadow: 0 0 10px ${colors.pink}, 0 0 25px ${colors.pinkGlow}; }
    .tecap-marker-shell.tecap-marker-gold { background: ${colors.gold}; color: ${colors.ivoryText}; border-color: ${colors.text}; box-shadow: 0 0 10px ${colors.gold}, 0 0 25px ${colors.goldGlow}; }
    .tecap-marker-shell.tecap-marker-magenta { background: ${colors.magenta}; border-color: ${colors.text}; }
    .tecap-marker-count { position: absolute; right: -9px; top: -9px; min-width: 19px; height: 19px; padding: 0 4px; display: grid; place-items: center; border-radius: 12px; box-sizing: border-box; background: ${colors.canvas}; border: 1px solid ${colors.text}; color: ${colors.text}; font-size: 9px; }
  `;
  document.head.appendChild(style);
}

export function MapCanvas({ initialRegion, markers, onMarkerPress, height = 360 }: MapCanvasProps) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const center: [number, number] = [initialRegion.latitude, initialRegion.longitude];

  useEffect(() => {
    const container = mapElement.current;
    if (!container || mapRef.current) return;
    installTecapMapStyles();
    const map = L.map(container, {
      zoomControl: true,
      attributionControl: true,
      minZoom: 11,
      maxZoom: 18,
      preferCanvas: true,
    }).setView(center, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      updateWhenIdle: true,
      updateWhenZooming: false,
      keepBuffer: 1,
    }).addTo(map);
    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    let mounted = true;
    let frameId: number | undefined;
    const invalidateSize = () => {
      if (!mounted) return;
      if (frameId !== undefined) window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        frameId = undefined;
        if (mapRef.current === map) map.invalidateSize({ pan: false, animate: false });
      });
    };
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(invalidateSize);
    resizeObserver?.observe(container);
    window.addEventListener('resize', invalidateSize, { passive: true });
    map.whenReady(invalidateSize);
    const initialResize = window.setTimeout(invalidateSize, 0);
    return () => {
      mounted = false;
      window.clearTimeout(initialResize);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', invalidateSize);
      if (frameId !== undefined) window.cancelAnimationFrame(frameId);
      markerLayerRef.current?.clearLayers();
      markerLayerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [center[0], center[1]]);

  useEffect(() => {
    const layer = markerLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    markers.forEach((marker) => {
      const icon = L.divIcon({
        className: 'tecap-leaflet-marker',
        html: `<span class="tecap-marker-shell ${categoryClass[marker.accent]}">${categoryIcon[marker.category]}<b class="tecap-marker-count">${marker.participantCount}</b></span>`,
        iconSize: [46, 46],
        iconAnchor: [23, 23],
      });
      const leafletMarker = L.marker([marker.latitude, marker.longitude], { icon });
      leafletMarker.bindTooltip(`${marker.name} · ${marker.subtitle}`, {
        direction: 'top',
        offset: [0, -18],
      });
      leafletMarker.on('click', () => onMarkerPress?.(marker));
      leafletMarker.addTo(layer);
    });
  }, [markers, onMarkerPress]);

  const recenter = () => mapRef.current?.setView(center, 14, { animate: true });

  return (
    <View
      style={[styles.wrapper, { height }]}
      accessibilityLabel='Carte TÉCAP interactive de Saint-Brieuc'
    >
      <View style={styles.mapRoot} nativeID='tecap-map-root'>
        <div ref={mapElement} className='tecap-map-root' style={styles.webMap} />
      </View>
      <Pressable onPress={recenter} style={styles.recenter} accessibilityLabel='Recentrer la carte'>
        <Text style={styles.recenterText}>⌾</Text>
      </Pressable>
      <View pointerEvents='none' style={styles.privacyBadge}>
        <Text style={styles.privacyText}>
          Carte réelle · hotspots agrégés · aucune adresse privée
        </Text>
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
  mapRoot: { flex: 1 },
  webMap: { width: '100%', height: '100%' },
  recenter: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
    borderColor: colors.goldHot,
    borderWidth: 1,
    ...glow.gold,
  },
  recenterText: { color: colors.goldLight, fontSize: 23, fontWeight: '900' },
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
