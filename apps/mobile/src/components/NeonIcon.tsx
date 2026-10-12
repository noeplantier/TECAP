import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';
import { colors } from '../theme';

export type NeonIconName = keyof typeof Ionicons.glyphMap;
export type NeonIconTone = 'pink' | 'gold' | 'none';

type NeonIconProps = {
  name: NeonIconName;
  size?: number;
  color?: string;
  tone?: NeonIconTone;
  style?: StyleProp<TextStyle>;
};

export function NeonIcon({ name, size = 20, color, tone = 'pink', style }: NeonIconProps) {
  const tint = color ?? (tone === 'gold' ? colors.goldLight : colors.pinkLight);
  const glow = tone === 'gold' ? colors.gold : colors.pinkElectric;

  return (
    <Ionicons
      name={name}
      size={size}
      color={tint}
      style={[
        tone === 'none'
          ? undefined
          : {
              textShadowColor: glow,
              textShadowRadius: tone === 'gold' ? 12 : 14,
              textShadowOffset: { width: 0, height: 0 },
            },
        style,
      ]}
    />
  );
}
