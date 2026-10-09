import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { demoMessages } from '../lib/demo';
import { colors, radius, spacing } from '../theme';
type Navigation = { navigate: (screen: string) => void };
export function ChatScreen({ navigation }: { navigation: Navigation }) {
  const [text, setText] = useState('');
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Home')}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>Léa, 24 · Aux Servan·es ce soir</Text>
        </View>
        <Text style={styles.more}>♢</Text>
      </View>
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
  more: { color: colors.mutedStrong, marginLeft: 'auto', fontSize: 20 },
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
