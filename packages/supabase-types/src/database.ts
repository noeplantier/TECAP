export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type ProfileRow = {
  id: string;
  first_name: string;
  birth_date: string;
  city: string;
  bio: string;
  avatar_path: string | null;
  role: 'user' | 'admin' | 'partner' | 'staff';
  is_18_plus_verified: boolean;
  created_at: string;
};
type EveningStatusRow = {
  id: string;
  user_id: string;
  city: string;
  status_type: string;
  venue: string | null;
  expires_at: string;
  created_at: string;
};
type TableContract<
  Row extends object,
  Insert extends object = Omit<Row, 'id' | 'created_at'> & { id?: string; created_at?: string },
> = { Row: Row; Insert: Insert; Update: Partial<Insert>; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: TableContract<ProfileRow, Omit<ProfileRow, 'created_at'> & { created_at?: string }>;
      preinscriptions: TableContract<
        {
          id: string;
          public_id: string;
          first_name: string;
          age: number;
          email: string;
          phone: string | null;
          city: string;
          referral_code: string | null;
          source: string | null;
          status: string;
          created_at: string;
        },
        {
          first_name: string;
          age: number;
          email: string;
          phone?: string | null;
          city: string;
          referral_code?: string | null;
          source?: string | null;
          status?: string;
          id?: string;
          public_id?: string;
          created_at?: string;
        }
      >;
      evening_statuses: TableContract<
        EveningStatusRow,
        Omit<EveningStatusRow, 'id' | 'created_at'> & { id?: string; created_at?: string }
      >;
      events: TableContract<
        {
          id: string;
          name: string;
          city: string;
          venue: string;
          starts_at: string;
          ends_at: string;
          created_at: string;
        },
        {
          name: string;
          city: string;
          venue: string;
          starts_at: string;
          ends_at: string;
          id?: string;
          created_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      validate_pass: { Args: { pass_id: string; scan_source?: string }; Returns: Json };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
