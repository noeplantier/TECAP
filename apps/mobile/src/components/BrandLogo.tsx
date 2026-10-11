import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type BrandLogoProps = {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
};

const sizeMap = {
  small: { logo: 16, tagline: 7, spacing: 0.8 },
  medium: { logo: 25, tagline: 9, spacing: 1.2 },
  large: { logo: 36, tagline: 10, spacing: 2.6 },
};

export function BrandLogo({ size = 'medium', showTagline = false }: BrandLogoProps) {
  const scale = sizeMap[size];

  return (
    <View accessible accessibilityLabel='TÉCAP, T’es où ? On se capte ?'>
      <Text style={[styles.logo, { fontSize: scale.logo, letterSpacing: scale.spacing }]}>
        TÉ<Text style={styles.accent}>CAP</Text>
      </Text>
      {showTagline && (
        <Text style={[styles.tagline, { fontSize: scale.tagline }]}>T’es où ? On se capte ?</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logo: { color: colors.text, fontWeight: '900' },
  accent: { color: colors.gold },
  tagline: { color: colors.mutedStrong, marginTop: 2, textAlign: 'center' },
});
