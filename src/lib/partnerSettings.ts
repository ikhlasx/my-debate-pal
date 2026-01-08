const STORAGE_KEY = 'partner-settings';

export interface PartnerSettings {
  partner1Name: string;
  partner2Name: string;
}

const DEFAULT_SETTINGS: PartnerSettings = {
  partner1Name: 'Husband',
  partner2Name: 'Wife',
};

export const getPartnerSettings = (): PartnerSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load partner settings:', e);
  }
  return DEFAULT_SETTINGS;
};

export const savePartnerSettings = (settings: PartnerSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save partner settings:', e);
  }
};

export const getPartnerName = (partner: 'husband' | 'wife'): string => {
  const settings = getPartnerSettings();
  return partner === 'husband' ? settings.partner1Name : settings.partner2Name;
};

