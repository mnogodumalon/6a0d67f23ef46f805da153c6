// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Testererfassung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    kategorie?: LookupValue;
    bemerkungen?: string;
  };
}

export const APP_IDS = {
  TESTERERFASSUNG: '6a0d67e1b854d612476be8fe',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'testererfassung': {
    kategorie: [{ key: "option_a", label: "Option A" }, { key: "option_b", label: "Option B" }, { key: "option_c", label: "Option C" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'testererfassung': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'email': 'string/email',
    'telefon': 'string/tel',
    'geburtsdatum': 'date/date',
    'kategorie': 'lookup/select',
    'bemerkungen': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateTestererfassung = StripLookup<Testererfassung['fields']>;