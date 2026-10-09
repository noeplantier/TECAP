import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const event = {
  name: 'TÉCAP Night #01',
  date: 'SAM. 26 OCT · 22H',
  venue: 'V&B Langueux',
  city: 'Saint-Brieuc',
  attendees: 128,
};

export function EventsScreen() {
  const [joined, setJoined] = useState(false);
  const [pass, setPass] = useState(false);
  const join = () => {
    setJoined(true);
    Alert.alert('Tu es sur la liste', 'Ton pass sera disponible juste ici.');
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>ÉVÉNEMENTS IRL</Text>
      <Text style={styles.title}>Les nuits TÉCAP</Text>
      <Text style={styles.subtitle}>Des rencontres qui sortent du téléphone.</Text>
      <View style={styles.eventCard}>
        <View style={styles.eventArt}>
          <Text style={styles.eventMark}>TÉCAP</Text>
          <Text style={styles.eventDate}>{event.date}</Text>
        </View>
        <View style={styles.eventCopy}>
          <Text style={styles.eventName}>{event.name}</Text>
          <Text style={styles.eventVenue}>
            📍 {event.venue} · {event.city}
          </Text>
          <Text style={styles.eventPeople}>✦ {event.attendees} personnes viennent</Text>
          {!joined ? (
            <Pressable onPress={join} style={styles.primary}>
              <Text style={styles.primaryText}>Je viens</Text>
            </Pressable>
          ) : (
            <View style={styles.joined}>
              <Text style={styles.joinedText}>✓ Inscrit TÉCAP Night</Text>
            </View>
          )}
        </View>
      </View>
      {joined && (
        <View style={styles.passCard}>
          <View style={styles.passTop}>
            <View>
              <Text style={styles.passLabel}>TON PASS</Text>
              <Text style={styles.passTitle}>Entrée standard</Text>
            </View>
            <Text style={styles.passId}>TC-01</Text>
          </View>
          {pass ? (
            <View style={styles.qr}>
              <Text style={styles.qrText}>▦</Text>
              <Text style={styles.qrCaption}>Présente ce QR à l’entrée</Text>
            </View>
          ) : (
            <Pressable onPress={() => setPass(true)} style={styles.secondary}>
              <Text style={styles.secondaryText}>Générer mon pass QR</Text>
            </Pressable>
          )}
        </View>
      )}
      <Text style={styles.safety}>
        Le staff valide ton pass une seule fois à l’entrée. Le bracelet social ne constitue jamais
        une preuve de consentement.
      </Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#08080b', padding: 22 },
  eyebrow: { color: '#ff4fd8', fontSize: 11, fontWeight: '800', letterSpacing: 1.3, marginTop: 16 },
  title: { color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#9797a6', fontSize: 15, marginTop: 10, marginBottom: 24 },
  eventCard: {
    backgroundColor: '#15151c',
    borderRadius: 20,
    overflow: 'hidden',
    borderColor: '#292936',
    borderWidth: 1,
  },
  eventArt: {
    height: 170,
    backgroundColor: '#6b25a8',
    padding: 20,
    justifyContent: 'space-between',
  },
  eventMark: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  eventDate: { color: '#fff', fontWeight: '800', fontSize: 13 },
  eventCopy: { padding: 18 },
  eventName: { color: '#fff', fontSize: 21, fontWeight: '800' },
  eventVenue: { color: '#c5c5d0', marginTop: 10 },
  eventPeople: { color: '#ff91dd', fontSize: 13, marginTop: 8 },
  primary: {
    backgroundColor: '#ff4fd8',
    borderRadius: 13,
    padding: 15,
    alignItems: 'center',
    marginTop: 18,
  },
  primaryText: { color: '#08080b', fontWeight: '800' },
  joined: {
    backgroundColor: '#1b3329',
    borderRadius: 13,
    padding: 15,
    alignItems: 'center',
    marginTop: 18,
  },
  joinedText: { color: '#71e0ab', fontWeight: '800' },
  passCard: { backgroundColor: '#f4f0e8', borderRadius: 20, padding: 18, marginTop: 18 },
  passTop: { flexDirection: 'row', justifyContent: 'space-between' },
  passLabel: { color: '#6b5e70', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  passTitle: { color: '#251a2c', fontSize: 18, fontWeight: '900', marginTop: 4 },
  passId: { color: '#6b5e70', fontWeight: '800' },
  qr: { alignItems: 'center', paddingVertical: 22 },
  qrText: { color: '#251a2c', fontSize: 100, lineHeight: 100 },
  qrCaption: { color: '#6b5e70', fontSize: 12 },
  secondary: {
    borderColor: '#bba8bd',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  secondaryText: { color: '#251a2c', fontWeight: '800' },
  safety: { color: '#777784', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 24 },
});
