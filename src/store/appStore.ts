import { create } from 'zustand';
import { Classe, Matiere, Chapitres, Lessons } from '@/types/classeTypes';
import * as api from '@/services/api';

interface AppState {
  // Données
  classes: Classe[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadClasses: (forceRefresh?: boolean) => Promise<void>;
  loadMatieres: (classeId: string) => Promise<void>;
  loadChapitres: (classeId: string, matiereId: string) => Promise<void>;
  loadLessons: (classeId: string, matiereId: string, chapitreId: string) => Promise<void>;
  
  // Mutations
  updateMatieres: (classeId: string, matieres: Matiere[]) => void;
  updateChapitres: (matiereId: string, chapitres: Chapitres[]) => void;
  updateLessons: (chapitreId: string, lessons: Lessons[]) => void;
  
  // Reset
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // État initial
  classes: [],
  isLoading: false,
  error: null,

  // Charger les classes
  loadClasses: async (forceRefresh = false) => {
    const { classes } = get();
    
    // Si déjà chargé et pas de refresh forcé, ne rien faire
    if (classes.length > 0 && !forceRefresh) {
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const data = await api.getClasses(forceRefresh);
      set({ classes: data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des classes';
      set({ error: message, isLoading: false });
      console.error('Erreur loadClasses:', error);
    }
  },

  // Charger les matières
  loadMatieres: async (classeId: string) => {
    const { classes } = get();
    const classe = classes.find(c => c.classeId === classeId);
    
    // Si déjà chargé, ne rien faire
    if (classe && classe.matieres.length > 0) {
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const matieres = await api.getMatieres(classeId);
      get().updateMatieres(classeId, matieres);
      set({ isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des matières';
      set({ error: message, isLoading: false });
      console.error('Erreur loadMatieres:', error);
    }
  },

  // Charger les chapitres
  loadChapitres: async (classeId: string, matiereId: string) => {
    const { classes } = get();
    const classe = classes.find(c => c.classeId === classeId);
    const matiere = classe?.matieres.find(m => m.matiereId === matiereId);
    
    // Si déjà chargé, ne rien faire
    if (matiere && matiere.chapitres.length > 0) {
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const chapitres = await api.getChapitres(classeId, matiereId);
      get().updateChapitres(matiereId, chapitres);
      set({ isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des chapitres';
      set({ error: message, isLoading: false });
      console.error('Erreur loadChapitres:', error);
    }
  },

  // Charger les leçons
  loadLessons: async (classeId: string, matiereId: string, chapitreId: string) => {
    const { classes } = get();
    const classe = classes.find(c => c.classeId === classeId);
    const matiere = classe?.matieres.find(m => m.matiereId === matiereId);
    const chapitre = matiere?.chapitres.find(c => c.chapitreId === chapitreId);
    
    // Si déjà chargé, ne rien faire
    if (chapitre && chapitre.lessons.length > 0) {
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const lessons = await api.getLessons(classeId, matiereId, chapitreId);
      get().updateLessons(chapitreId, lessons);
      set({ isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des leçons';
      set({ error: message, isLoading: false });
      console.error('Erreur loadLessons:', error);
    }
  },

  // Mettre à jour les matières
  updateMatieres: (classeId: string, matieres: Matiere[]) => {
    set((state) => ({
      classes: state.classes.map(classe =>
        classe.classeId === classeId
          ? { ...classe, matieres }
          : classe
      )
    }));
  },

  // Mettre à jour les chapitres
  updateChapitres: (matiereId: string, chapitres: Chapitres[]) => {
    set((state) => ({
      classes: state.classes.map(classe => ({
        ...classe,
        matieres: classe.matieres.map(matiere =>
          matiere.matiereId === matiereId
            ? { ...matiere, chapitres }
            : matiere
        )
      }))
    }));
  },

  // Mettre à jour les leçons
  updateLessons: (chapitreId: string, lessons: Lessons[]) => {
    set((state) => ({
      classes: state.classes.map(classe => ({
        ...classe,
        matieres: classe.matieres.map(matiere => ({
          ...matiere,
          chapitres: matiere.chapitres.map(chapitre =>
            chapitre.chapitreId === chapitreId
              ? { ...chapitre, lessons }
              : chapitre
          )
        }))
      }))
    }));
  },

  // Reset
  reset: () => {
    set({ classes: [], isLoading: false, error: null });
  },
}));