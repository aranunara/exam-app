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
  },
  stats: {
    overview: ['stats', 'overview'] as const,
    categories: ['stats', 'categories'] as const,
    tags: ['stats', 'tags'] as const,
    history: (page: number) => ['stats', 'history', page] as const,
    weakAreas: ['stats', 'weakAreas'] as const,
  },
  confidence: {
    byQuestion: (questionId: string) =>
      ['confidence', questionId] as const,
    batch: (questionIds: string[]) =>
      ['confidence', 'batch', questionIds] as const,
  },
} as const
