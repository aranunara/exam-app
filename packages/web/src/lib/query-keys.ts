export const queryKeys = {
  categories: {
    all: ['categories'] as const,
    detail: (id: string) => ['categories', id] as const,
  },
  tags: {
    all: ['tags'] as const,
    search: (search: string) => ['tags', { search }] as const,
  },
  questionSets: {
    all: ['questionSets'] as const,
    list: (filters: Record<string, string>) =>
      ['questionSets', filters] as const,
    detail: (id: string) => ['questionSets', id] as const,
  },
  sessions: {
    detail: (id: string) => ['sessions', id] as const,
    question: (sessionId: string, index: number) =>
      ['sessions', sessionId, 'questions', index] as const,
    results: (id: string) => ['sessions', id, 'results'] as const,
    previewFilter: (questionSetId: string) =>
      ['sessions', 'preview-filter', questionSetId] as const,
  },
  stats: {
    overview: (filters?: Record<string, string>) =>
      ['stats', 'overview', filters ?? {}] as const,
    categories: (filters?: Record<string, string>) =>
      ['stats', 'categories', filters ?? {}] as const,
    tags: (filters?: Record<string, string>) =>
      ['stats', 'tags', filters ?? {}] as const,
    history: (page: number, filters?: Record<string, string>) =>
      ['stats', 'history', page, filters ?? {}] as const,
    weakAreas: (filters?: Record<string, string>) =>
      ['stats', 'weakAreas', filters ?? {}] as const,
    questionSetScores: ['stats', 'questionSetScores'] as const,
  },
  confidence: {
    byQuestion: (questionId: string) =>
      ['confidence', questionId] as const,
    batch: (questionIds: string[]) =>
      ['confidence', 'batch', questionIds] as const,
  },
} as const
