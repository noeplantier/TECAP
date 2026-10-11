import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { demoCommerce } from '../lib/commerce';
import { boostFeatures, demoPhotos, inviteFeatures, premiumFeatures } from '../lib/demo';
import { useAppStore } from '../state/useAppStore';
import type { OfferId } from '../state/useAppStore';
import { colors, glow, radius, spacing } from '../theme';
import { BrandLogo } from '../components/BrandLogo';

type Mode = 'invite' | 'premium' | 'boost';
type Navigation = { navigate: (screen: string) => void };
const productCopy = {
  invite: {
    eyebrow: 'UNE INVITATION SPÉCIALE',
    title: 'ON SE CAPTE',
    titleAccent: 'CE SOIR ?',
    subtitle: 'Envoie une invitation spéciale au profil qui te plaît vraiment.',
    cta: 'Envoyer une invitation',
    hero: demoPhotos.night,
  },
  premium: {
    eyebrow: 'PASSE EN PREMIUM',
    title: 'Plus de rencontres.',
    titleAccent: 'Plus de sorties.',
    subtitle:
      'Découvre qui sort, où et quand, et rencontre des personnes qui partagent tes soirées.',
    cta: 'Passer en Premium',
    hero: demoPhotos.night,
  },
  boost: {
    eyebrow: 'BOOSTE TON PROFIL',
    title: 'Plus visible.',
    titleAccent: 'Plus d’opportunités.',
    subtitle: 'Sois plus visible pendant 1h et multiplie tes chances de rencontres.',
    cta: 'Activer mon Boost (1h)',
    hero: demoPhotos.night,
  },
};

export function ShopScreen({ navigation }: { navigation: Navigation }) {
  const [mode, setMode] = useState<Mode>('premium');
  const [selected, setSelected] = useState<OfferId>('premium-3');
  const activatePremium = useAppStore((state) => state.activatePremium);
  const addBoosts = useAppStore((state) => state.addBoosts);
  const addInvitationCredits = useAppStore((state) => state.addInvitationCredits);
  const copy = productCopy[mode];
  const features = useMemo(
    () =>
      mode === 'premium' ? premiumFeatures : mode === 'boost' ? boostFeatures : inviteFeatures,
    [mode],
  );
  const selectMode = (next: Mode) => {
    setMode(next);
    setSelected(next === 'premium' ? 'premium-3' : next === 'boost' ? 'boost-5' : 'invite-5');
  };
  const buy = async () => {
    const result = await demoCommerce.purchase(selected);
    if (mode === 'premium') activatePremium(result.offerId);
    if (mode === 'boost') addBoosts(selected === 'boost-5' ? 5 : 1, result.offerId);
    if (mode === 'invite') addInvitationCredits(selected === 'invite-5' ? 5 : 1, result.offerId);
    if (mode === 'invite') navigation.navigate('Invitation');
    else
      Alert.alert(
        'C’est activé',
        'Mode démo : ton offre est disponible immédiatement. Le paiement réel sera branché avec Supabase/RevenueCat.',
      );
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <BrandLogo size='medium' showTagline />
        </View>
        <Text style={styles.info}>ⓘ</Text>
      </View>
      <View style={styles.modeBar}>
        {(['invite', 'premium', 'boost'] as Mode[]).map((item) => (
          <Pressable
            key={item}
            onPress={() => selectMode(item)}
            style={[styles.mode, mode === item && styles.modeActive]}
          >
            <Text style={[styles.modeText, mode === item && styles.modeTextActive]}>
              {item === 'invite' ? '♡ Invitation' : item === 'premium' ? '♛ Premium' : '↯ Boost'}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.hero}>
        <Image source={{ uri: copy.hero }} style={styles.heroImage} />
        <View style={styles.heroShade} />
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={styles.title}>
            {copy.title}
            {`\n`}
            <Text style={styles.titleAccent}>{copy.titleAccent}</Text>
          </Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>
      </View>
      {mode === 'premium' && <PremiumComparison />}
      <View style={styles.featureCard}>
        {features.map((feature) => (
          <View key={feature.title} style={styles.featureRow}>
            <View
              style={[styles.featureIcon, mode === 'premium' ? styles.goldGlow : styles.pinkGlow]}
            >
              <Text style={styles.featureIconText}>{feature.icon}</Text>
            </View>
            <View style={styles.featureCopy}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureBody}>{feature.body}</Text>
            </View>
          </View>
        ))}
      </View>
      <OfferSelector mode={mode} selected={selected} onSelect={setSelected} />
      <Pressable
        onPress={buy}
        style={[
          styles.cta,
          mode === 'premium' ? styles.ctaGold : styles.ctaPink,
          mode === 'premium' && glow.gold,
        ]}
      >
        <Text style={styles.ctaText}>
          {copy.cta} <Text style={styles.ctaArrow}>›</Text>
        </Text>
      </Pressable>
      {mode === 'invite' && (
        <Pressable onPress={() => navigation.navigate('Invitation')} style={styles.secondary}>
          <Text style={styles.secondaryText}>Voir comment ça marche</Text>
        </Pressable>
      )}
      <Text style={styles.secure}>▣ Paiement sécurisé · Achat unique · Annulation possible</Text>
    </ScrollView>
  );
}

function PremiumComparison() {
  return (
    <View style={styles.comparison}>
      <View style={styles.comparisonHead}>
        <Text style={styles.comparisonTitle}>TÉCAP Premium</Text>
        <Text style={styles.comparisonBadge}>LE PLUS POPULAIRE</Text>
      </View>
      <Text style={styles.comparisonSubtitle}>L’expérience complète pour tes soirées.</Text>
      <View style={styles.comparisonColumns}>
        <View style={styles.comparisonColumn}>
          <Text style={styles.comparisonColumnTitle}>Gratuit</Text>
          <Text style={styles.comparisonValue}>30</Text>
          <Text style={styles.comparisonUnit}>LIKES / JOUR</Text>
          <Text style={styles.comparisonMuted}>Swipe et match</Text>
          <Text style={styles.comparisonMuted}>Événements publics</Text>
        </View>
        <View style={[styles.comparisonColumn, styles.comparisonPremium]}>
          <Text style={styles.comparisonColumnTitle}>♛ Premium</Text>
          <Text style={styles.comparisonValue}>∞</Text>
          <Text style={styles.comparisonUnit}>LIKES ILLIMITÉS</Text>
          <Text style={styles.comparisonFeature}>Voir qui sort ce soir</Text>
          <Text style={styles.comparisonFeature}>Filtres avancés</Text>
          <Text style={styles.comparisonFeature}>Boosts inclus</Text>
        </View>
      </View>
    </View>
  );
}

function OfferSelector({
  mode,
  selected,
  onSelect,
}: {
  mode: Mode;
  selected: OfferId;
  onSelect: (offer: OfferId) => void;
}) {
  const offers =
    mode === 'premium'
      ? [
          { id: 'premium-1' as OfferId, name: '1 mois', price: '19,99 €', detail: '/ mois' },
          {
            id: 'premium-3' as OfferId,
            name: '3 mois',
            price: '49,99 €',
            detail: 'soit 16,66 €/mois',
            badge: '-17%',
          },
          {
            id: 'premium-12' as OfferId,
            name: '12 mois',
            price: '129,99 €',
            detail: 'soit 10,83 €/mois',
            badge: '-46%',
          },
        ]
      : mode === 'boost'
        ? [
            {
              id: 'boost-1' as OfferId,
              name: '1 Boost (1h)',
              price: '3,99 €',
              detail: 'activation immédiate',
            },
            {
              id: 'boost-5' as OfferId,
              name: '5 Boosts (1h)',
              price: '14,99 €',
              detail: 'soit 2,99 €/boost',
              badge: '-25%',
            },
          ]
        : [
            {
              id: 'invite-1' as OfferId,
              name: '1 demande',
              price: '5,99 €',
              detail: 'achat unique',
            },
            {
              id: 'invite-5' as OfferId,
              name: '5 demandes',
              price: '24,99 €',
              detail: 'achat unique',
              badge: '-17%',
            },
          ];
  return (
    <View style={styles.offerGrid}>
      {offers.map((offer) => (
        <Pressable
          key={offer.id}
          onPress={() => onSelect(offer.id)}
          style={[styles.offer, selected === offer.id && styles.offerSelected]}
        >
          {offer.badge && <Text style={styles.badge}>{offer.badge}</Text>}
          <View style={styles.radio}>
            {selected === offer.id && <View style={styles.radioOn} />}
          </View>
          <Text style={styles.offerName}>{offer.name}</Text>
          <Text style={styles.offerPrice}>{offer.price}</Text>
          <Text style={styles.offerDetail}>{offer.detail}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.canvas,
    padding: spacing.lg,
    paddingTop: 28,
    paddingBottom: 30,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { color: colors.text, fontSize: 23 },
  modeBar: { flexDirection: 'row', gap: 7, marginVertical: 18 },
  mode: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  modeActive: { borderColor: colors.pink, backgroundColor: 'rgba(255,46,173,.12)' },
  modeText: { color: colors.muted, fontSize: 10 },
  modeTextActive: { color: colors.text, fontWeight: '800' },
  hero: {
    height: 245,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surface,
  },
  heroImage: { width: '100%', height: '100%' },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,11,.58)' },
  heroCopy: { position: 'absolute', left: 18, right: 18, bottom: 18 },
  eyebrow: {
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 1.1,
    fontWeight: '900',
    marginBottom: 10,
  },
  title: { color: colors.text, fontSize: 29, lineHeight: 32, fontWeight: '900' },
  titleAccent: { color: colors.pink },
  subtitle: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: 10 },
  comparison: {
    backgroundColor: colors.surface,
    borderColor: colors.goldSoft,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 15,
    marginTop: 10,
  },
  comparisonHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  comparisonTitle: { color: colors.gold, fontSize: 16, fontWeight: '900' },
  comparisonBadge: {
    color: colors.ivoryText,
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 8,
    fontWeight: '900',
  },
  comparisonSubtitle: { color: colors.mutedStrong, fontSize: 10, marginTop: 4 },
  comparisonColumns: { flexDirection: 'row', gap: 8, marginTop: 13 },
  comparisonColumn: {
    flex: 1,
    backgroundColor: colors.canvas,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 11,
  },
  comparisonPremium: { borderColor: colors.gold, backgroundColor: 'rgba(255,211,106,.08)' },
  comparisonColumnTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  comparisonValue: { color: colors.pink, fontSize: 28, fontWeight: '900', marginTop: 7 },
  comparisonUnit: { color: colors.text, fontSize: 9, fontWeight: '900', marginTop: -3 },
  comparisonMuted: { color: colors.muted, fontSize: 9, marginTop: 10 },
  comparisonFeature: { color: colors.gold, fontSize: 9, marginTop: 10 },
  featureCard: {
    backgroundColor: 'rgba(13,12,23,.94)',
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    marginTop: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: colors.surfaceStrong,
  },
  pinkGlow: {
    shadowColor: colors.pink,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  goldGlow: {
    shadowColor: colors.gold,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  featureIconText: { color: colors.pink, fontSize: 23, fontWeight: '800' },
  featureCopy: { flex: 1 },
  featureTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  featureBody: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  offerGrid: { flexDirection: 'row', gap: 8, marginTop: 12 },
  offer: {
    flex: 1,
    minHeight: 112,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    position: 'relative',
  },
  offerSelected: {
    borderColor: colors.pink,
    backgroundColor: 'rgba(255,46,173,.08)',
    ...glow.pink,
  },
  badge: {
    position: 'absolute',
    top: -10,
    left: 9,
    backgroundColor: colors.pink,
    color: colors.text,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 4,
    fontSize: 8,
    fontWeight: '800',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 10,
    borderColor: colors.muted,
    borderWidth: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.pink },
  offerName: { color: colors.mutedStrong, fontSize: 11, marginTop: 3 },
  offerPrice: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 4 },
  offerDetail: { color: colors.muted, fontSize: 9, marginTop: 4 },
  cta: { borderRadius: radius.pill, alignItems: 'center', padding: 16, marginTop: 17 },
  ctaPink: { backgroundColor: colors.pink },
  ctaGold: { backgroundColor: colors.gold },
  ctaText: { color: '#190915', fontSize: 15, fontWeight: '900' },
  ctaArrow: { fontSize: 23 },
  secondary: { alignItems: 'center', paddingVertical: 13 },
  secondaryText: { color: colors.mutedStrong, fontSize: 11 },
  secure: { color: colors.muted, textAlign: 'center', fontSize: 9, marginTop: 8 },
});
