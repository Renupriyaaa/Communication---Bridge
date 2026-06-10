export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      coffee_chats: {
        Row: {
          created_at: string;
          duration_minutes: number;
          id: string;
          message: string | null;
          proposed_time: string | null;
          purpose: Database["public"]["Enums"]["coffee_purpose"];
          recipient_id: string;
          requester_id: string;
          status: Database["public"]["Enums"]["coffee_chat_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          duration_minutes: number;
          id?: string;
          message?: string | null;
          proposed_time?: string | null;
          purpose: Database["public"]["Enums"]["coffee_purpose"];
          recipient_id: string;
          requester_id: string;
          status?: Database["public"]["Enums"]["coffee_chat_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          message?: string | null;
          proposed_time?: string | null;
          purpose?: Database["public"]["Enums"]["coffee_purpose"];
          recipient_id?: string;
          requester_id?: string;
          status?: Database["public"]["Enums"]["coffee_chat_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      connections: {
        Row: {
          addressee_id: string;
          created_at: string;
          id: string;
          message: string | null;
          requester_id: string;
          status: Database["public"]["Enums"]["connection_status"];
          updated_at: string;
        };
        Insert: {
          addressee_id: string;
          created_at?: string;
          id?: string;
          message?: string | null;
          requester_id: string;
          status?: Database["public"]["Enums"]["connection_status"];
          updated_at?: string;
        };
        Update: {
          addressee_id?: string;
          created_at?: string;
          id?: string;
          message?: string | null;
          requester_id?: string;
          status?: Database["public"]["Enums"]["connection_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          read_at: string | null;
          recipient_id: string;
          sender_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          recipient_id: string;
          sender_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          recipient_id?: string;
          sender_id?: string;
        };
        Relationships: [];
      };
      opportunities: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          link: string | null;
          location: string | null;
          poster_id: string;
          tags: string[];
          title: string;
          type: Database["public"]["Enums"]["opportunity_type"];
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          link?: string | null;
          location?: string | null;
          poster_id: string;
          tags?: string[];
          title: string;
          type?: Database["public"]["Enums"]["opportunity_type"];
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          link?: string | null;
          location?: string | null;
          poster_id?: string;
          tags?: string[];
          title?: string;
          type?: Database["public"]["Enums"]["opportunity_type"];
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string;
          career_goals: string;
          company: string;
          created_at: string;
          id: string;
          industry: string;
          interests: string[];
          location: string;
          name: string;
          offering_skills: string[];
          onboarded: boolean;
          role: string;
          seeking_skills: string[];
          skills: string[];
          status: Database["public"]["Enums"]["networking_status"];
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string;
          career_goals?: string;
          company?: string;
          created_at?: string;
          id: string;
          industry?: string;
          interests?: string[];
          location?: string;
          name?: string;
          offering_skills?: string[];
          onboarded?: boolean;
          role?: string;
          seeking_skills?: string[];
          skills?: string[];
          status?: Database["public"]["Enums"]["networking_status"];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string;
          career_goals?: string;
          company?: string;
          created_at?: string;
          id?: string;
          industry?: string;
          interests?: string[];
          location?: string;
          name?: string;
          offering_skills?: string[];
          onboarded?: boolean;
          role?: string;
          seeking_skills?: string[];
          skills?: string[];
          status?: Database["public"]["Enums"]["networking_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      project_applications: {
        Row: {
          applicant_id: string;
          created_at: string;
          id: string;
          pitch: string | null;
          project_id: string;
        };
        Insert: {
          applicant_id: string;
          created_at?: string;
          id?: string;
          pitch?: string | null;
          project_id: string;
        };
        Update: {
          applicant_id?: string;
          created_at?: string;
          id?: string;
          pitch?: string | null;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_applications_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          is_open: boolean;
          looking_for: string[];
          owner_id: string;
          tags: string[];
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          is_open?: boolean;
          looking_for?: string[];
          owner_id: string;
          tags?: string[];
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          is_open?: boolean;
          looking_for?: string[];
          owner_id?: string;
          tags?: string[];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      are_connected: { Args: { a: string; b: string }; Returns: boolean };
    };
    Enums: {
      coffee_chat_status: "pending" | "accepted" | "declined" | "completed" | "cancelled";
      coffee_purpose:
        | "mentorship"
        | "career_guidance"
        | "startup_discussion"
        | "collaboration"
        | "networking";
      connection_status: "pending" | "accepted" | "rejected";
      networking_status:
        | "open_to_networking"
        | "open_to_mentorship"
        | "looking_for_collaborators"
        | "busy"
        | "not_accepting";
      opportunity_type:
        | "internship"
        | "hackathon"
        | "competition"
        | "freelance"
        | "startup_role"
        | "other";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      coffee_chat_status: ["pending", "accepted", "declined", "completed", "cancelled"],
      coffee_purpose: [
        "mentorship",
        "career_guidance",
        "startup_discussion",
        "collaboration",
        "networking",
      ],
      connection_status: ["pending", "accepted", "rejected"],
      networking_status: [
        "open_to_networking",
        "open_to_mentorship",
        "looking_for_collaborators",
        "busy",
        "not_accepting",
      ],
      opportunity_type: [
        "internship",
        "hackathon",
        "competition",
        "freelance",
        "startup_role",
        "other",
      ],
    },
  },
} as const;
