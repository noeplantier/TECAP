import type { Region } from 'react-native-maps';
import type { TecapPoi } from '../lib/mapData';

export type MapMarker = TecapPoi;

export type MapRegion = Pick<Region, 'latitude' | 'longitude'> &
  Partial<Pick<Region, 'latitudeDelta' | 'longitudeDelta'>>;

export type MapCanvasProps = {
  initialRegion: MapRegion;
  markers: MapMarker[];
  onMarkerPress?: (marker: MapMarker) => void;
  height?: number;
};
