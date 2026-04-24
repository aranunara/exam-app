type FilterInput = Record<string, string | undefined> | undefined

function normalizeFilters(filters: FilterInput): Record<string, string> {
  if (!filters) return {}
  const entries: [string, string][] = []
  for (const key of Object.keys(filters).sort()) {
    const value = filters[key]
    if (value !== undefined && value !== '') {
      entries.push([key, value])
    }
  }
  return Object.fromEntries(entries)
}

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
    list: (filters?: FilterInput) =>
      ['workbooks', 'list', normalizeFilters(filters)] as const,
    detail: (id: string) => ['workbooks', id] as const,
  },
  sessions: {
    detail: (id: string) => ['sessions', id] as const,
    question: (sessionId: string, index: number) =>
      ['sessions', sessionId, 'questions', index] as const,
    results: (id: string) => ['sessions', id, 'results'] as const,
    previewFilter: (workbookId: string) =>
      ['sessions', 'preview-filter', workbookId] as const,
    inProgress: (workbookId: string) =>
      ['sessions', 'in-progress', workbookId] as const,
  },
  stats: {
    overview: (filters?: FilterInput) =>
      ['stats', 'overview', normalizeFilters(filters)] as const,
    subjects: (filters?: FilterInput) =>
      ['stats', 'subjects', normalizeFilters(filters)] as const,
    tags: (filters?: FilterInput) =>
      ['stats', 'tags', normalizeFilters(filters)] as const,
    history: (page: number, filters?: FilterInput) =>
      ['stats', 'history', page, normalizeFilters(filters)] as const,
    weakAreas: (filters?: FilterInput) =>
      ['stats', 'weakAreas', normalizeFilters(filters)] as const,
    workbookScores: ['stats', 'workbookScores'] as const,
  },
  confidence: {
    byQuestion: (questionId: string) =>
      ['confidence', questionId] as const,
    batch: (questionIds: string[]) =>
      ['confidence', 'batch', [...questionIds].sort()] as const,
  },
} as const
