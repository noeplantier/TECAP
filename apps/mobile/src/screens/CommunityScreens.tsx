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
  fetchRennesWaitlistStatus,
  fetchBackendEntitlements,
  joinRennesWaitlist,
  type RennesWaitlistStatus,
} from '../lib/backend';
import { isBackendEnabled } from '../lib/runtime';
import { goToDiscover, goToMessages, goToOutings, goToShop } from '../navigation/routes';
import { useAppStore } from '../state/useAppStore';
import { colors, glow, radius, spacing } from '../theme';

type Navigation = {
  navigate: (screen: string, params?: unknown) => void;
  goBack?: () => void;
};
type VenueRoute = { params?: { venue?: string; count?: number; kind?: string } };

const cityFriends = [
  {
    id: 'thomas',
    name: 'Thomas',
    age: 26,
    status: 'En soirée au Liberté',
    time: 'expire dans 1 h 12',
    photo: demoPhotos.alex,
    online: true,
  },
  {
    id: 'julie',
    name: 'Julie',
    age: 24,
    status: 'En ligne',
    time: 'active maintenant',
    photo: demoPhotos.manon,
    online: true,
  },
  {
    id: 'ines',
    name: 'Inès',
    age: 25,
    status: 'Concert · Le MeM',
    time: 'expire dans 48 min',
    photo: demoPhotos.lea,
    online: false,
  },
];
const requests = [
  {
    id: 'camille',
    name: 'Camille',
    age: 23,
    photo: demoPhotos.manon,
    note: 'Vous avez 3 amis en commun',
  },
  {
    id: 'hugo',
    name: 'Hugo',
    age: 27,
    photo: demoPhotos.alex,
    note: 'Vous sortez souvent dans le centre',
  },
];

export function FriendsScreen({ navigation }: { navigation: Navigation }) {
  const [tab, setTab] = useState<'Amis' | 'Demandes'>('Amis');
  const [accepted, setAccepted] = useState<string[]>([]);
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Header eyebrow='TON CERCLE' />
      <Text style={styles.title}>Les amis, en mieux.</Text>
      <Text style={styles.sub}>Retrouve tes proches sans partager ta position GPS.</Text>
      <View style={styles.segment}>
        {(['Amis', 'Demandes'] as const).map((item) => (
          <Pressable
            key={item}
            onPress={() => setTab(item)}
            style={[styles.segmentItem, tab === item && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, tab === item && styles.segmentTextActive]}>
              {item}
              {item === 'Demandes' ? '  2' : '  8'}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === 'Amis' ? (
        <>
          <Text style={styles.section}>Actifs ce soir</Text>
          {cityFriends.map((friend) => (
            <View key={friend.id} style={styles.friendRow}>
              <View style={styles.avatarWrap}>
                <Image source={{ uri: friend.photo }} style={styles.avatar} />
                <View style={[styles.presence, !friend.online && styles.presenceOff]} />
              </View>
              <View style={styles.grow}>
                <Text style={styles.name}>
                  {friend.name}, {friend.age}
                </Text>
                <Text style={styles.copy}>{friend.status}</Text>
                <Text style={styles.caption}>{friend.time}</Text>
              </View>
              <Pressable onPress={() => goToMessages(navigation)} style={styles.smallButton}>
                <Text style={styles.smallButtonText}>Écrire</Text>
              </Pressable>
            </View>
          ))}
          <View style={styles.privacy}>
            <Text style={styles.privacyText}>
              ⌖ Les lieux affichés viennent uniquement des statuts partagés volontairement.
            </Text>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.section}>Nouvelles demandes</Text>
          {requests.map((person) => (
            <View key={person.id} style={styles.friendRow}>
              <Image source={{ uri: person.photo }} style={styles.avatar} />
              <View style={styles.grow}>
                <Text style={styles.name}>
                  {person.name}, {person.age}
                </Text>
                <Text style={styles.copy}>{person.note}</Text>
              </View>
              {accepted.includes(person.id) ? (
                <Text style={styles.accepted}>Ajouté ✓</Text>
              ) : (
                <Pressable
                  onPress={() => setAccepted((values) => [...values, person.id])}
                  style={styles.smallButton}
                >
                  <Text style={styles.smallButtonText}>Accepter</Text>
                </Pressable>
              )}
            </View>
          ))}
        </>
      )}
      <Pressable onPress={() => goToDiscover(navigation)} style={styles.outlineButton}>
        <Text style={styles.outlineText}>＋ Inviter des amis</Text>
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
  const venue = route?.params?.venue ?? 'L’Apsara';
  const count = route?.params?.count ?? 124;
  const type = route?.params?.kind ?? 'Bar · Club';
  const people = useMemo(() => demoProfiles.slice(0, 5), []);
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Header eyebrow='FICHE LIEU' />
      <View style={styles.venueHero}>
        <Image source={{ uri: demoPhotos.night }} style={StyleSheet.absoluteFillObject} />
        <View style={styles.venueShade} />
        <Text style={styles.heroEyebrow}>✦ RENNES · {type.toUpperCase()}</Text>
        <Text style={styles.heroTitle}>{venue}</Text>
        <Text style={styles.heroMeta}>⌖ Centre-ville · Rennes</Text>
      </View>
      <View style={styles.attendanceCard}>
        <Text style={styles.attendanceNumber}>{count}</Text>
        <View style={styles.grow}>
          <Text style={styles.name}>personnes y sont</Text>
          <Text style={styles.copy}>Statuts partagés volontairement ce soir</Text>
        </View>
        <Text style={styles.liveDot}>● LIVE</Text>
      </View>
      <View style={styles.detailsCard}>
        <Text style={styles.section}>À propos</Text>
        <Text style={styles.copy}>Bar · Club · Cocktails et DJ sets au cœur de Rennes.</Text>
        <Text style={styles.copy}>⌖ 1 rue Saint-Michel, Rennes</Text>
        <Text style={styles.copy}>◷ Ouvert ce soir · jusqu’à 2 h</Text>
      </View>
      <View style={styles.sectionRow}>
        <Text style={styles.section}>Qui est de sortie ?</Text>
        <Text style={styles.caption}>Aperçu public · 18+</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.peopleRow}
      >
        {people.map((person) => (
          <View key={person.id} style={styles.personCard}>
            <Image source={{ uri: person.photo }} style={styles.personPhoto} />
            <Text style={styles.personName}>
              {person.name}, {person.age}
            </Text>
            <Text style={styles.personStatus}>● À {venue}</Text>
          </View>
        ))}
      </ScrollView>
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
  const [tab, setTab] = useState<'Soirées' | 'Mes crews'>('Soirées');
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [created, setCreated] = useState<string[]>([]);
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Header eyebrow='TÉCAP CREW' />
      <Text style={styles.title}>Les meilleures soirées, à plusieurs.</Text>
      <Text style={styles.sub}>
        Monte ton plan, invite ton crew et retrouve les autres en ville.
      </Text>
      <View style={styles.segment}>
        {(['Soirées', 'Mes crews'] as const).map((item) => (
          <Pressable
            key={item}
            onPress={() => setTab(item)}
            style={[styles.segmentItem, tab === item && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, tab === item && styles.segmentTextActive]}>
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === 'Soirées' ? (
        <>
          <Pressable
            onPress={() => setCreating((value) => !value)}
            style={[styles.createCard, glow.gold]}
          >
            <Text style={styles.createIcon}>＋</Text>
            <View style={styles.grow}>
              <Text style={styles.name}>Créer une soirée</Text>
              <Text style={styles.copy}>Titre · lieu · heure · invitation</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          {creating && (
            <View style={styles.formCard}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder='Ex. Apéro entre Rennais·es'
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
              <View style={styles.formRow}>
                <Text style={styles.formHint}>⌖ L’Apsara · ce soir · 21 h</Text>
                <Pressable
                  onPress={() => {
                    const clean = title.trim();
                    if (!clean) {
                      Alert.alert('Ajoute un titre', 'Donne un nom à ta soirée.');
                      return;
                    }
                    setCreated((items) => [clean, ...items]);
                    setTitle('');
                    setCreating(false);
                  }}
                  style={styles.smallButton}
                >
                  <Text style={styles.smallButtonText}>Créer</Text>
                </Pressable>
              </View>
            </View>
          )}
          {created.map((item, index) => (
            <OutingCard
              key={`${item}-${index}`}
              title={item}
              meta='L’Apsara · Ce soir · toi + ton crew'
            />
          ))}
          <OutingCard
            title='Un verre, puis on voit'
            meta='Le Connétable · Ce soir · 12 personnes'
          />
          <OutingCard title='Concert au Liberté' meta='Le Liberté · 21 h · 8 personnes' />
          <OutingCard title='Brunch de dimanche' meta='Centre-ville · Dimanche · 6 personnes' />
        </>
      ) : (
        <>
          <Text style={styles.section}>Tes crews</Text>
          {['Les Rennais·es 🌙', 'Team concert 🎶', 'Potes du campus ✨'].map((name, index) => (
            <View key={name} style={styles.friendRow}>
              <View style={[styles.crewBadge, index === 1 && styles.crewBadgeGold]}>
                <Text style={styles.crewBadgeText}>{['R', '♪', '✦'][index]}</Text>
              </View>
              <View style={styles.grow}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.copy}>
                  {[8, 5, 11][index]} membres ·{' '}
                  {index === 0 ? '3 actifs ce soir' : 'dernière sortie cette semaine'}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          ))}
          <Pressable
            onPress={() =>
              Alert.alert('Nouveau crew', 'Invitation TÉCAP prête à partager avec tes amis.')
            }
            style={styles.outlineButton}
          >
            <Text style={styles.outlineText}>＋ Créer un crew</Text>
          </Pressable>
        </>
      )}
      <Pressable onPress={() => goToOutings(navigation)} style={styles.textButton}>
        <Text style={styles.textButtonLabel}>Voir toutes les sorties de Rennes ↗</Text>
      </Pressable>
    </ScrollView>
  );
}

function OutingCard({ title, meta }: { title: string; meta: string }) {
  const [joined, setJoined] = useState(false);
  return (
    <View style={styles.outingCard}>
      <View style={styles.outingAccent}>
        <Text style={styles.outingEmoji}>🌙</Text>
      </View>
      <View style={styles.grow}>
        <Text style={styles.name}>{title}</Text>
        <Text style={styles.copy}>{meta}</Text>
      </View>
      <Pressable onPress={() => setJoined((value) => !value)} style={styles.smallButton}>
        <Text style={styles.smallButtonText}>{joined ? '✓ J’y vais' : 'Rejoindre'}</Text>
      </Pressable>
    </View>
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
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Header eyebrow='TES ADMIRATEURS' />
      <Text style={styles.title}>
        Tu as <Text style={styles.goldTitle}>38 likes.</Text>
      </Text>
      <Text style={styles.sub}>Des personnes qui ont déjà envie de te découvrir.</Text>
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
          {premium ? 'Tes likes t’attendent' : 'Débloque tes 38 likes'}
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
            ✨ Tu es dans le top des likes ce soir. Ouvre Découvrir pour les retrouver.
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
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  headerEyebrow: { color: colors.gold, fontSize: 8, letterSpacing: 1.1, fontWeight: '900' },
  title: { color: colors.text, fontSize: 27, lineHeight: 33, fontWeight: '900', marginTop: 8 },
  goldTitle: { color: colors.gold },
  sub: { color: colors.mutedStrong, fontSize: 12, lineHeight: 18, marginTop: 7, marginBottom: 18 },
  section: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 11 },
  segment: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    marginBottom: 16,
  },
  segmentItem: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.pinkWash, borderColor: colors.hotPink, borderWidth: 1 },
  segmentText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  segmentTextActive: { color: colors.text, fontWeight: '900' },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 11,
    marginBottom: 9,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 47, height: 47, borderRadius: 24, borderWidth: 1, borderColor: colors.pink },
  presence: {
    position: 'absolute',
    right: 0,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  presenceOff: { backgroundColor: colors.muted },
  grow: { flex: 1 },
  name: { color: colors.text, fontSize: 12, fontWeight: '900' },
  copy: { color: colors.mutedStrong, fontSize: 10, lineHeight: 15, marginTop: 4 },
  caption: { color: colors.muted, fontSize: 8, marginTop: 4 },
  smallButton: {
    backgroundColor: colors.pinkWash,
    borderColor: colors.hotPink,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  smallButtonText: { color: colors.pinkLight, fontSize: 9, fontWeight: '900' },
  accepted: { color: colors.green, fontSize: 10, fontWeight: '800' },
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
  primaryButtonOn: { backgroundColor: colors.green },
  primaryButtonText: { color: '#180914', fontSize: 12, fontWeight: '900' },
  goldButton: { backgroundColor: colors.gold },
  textButton: { alignItems: 'center', padding: 13, marginTop: 4 },
  textButtonLabel: { color: colors.mutedStrong, fontSize: 10, fontWeight: '700' },
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.goldWash,
    borderColor: colors.goldHot,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 12,
  },
  createIcon: { color: colors.gold, fontSize: 24, fontWeight: '700' },
  chevron: { color: colors.gold, fontSize: 23 },
  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 13,
    marginBottom: 12,
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
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  formHint: { color: colors.mutedStrong, fontSize: 9 },
  outingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 11,
    marginBottom: 9,
  },
  outingAccent: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.pinkWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outingEmoji: { fontSize: 17 },
  crewBadge: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.pinkWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crewBadgeGold: { backgroundColor: colors.goldWash },
  crewBadgeText: { color: colors.gold, fontSize: 17, fontWeight: '900' },
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
