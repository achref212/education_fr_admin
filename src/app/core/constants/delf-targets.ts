export const DELF_LEVELS: string[] = ['A1', 'A1+', 'A2', 'A2/B1', 'B1'];

export const DELF_TARGETS_BY_CLASS: Record<string, string> = {
  '2ème année': 'A1',
  '3ème année': 'A1',
  '4ème année': 'A1',
  '5ème année': 'A1+',
  '6ème année': 'A1+',
  '7ème année': 'A2',
  '8ème année': 'A2',
  '9ème année': 'A2/B1',
};

export function resolveDelfTarget(classLevel: string | null | undefined): string {
  if (!classLevel) return '—';
  return DELF_TARGETS_BY_CLASS[classLevel] ?? '—';
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
