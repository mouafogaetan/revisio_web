import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Layout } from '@/components/layout/Layout'
import { HomeScreen } from '@/screens/HomeScreen'
import { ShowMatieresScreen } from '@/screens/ShowMatieresScreen'
import { ShowChapitresScreen } from '@/screens/ShowChapitresScreen'
import { ShowLessonScreen } from '@/screens/ShowLessonScreen'
import { LessonViewScreen } from '@/screens/LessonViewScreen'
import { ActuScreen } from '@/screens/ActuScreen'
import { ContactScreen } from '@/screens/ContactScreen'
import { QuizExamScreen } from '@/screens/QuizExamScreen'
import { SujetScreen } from '@/screens/SujetScreen'
import { CoursDocScreen } from '@/screens/CoursDocScreen'
import { CoursVideoScreen } from '@/screens/CoursVideoScreen'
import { ExerciceDocScreen } from '@/screens/ExerciceDocScreen'
import { ExerciceVideoScreen } from '@/screens/ExerciceVideoScreen'
import { QuizScreen } from '@/screens/QuizScreen'
import { ResultScreen } from '@/screens/ResultScreen'
import { ReponsesScreen } from '@/screens/ReponsesScreen'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const { classes, isLoading, loadClasses } = useAppStore()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    loadClasses().finally(() => setInitialized(true))
  }, [loadClasses])

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {!initialized || (isLoading && classes.length === 0) ? (
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">Chargement...</span>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomeScreen />} />
              <Route path="matiere/:classeId" element={<ShowMatieresScreen />} />
              <Route path="chapitre/:classeId/:matiereId" element={<ShowChapitresScreen />} />
              <Route path="lesson/:classeId/:matiereId/:chapitreId" element={<ShowLessonScreen />} />
              <Route path="lesson/:classeId/:matiereId/:chapitreId/:lessonId" element={<LessonViewScreen />} />
              <Route path="cours-doc/:classeId/:matiereId/:chapitreId/:lessonId" element={<CoursDocScreen />} />
              <Route path="cours-video/:classeId/:matiereId/:chapitreId/:lessonId" element={<CoursVideoScreen />} />
              <Route path="exercice-doc/:classeId/:matiereId/:chapitreId/:lessonId" element={<ExerciceDocScreen />} />
              <Route path="exercice-video/:classeId/:matiereId/:chapitreId/:lessonId" element={<ExerciceVideoScreen />} />
              <Route path="quiz" element={<QuizScreen />} />
              <Route path="result" element={<ResultScreen />} />
              <Route path="reponses" element={<ReponsesScreen />} />
              <Route path="sujet/:classeId/:matiereId/:epreuveId?" element={<SujetScreen />} />
              <Route path="evaluation" element={<QuizExamScreen />} />
              <Route path="actu" element={<ActuScreen />} />
              <Route path="contact" element={<ContactScreen />} />
            </Route>
          </Routes>
        )}
      </Router>
    </QueryClientProvider>
  )
}

export default App