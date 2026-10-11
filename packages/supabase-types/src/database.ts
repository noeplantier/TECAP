export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'user' | 'admin' | 'partner' | 'staff';
export type LeadStatus =
  'PREINSCRIT' | 'COMPTE_CRÉÉ' | 'INSCRIT TÉCAP NIGHT' | 'PASS GÉNÉRÉ' | 'PASS UTILISÉ';
export type PassState = 'generated' | 'used' | 'invalid';
export type CatchStatus = 'pending' | 'accepted' | 'declined' | 'alternative' | 'expired';

export type TableContract<Row extends object, Insert extends object = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: Array<{
    foreignKeyName: string;
    columns: string[];
    isOneToOne: boolean;
    referencedRelation: string;
    referencedColumns: string[];
  }>;
};

type Base = { id: string; created_at: string };
type Profile = Base & {
  first_name: string;
  birth_date: string;
  city: string;
  bio: string;
  avatar_path: string | null;
  role: UserRole;
  is_18_plus_verified: boolean;
  consent_terms_at: string | null;
  consent_notifications_at: string | null;
  consent_sms_at: string | null;
  updated_at: string;
};
type Preinscription = Base & {
  public_id: string | null;
  row_number: number;
  first_name: string;
  age: number;
  email: string;
  phone: string | null;
  city: string;
  referral_code: string | null;
  source: string | null;
  status: LeadStatus;
};
type Event = Base & {
  name: string;
  city: string;
  venue: string;
  starts_at: string;
  ends_at: string;
  cover_path: string | null;
  is_published: boolean;
};
type EventParticipant = {
  event_id: string;
  user_id: string;
  bracelet_choice: string | null;
  joined_at: string;
};
type EveningStatus = Base & {
  user_id: string;
  city: string;
  status_type: string;
  venue: string | null;
  expires_at: string;
};
type Pass = Base & {
  event_id: string;
  user_id: string;
  offer: string;
  qr_token_hash: string;
  state: PassState;
  generated_at: string;
  used_at: string | null;
};
type PassScan = Base & {
  pass_id: string;
  scanned_by: string;
  scan_source: string;
  outcome: string;
};
type Swipe = { actor_id: string; target_id: string; direction: string; created_at: string };
type Match = Base & { user_a: string; user_b: string };
type Message = Base & { match_id: string; sender_id: string; body: string };
type AuditLog = Base & {
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Json;
};
type Conversation = Base & { match_id: string; updated_at: string };
type CatchRequest = Base & {
  match_id: string | null;
  sender_id: string;
  receiver_id: string;
  intent: string;
  venue_optional: string | null;
  time_option: string | null;
  message_optional: string | null;
  status: CatchStatus;
  alternative_message_optional: string | null;
  expires_at: string;
  responded_at: string | null;
};
type Notification = Base & {
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Json;
  read_at: string | null;
};
type LikesUsage = {
  user_id: string;
  window_started_at: string;
  likes_used: number;
  updated_at: string;
};
type Purchase = Base & {
  user_id: string;
  product_id: string;
  purchase_type: string;
  store_transaction_id: string | null;
  status: string;
  started_at: string;
  expires_at: string | null;
  remaining_uses: number | null;
};
type Boost = Base & { user_id: string; starts_at: string; ends_at: string; status: string };
type Report = Base & {
  reporter_id: string;
  reported_user_id: string | null;
  message_id: string | null;
  reason: string;
  details: string | null;
  status: string;
};
type Block = { blocker_id: string; blocked_id: string; created_at: string };

type InsertOf<Row extends object> = Partial<Row> & Omit<Row, 'id' | 'created_at'>;

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.5' };
  public: {
    Tables: {
      profiles: TableContract<
        Profile,
        Omit<Profile, 'created_at' | 'updated_at'> & {
          id: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      preinscriptions: TableContract<Preinscription, InsertOf<Preinscription>>;
      events: TableContract<Event, InsertOf<Event>>;
      event_participants: TableContract<EventParticipant, EventParticipant>;
      evening_statuses: TableContract<EveningStatus, InsertOf<EveningStatus>>;
      passes: TableContract<Pass, InsertOf<Pass>>;
      pass_scans: TableContract<PassScan, InsertOf<PassScan>>;
      swipes: TableContract<Swipe, Swipe>;
      matches: TableContract<Match, InsertOf<Match>>;
      messages: TableContract<Message, InsertOf<Message>>;
      admin_audit_log: TableContract<AuditLog, InsertOf<AuditLog>>;
      conversations: TableContract<Conversation, InsertOf<Conversation>>;
      catch_tonight_requests: TableContract<CatchRequest, InsertOf<CatchRequest>>;
      notifications: TableContract<Notification, InsertOf<Notification>>;
      likes_usage: TableContract<LikesUsage, LikesUsage>;
      purchases: TableContract<Purchase, InsertOf<Purchase>>;
      boosts: TableContract<Boost, InsertOf<Boost>>;
      reports: TableContract<Report, InsertOf<Report>>;
      blocks: TableContract<Block, Block>;
    };
    Views: Record<string, never>;
    Functions: {
      validate_pass: { Args: { pass_id: string; scan_source?: string }; Returns: Json };
      record_swipe: { Args: { target_id: string; direction: string }; Returns: Json };
      expire_evening_statuses: { Args: Record<string, never>; Returns: number };
      is_staff_or_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: { user_role: UserRole; lead_status: LeadStatus; pass_state: PassState };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<Name extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][Name]['Row'];
export type TablesInsert<Name extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][Name]['Insert'];
export type TablesUpdate<Name extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][Name]['Update'];
