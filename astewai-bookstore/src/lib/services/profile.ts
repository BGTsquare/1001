import { Profile } from '../types/profile';

const profiles: Profile[] = [];

export const ProfileService = {
  getProfile: (id: string): Profile | undefined => {
    return profiles.find((profile) => profile.id === id);
  },
  updateProfile: (id: string, data: Partial<Profile>): Profile | undefined => {
    const profile = profiles.find((p) => p.id === id);
    if (profile) {
      Object.assign(profile, data);
      return profile;
    }
    return undefined;
  },
  createProfile: (data: Profile): Profile => {
    profiles.push(data);
    return data;
  },
};
