// Hand-written to match supabase/migrations/0001_init.sql and 0002_storage.sql.
// Regenerate with `supabase gen types typescript --linked` once the project
// is linked, and diff against this file rather than blindly overwriting it.

export type ProposalStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "signed"
  | "paid"
  | "void"
  | "expired";

export type PaymentType = "full" | "deposit" | "custom";
export type SignatureType = "typed" | "drawn";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type ProposalEventType =
  | "created"
  | "sent"
  | "viewed"
  | "signed"
  | "paid"
  | "voided"
  | "resent"
  | "duplicated"
  | "expired";

export type SectionKey =
  | "cover"
  | "executive_summary"
  | "challenges"
  | "solution"
  | "why_us"
  | "scope"
  | "team"
  | "investment"
  | "agreement";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          contact_address: string | null;
          scheduling_link: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["organizations"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["organizations"]["Row"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          org_id: string;
          full_name: string | null;
          email: string | null;
          role: "owner" | "member";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          org_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          role: string | null;
          description: string | null;
          photo_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["team_members"]["Row"]> & {
          org_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["team_members"]["Row"]>;
        Relationships: [];
      };
      proposals: {
        Row: {
          id: string;
          org_id: string;
          created_by: string | null;
          public_token: string;
          status: ProposalStatus;
          client_company: string;
          client_contact_name: string | null;
          client_email: string | null;
          eyebrow_text: string;
          headline: string | null;
          subhead: string | null;
          proposal_date: string;
          valid_for_days: number;
          currency: string;
          amount_due_cents: number;
          payment_type: PaymentType;
          brief_description: string;
          sent_at: string | null;
          first_viewed_at: string | null;
          signed_at: string | null;
          paid_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["proposals"]["Row"]> & {
          org_id: string;
          public_token: string;
          client_company: string;
          brief_description: string;
        };
        Update: Partial<Database["public"]["Tables"]["proposals"]["Row"]>;
        Relationships: [];
      };
      proposal_content: {
        Row: {
          id: string;
          proposal_id: string;
          section_key: SectionKey;
          sort_order: number;
          content: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["proposal_content"]["Row"]> & {
          proposal_id: string;
          section_key: SectionKey;
          sort_order: number;
        };
        Update: Partial<Database["public"]["Tables"]["proposal_content"]["Row"]>;
        Relationships: [];
      };
      pricing_line_items: {
        Row: {
          id: string;
          proposal_id: string;
          sort_order: number;
          item_name: string;
          description: string | null;
          amount_cents: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pricing_line_items"]["Row"]> & {
          proposal_id: string;
          item_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["pricing_line_items"]["Row"]>;
        Relationships: [];
      };
      proposal_team_members: {
        Row: {
          id: string;
          proposal_id: string;
          name: string;
          role: string | null;
          description: string | null;
          photo_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["proposal_team_members"]["Row"]> & {
          proposal_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["proposal_team_members"]["Row"]>;
        Relationships: [];
      };
      signatures: {
        Row: {
          id: string;
          proposal_id: string;
          signer_name: string;
          signer_email: string | null;
          signature_type: SignatureType;
          signature_data: string;
          signed_at: string;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["signatures"]["Row"]> & {
          proposal_id: string;
          signer_name: string;
          signature_type: SignatureType;
          signature_data: string;
        };
        Update: Partial<Database["public"]["Tables"]["signatures"]["Row"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          proposal_id: string;
          stripe_checkout_session_id: string;
          stripe_payment_intent_id: string | null;
          amount_cents: number;
          currency: string;
          status: PaymentStatus;
          paid_at: string | null;
          raw_event: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> & {
          proposal_id: string;
          stripe_checkout_session_id: string;
          amount_cents: number;
          currency: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
        Relationships: [];
      };
      proposal_events: {
        Row: {
          id: string;
          proposal_id: string;
          event_type: ProposalEventType;
          metadata: Record<string, unknown> | null;
          occurred_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["proposal_events"]["Row"]> & {
          proposal_id: string;
          event_type: ProposalEventType;
        };
        Update: Partial<Database["public"]["Tables"]["proposal_events"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
