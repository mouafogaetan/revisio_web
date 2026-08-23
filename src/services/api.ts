import axios from 'axios';
import { 
    Classe, 
    Matiere, 
    Chapitres, 
    Lessons, 
    Questions, 
    Quiz, 
    Exercice, 
    CoursVideo, 
    ExerciceVideo,
    Actu,
    Contact,
    Epreuve
} from '@/types/classeTypes';
import { API_URL } from '@/constants';

// Configuration de base d'Axios
const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    }
});

// Intercepteur pour ajouter un timestamp à chaque requête
api.interceptors.request.use((config) => {
    const separator = config.url?.includes('?') ? '&' : '?';
    config.url = `${config.url}${separator}_=${Date.now()}`;
    return config;
});

// Fonction utilitaire pour parser les réponses JSON
async function parseJsonResponse<T>(response: any, url: string): Promise<T> {
    const data = response.data;
    
    if (typeof data === 'string') {
        // Nettoyer le texte : enlever le BOM et autres caractères invisibles
        let cleanedText = data;
        if (cleanedText.charCodeAt(0) === 0xFEFF) {
            cleanedText = cleanedText.slice(1);
        }
        cleanedText = cleanedText.replace(/^[\u0000-\u001F\u007F-\u009F]+/, '');
        
        try {
            return JSON.parse(cleanedText) as T;
        } catch (parseError) {
            console.error(`Erreur de parsing JSON pour ${url}:`, parseError);
            throw new Error(`Impossible de parser JSON pour ${url}`);
        }
    }
    
    return data as T;
}

// ============================================
// INTERFACES POUR LES ANNONCES PERSONNALISÉES
// ============================================

export interface CustomAd {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
    backgroundColor?: string;
    textColor?: string;
}

export interface CustomInterstitialAd {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    iconUrl?: string;
    ctaText?: string;
    ctaLink?: string;
    backgroundColor?: string;
    textColor?: string;
    buttonColor?: string;
    duration?: number;
}

export interface ExamLessonSelection {
    chapitreId: string;
    lessonId: string;
    lessonName?: string;
}

// ============================================
// FONCTIONS API
// ============================================

// 1. getClasses
export async function getClasses(forceRefresh: boolean = false): Promise<Classe[]> {
    try {
        const response = await api.get('/data/classes.json');
        const data = await parseJsonResponse<any[]>(response, '/data/classes.json');
        
        return data.map((item: any) => ({
            classeId: item.id,
            classeName: item.nom,
            matieres: [],
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération des classes:", error);
        throw error;
    }
}

// 2. getMatieres
export async function getMatieres(classeId: string): Promise<Matiere[]> {
    try {
        const response = await api.get(`/data/${classeId}/matieres.json`);
        const data = await parseJsonResponse<any[]>(response, `/data/${classeId}/matieres.json`);
        
        return data.map((item: any) => ({
            matiereId: item.id,
            classeId: classeId,
            matiereName: item.nom,
            chapitres: []
        }));
    } catch (error) {
        console.error(`Erreur lors de la récupération des matières pour la classe ${classeId}:`, error);
        throw error;
    }
}

// 3. getChapitres
export async function getChapitres(classeId: string, matiereId: string): Promise<Chapitres[]> {
    try {
        const response = await api.get(`/data/${classeId}/${matiereId}/chapitres.json`);
        const data = await parseJsonResponse<any[]>(response, `/data/${classeId}/${matiereId}/chapitres.json`);
        
        return data.map((item: any, index: number) => ({
            chapitreId: item.id,
            matiereId: matiereId,
            chapitreName: item.nom,
            index: index,
            classeId: classeId,
            lessons: []
        }));
    } catch (error) {
        console.error(`Erreur lors de la récupération des chapitres pour ${classeId}/${matiereId}:`, error);
        throw error;
    }
}

// 4. getEpreuves
export async function getEpreuves(
    classeId: string,
    matiereId: string
): Promise<Epreuve[]> {
    try {
        const response = await api.get(`/data/${classeId}/${matiereId}/epreuves.json`);
        const data = await parseJsonResponse<any[]>(response, `/data/${classeId}/${matiereId}/epreuves.json`);

        return data.map((item: any, index: number) => ({
            epreuveId: item.id || `${matiereId}_epreuve_${index}`,
            matiereId: matiereId,
            classeId: classeId,
            title: item.nom
        }));
    } catch (error) {
        console.error(`Erreur lors de la récupération des épreuves pour la matière ${matiereId} de la classe ${classeId}:`, error);
        return [];
    }
}

// 5. getActu
export async function getActu(): Promise<Actu[]> {
    try {
        const response = await api.get('/data/actu.json');
        const data = await parseJsonResponse<any[]>(response, '/data/actu.json');

        return data.map((item: any, index: number) => ({
            actuId: item.id || `actu_${index}`,
            title: item.titre,
            content: item.contenu,
            date: item.date
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération des actualités:", error);
        return [];
    }
}

// 6. getContact
export async function getContact(): Promise<Contact | null> {
    try {
        const response = await api.get('/data/contact.json');
        const data = await parseJsonResponse<any>(response, '/data/contact.json');

        return {
            email: data.email || "",
            whatsapp: data.whatsapp || ""
        };
    } catch (error) {
        console.error("Erreur lors de la récupération des contacts:", error);
        return null;
    }
}

// 7. getLessons
export async function getLessons(classeId: string, matiereId: string, chapitreId: string): Promise<Lessons[]> {
    try {
        const response = await api.get(`/data/${classeId}/${matiereId}/${chapitreId}/lessons.json`);
        const data = await parseJsonResponse<any[]>(response, `/data/${classeId}/${matiereId}/${chapitreId}/lessons.json`);
        
        return data.map((item: any, index: number) => ({
            lessonId: item.id,
            chapitreId: chapitreId,
            lessonName: item.nom,
            classeId: classeId,            
            matiereId: matiereId,
            index: index
        }));
    } catch (error) {
        console.error(`Erreur lors de la récupération des leçons pour ${classeId}/${matiereId}/${chapitreId}:`, error);
        throw error;
    }
}

// 8. getQuestions
export async function getQuestions(
    classeId: string, 
    matiereId: string, 
    chapitreId: string, 
    lessonId: string
): Promise<Questions[]> {
    try {
        const response = await api.get(`/data/${classeId}/${matiereId}/${chapitreId}/qcm/${lessonId}.json`);
        const data = await parseJsonResponse<any[]>(response, `/data/${classeId}/${matiereId}/${chapitreId}/qcm/${lessonId}.json`);

        return data.map((item: any, index: number) => ({
            questionId: index.toString(),
            lessonId: lessonId,
            chapitreId: chapitreId,
            matiereId: matiereId,
            classeId: classeId,
            questionText: item.questionText,
            options: item.options,
            correctAnswer: item.correctAnswer,
            explanation: item.explanation,
            difficulty: item.difficulty,
            userAnswer: undefined
        }));
    } catch (error) {
        console.error(`Erreur lors de la récupération des questions pour la leçon ${lessonId}:`, error);
        throw error;
    }
}

// 9. getExercices
export async function getExercices(
    classeId: string,
    matiereId: string,
    chapitreId: string,
    lessonId: string
): Promise<Exercice[]> {
    try {
        const response = await api.get(`/data/${classeId}/${matiereId}/${chapitreId}/exercice/${lessonId}.json`);
        const data = await parseJsonResponse<any[]>(response, `/data/${classeId}/${matiereId}/${chapitreId}/exercice/${lessonId}.json`);

        return data.map((item: any, index: number) => ({
            id: item.id || `${lessonId}_exercice_${index}`,
            lessonId: lessonId,
            chapitreId: chapitreId,
            matiereId: matiereId,
            classeId: classeId,
            intitule: item.intitule,
            type: item.type === 'ressource' ? 'ressource' : 'competence',
            niveau: item.niveau,
            enonce: {
                texte: item.enonce.texte,
                images: item.enonce.images || []
            },
            questions: item.questions.map((q: any, qIndex: number) => ({
                numero: q.numero.toString(),
                texte: q.texte,
                niveau: q.niveau,
                reponse: q.reponse,
                sousQuestions: q.sousQuestions && q.sousQuestions.length > 0 
                    ? q.sousQuestions.map((sq: any) => ({
                        numero: sq.numero,
                        texte: sq.texte,
                        niveau: sq.niveau,
                        reponse: sq.reponse
                    }))
                    : undefined
            }))
        }));
    } catch (error) {
        console.error(`Erreur lors de la récupération des exercices pour la leçon ${lessonId}:`, error);
        throw error;
    }
}

// 10. getCoursVideo
export async function getCoursVideo(
    classeId: string,
    matiereId: string,
    chapitreId: string,
    lessonId: string
): Promise<CoursVideo[]> {
    try {
        const response = await api.get(`/data/${classeId}/${matiereId}/${chapitreId}/cours_video/${lessonId}.json`);
        const data = await parseJsonResponse<any[]>(response, `/data/${classeId}/${matiereId}/${chapitreId}/cours_video/${lessonId}.json`);

        return data.map((item: any, index: number) => ({
            coursVideoId: item.id || `${lessonId}_video_${index}`,
            lessonId: lessonId,
            chapitreId: chapitreId,
            matiereId: matiereId,
            classeId: classeId,
            title: item.nom,
            youtubeUrl: item.youtubeUrl
        }));
    } catch (error) {
        console.error(`Erreur lors de la récupération des cours vidéo pour la leçon ${lessonId}:`, error);
        return [];
    }
}

// 11. getExerciceVideo
export async function getExerciceVideo(
    classeId: string,
    matiereId: string,
    chapitreId: string,
    lessonId: string
): Promise<ExerciceVideo[]> {
    try {
        const response = await api.get(`/data/${classeId}/${matiereId}/${chapitreId}/exercices_video/${lessonId}.json`);
        const data = await parseJsonResponse<any[]>(response, `/data/${classeId}/${matiereId}/${chapitreId}/exercices_video/${lessonId}.json`);
        
        return data.map((item: any, index: number) => ({
            exerciceVideoId: item.id || `${lessonId}_exercice_video_${index}`,
            lessonId: lessonId,
            chapitreId: chapitreId,
            matiereId: matiereId,
            classeId: classeId,
            title: item.nom,
            youtubeUrl: item.youtubeUrl
        }));
    } catch (error) {
        console.error(`Erreur lors de la récupération des exercices vidéo pour la leçon ${lessonId}:`, error);
        return [];
    }
}

// 12. getCustomAds
export async function getCustomAds(): Promise<CustomAd[]> {
    try {
        const response = await api.get('/data/ads.json');
        const data = await parseJsonResponse<any[]>(response, '/data/ads.json');
        
        return data.map((item: any, index: number) => ({
            id: item.id || `custom_ad_${index}`,
            title: item.title || "",
            description: item.description || "",
            imageUrl: item.imageUrl,
            ctaText: item.ctaText || "En savoir plus",
            ctaLink: item.ctaLink,
            backgroundColor: item.backgroundColor || "#f0f0f0",
            textColor: item.textColor || "#333333"
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération des annonces personnalisées:", error);
        return [];
    }
}

// 13. getCustomInterstitialAds
export async function getCustomInterstitialAds(): Promise<CustomInterstitialAd[]> {
    try {
        const response = await api.get('/data/interstitial_ads.json');
        const data = await parseJsonResponse<any[]>(response, '/data/interstitial_ads.json');

        return data.map((item: any, index: number) => ({
            id: item.id || `custom_interstitial_${index}`,
            title: item.title || "",
            description: item.description || "",
            imageUrl: item.imageUrl,
            iconUrl: item.iconUrl,
            ctaText: item.ctaText || "En savoir plus",
            ctaLink: item.ctaLink,
            backgroundColor: item.backgroundColor || "#ffffff",
            textColor: item.textColor || "#333333",
            buttonColor: item.buttonColor || "#66857A",
            duration: item.duration || 5
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération des annonces interstitielles personnalisées:", error);
        return [];
    }
}

// ============================================
// FONCTIONS DE GÉNÉRATION DE QUIZ
// ============================================

function getRandomElements<T>(array: T[], count: number): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
}

// 14. generateQuizForLesson
export const generateQuizForLesson = async (
    classeId: string,
    matiereId: string,
    chapitreId: string,
    lessonId: string,
    matiereName: string,
    lessonName: string,
    nbreQuestions: number
): Promise<Quiz | null> => {
    try {
        const questions = await getQuestions(classeId, matiereId, chapitreId, lessonId);
        
        if (!questions || questions.length === 0) {
            console.warn(`Aucune question trouvée pour la leçon ${lessonId}`);
            return null;
        }

        const shuffledQuestions = [...questions];
        for (let i = shuffledQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
        }

        const selectedQuestions = shuffledQuestions.slice(0, Math.min(nbreQuestions, shuffledQuestions.length));

        let totalDuration = 0;
        selectedQuestions.forEach(q => {
            switch (q.difficulty) {
                case 'easy': totalDuration += 15; break;
                case 'medium': totalDuration += 20; break;
                case 'hard': totalDuration += 25; break;
                case 'very hard': totalDuration += 30; break;
                default: totalDuration += 15;
            }
        });

        const quizId = `${lessonId}_quiz_${Date.now()}`;

        const quiz: Quiz = {
            quizId: quizId,
            matiereId: matiereId,
            matiereName: matiereName,
            title: `${lessonName} - Quiz`,
            questions: selectedQuestions,
            lessons: [lessonId],
            duration: totalDuration,
            type: "quiz"
        };

        return quiz;
    } catch (error) {
        console.error(`Erreur lors de la génération du quiz pour la leçon ${lessonId}:`, error);
        return null;
    }
};

// 15. generateExamQuizForLessons
export const generateExamQuizForLessons = async (
    classeId: string,
    matiereId: string,
    lessonsSelection: ExamLessonSelection[],
    matiereName: string,
    nbreQuestionsParLesson: number
): Promise<Quiz | null> => {
    try {
        const allQuestionsPromises = lessonsSelection.map(async (selection) => {
            const { chapitreId, lessonId } = selection;
            
            const questions = await getQuestions(
                classeId, 
                matiereId, 
                chapitreId, 
                lessonId
            );
            
            return questions.map(q => ({
                ...q,
                lessonId: lessonId
            }));
        });

        const allQuestionsArrays = await Promise.all(allQuestionsPromises);
        const allAvailableQuestions = allQuestionsArrays.flat();

        if (allAvailableQuestions.length === 0) {
            console.warn('Aucune question trouvée pour les leçons spécifiées');
            return null;
        }

        const maxQuestionsTotal = 20;
        let remainingQuestions = maxQuestionsTotal;
        const questionsPerLesson: number[] = [];

        for (let i = 0; i < lessonsSelection.length; i++) {
            const availableForLesson = allQuestionsArrays[i].length;
            const maxForThisLesson = Math.min(
                nbreQuestionsParLesson,
                availableForLesson,
                Math.ceil(remainingQuestions / (lessonsSelection.length - i))
            );
            
            questionsPerLesson.push(maxForThisLesson);
            remainingQuestions -= maxForThisLesson;
        }

        if (remainingQuestions > 0) {
            for (let i = 0; i < lessonsSelection.length && remainingQuestions > 0; i++) {
                const availableForLesson = allQuestionsArrays[i].length;
                const currentMax = questionsPerLesson[i];
                const canAdd = Math.min(
                    remainingQuestions,
                    availableForLesson - currentMax,
                    nbreQuestionsParLesson - currentMax
                );
                
                if (canAdd > 0) {
                    questionsPerLesson[i] += canAdd;
                    remainingQuestions -= canAdd;
                }
            }
        }

        const selectedQuestions: Questions[] = [];
        
        for (let i = 0; i < lessonsSelection.length; i++) {
            const questionsForLesson = allQuestionsArrays[i];
            const count = questionsPerLesson[i];
            
            if (count > 0 && questionsForLesson.length > 0) {
                const selected = count >= questionsForLesson.length 
                    ? questionsForLesson 
                    : getRandomElements(questionsForLesson, count);
                selectedQuestions.push(...selected);
            }
        }

        if (selectedQuestions.length === 0) {
            console.warn('Aucune question sélectionnée pour l\'examen');
            return null;
        }

        const shuffledQuestions = getRandomElements(selectedQuestions, selectedQuestions.length);

        const duration = shuffledQuestions.reduce((total, q) => {
            switch (q.difficulty) {
                case 'easy': return total + 60;
                case 'medium': return total + 80;
                case 'hard': return total + 100;
                case 'very hard': return total + 120;
                default: return total + 60;
            }
        }, 0);

        const examDuration = duration + 600;

        const quizId = `exam_${classeId}_${matiereId}_${Date.now()}`;
        const lessonIds = lessonsSelection.map(sel => sel.lessonId);

        const quiz: Quiz = {
            quizId,
            matiereId,
            matiereName,
            title: `Examen - ${matiereName}`,
            questions: shuffledQuestions,
            lessons: lessonIds,
            duration: examDuration,
            type: 'exam'
        };

        return quiz;
    } catch (error) {
        console.error('Erreur lors de la génération du quiz exam:', error);
        return null;
    }
};

export function getImageUrl(type: 'classe' | 'matiere' | 'chapitre' | 'lesson', id: string): string | null {
  const baseUrl = API_URL
  const normalizedId = id.toLowerCase()
  
  switch (type) {
    case 'classe':
      return `${baseUrl}/data/icons/classes/${normalizedId}.png`
    case 'matiere':
      return `${baseUrl}/data/icons/matieres/${normalizedId}.png`
    case 'chapitre':
      return `${baseUrl}/data/icons/chapitres/chap_${normalizedId}.png`
    case 'lesson':
      return `${baseUrl}/data/icons/lessons/lesson_${normalizedId}.png`
    default:
      return null
  }
}

// ============================================
// EXPORT PAR DÉFAUT
// ============================================

export default {
    getClasses,
    getMatieres,
    getChapitres,
    getEpreuves,
    getActu,
    getContact,
    getLessons,
    getQuestions,
    getExercices,
    getCoursVideo,
    getExerciceVideo,
    getCustomAds,
    getCustomInterstitialAds,
    generateQuizForLesson,
    generateExamQuizForLessons,
};