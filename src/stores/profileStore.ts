import { create } from 'zustand'

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_gradient: string | null;
  time_zone?: string | null;
  linkedin_profile_url?: string | null;
  linkedin_headline?: string | null;
  linkedin_company?: string | null;
  linkedin_id?: string | null;
} | null;

type State = {
  profile: Profile;        // confirmed (matches current session)
  lastNonNull: Profile;    // last confirmed
  provisional: Profile;    // last-known before session resolves
  setProfile: (p: Profile) => void;
  setProvisional: (p: Profile | null) => void;
  clearOnSignOut: () => void;
};

export const useProfileStore = create<State>((set) => ({
  profile: null,
  lastNonNull: null,
  provisional: null,
  setProfile: (p) => set((s) => ({
    profile: p,
    lastNonNull: p ?? s.lastNonNull,
    provisional: p ?? s.provisional,
  })),
  setProvisional: (p) => set({ provisional: p }),
  clearOnSignOut: () => set({ profile: null, lastNonNull: null, provisional: null }),
}));


