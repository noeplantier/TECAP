import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type SubscriptionTier = 'free' | 'premium';
export type OfferId =
  'invite-1' | 'invite-5' | 'premium-1' | 'premium-3' | 'premium-12' | 'boost-1' | 'boost-5';
export type SwipeDirection = 'like' | 'pass';
export type CatchIntent = 'verre' | 'manger' | 'concert' | 'club' | 'improviser';
export type CatchStatus = 'pending' | 'accepted' | 'declined' | 'alternative' | 'expired';

export type Match = {
  id: string;
  profileId: string;
  createdAt: number;
  lastActivityAt: number;
};

export type LocalMessage = {
  id: string;
  matchId: string;
  sender: 'me' | 'them';
  text: string;
  createdAt: number;
  read: boolean;
};

export type CatchRequest = {
  id: string;
  matchId: string;
  receiverProfileId: string;
  intent: CatchIntent;
  venue?: string;
  timeOption?: string;
  message?: string;
  status: CatchStatus;
  createdAt: number;
  respondedAt?: number;
};

export type LocalNotification = {
  id: string;
  type: 'match' | 'message' | 'catch' | 'system';
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  data?: Record<string, string>;
};

export type OutingStatus = {
  activityType: string;
  city: string;
  venue?: string;
  timeWindow?: string;
  note?: string;
  expiresAt: number;
};
export type LocationConsent = 'unknown' | 'granted' | 'denied';
export type ApproximateLocation = {
  latitude: number;
  longitude: number;
  accuracyM?: number | null;
  updatedAt: number;
};

const LIKE_WINDOW_MS = 24 * 60 * 60 * 1000;
export const FREE_LIKE_LIMIT = 25;

const now = () => Date.now();
let outingExpiryTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleOutingCleanup(expiresAt: number) {
  if (outingExpiryTimer) clearTimeout(outingExpiryTimer);
  const delay = expiresAt - now();
  if (delay <= 0) {
    const current = useAppStore.getState().outingStatus;
    if (current?.expiresAt === expiresAt) useAppStore.getState().removeOutingStatus();
    return;
  }
  outingExpiryTimer = setTimeout(() => {
    const current = useAppStore.getState().outingStatus;
    if (current?.expiresAt === expiresAt) useAppStore.getState().removeOutingStatus();
  }, delay);
}

function activeTimestamps(timestamps: number[], timestamp = now()) {
  return timestamps.filter((value) => timestamp - value < LIKE_WINDOW_MS);
}

function notification(
  type: LocalNotification['type'],
  title: string,
  body: string,
  data?: Record<string, string>,
): LocalNotification {
  return {
    id: `notification-${Date.now()}-${Math.random()}`,
    type,
    title,
    body,
    createdAt: now(),
    read: false,
    data,
  };
}

type AppState = {
  city: string;
  isAuthenticated: boolean;
  hasAccepted18Plus: boolean;
  subscription: SubscriptionTier;
  boosts: number;
  invitationCredits: number;
  lastPurchase?: OfferId;
  likedProfileIds: string[];
  passedProfileIds: string[];
  blockedProfileIds: string[];
  likeTimestamps: number[];
  matches: Match[];
  messages: LocalMessage[];
  catchRequests: CatchRequest[];
  notifications: LocalNotification[];
  outingStatus?: OutingStatus;
  locationConsent: LocationConsent;
  mapVisible: boolean;
  approximateLocation?: ApproximateLocation;
  setCity: (city: string) => void;
  setAuthenticated: (value: boolean) => void;
  setAccepted18Plus: (value: boolean) => void;
  activatePremium: (offer: OfferId) => void;
  addBoosts: (amount: number, offer: OfferId) => void;
  addInvitationCredits: (amount: number, offer: OfferId) => void;
  likeProfile: (
    profileId: string,
    willMatchOnLike: boolean,
  ) => { allowed: boolean; matched: boolean };
  passProfile: (profileId: string) => void;
  blockProfile: (profileId: string) => void;
  isBlocked: (profileId: string) => boolean;
  likesRemaining: () => number;
  addMessage: (matchId: string, sender: LocalMessage['sender'], text: string) => void;
  markMatchRead: (matchId: string) => void;
  sendCatchRequest: (input: Omit<CatchRequest, 'id' | 'status' | 'createdAt'>) => void;
  respondToCatchRequest: (
    requestId: string,
    status: Exclude<CatchStatus, 'pending' | 'expired'>,
  ) => void;
  publishOutingStatus: (status: OutingStatus) => void;
  removeOutingStatus: () => void;
  setLocationConsent: (value: LocationConsent) => void;
  setMapVisible: (value: boolean) => void;
  setApproximateLocation: (value: ApproximateLocation | undefined) => void;
  addNotification: (input: Omit<LocalNotification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationsRead: () => void;
  resetDemo: () => void;
};

const initialState = {
  city: 'Saint-Brieuc',
  isAuthenticated: false,
  hasAccepted18Plus: false,
  subscription: 'free' as SubscriptionTier,
  boosts: 0,
  invitationCredits: 0,
  likedProfileIds: [] as string[],
  passedProfileIds: [] as string[],
  blockedProfileIds: [] as string[],
  likeTimestamps: [] as number[],
  matches: [] as Match[],
  messages: [] as LocalMessage[],
  catchRequests: [] as CatchRequest[],
  notifications: [] as LocalNotification[],
  outingStatus: undefined as OutingStatus | undefined,
  locationConsent: 'unknown' as LocationConsent,
  mapVisible: false,
  approximateLocation: undefined as ApproximateLocation | undefined,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setCity: (city) => set({ city }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setAccepted18Plus: (hasAccepted18Plus) => set({ hasAccepted18Plus }),
      activatePremium: (lastPurchase) => set({ subscription: 'premium', lastPurchase }),
      addBoosts: (amount, lastPurchase) =>
        set((state) => ({ boosts: state.boosts + amount, lastPurchase })),
      addInvitationCredits: (amount, lastPurchase) =>
        set((state) => ({ invitationCredits: state.invitationCredits + amount, lastPurchase })),
      likeProfile: (profileId, willMatchOnLike) => {
        const state = get();
        const timestamps = activeTimestamps(state.likeTimestamps);
        if (state.subscription === 'free' && timestamps.length >= FREE_LIKE_LIMIT) {
          set({ likeTimestamps: timestamps });
          return { allowed: false, matched: false };
        }
        const alreadyLiked = state.likedProfileIds.includes(profileId);
        if (alreadyLiked)
          return {
            allowed: true,
            matched: state.matches.some((match) => match.profileId === profileId),
          };
        const matched =
          willMatchOnLike && !state.matches.some((match) => match.profileId === profileId);
        const match = matched
          ? { id: `match-${profileId}`, profileId, createdAt: now(), lastActivityAt: now() }
          : undefined;
        set((current) => ({
          likedProfileIds: [...current.likedProfileIds, profileId],
          likeTimestamps: [...timestamps, now()],
          matches: match ? [...current.matches, match] : current.matches,
          notifications: match
            ? [
                notification('match', 'Nouveau match', 'Une nouvelle rencontre commence ce soir.', {
                  matchId: match.id,
                  profileId,
                }),
                ...current.notifications,
              ]
            : current.notifications,
        }));
        return { allowed: true, matched };
      },
      passProfile: (profileId) =>
        set((state) => ({
          passedProfileIds: state.passedProfileIds.includes(profileId)
            ? state.passedProfileIds
            : [...state.passedProfileIds, profileId],
        })),
      blockProfile: (profileId) =>
        set((state) => ({
          blockedProfileIds: state.blockedProfileIds.includes(profileId)
            ? state.blockedProfileIds
            : [...state.blockedProfileIds, profileId],
          matches: state.matches.filter((match) => match.profileId !== profileId),
          catchRequests: state.catchRequests.filter(
            (request) => request.receiverProfileId !== profileId,
          ),
        })),
      isBlocked: (profileId) => get().blockedProfileIds.includes(profileId),
      likesRemaining: () => {
        const state = get();
        if (state.subscription === 'premium') return Infinity;
        return Math.max(0, FREE_LIKE_LIMIT - activeTimestamps(state.likeTimestamps).length);
      },
      addMessage: (matchId, sender, text) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: `message-${Date.now()}-${Math.random()}`,
              matchId,
              sender,
              text,
              createdAt: now(),
              read: sender === 'me',
            },
          ],
          matches: state.matches.map((match) =>
            match.id === matchId ? { ...match, lastActivityAt: now() } : match,
          ),
          notifications:
            sender === 'them'
              ? [
                  notification('message', 'Nouveau message', text, { matchId }),
                  ...state.notifications,
                ]
              : state.notifications,
        })),
      markMatchRead: (matchId) =>
        set((state) => ({
          messages: state.messages.map((message) =>
            message.matchId === matchId ? { ...message, read: true } : message,
          ),
        })),
      sendCatchRequest: (input) =>
        set((state) => {
          const request: CatchRequest = {
            ...input,
            id: `catch-${Date.now()}`,
            status: 'pending',
            createdAt: now(),
          };
          return {
            catchRequests: [request, ...state.catchRequests],
            notifications: [
              notification(
                'catch',
                'On se capte ce soir ?',
                'Ta demande a été envoyée. Tu seras informé de sa réponse.',
                { requestId: request.id },
              ),
              ...state.notifications,
            ],
          };
        }),
      respondToCatchRequest: (requestId, status) =>
        set((state) => {
          const request = state.catchRequests.find((item) => item.id === requestId);
          if (!request) return state;
          const message =
            status === 'accepted'
              ? 'a accepté de se capter ce soir.'
              : status === 'declined'
                ? 'ne peut pas ce soir.'
                : 'te propose une autre idée.';
          return {
            catchRequests: state.catchRequests.map((item) =>
              item.id === requestId ? { ...item, status, respondedAt: now() } : item,
            ),
            notifications: [
              notification('catch', 'Réponse à ta demande', `Alex ${message}`, {
                requestId,
                status,
              }),
              ...state.notifications,
            ],
          };
        }),
      publishOutingStatus: (outingStatus) => {
        set({ outingStatus });
        scheduleOutingCleanup(outingStatus.expiresAt);
      },
      removeOutingStatus: () => {
        if (outingExpiryTimer) clearTimeout(outingExpiryTimer);
        set({ outingStatus: undefined });
      },
      setLocationConsent: (locationConsent) => set({ locationConsent }),
      setMapVisible: (mapVisible) => set({ mapVisible }),
      setApproximateLocation: (approximateLocation) => set({ approximateLocation }),
      addNotification: (input) =>
        set((state) => ({
          notifications: [
            {
              ...input,
              id: `notification-${Date.now()}-${Math.random()}`,
              createdAt: now(),
              read: false,
            },
            ...state.notifications,
          ],
        })),
      markNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((item) => ({ ...item, read: true })),
        })),
      resetDemo: () => set(initialState),
    }),
    {
      name: 'tecap-demo-state-v2',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        const expiresAt = state?.outingStatus?.expiresAt;
        if (expiresAt !== undefined) scheduleOutingCleanup(expiresAt);
      },
    },
  ),
);
