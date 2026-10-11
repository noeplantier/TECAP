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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { demoProfiles } from '../lib/demo';
import { fetchBackendConversation, sendBackendMessage } from '../lib/backend';
import { goToDiscover } from '../navigation/routes';
import { isBackendEnabled } from '../lib/runtime';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../state/useAppStore';
import { colors, radius, spacing } from '../theme';
import { BrandLogo } from '../components/BrandLogo';

type Navigation = { navigate: (screen: string, params?: unknown) => void; goBack?: () => void };
type Route = { params?: { matchId?: string } };

export function ChatScreen({ navigation, route }: { navigation: Navigation; route?: Route }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const matches = useAppStore((state) => state.matches);
  const messages = useAppStore((state) => state.messages);
  const requests = useAppStore((state) => state.catchRequests);
  const addMessage = useAppStore((state) => state.addMessage);
  const markMatchRead = useAppStore((state) => state.markMatchRead);
  const queryClient = useQueryClient();
  const matchId = route?.params?.matchId;
  const selectedMatch = matches.find((match) => match.id === matchId) ?? matches[0];
  const profile = useMemo(
    () => demoProfiles.find((item) => item.id === selectedMatch?.profileId),
    [selectedMatch?.profileId],
  );
  const remoteConversation = useQuery({
    queryKey: ['backend-conversation', matchId],
    queryFn: () => fetchBackendConversation(matchId!),
    enabled: isBackendEnabled && Boolean(matchId),
  });
  const displayProfile = isBackendEnabled ? remoteConversation.data?.profile : profile;

  useEffect(() => {
    if (selectedMatch && !isBackendEnabled) markMatchRead(selectedMatch.id);
  }, [markMatchRead, selectedMatch]);

  useEffect(() => {
    if (!isBackendEnabled || !matchId) return;
    const channel = supabase
      .channel(`tecap-conversation-${matchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        () => void queryClient.invalidateQueries({ queryKey: ['backend-conversation', matchId] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [matchId, queryClient]);

  if (
    (!isBackendEnabled && (!selectedMatch || !profile)) ||
    (isBackendEnabled && remoteConversation.isLoading)
  ) {
    return (
      <View style={styles.container}>
        <View style={styles.listHeader}>
          <BrandLogo size='medium' showTagline />
          <Text style={styles.more}>♢</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>♡</Text>
          <Text style={styles.emptyTitle}>Tes matchs apparaîtront ici</Text>
          <Text style={styles.emptyBody}>
            Like un profil qui sort ce soir et démarre une conversation quand le like est
            réciproque.
          </Text>
          <Pressable onPress={() => goToDiscover(navigation)} style={styles.primary}>
            <Text style={styles.primaryText}>Découvrir des profils</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!displayProfile) return null;
  const conversation = isBackendEnabled
    ? (remoteConversation.data?.messages ?? []).map((message) => ({
        id: message.id,
        text: message.text,
        createdAt: new Date(message.createdAt).getTime(),
        sender: message.senderId === displayProfile.id ? ('them' as const) : ('me' as const),
      }))
    : messages.filter((message) => message.matchId === selectedMatch!.id);
  const pendingRequest = requests.find(
    (request) => request.matchId === selectedMatch!.id && request.status === 'pending',
  );

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    if (isBackendEnabled) {
      try {
        await sendBackendMessage(matchId!, content);
        setText('');
        await queryClient.invalidateQueries({ queryKey: ['backend-conversation', matchId] });
      } catch (error) {
        Alert.alert(
          'Message non envoyé',
          error instanceof Error ? error.message : 'Réessaie dans un instant.',
        );
      } finally {
        setSending(false);
      }
      return;
    }
    addMessage(selectedMatch!.id, 'me', content);
    setText('');
    setTimeout(() => {
      addMessage(
        selectedMatch!.id,
        'them',
        content.toLowerCase().includes('bar')
          ? 'Carrément, ton plan me tente bien ✨'
          : 'Oui, avec plaisir ! On se capte ce soir ?',
      );
      setSending(false);
    }, 650);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack?.()} accessibilityRole='button'>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Image source={{ uri: displayProfile.photo }} style={styles.headerAvatar} />
        <View style={styles.headerCopy}>
          <BrandLogo size='small' />
          <Text style={styles.title}>
            {displayProfile.name}, {displayProfile.age}
          </Text>
          <Text style={styles.subtitle}>
            En ligne · {displayProfile.venue ?? 'disponible ce soir'}
          </Text>
        </View>
        <Text style={styles.more}>•••</Text>
      </View>
      <Pressable
        onPress={() => goToDiscover(navigation, 'Invitation')}
        style={styles.catchCard}
        accessibilityRole='button'
      >
        <Text style={styles.catchIcon}>✦</Text>
        <View style={styles.catchCopy}>
          <Text style={styles.catchTitle}>On se capte ce soir ?</Text>
          <Text style={styles.catchBody}>
            {pendingRequest ? 'Demande en attente de réponse' : 'Proposer un plan avec intention'}
          </Text>
        </View>
        <Text style={styles.catchArrow}>›</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.messages}>
        <View style={styles.matchBanner}>
          <Text style={styles.matchIcon}>♡</Text>
          <View>
            <Text style={styles.matchTitle}>Match récent</Text>
            <Text style={styles.matchBody}>Vous partagez peut-être la même soirée.</Text>
          </View>
        </View>
        {conversation.length === 0 && (
          <View style={styles.welcome}>
            <Text style={styles.welcomeTitle}>Commence la conversation</Text>
            <Text style={styles.welcomeText}>
              “Salut, ton plan {displayProfile.venue ?? 'de ce soir'} me tente bien.”
            </Text>
          </View>
        )}
        {conversation.map((message) => (
          <View
            key={message.id}
            style={[styles.messageWrap, message.sender === 'me' && styles.right]}
          >
            <View style={[styles.bubble, message.sender === 'me' && styles.bubbleRight]}>
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
            <Text style={styles.time}>
              {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {message.sender === 'me' ? ' · Envoyé' : ''}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.composer}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
          editable={!sending}
          placeholder='Écris un message…'
          placeholderTextColor={colors.muted}
          style={styles.input}
          returnKeyType='send'
        />
        <Pressable
          disabled={sending || !text.trim()}
          onPress={send}
          style={[styles.send, (!text.trim() || sending) && styles.sendDisabled]}
        >
          <Text style={styles.sendText}>➤</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas, paddingTop: 28 },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  back: { color: colors.text, fontSize: 32, marginRight: 13 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderColor: colors.pink,
    borderWidth: 1,
  },
  headerCopy: { flex: 1 },
  title: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 2 },
  subtitle: { color: colors.muted, fontSize: 10, marginTop: 3 },
  more: { color: colors.mutedStrong, fontSize: 20, marginLeft: 'auto' },
  catchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.lg,
    marginBottom: 0,
    padding: 12,
    borderColor: colors.pinkSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.pinkWash,
  },
  catchIcon: { color: colors.pink, fontSize: 22, marginRight: 10 },
  catchCopy: { flex: 1 },
  catchTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  catchBody: { color: colors.muted, fontSize: 9, marginTop: 3 },
  catchArrow: { color: colors.pink, fontSize: 24 },
  messages: { padding: spacing.lg, paddingBottom: 25 },
  matchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.goldWash,
    borderColor: colors.goldSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 18,
  },
  matchIcon: { color: colors.gold, fontSize: 24, marginRight: 10 },
  matchTitle: { color: colors.gold, fontSize: 12, fontWeight: '900' },
  matchBody: { color: colors.mutedStrong, fontSize: 9, marginTop: 3 },
  welcome: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 16,
  },
  welcomeTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  welcomeText: { color: colors.mutedStrong, fontSize: 12, lineHeight: 18, marginTop: 7 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: { color: colors.pink, fontSize: 64 },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 15,
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 9,
  },
  primary: {
    backgroundColor: colors.pink,
    borderRadius: radius.pill,
    alignItems: 'center',
    padding: 15,
    marginTop: 20,
    paddingHorizontal: 22,
  },
  primaryText: { color: '#190915', fontWeight: '900' },
  messageWrap: { alignItems: 'flex-start', marginBottom: 12 },
  right: { alignItems: 'flex-end' },
  bubble: {
    backgroundColor: colors.surfaceStrong,
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radius.md,
  },
  bubbleRight: { backgroundColor: colors.violetSoft, borderBottomRightRadius: 4 },
  messageText: { color: colors.text, fontSize: 13, lineHeight: 18 },
  time: { color: colors.muted, fontSize: 9, marginTop: 4 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.canvas,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 12,
  },
  send: {
    backgroundColor: colors.ivory,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendDisabled: { opacity: 0.45 },
  sendText: { color: colors.ivoryText, fontSize: 18 },
});
