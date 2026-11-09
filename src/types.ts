export type QuestionType = 'multiple_choice' | 'open'

export type QuestionMode = 'grade' | 'self_check'

export interface Option {
  id: string
  text: string
  correct?: boolean
}

export interface Question {
  id: string
  source: string
  section?: string
  type: QuestionType
  question: string
  options?: Option[]
  answer?: string
  correctUnknown?: boolean
  kind?: string
  variant?: number | string
  sourceNumber?: number | string
  mode?: QuestionMode
}

export interface SourceMeta {
  file: string
  label: string
  source: string
  count: number
  types: Record<string, number>
}

export interface BankMeta {
  title: string
  total: number
  skippedEmptyQuestions: number
  stats: {
    mcqGradable: number
    mcqSelfCheck: number
    open: number
    openNoAnswer: number
  }
  sources: SourceMeta[]
}

export interface ManifestSource {
  id: string
  label: string
  source: string
  count: number
  types: Record<string, number>
  /** Path relative to /data/, e.g. chunks/Medkat.json */
  chunk: string
  questionIds: string[]
}

export interface BankManifest {
  meta: Omit<BankMeta, 'sources'>
  sources: ManifestSource[]
}

export interface ChunkPayload {
  source: string
  questions: Question[]
}

export interface QuestionProgress {
  correctCount: number
  seenCount: number
  mastered: boolean
  lastSeen: number
}

export type ProgressMap = Record<string, QuestionProgress>

export type Screen = 'home' | 'quiz'
