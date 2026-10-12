import { Ionicons } from '@expo/vector-icons';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { colors } from '../theme';

export type NeonIconName = keyof typeof Ionicons.glyphMap;
export type NeonIconTone = 'pink' | 'gold' | 'none';

function glyphCharacter(value: number | string) {
  const codepoint = typeof value === 'number' ? value : Number.parseInt(value, 16);
  return Number.isFinite(codepoint) ? String.fromCodePoint(codepoint) : value;
}

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
  const glyph = glyphCharacter(Ionicons.glyphMap[name]);

  return (
    <Text
      allowFontScaling={false}
      style={[
        {
          color: tint,
          fontFamily: 'Ionicons',
          fontSize: size,
          lineHeight: size + 4,
          textAlign: 'center',
          ...(tone === 'none'
            ? {}
            : {
                textShadowColor: glow,
                textShadowRadius: tone === 'gold' ? 12 : 14,
                textShadowOffset: { width: 0, height: 0 },
              }),
        },
        style,
      ]}
    >
      {glyph}
    </Text>
  );
}
