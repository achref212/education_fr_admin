import { AppPreviewStep } from '../models/app-preview-step.model';

export const APP_PREVIEW_STEPS: AppPreviewStep[] = [
  {
    id: 'delf-intro',
    order: 1,
    title: 'Test DELF — Introduction',
    subtitle: 'Évaluation initiale',
    description:
      'Après la connexion, l\'élève découvre le test de positionnement DELF qui détermine son niveau (A1 à B2) selon sa classe.',
    icon: 'assignment',
    screenKey: 'delfIntro',
    bottomNavIndex: null,
    highlights: ['Badge objectif DELF', 'Explication du test', 'Bouton « Commencer le test »'],
  },
  {
    id: 'delf-question',
    order: 2,
    title: 'Test DELF — Question',
    subtitle: 'Section Grammaire',
    description:
      'L\'élève répond aux questions par catégorie (Grammaire, Conjugaison, Orthographe, etc.) avec une barre de progression.',
    icon: 'quiz',
    screenKey: 'delfQuestion',
    bottomNavIndex: null,
    highlights: ['Barre de progression 1/6', 'Question à choix multiples', 'Pilule catégorie'],
  },
  {
    id: 'delf-result',
    order: 3,
    title: 'Test DELF — Résultat',
    subtitle: 'Niveau obtenu',
    description:
      'À la fin du test, l\'élève voit son niveau DELF atteint, les scores par catégorie et peut continuer vers l\'accueil.',
    icon: 'emoji_events',
    screenKey: 'delfResult',
    bottomNavIndex: null,
    highlights: ['Niveau A2 obtenu', 'Scores par catégorie', 'Comparaison à l\'objectif'],
  },
  {
    id: 'home',
    order: 4,
    title: 'Accueil',
    subtitle: 'Tableau de bord élève',
    description:
      'L\'écran principal après le test : objectif du jour, catégories d\'apprentissage, activités et progression DELF.',
    icon: 'home',
    screenKey: 'home',
    bottomNavIndex: 0,
    homeVariant: 'initial',
    highlights: ['Objectif du jour', 'Grille Apprentissage (6 catégories)', 'Activités & Mon Parcours'],
  },
  {
    id: 'learn-category',
    order: 5,
    title: 'Apprentissage — Catégorie',
    subtitle: 'Grammaire',
    description:
      'En tapant une catégorie depuis l\'accueil, l\'élève accède à la liste des leçons avec états verrouillé/débloqué.',
    icon: 'menu_book',
    screenKey: 'learnCategory',
    bottomNavIndex: 0,
    highlights: ['Liste de leçons', 'Progression par leçon', 'États verrouillé / débloqué'],
  },
  {
    id: 'learn-lesson',
    order: 6,
    title: 'Apprentissage — Leçon',
    subtitle: 'Contenu pédagogique',
    description:
      'L\'élève consulte le contenu de la leçon et peut la marquer comme terminée pour avancer dans son parcours.',
    icon: 'auto_stories',
    screenKey: 'learnLesson',
    bottomNavIndex: 0,
    highlights: ['Titre et contenu', 'Extrait pédagogique', 'Bouton « Marquer comme terminé »'],
  },
  {
    id: 'multiplayer',
    order: 7,
    title: 'Multijoueur',
    subtitle: 'Défis entre élèves',
    description:
      'Depuis l\'accueil, l\'élève peut rejoindre ou créer une salle multijoueur pour défier d\'autres apprenants.',
    icon: 'groups',
    screenKey: 'multiplayer',
    bottomNavIndex: 0,
    highlights: ['Code de salle', 'Salles actives', 'Rejoindre / Créer une salle'],
  },
  {
    id: 'home-return',
    order: 8,
    title: 'Accueil (retour)',
    subtitle: 'Progression mise à jour',
    description:
      'Retour à l\'accueil après une activité : la série et la progression reflètent l\'avancement de l\'élève.',
    icon: 'home',
    screenKey: 'home',
    bottomNavIndex: 0,
    homeVariant: 'return',
    highlights: ['Série augmentée', 'Progression DELF actualisée', 'Objectif du jour mis à jour'],
  },
  {
    id: 'profile',
    order: 9,
    title: 'Profil',
    subtitle: 'Compte élève',
    description:
      'Via la barre de navigation, l\'élève consulte ses informations, change son thème et se déconnecte.',
    icon: 'person',
    screenKey: 'profile',
    bottomNavIndex: 2,
    highlights: ['Avatar et niveau', 'Informations personnelles', 'Thème et déconnexion'],
  },
];
