export interface PhoneCode {
  dialCode: string;
  country: string;
  flag: string;
}

export const PHONE_CODES: PhoneCode[] = [
  // ── Most common for this platform ──────────────────────────────────
  { dialCode: '+216', country: 'Tunisie',              flag: '🇹🇳' },
  { dialCode: '+33',  country: 'France',               flag: '🇫🇷' },
  { dialCode: '+213', country: 'Algérie',              flag: '🇩🇿' },
  { dialCode: '+212', country: 'Maroc',                flag: '🇲🇦' },
  { dialCode: '+32',  country: 'Belgique',             flag: '🇧🇪' },
  { dialCode: '+41',  country: 'Suisse',               flag: '🇨🇭' },
  { dialCode: '+352', country: 'Luxembourg',           flag: '🇱🇺' },
  // ── Europe ─────────────────────────────────────────────────────────
  { dialCode: '+44',  country: 'Royaume-Uni',          flag: '🇬🇧' },
  { dialCode: '+49',  country: 'Allemagne',            flag: '🇩🇪' },
  { dialCode: '+34',  country: 'Espagne',              flag: '🇪🇸' },
  { dialCode: '+39',  country: 'Italie',               flag: '🇮🇹' },
  { dialCode: '+31',  country: 'Pays-Bas',             flag: '🇳🇱' },
  { dialCode: '+351', country: 'Portugal',             flag: '🇵🇹' },
  { dialCode: '+30',  country: 'Grèce',                flag: '🇬🇷' },
  { dialCode: '+43',  country: 'Autriche',             flag: '🇦🇹' },
  { dialCode: '+46',  country: 'Suède',                flag: '🇸🇪' },
  { dialCode: '+47',  country: 'Norvège',              flag: '🇳🇴' },
  { dialCode: '+45',  country: 'Danemark',             flag: '🇩🇰' },
  { dialCode: '+358', country: 'Finlande',             flag: '🇫🇮' },
  { dialCode: '+48',  country: 'Pologne',              flag: '🇵🇱' },
  // ── Afrique ────────────────────────────────────────────────────────
  { dialCode: '+218', country: 'Libye',                flag: '🇱🇾' },
  { dialCode: '+20',  country: 'Égypte',               flag: '🇪🇬' },
  { dialCode: '+221', country: 'Sénégal',              flag: '🇸🇳' },
  { dialCode: '+225', country: "Côte d'Ivoire",        flag: '🇨🇮' },
  { dialCode: '+237', country: 'Cameroun',             flag: '🇨🇲' },
  { dialCode: '+243', country: 'Congo (RDC)',           flag: '🇨🇩' },
  { dialCode: '+234', country: 'Nigéria',              flag: '🇳🇬' },
  // ── Moyen-Orient ───────────────────────────────────────────────────
  { dialCode: '+966', country: 'Arabie Saoudite',      flag: '🇸🇦' },
  { dialCode: '+971', country: 'Émirats Arabes Unis',  flag: '🇦🇪' },
  { dialCode: '+974', country: 'Qatar',                flag: '🇶🇦' },
  { dialCode: '+965', country: 'Koweït',               flag: '🇰🇼' },
  { dialCode: '+962', country: 'Jordanie',             flag: '🇯🇴' },
  { dialCode: '+961', country: 'Liban',                flag: '🇱🇧' },
  // ── Amériques ──────────────────────────────────────────────────────
  { dialCode: '+1',   country: 'États-Unis / Canada',  flag: '🇺🇸' },
  { dialCode: '+55',  country: 'Brésil',               flag: '🇧🇷' },
  { dialCode: '+52',  country: 'Mexique',              flag: '🇲🇽' },
  // ── Asie / Océanie ─────────────────────────────────────────────────
  { dialCode: '+86',  country: 'Chine',                flag: '🇨🇳' },
  { dialCode: '+81',  country: 'Japon',                flag: '🇯🇵' },
  { dialCode: '+82',  country: 'Corée du Sud',         flag: '🇰🇷' },
  { dialCode: '+91',  country: 'Inde',                 flag: '🇮🇳' },
  { dialCode: '+61',  country: 'Australie',            flag: '🇦🇺' },
];

/**
 * Split a stored phone string (e.g. "+216 12 345 678") into { dialCode, number }.
 * Falls back to '+216' if no known code matches.
 */
export function parsePhone(phone: string): { dialCode: string; number: string } {
  const clean = phone.trim();
  const sorted = [...PHONE_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const pc of sorted) {
    if (clean.startsWith(pc.dialCode)) {
      return { dialCode: pc.dialCode, number: clean.slice(pc.dialCode.length).trim() };
    }
  }
  return { dialCode: '+216', number: clean };
}
