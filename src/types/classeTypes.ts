export interface Classe {
    classeId: string;
    classeName: string;
    matieres: Matiere[];
}

export interface Matiere{
    matiereId: string;
    classeId: string;
    matiereName: string;
    chapitres: Chapitres[];
}

export interface Epreuve{
    epreuveId: string;
    matiereId: string;
    classeId: string;
    title: string;
}

export interface Chapitres {
    chapitreId: string;
    matiereId: string;
    classeId: string;
    chapitreName: string;
    index: number;
    lessons: Lessons[];
}
export interface Lessons {
    lessonId: string;
    chapitreId: string;
    matiereId: string;
    classeId: string;
    lessonName: string;
    index: number;
}
export interface CoursVideo{
  coursVideoId: string;
  lessonId: string;
  chapitreId: string;
  matiereId: string;
  classeId: string;
  title: string;
  youtubeUrl: string;
}

export interface ExerciceVideo{
  exerciceVideoId: string;
  lessonId: string;
  chapitreId: string;
  matiereId: string;
  classeId: string;
  title: string;
  youtubeUrl: string;
}

export interface Questions{
    questionId: string;
    lessonId: string;
    chapitreId: string;
    matiereId: string;
    classeId: string;
    questionText: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
    difficulty: "easy" | "medium" | "hard" | "very hard";
    userAnswer?: number; // Optional, for user responses
}

export interface Quiz{
    quizId: string;
    matiereId: string;
    matiereName: string;
    title: string;
    questions: Questions[];
    lessons: string[];
    duration: number; // in seconds
    type: "quiz" | "exam";
}

export interface Evaluation{
  EvaluationId:string;
  matiereId:string;
  matiereName:string;
  exercices:Exercice[];
}

export interface Exercice {
  id: string; // ID auto-généré
  lessonId: string;
  chapitreId: string;
  matiereId: string;
  classeId: string;
  intitule: string; // Titre de l'exercice
  type: 'ressource' | 'competence'; // Type d'exercice
  niveau: 'easy' | 'medium' | 'hard' | 'very hard'; // Difficulté globale
  enonce: {
    texte: string; // Texte de l'énoncé
    images?: string[]; // Tableau de 3 images max en base64
  };
  questions: Question[]; // Tableau de questions
}

export interface Question {
  numero: string; // Numéro de la question
  texte: string; // Texte de la question
  niveau: 'easy' | 'medium' | 'hard' | 'very hard'; // Difficulté de la question
  reponse?: string; // Réponse attendue
  sousQuestions?: SousQuestion[]; // Sous-questions optionnelles
}

interface SousQuestion {
  numero: string; // Format "1.a", "1.b" etc.
  texte: string; // Texte de la sous-question
  niveau: 'easy' | 'medium' | 'hard' | 'very hard'; // Difficulté
  reponse?: string; // Réponse attendue
}

export interface QuizResult {
  quizId: string;
  matiereId: string;
  nbrQuestions: number;
  correctAnswers: number;
  score?: number;
  lessons: string[];
  dateTaken: Date;
  type: "quiz" | "exam";
}

export interface Actu{
  actuId: string;
  title: string;
  content: string;
  date: string; 
}
export interface Contact{
  email: string;
  whatsapp: string;
}