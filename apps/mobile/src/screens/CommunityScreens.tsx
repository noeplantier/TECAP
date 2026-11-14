import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { BrandLogo } from '../components/BrandLogo';
import { demoPhotos, demoProfiles } from '../lib/demo';
import {
  fetchBackendEntitlements,
  fetchBackendLaunchAreas,
  fetchBackendPointsOfInterest,
  fetchBackendProfiles,
  fetchRennesWaitlistStatus,
  joinRennesWaitlist,
  type RennesWaitlistStatus,
} from '../lib/backend';
import { isBackendEnabled } from '../lib/runtime';
import { goToDiscover, goToOutings, goToShop } from '../navigation/routes';
import { useAppStore } from '../state/useAppStore';
import { colors, glow, radius, spacing } from '../theme';

type Navigation = {
  navigate: (screen: string, params?: unknown) => void;
  goBack?: () => void;
};
type VenueRoute = { params?: { venue?: string; count?: number; kind?: string } };

function toCitySlug(name: string) {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'saint-brieuc'
  );
}

export function FriendsScreen({ navigation }: { navigation: Navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Header eyebrow='AMIS · BIENTÔT' />
      <View style={styles.soonBadge}>
        <Text style={styles.soonBadgeText}>BIENTÔT DISPONIBLE</Text>
      </View>
      <Text style={styles.title}>Tes amis dans TÉCAP, sans suivi GPS.</Text>
      <Text style={styles.sub}>
        Le cercle d’amis arrive prochainement pour retrouver tes proches qui choisissent de partager
        leur sortie du soir.
      </Text>
      <View style={styles.detailsCard}>
        <Text style={styles.section}>En attendant</Text>
        <Text style={styles.copy}>
          Tu peux déjà publier ton intention de sortie, découvrir qui sort autour de toi et échanger
          après un match.
        </Text>
      </View>
      <Pressable
        onPress={() => goToOutings(navigation, 'EveningStatus')}
        style={[styles.primaryButton, glow.pink]}
      >
        <Text style={styles.primaryButtonText}>Publier mon plan ce soir</Text>
      </Pressable>
      <Pressable onPress={() => goToDiscover(navigation)} style={styles.outlineButton}>
        <Text style={styles.outlineText}>Découvrir des profils</Text>
      </Pressable>
    </ScrollView>
  );
}

export function VenueDetailScreen({
  navigation,
  route,
}: {
  navigation: Navigation;
  route?: VenueRoute;
}) {
  const city = useAppStore((state) => state.city);
  const launchAreasQuery = useQuery({
    queryKey: ['backend-launch-areas'],
    queryFn: fetchBackendLaunchAreas,
    enabled: isBackendEnabled,
    staleTime: 10 * 60_000,
  });
  const activeArea =
    launchAreasQuery.data?.find((area) => area.name === city) ?? launchAreasQuery.data?.[0];
  const citySlug = activeArea?.slug ?? toCitySlug(city);
  const poisQuery = useQuery({
    queryKey: ['backend-points-of-interest', citySlug],
    queryFn: () => fetchBackendPointsOfInterest(citySlug),
    enabled: isBackendEnabled,
    staleTime: 5 * 60_000,
  });
  const remoteProfiles = useQuery({
    queryKey: ['discover-profiles', isBackendEnabled],
    queryFn: () => fetchBackendProfiles(),
    enabled: isBackendEnabled,
  });

  const venue = route?.params?.venue ?? (isBackendEnabled ? 'Lieu du soir' : 'Place du Chai');
  const matchingPoi = useMemo(
    () =>
      (poisQuery.data ?? []).find(
        (poi) => poi.name.trim().toLowerCase() === venue.trim().toLowerCase(),
      ),
    [poisQuery.data, venue],
  );
  const people = useMemo(() => {
    const source = isBackendEnabled ? (remoteProfiles.data ?? []) : demoProfiles;
    const atVenue = source.filter(
      (person) =>
        person.status &&
        person.venue &&
        person.venue.trim().toLowerCase() === venue.trim().toLowerCase(),
    );
    return atVenue.length > 0 || isBackendEnabled ? atVenue : demoProfiles.slice(0, 4);
  }, [remoteProfiles.data, venue]);

  const count = route?.params?.count ?? matchingPoi?.participant_count ?? people.length;
  const type = route?.params?.kind ?? matchingPoi?.subtitle ?? 'Lieu partagé';

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Header eyebrow={isBackendEnabled ? 'FICHE LIEU' : 'FICHE LIEU · DÉMO'} />
      <View style={styles.venueHero}>
        <Image source={{ uri: demoPhotos.night }} style={StyleSheet.absoluteFillObject} />
        <View style={styles.venueShade} />
        <Text style={styles.heroEyebrow}>
          ✦ {city.toLocaleUpperCase('fr-FR')} · {type.toLocaleUpperCase('fr-FR')}
        </Text>
        <Text style={styles.heroTitle}>{venue}</Text>
        <Text style={styles.heroMeta}>⌖ {city}</Text>
      </View>
      <View style={styles.attendanceCard}>
        <Text style={styles.attendanceNumber}>{count}</Text>
        <View style={styles.grow}>
          <Text style={styles.name}>
            personne{count > 1 ? 's' : ''} y {count > 1 ? 'sont' : 'est'}
          </Text>
          <Text style={styles.copy}>Statuts partagés volontairement ce soir</Text>
        </View>
        <Text style={styles.liveDot}>● CE SOIR</Text>
      </View>
      <View style={styles.detailsCard}>
        <Text style={styles.section}>À propos</Text>
        <Text style={styles.copy}>
          {matchingPoi?.description ??
            `Lieu partagé par des membres dans ${city}. Aucune position GPS automatique.`}
        </Text>
        {matchingPoi?.starts_at && <Text style={styles.copy}>◷ {matchingPoi.starts_at}</Text>}
      </View>
      <View style={styles.sectionRow}>
        <Text style={styles.section}>Qui est de sortie ?</Text>
        <Text style={styles.caption}>Aperçu public · 18+</Text>
      </View>
      {people.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.peopleRow}
        >
          {people.map((person) => (
            <Pressable
              key={person.id}
              onPress={() => goToDiscover(navigation, 'ProfileDetail', { profileId: person.id })}
              style={styles.personCard}
            >
              <Image source={{ uri: person.photo }} style={styles.personPhoto} />
              <Text style={styles.personName}>
                {person.name}, {person.age}
              </Text>
              <Text style={styles.personStatus} numberOfLines={1}>
                ● {person.status ?? venue}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.detailsCard}>
          <Text style={styles.copy}>
            Aucun profil public n’a encore partagé ce lieu pour ce soir.
          </Text>
        </View>
      )}
      <Pressable
        onPress={() => navigation.navigate('EveningStatus', { venue })}
        style={[styles.primaryButton, glow.pink]}
      >
        <Text style={styles.primaryButtonText}>J’y vais · publier mon statut</Text>
      </Pressable>
      <Pressable onPress={() => goToOutings(navigation, 'EveningStatus')} style={styles.textButton}>
        <Text style={styles.textButtonLabel}>Modifier mon statut de sortie</Text>
      </Pressable>
    </ScrollView>
  );
}

export function CrewScreen({ navigation }: { navigation: Navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Header eyebrow='TÉCAP CREW · BIENTÔT' />
      <View style={styles.soonBadge}>
        <Text style={styles.soonBadgeText}>BIENTÔT DISPONIBLE</Text>
      </View>
      <Text style={styles.title}>Les sorties en groupe arrivent bientôt.</Text>
      <Text style={styles.sub}>
        Tu pourras bientôt monter un crew et proposer une sortie à plusieurs depuis cette section.
      </Text>
      <View style={styles.detailsCard}>
        <Text style={styles.section}>Disponible dès maintenant</Text>
        <Text style={styles.copy}>
          Consulte la carte du soir, partage ton statut « Entre amis » et découvre les personnes qui
          sortent dans ta ville.
        </Text>
      </View>
      <Pressable
        onPress={() => goToOutings(navigation, 'Map')}
        style={[styles.primaryButton, glow.pink]}
      >
        <Text style={styles.primaryButtonText}>Ouvrir la carte du soir</Text>
      </Pressable>
      <Pressable onPress={() => goToOutings(navigation)} style={styles.textButton}>
        <Text style={styles.textButtonLabel}>Retour à Qui sort ce soir ? ›</Text>
      </Pressable>
    </ScrollView>
  );
}

export function WhoLikedMeScreen({ navigation }: { navigation: Navigation }) {
  const [selected, setSelected] = useState(false);
  const localPremium = useAppStore((state) => state.subscription === 'premium');
  const entitlements = useQuery({
    queryKey: ['backend-entitlements'],
    queryFn: fetchBackendEntitlements,
    enabled: isBackendEnabled,
  });
  const premium = isBackendEnabled ? Boolean(entitlements.data?.premium) : localPremium;

  if (isBackendEnabled) {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <Header eyebrow='TES ADMIRATEURS' />
        <View style={styles.soonBadge}>
          <Text style={styles.soonBadgeText}>BIENTÔT DISPONIBLE</Text>
        </View>
        <Text style={styles.title}>
          Découvre tes likes <Text style={styles.goldTitle}>dès l’ouverture de la vue.</Text>
        </Text>
        <Text style={styles.sub}>
          La liste dédiée des likes reçus arrive prochainement. En attendant, chaque like réciproque
          dans Découvrir crée immédiatement un match.
        </Text>
        <View style={styles.detailsCard}>
          <Text style={styles.section}>
            {premium ? 'Ton accès Premium est actif' : 'Découvrir ou passer Premium'}
          </Text>
          <Text style={styles.copy}>
            {premium
              ? 'Tu bénéficies déjà des likes illimités dans Découvrir.'
              : 'Passe en Premium dans la Boutique pour profiter des likes illimités et des avantages à venir.'}
          </Text>
          <Pressable
            onPress={() => (premium ? goToDiscover(navigation) : goToShop(navigation))}
            style={[styles.primaryButton, styles.goldButton, glow.gold]}
          >
            <Text style={styles.primaryButtonText}>
              {premium ? 'Ouvrir Découvrir' : 'Voir la Boutique Premium'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Header eyebrow='TES ADMIRATEURS · DÉMO' />
      <Text style={styles.title}>
        Aperçu <Text style={styles.goldTitle}>Likes · Démo</Text>
      </Text>
      <Text style={styles.sub}>
        Des personnes qui ont déjà envie de te découvrir (aperçu démo).
      </Text>
      <View style={styles.likesGrid}>
        {demoProfiles.slice(0, 6).map((profile, index) => (
          <Pressable
            key={profile.id}
            onPress={() => (premium ? setSelected(true) : goToShop(navigation))}
            style={styles.likeTile}
          >
            <Image
              source={{ uri: profile.photo }}
              style={[styles.likeImage, !premium && styles.blurred]}
              blurRadius={premium ? 0 : 18}
            />
            <View style={styles.likeShade} />
            <Text style={styles.likeNumber}>{index === 0 && premium ? profile.name : '♡'}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.detailsCard}>
        <Text style={styles.section}>
          {premium ? 'Tes likes t’attendent' : 'Débloque tes likes en mode démo'}
        </Text>
        <Text style={styles.copy}>
          {premium
            ? 'Découvre leurs profils et commence la conversation.'
            : 'Passe en Premium pour voir qui t’a liké, sans attendre le match.'}
        </Text>
        <Pressable
          onPress={() => (premium ? setSelected(true) : goToShop(navigation))}
          style={[styles.primaryButton, styles.goldButton, glow.gold]}
        >
          <Text style={styles.primaryButtonText}>
            {premium ? 'Voir tous mes likes' : 'Voir les likes avec Premium'}
          </Text>
        </Pressable>
      </View>
      {selected && (
        <View style={styles.privacy}>
          <Text style={styles.privacyText}>
            ✨ Mode démo : ouvre Découvrir pour retrouver ces profils.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const DEMO_WAITLIST: RennesWaitlistStatus = { count: 374, threshold: 500, cityOpen: false };
export function RennesWaitlistScreen({ navigation }: { navigation: Navigation }) {
  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [joined, setJoined] = useState(false);
  const [mockCount, setMockCount] = useState(DEMO_WAITLIST.count);
  const status = useQuery({
    queryKey: ['rennes-waitlist'],
    queryFn: fetchRennesWaitlistStatus,
    enabled: isBackendEnabled,
    retry: 1,
  });
  useEffect(() => {
    if (status.data) setMockCount(status.data.count);
  }, [status.data]);
  const remote: RennesWaitlistStatus | undefined = status.data;
  const count = remote?.count ?? mockCount;
  const threshold = remote?.threshold ?? DEMO_WAITLIST.threshold;
  const open = remote?.cityOpen ?? false;
  const progress = Math.min(1, count / threshold);
  const submit = async () => {
    if (!firstName.trim() || !email.includes('@') || Number(age) < 18 || !consent) {
      Alert.alert(
        'Presque prêt·e',
        'Renseigne ton prénom, un email valide, confirme tes 18 ans et accepte le contact pour la préinscription.',
      );
      return;
    }
    try {
      if (isBackendEnabled) {
        const result = await joinRennesWaitlist({
          firstName: firstName.trim(),
          age: Number(age),
          email: email.trim(),
        });
        setMockCount(result.count);
        await status.refetch();
      } else setMockCount((value) => Math.min(threshold, value + 1));
      setJoined(true);
    } catch (error) {
      Alert.alert(
        'Inscription impossible',
        error instanceof Error ? error.message : 'Réessaie dans un instant.',
      );
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Header eyebrow='VILLE PILOTE · ILLE-ET-VILAINE' />
      <View style={styles.waitlistHero}>
        <View style={styles.waitlistGlow} />
        <Text style={styles.waitlistEyebrow}>LA PROCHAINE VILLE À ALLUMER</Text>
        <Text style={styles.waitlistTitle}>Rennes{`\n`}va se capter.</Text>
        <Text style={styles.waitlistSlogan}>Tes où ? On se capte.</Text>
        <Text style={styles.copy}>Rencontres, sorties et soirées, au rythme des Rennais·es.</Text>
      </View>
      <View style={styles.counterCard}>
        <View style={styles.counterTop}>
          <View>
            <Text style={styles.counterLabel}>
              {open ? 'RENNES EST OUVERTE' : 'DÉBLOQUE TÉCAP À RENNES'}
            </Text>
            <Text style={styles.counterValue}>
              {count.toLocaleString('fr-FR')}{' '}
              <Text style={styles.counterUnit}>/ {threshold.toLocaleString('fr-FR')}</Text>
            </Text>
          </View>
          <Text style={styles.counterIcon}>{open ? '✓' : '✦'}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(2, progress * 100)}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {open
            ? 'La ville est débloquée. À très vite pour la Launch Night !'
            : `${Math.max(0, threshold - count)} préinscriptions avant le lancement`}
        </Text>
      </View>
      {joined ? (
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✦</Text>
          <Text style={styles.section}>Tu es sur la liste !</Text>
          <Text style={styles.copy}>
            On te prévient dès que Rennes s’allume. Ton numéro de préinscription est bien
            enregistré.
          </Text>
          <Text style={styles.waitlistNumber}>RENNES · #{String(count).padStart(4, '0')}</Text>
        </View>
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.section}>Réserve ta place pour la Launch Night</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder='Ton prénom'
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <View style={styles.inputRow}>
            <TextInput
              value={age}
              onChangeText={setAge}
              keyboardType='number-pad'
              placeholder='Âge'
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.ageInput]}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize='none'
              keyboardType='email-address'
              placeholder='ton@email.fr'
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.emailInput]}
            />
          </View>
          <Pressable onPress={() => setConsent((value) => !value)} style={styles.consentRow}>
            <View style={[styles.checkbox, consent && styles.checkboxOn]}>
              {consent && <Text style={styles.checkboxText}>✓</Text>}
            </View>
            <Text style={styles.consentText}>
              J’ai 18 ans ou plus et j’accepte d’être contacté·e pour le lancement de TÉCAP à
              Rennes.
            </Text>
          </Pressable>
          <Pressable onPress={() => void submit()} style={[styles.primaryButton, glow.pink]}>
            <Text style={styles.primaryButtonText}>Je rejoins la liste ↗</Text>
          </Pressable>
          <Text style={styles.finePrint}>
            Email utilisé uniquement pour la préinscription. Aucun GPS et aucun historique de
            position.
          </Text>
        </View>
      )}
      <View style={styles.launchCard}>
        <Text style={styles.launchIcon}>🌙</Text>
        <View style={styles.grow}>
          <Text style={styles.name}>Launch Night Rennes</Text>
          <Text style={styles.copy}>
            Une soirée pour lancer TÉCAP ensemble, dès que le compteur est atteint.
          </Text>
        </View>
      </View>
      {!isBackendEnabled && (
        <Text style={styles.demoNotice}>
          Aperçu démo · le compteur serveur apparaît lorsque Supabase est activé.
        </Text>
      )}
      <Pressable onPress={() => navigation.goBack?.()} style={styles.textButton}>
        <Text style={styles.textButtonLabel}>Retour à la connexion</Text>
      </Pressable>
    </ScrollView>
  );
}

function Header({ eyebrow }: { eyebrow: string }) {
  return (
    <View style={styles.header}>
      <BrandLogo size='small' />
      <Text style={styles.headerEyebrow}>{eyebrow}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    backgroundColor: colors.canvas,
    padding: spacing.lg,
    paddingTop: 27,
    paddingBottom: 112,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  headerEyebrow: { color: colors.gold, fontSize: 8, letterSpacing: 1.1, fontWeight: '900' },
  soonBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldWash,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
  },
  soonBadgeText: { color: colors.goldLight, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 27, lineHeight: 33, fontWeight: '900', marginTop: 8 },
  goldTitle: { color: colors.gold },
  sub: { color: colors.mutedStrong, fontSize: 12, lineHeight: 18, marginTop: 7, marginBottom: 18 },
  section: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 11 },
  grow: { flex: 1 },
  name: { color: colors.text, fontSize: 12, fontWeight: '900' },
  copy: { color: colors.mutedStrong, fontSize: 10, lineHeight: 15, marginTop: 4 },
  caption: { color: colors.muted, fontSize: 8, marginTop: 4 },
  privacy: {
    backgroundColor: colors.surface,
    borderColor: colors.goldSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 13,
    marginTop: 10,
  },
  privacyText: { color: colors.goldLight, fontSize: 10, lineHeight: 15 },
  outlineButton: {
    borderColor: colors.hotPink,
    borderWidth: 1,
    borderRadius: radius.pill,
    alignItems: 'center',
    padding: 14,
    marginTop: 14,
  },
  outlineText: { color: colors.pinkLight, fontSize: 11, fontWeight: '900' },
  venueHero: {
    height: 205,
    overflow: 'hidden',
    borderRadius: radius.lg,
    padding: 17,
    justifyContent: 'flex-end',
    marginBottom: 12,
    borderColor: colors.goldHot,
    borderWidth: 1,
  },
  venueShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,3,8,0.5)' },
  heroEyebrow: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 7 },
  heroMeta: { color: colors.mutedStrong, fontSize: 11, marginTop: 4 },
  attendanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.pinkWash,
    borderColor: colors.hotPink,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 11,
  },
  attendanceNumber: { color: colors.pinkLight, fontSize: 29, fontWeight: '900' },
  liveDot: { color: colors.green, fontSize: 8, fontWeight: '900' },
  detailsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 17,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  peopleRow: { gap: 10, paddingBottom: 4 },
  personCard: {
    width: 125,
    marginRight: 2,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    paddingBottom: 9,
  },
  personPhoto: { width: 125, height: 130 },
  personName: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 7,
    marginHorizontal: 8,
  },
  personStatus: { color: colors.pinkLight, fontSize: 8, marginTop: 3, marginHorizontal: 8 },
  primaryButton: {
    backgroundColor: colors.pink,
    padding: 15,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginTop: 14,
  },
  primaryButtonText: { color: '#180914', fontSize: 12, fontWeight: '900' },
  goldButton: { backgroundColor: colors.gold },
  textButton: { alignItems: 'center', padding: 13, marginTop: 4 },
  textButtonLabel: { color: colors.mutedStrong, fontSize: 10, fontWeight: '700' },
  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 13,
    marginBottom: 12,
    marginTop: 13,
  },
  input: {
    backgroundColor: colors.canvas,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 11,
  },
  likesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 12 },
  likeTile: {
    width: '31.5%',
    aspectRatio: 0.75,
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderColor: colors.goldSoft,
    borderWidth: 1,
  },
  likeImage: { width: '100%', height: '100%' },
  blurred: { opacity: 0.72 },
  likeShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,3,8,0.16)' },
  likeNumber: {
    position: 'absolute',
    alignSelf: 'center',
    top: '42%',
    color: colors.gold,
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: colors.goldGlow,
    textShadowRadius: 12,
  },
  waitlistHero: {
    minHeight: 220,
    borderColor: colors.hotPink,
    borderWidth: 1,
    borderRadius: radius.lg,
    backgroundColor: '#17091B',
    padding: 20,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  waitlistGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    right: -60,
    top: -60,
    borderRadius: 100,
    backgroundColor: colors.magentaDeep,
    opacity: 0.45,
  },
  waitlistEyebrow: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  waitlistTitle: {
    color: colors.text,
    fontSize: 37,
    lineHeight: 40,
    fontWeight: '900',
    marginTop: 11,
  },
  waitlistSlogan: { color: colors.pinkLight, fontSize: 15, fontWeight: '900', marginTop: 10 },
  counterCard: {
    backgroundColor: colors.surface,
    borderColor: colors.goldSoft,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 15,
    marginTop: 13,
  },
  counterTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counterLabel: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  counterValue: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: 3 },
  counterUnit: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  counterIcon: { color: colors.gold, fontSize: 26 },
  progressTrack: {
    height: 9,
    backgroundColor: colors.canvas,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: { height: '100%', backgroundColor: colors.pink, borderRadius: radius.pill },
  progressText: { color: colors.mutedStrong, fontSize: 9, marginTop: 8 },
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  ageInput: { width: 76 },
  emailInput: { flex: 1 },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 12 },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.pink, borderColor: colors.pink },
  checkboxText: { color: colors.canvas, fontSize: 11, fontWeight: '900' },
  consentText: { flex: 1, color: colors.mutedStrong, fontSize: 9, lineHeight: 14 },
  finePrint: {
    color: colors.muted,
    fontSize: 8,
    lineHeight: 13,
    textAlign: 'center',
    marginTop: 11,
  },
  successCard: {
    backgroundColor: colors.surface,
    borderColor: colors.goldHot,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 18,
    alignItems: 'center',
    marginTop: 14,
  },
  successIcon: { color: colors.gold, fontSize: 27, marginBottom: 8 },
  waitlistNumber: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 14,
  },
  launchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.pinkWash,
    borderColor: colors.lineBright,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 13,
    marginTop: 13,
  },
  launchIcon: { fontSize: 21 },
  demoNotice: { color: colors.muted, fontSize: 8, textAlign: 'center', marginTop: 10 },
});
