// src/data/dataLoader.ts

// Importation directe des fichiers JSON (seront bundlés par Vite)
import classesData from './classes.json?url';
import actuData from './actu.json?url';
import contactData from './contact.json?url';
import adsData from './ads.json?url';
import interstitialAdsData from './interstitial_ads.json?url';

// Type pour les chemins de fichiers
type DataPath = string;

// Fonction pour charger un fichier JSON local
async function loadLocalJSON<T>(path: string): Promise<T> {
  try {
    // Utiliser fetch pour charger le fichier depuis le dossier public
    // ou directement importer si c'est un module
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${path}:`, error);
    throw error;
  }
}

// Fonction pour charger un fichier HTML local
async function loadLocalHTML(path: string): Promise<string> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error loading ${path}:`, error);
    throw error;
  }
}

// ============================================
// FONCTIONS DE CHARGEMENT DES DONNÉES
// ============================================

export async function getClassesLocal(): Promise<any[]> {
  return loadLocalJSON<any[]>('/data/classes.json');
}

export async function getMatieresLocal(classeId: string): Promise<any[]> {
  return loadLocalJSON<any[]>(`/data/${classeId}/matieres.json`);
}

export async function getChapitresLocal(classeId: string, matiereId: string): Promise<any[]> {
  return loadLocalJSON<any[]>(`/data/${classeId}/${matiereId}/chapitres.json`);
}

export async function getLessonsLocal(classeId: string, matiereId: string, chapitreId: string): Promise<any[]> {
  return loadLocalJSON<any[]>(`/data/${classeId}/${matiereId}/${chapitreId}/lessons.json`);
}

export async function getQuestionsLocal(
  classeId: string,
  matiereId: string,
  chapitreId: string,
  lessonId: string
): Promise<any[]> {
  return loadLocalJSON<any[]>(`/data/${classeId}/${matiereId}/${chapitreId}/qcm/${lessonId}.json`);
}

export async function getExercicesLocal(
  classeId: string,
  matiereId: string,
  chapitreId: string,
  lessonId: string
): Promise<any[]> {
  return loadLocalJSON<any[]>(`/data/${classeId}/${matiereId}/${chapitreId}/exercice/${lessonId}.json`);
}

export async function getCoursVideoLocal(
  classeId: string,
  matiereId: string,
  chapitreId: string,
  lessonId: string
): Promise<any[]> {
  return loadLocalJSON<any[]>(`/data/${classeId}/${matiereId}/${chapitreId}/cours_video/${lessonId}.json`);
}

export async function getExerciceVideoLocal(
  classeId: string,
  matiereId: string,
  chapitreId: string,
  lessonId: string
): Promise<any[]> {
  return loadLocalJSON<any[]>(`/data/${classeId}/${matiereId}/${chapitreId}/exercices_video/${lessonId}.json`);
}

export async function getEpreuvesLocal(classeId: string, matiereId: string): Promise<any[]> {
  return loadLocalJSON<any[]>(`/data/${classeId}/${matiereId}/epreuves.json`);
}

export async function getActuLocal(): Promise<any[]> {
  return loadLocalJSON<any[]>('/data/actu.json');
}

export async function getContactLocal(): Promise<any> {
  return loadLocalJSON<any>('/data/contact.json');
}

export async function getCustomAdsLocal(): Promise<any[]> {
  return loadLocalJSON<any[]>('/data/ads.json');
}

export async function getCustomInterstitialAdsLocal(): Promise<any[]> {
  return loadLocalJSON<any[]>('/data/interstitial_ads.json');
}

export async function getCoursDocHTML(
  classeId: string,
  matiereId: string,
  chapitreId: string,
  lessonId: string
): Promise<string> {
  return loadLocalHTML(`/data/${classeId}/${matiereId}/${chapitreId}/cours/${lessonId}.html`);
}

export async function getEpreuveHTML(
  classeId: string,
  matiereId: string,
  epreuveId: string
): Promise<string> {
  return loadLocalHTML(`/data/${classeId}/${matiereId}/epreuves/${epreuveId}.html`);
}