export type DelfTrack = 'Prime' | 'Junior';

export type DelfLevelGroup = {
  track: DelfTrack;
  label: string;
  levels: string[];
};

export const DELF_LEVELS: string[] = ['A1.1', 'A1', 'A2', 'B1', 'B2'];

export const DELF_LEVEL_GROUPS: DelfLevelGroup[] = [
  { track: 'Prime', label: 'DELF Prime · 2ème à 6ème', levels: ['A1.1', 'A1', 'A2'] },
  { track: 'Junior', label: 'DELF Junior · 7ème à 9ème', levels: ['A1', 'A2', 'B1', 'B2'] },
];

export const DELF_DEFAULT_THRESHOLDS = [
  { level: 'B2', minOverall: 90, minCategory: 85 },
  { level: 'B1', minOverall: 80, minCategory: 70 },
  { level: 'A2', minOverall: 65, minCategory: 55 },
  { level: 'A1', minOverall: 50, minCategory: 40 },
  { level: 'A1.1', minOverall: 35, minCategory: 25 },
];

export const DELF_TARGETS_BY_CLASS: Record<string, string> = {
  '2ème année': 'A1.1',
  '3ème année': 'A1',
  '4ème année': 'A1',
  '5ème année': 'A2',
  '6ème année': 'A2',
  '7ème année': 'A1',
  '8ème année': 'A2',
  '9ème année': 'B1',
};

export const DELF_TRACKS_BY_CLASS: Record<string, DelfTrack> = {
  '2ème année': 'Prime',
  '3ème année': 'Prime',
  '4ème année': 'Prime',
  '5ème année': 'Prime',
  '6ème année': 'Prime',
  '7ème année': 'Junior',
  '8ème année': 'Junior',
  '9ème année': 'Junior',
};

export function resolveDelfTarget(classLevel: string | null | undefined): string {
  if (!classLevel) return '—';
  return DELF_TARGETS_BY_CLASS[classLevel] ?? '—';
}

export function resolveDelfTrack(classLevel: string | null | undefined): DelfTrack | null {
  if (!classLevel) return null;
  return DELF_TRACKS_BY_CLASS[classLevel] ?? null;
}

export function resolveDelfGroupLabel(classLevel: string | null | undefined): string {
  const track = resolveDelfTrack(classLevel);
  if (!track) return 'DELF Prime ou Junior';
  return track === 'Prime' ? 'DELF Prime · 2ème à 6ème' : 'DELF Junior · 7ème à 9ème';
}

export function delfGroupsForClass(classLevel: string | null | undefined): DelfLevelGroup[] {
  const track = resolveDelfTrack(classLevel);
  if (!track) return DELF_LEVEL_GROUPS;
  return DELF_LEVEL_GROUPS.filter((group) => group.track === track);
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
};

export const STEP_STATUS_LABELS: Record<string, string> = {
  locked: 'Verrouillé',
  available: 'Disponible',
  in_progress: 'En cours',
  completed: 'Terminé',
};
