import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { demoMessages, demoPhotos } from '../lib/demo';
import { colors, radius, spacing } from '../theme';
import { BrandLogo } from '../components/BrandLogo';
type Navigation = { navigate: (screen: string) => void };
export function ChatScreen({ navigation }: { navigation: Navigation }) {
  const [text, setText] = useState('');
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Home')}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Image source={{ uri: demoPhotos.alex }} style={styles.headerAvatar} />
        <View style={styles.headerCopy}>
          <BrandLogo size='small' />
          <Text style={styles.title}>Alex, 27</Text>
          <Text style={styles.subtitle}>En ligne · Messages</Text>
        </View>
        <Text style={styles.more}>♢</Text>
      </View>
      <Pressable
        onPress={() => navigation.navigate('IncomingRequest')}
        style={styles.requestCard}
        accessibilityRole='button'
      >
        <View style={styles.requestIcon}>
          <Text style={styles.requestIconText}>♡</Text>
        </View>
        <View style={styles.requestCopy}>
          <Text style={styles.requestEyebrow}>NOUVELLE DEMANDE</Text>
          <Text style={styles.requestTitle}>On se capte ce soir ?</Text>
          <Text style={styles.requestBody}>Alex t’a envoyé une invitation spéciale.</Text>
        </View>
        <Text style={styles.requestArrow}>›</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.messages}>
        {demoMessages.map((message) => (
          <View
            key={message.id}
            style={[styles.messageWrap, message.side === 'right' && styles.right]}
          >
            <View style={[styles.bubble, message.side === 'right' && styles.bubbleRight]}>
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
            <Text style={styles.time}>{message.time}</Text>
          </View>
        ))}
        <View style={styles.quick}>
          <Text style={styles.quickText}>On se capte ? 👀</Text>
          <Text style={styles.quickText}>T’es avec qui ?</Text>
        </View>
      </ScrollView>
      <View style={styles.composer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder='Écris un message…'
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Pressable onPress={() => setText('')} style={styles.send}>
          <Text style={styles.sendText}>➤</Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas, paddingTop: 28 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  back: { color: colors.text, fontSize: 32, marginRight: 15 },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 10, marginTop: 4 },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    borderColor: colors.pink,
    borderWidth: 1,
  },
  headerCopy: { flex: 1 },
  more: { color: colors.mutedStrong, marginLeft: 'auto', fontSize: 20 },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: 12,
    padding: 12,
    borderColor: colors.pinkSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,46,173,.1)',
  },
  requestIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  requestIconText: { color: colors.pink, fontSize: 22 },
  requestCopy: { flex: 1 },
  requestEyebrow: { color: colors.gold, fontSize: 8, letterSpacing: 1, fontWeight: '900' },
  requestTitle: { color: colors.text, fontSize: 12, fontWeight: '800', marginTop: 4 },
  requestBody: { color: colors.muted, fontSize: 9, marginTop: 3 },
  requestArrow: { color: colors.pink, fontSize: 24 },
  messages: { padding: spacing.lg, paddingBottom: 30 },
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
  quick: { flexDirection: 'row', gap: 8, marginTop: 8 },
  quickText: {
    color: colors.mutedStrong,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 10,
  },
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
  sendText: { color: colors.ivoryText, fontSize: 18 },
});
