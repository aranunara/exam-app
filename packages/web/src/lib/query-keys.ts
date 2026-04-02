export const queryKeys = {
  subjects: {
    all: ['subjects'] as const,
    detail: (id: string) => ['subjects', id] as const,
  },
  tags: {
    all: ['tags'] as const,
    search: (search: string) => ['tags', { search }] as const,
  },
  workbooks: {
    all: ['workbooks'] as const,
    list: (filters: Record<string, string>) =>
      ['workbooks', filters] as const,
    detail: (id: string) => ['workbooks', id] as const,
  },
  sessions: {
    detail: (id: string) => ['sessions', id] as const,
    question: (sessionId: string, index: number) =>
      ['sessions', sessionId, 'questions', index] as const,
    results: (id: string) => ['sessions', id, 'results'] as const,
    previewFilter: (workbookId: string) =>
      ['sessions', 'preview-filter', workbookId] as const,
  },
  stats: {
    overview: (filters?: Record<string, string>) =>
      ['stats', 'overview', filters ?? {}] as const,
    subjects: (filters?: Record<string, string>) =>
      ['stats', 'subjects', filters ?? {}] as const,
    tags: (filters?: Record<string, string>) =>
      ['stats', 'tags', filters ?? {}] as const,
    history: (page: number, filters?: Record<string, string>) =>
      ['stats', 'history', page, filters ?? {}] as const,
    weakAreas: (filters?: Record<string, string>) =>
      ['stats', 'weakAreas', filters ?? {}] as const,
    workbookScores: ['stats', 'workbookScores'] as const,
  },
  confidence: {
    byQuestion: (questionId: string) =>
      ['confidence', questionId] as const,
    batch: (questionIds: string[]) =>
      ['confidence', 'batch', questionIds] as const,
  },
} as const
