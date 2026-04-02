import { useState, useCallback, useRef, useReducer, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { ErrorMessage } from '@/components/shared/error-message'
import { Collapsible } from '@/components/shared/collapsible'
import { ToggleSwitch } from '@/components/shared/toggle-switch'
import {
  QuestionNavigator,
  type QuestionState,
} from '@/components/shared/question-navigator'
import { useModal } from '@/hooks/use-modal'
import { WritingTipsModal } from '@/components/shared/writing-tips-modal'
import {
  QuestionEditor,
  createEmptyQuestion,
  type QuestionFormData,
} from '@/components/shared/question-editor'
import type {
  ApiResponse,
  Workbook,
  Question,
  Subject,
  Tag,
} from '@/types'
import type { ConfidenceLevel } from '@/lib/confidence-config'

interface SetFormData {
  title: string
  description: string
  subjectId: string
  timeLimit: string
  isPublished: boolean
  tagIds: string[]
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function questionToForm(question: Question): QuestionFormData {
  return {
    id: question.id,
    body: question.body,
    explanation: question.explanation ?? '',
    isMultiAnswer: question.isMultiAnswer,
    sortOrder: question.sortOrder,
    tagIds: question.tagIds,
    choices: question.choices.map((c) => ({
      id: c.id,
      body: c.body,
      isCorrect: c.isCorrect,
      explanation: c.explanation ?? '',
      sortOrder: c.sortOrder,
    })),
  }
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-64 rounded bg-muted/50" />
      <div className="h-40 rounded-lg border bg-muted/50" />
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="h-64 rounded-lg border bg-muted/50" />
      ))}
    </div>
  )
}

interface ToastData {
  type: 'success' | 'error'
  message: string
}

function Toast({ toast, onClose }: { toast: ToastData; onClose: () => void }) {
  const isSuccess = toast.type === 'success'
  return (
    <div
      role="alert"
      className={`animate-in slide-in-from-bottom-2 flex items-start gap-3 rounded-lg border p-4 shadow-lg ${
        isSuccess
          ? 'border-success/30 bg-success-muted text-success-foreground'
          : 'border-destructive/50 bg-destructive/10 text-destructive'
      }`}
    >
      <span className="flex-1 text-sm">{toast.message}</span>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 text-current opacity-60 hover:opacity-100"
        aria-label="閉じる"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}

interface UiState {
  setDetailOpen: boolean
  expandedQuestions: Set<number>
  dirtyQuestions: Set<number>
  activeQuestionIndex: number | null
  toast: ToastData | null
  saveStatuses: Map<number, SaveStatus>
}

type UiAction =
  | { type: 'SET_DETAIL_OPEN'; open: boolean }
  | { type: 'EXPAND_QUESTION'; index: number }
  | { type: 'COLLAPSE_QUESTION'; index: number }
  | { type: 'SET_EXPANDED'; expanded: Set<number> }
  | { type: 'MARK_DIRTY'; index: number }
  | { type: 'CLEAR_DIRTY'; index: number }
  | { type: 'SET_DIRTY'; dirty: Set<number> }
  | { type: 'SET_ACTIVE'; index: number | null }
  | { type: 'SHOW_TOAST'; toast: ToastData }
  | { type: 'CLEAR_TOAST' }
  | { type: 'REMOVE_QUESTION_ADJUST'; removedIndex: number }
  | { type: 'SWAP_QUESTION_INDICES'; fromIndex: number; toIndex: number }
  | { type: 'SET_SAVE_STATUS'; index: number; status: SaveStatus }

function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'SET_DETAIL_OPEN':
      return { ...state, setDetailOpen: action.open }
    case 'EXPAND_QUESTION': {
      const next = new Set(state.expandedQuestions)
      next.add(action.index)
      return { ...state, expandedQuestions: next }
    }
    case 'COLLAPSE_QUESTION': {
      const next = new Set(state.expandedQuestions)
      next.delete(action.index)
      return { ...state, expandedQuestions: next }
    }
    case 'SET_EXPANDED':
      return { ...state, expandedQuestions: action.expanded }
    case 'MARK_DIRTY': {
      const next = new Set(state.dirtyQuestions)
      next.add(action.index)
      return { ...state, dirtyQuestions: next }
    }
    case 'CLEAR_DIRTY': {
      const next = new Set(state.dirtyQuestions)
      next.delete(action.index)
      return { ...state, dirtyQuestions: next }
    }
    case 'SET_DIRTY':
      return { ...state, dirtyQuestions: action.dirty }
    case 'SET_ACTIVE':
      return { ...state, activeQuestionIndex: action.index }
    case 'SHOW_TOAST':
      return { ...state, toast: action.toast }
    case 'CLEAR_TOAST':
      return { ...state, toast: null }
    case 'REMOVE_QUESTION_ADJUST': {
      const { removedIndex } = action
      const nextExpanded = new Set<number>()
      for (const idx of state.expandedQuestions) {
        if (idx < removedIndex) nextExpanded.add(idx)
        else if (idx > removedIndex) nextExpanded.add(idx - 1)
      }
      const nextDirty = new Set<number>()
      for (const idx of state.dirtyQuestions) {
        if (idx < removedIndex) nextDirty.add(idx)
        else if (idx > removedIndex) nextDirty.add(idx - 1)
      }
      const nextStatuses = new Map<number, SaveStatus>()
      for (const [idx, status] of state.saveStatuses) {
        if (idx < removedIndex) nextStatuses.set(idx, status)
        else if (idx > removedIndex) nextStatuses.set(idx - 1, status)
      }
      let nextActive = state.activeQuestionIndex
      if (nextActive === removedIndex) {
        nextActive = null
      } else if (nextActive !== null && nextActive > removedIndex) {
        nextActive = nextActive - 1
      }
      return {
        ...state,
        expandedQuestions: nextExpanded,
        dirtyQuestions: nextDirty,
        saveStatuses: nextStatuses,
        activeQuestionIndex: nextActive,
      }
    }
    case 'SWAP_QUESTION_INDICES': {
      const { fromIndex, toIndex } = action
      const nextExpanded = new Set<number>()
      for (const idx of state.expandedQuestions) {
        if (idx === fromIndex) nextExpanded.add(toIndex)
        else if (idx === toIndex) nextExpanded.add(fromIndex)
        else nextExpanded.add(idx)
      }
      const nextDirty = new Set<number>()
      for (const idx of state.dirtyQuestions) {
        if (idx === fromIndex) nextDirty.add(toIndex)
        else if (idx === toIndex) nextDirty.add(fromIndex)
        else nextDirty.add(idx)
      }
      const nextStatuses = new Map<number, SaveStatus>()
      for (const [idx, status] of state.saveStatuses) {
        if (idx === fromIndex) nextStatuses.set(toIndex, status)
        else if (idx === toIndex) nextStatuses.set(fromIndex, status)
        else nextStatuses.set(idx, status)
      }
      let nextActive = state.activeQuestionIndex
      if (nextActive === fromIndex) nextActive = toIndex
      else if (nextActive === toIndex) nextActive = fromIndex
      return {
        ...state,
        expandedQuestions: nextExpanded,
        dirtyQuestions: nextDirty,
        saveStatuses: nextStatuses,
        activeQuestionIndex: nextActive,
      }
    }
    case 'SET_SAVE_STATUS': {
      const next = new Map(state.saveStatuses)
      if (action.status === 'idle') {
        next.delete(action.index)
      } else {
        next.set(action.index, action.status)
      }
      return { ...state, saveStatuses: next }
    }
  }
}

export default function AdminWorkbookEditPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isNew = id === 'new'
  const tipsModal = useModal()

  const [setForm, setSetForm] = useState<SetFormData>({
    title: '',
    description: '',
    subjectId: isNew ? (searchParams.get('subjectId') ?? '') : '',
    timeLimit: '',
    isPublished: false,
    tagIds: [],
  })
  const [questions, setQuestions] = useState<QuestionFormData[]>([])
  const [initialized, setInitialized] = useState(isNew)

  const [ui, dispatch] = useReducer(uiReducer, {
    setDetailOpen: isNew,
    expandedQuestions: new Set<number>(),
    dirtyQuestions: new Set<number>(),
    activeQuestionIndex: null,
    toast: null,
    saveStatuses: new Map<number, SaveStatus>(),
  })

  const questionRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const questionsRef = useRef(questions)
  questionsRef.current = questions
  const autoSaveTimersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  function showToast(data: ToastData) {
    dispatch({ type: 'SHOW_TOAST', toast: data })
    setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 4000)
  }

  const setQuery = useQuery({
    queryKey: queryKeys.workbooks.detail(id!),
    queryFn: () =>
      api.get<ApiResponse<Workbook>>(`/workbooks/${id}`),
    enabled: !isNew,
  })

  const subjectsQuery = useQuery({
    queryKey: queryKeys.subjects.all,
    queryFn: () => api.get<ApiResponse<Subject[]>>('/subjects'),
  })

  const tagsQuery = useQuery({
    queryKey: queryKeys.tags.all,
    queryFn: () => api.get<ApiResponse<Tag[]>>('/tags'),
  })

  const questionIds = useMemo(
    () => questions.filter((q) => q.id).map((q) => q.id!),
    [questions],
  )

  const confidenceQuery = useQuery({
    queryKey: queryKeys.confidence.batch(questionIds),
    queryFn: () =>
      api.post<ApiResponse<Record<string, number>>>('/confidence/batch', {
        questionIds,
      }),
    enabled: !isNew && questionIds.length > 0,
  })

  const [confidenceMap, setConfidenceMap] = useState<Record<string, number>>({})

  useEffect(() => {
    if (confidenceQuery.data?.data) {
      setConfidenceMap(confidenceQuery.data.data)
    }
  }, [confidenceQuery.data])

  if (setQuery.data?.data && !initialized) {
    const data = setQuery.data.data
    setSetForm({
      title: data.title,
      description: data.description ?? '',
      subjectId: data.subjectId,
      timeLimit:
        data.timeLimit !== null ? String(Math.floor(data.timeLimit / 60)) : '',
      isPublished: data.isPublished,
      tagIds: data.tagIds ?? [],
    })
    setQuestions(
      (data.questions ?? [])
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(questionToForm),
    )
    setInitialized(true)
  }

  const createSetMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<ApiResponse<Workbook>>('/workbooks', payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workbooks.all })
      const newId = response.data?.id
      if (newId) {
        navigate(`/admin/workbooks/${newId}`, { replace: true })
      }
    },
    onError: (error: Error) => {
      showToast({ type: 'error', message: error.message })
    },
  })

  const updateSetMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.put<ApiResponse<Workbook>>(`/workbooks/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workbooks.detail(id!),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.workbooks.all })
      showToast({ type: 'success', message: '問題集を保存しました。' })
    },
    onError: (error: Error) => {
      showToast({ type: 'error', message: error.message })
    },
  })

  const saveQuestionMutation = useMutation({
    mutationFn: ({
      questionId,
      payload,
    }: {
      questionIndex: number
      questionId?: string
      payload: Record<string, unknown>
    }) => {
      if (questionId) {
        return api.put<ApiResponse<Question>>(
          `/workbooks/${id}/questions/${questionId}`,
          payload,
        )
      }
      return api.post<ApiResponse<Question>>(
        `/workbooks/${id}/questions`,
        payload,
      )
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workbooks.detail(id!),
      })
      dispatch({ type: 'CLEAR_DIRTY', index: variables.questionIndex })
      dispatch({ type: 'SET_SAVE_STATUS', index: variables.questionIndex, status: 'saved' })
      setTimeout(() => {
        dispatch({ type: 'SET_SAVE_STATUS', index: variables.questionIndex, status: 'idle' })
      }, 3000)
      if (response.data?.id) {
        setQuestions((prev) =>
          prev.map((q, i) =>
            i === variables.questionIndex
              ? { ...q, id: response.data!.id }
              : q,
          ),
        )
      }
    },
    onError: (error: Error, variables) => {
      dispatch({ type: 'SET_SAVE_STATUS', index: variables.questionIndex, status: 'error' })
      showToast({ type: 'error', message: error.message })
    },
  })

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) =>
      api.delete<ApiResponse<null>>(
        `/workbooks/${id}/questions/${questionId}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workbooks.detail(id!),
      })
    },
    onError: (error: Error) => {
      showToast({ type: 'error', message: error.message })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (questionIds: string[]) =>
      api.patch<ApiResponse<null>>(
        `/workbooks/${id}/questions/reorder`,
        { questionIds },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workbooks.detail(id!),
      })
    },
    onError: (error: Error) => {
      showToast({ type: 'error', message: error.message })
    },
  })

  const AUTO_SAVE_DELAY = 1500

  function isQuestionValid(question: QuestionFormData): boolean {
    if (!question.body.trim()) return false
    if (question.choices.some((c) => !c.body.trim())) return false
    if (!question.choices.some((c) => c.isCorrect)) return false
    if (question.choices.every((c) => c.isCorrect)) return false
    return true
  }

  function clearAutoSaveTimer(index: number) {
    const timer = autoSaveTimersRef.current.get(index)
    if (timer) {
      clearTimeout(timer)
      autoSaveTimersRef.current.delete(index)
    }
  }

  function scheduleAutoSave(index: number) {
    clearAutoSaveTimer(index)
    const timer = setTimeout(() => {
      autoSaveTimersRef.current.delete(index)
      const question = questionsRef.current[index]
      if (!question || !isQuestionValid(question)) return

      dispatch({ type: 'SET_SAVE_STATUS', index, status: 'saving' })

      const payload = {
        body: question.body,
        explanation: question.explanation || null,
        isMultiAnswer: question.isMultiAnswer,
        sortOrder: question.sortOrder,
        tagIds: question.tagIds,
        choices: question.choices.map((c) => ({
          ...(c.id ? { id: c.id } : {}),
          body: c.body,
          isCorrect: c.isCorrect,
          explanation: c.explanation || null,
          sortOrder: c.sortOrder,
        })),
      }

      saveQuestionMutation.mutate({
        questionIndex: index,
        questionId: question.id,
        payload,
      })
    }, AUTO_SAVE_DELAY)
    autoSaveTimersRef.current.set(index, timer)
  }

  useEffect(() => {
    return () => {
      for (const timer of autoSaveTimersRef.current.values()) {
        clearTimeout(timer)
      }
    }
  }, [])

  const handleSetFieldChange = useCallback(
    (field: keyof SetFormData, value: string | boolean | string[]) => {
      setSetForm((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

  function handleQuestionChange(index: number, updated: QuestionFormData) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)))
    dispatch({ type: 'MARK_DIRTY', index })
    if (!isNew) {
      const currentStatus = ui.saveStatuses.get(index)
      if (currentStatus === 'error' || currentStatus === 'saved') {
        dispatch({ type: 'SET_SAVE_STATUS', index, status: 'idle' })
      }
      scheduleAutoSave(index)
    }
  }

  function handleRemoveQuestion(index: number) {
    clearAutoSaveTimer(index)
    const question = questions[index]
    if (question.id) {
      deleteQuestionMutation.mutate(question.id)
    }
    setQuestions((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((q, i) => ({ ...q, sortOrder: i })),
    )
    dispatch({ type: 'REMOVE_QUESTION_ADJUST', removedIndex: index })
  }

  function handleAddQuestion() {
    const newIndex = questions.length
    setQuestions((prev) => [...prev, createEmptyQuestion(prev.length)])
    dispatch({ type: 'EXPAND_QUESTION', index: newIndex })
    dispatch({ type: 'SET_ACTIVE', index: newIndex })

    requestAnimationFrame(() => {
      const el = questionRefs.current.get(newIndex)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function handleMoveQuestion(fromIndex: number, direction: 'up' | 'down') {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= questions.length) return

    clearAutoSaveTimer(fromIndex)
    clearAutoSaveTimer(toIndex)

    setQuestions((prev) => {
      const newList = [...prev]
      const temp = newList[fromIndex]
      newList[fromIndex] = { ...newList[toIndex], sortOrder: fromIndex }
      newList[toIndex] = { ...temp, sortOrder: toIndex }
      return newList
    })

    dispatch({ type: 'SWAP_QUESTION_INDICES', fromIndex, toIndex })

    const existingIds = questions
      .map((q) => q.id)
      .filter((qId): qId is string => !!qId)

    if (existingIds.length > 1) {
      const reorderedIds = [...existingIds]
      if (
        fromIndex < reorderedIds.length &&
        toIndex < reorderedIds.length
      ) {
        const tempId = reorderedIds[fromIndex]
        reorderedIds[fromIndex] = reorderedIds[toIndex]
        reorderedIds[toIndex] = tempId
        reorderMutation.mutate(reorderedIds)
      }
    }
  }

  function handleSaveSet() {
    dispatch({ type: 'CLEAR_TOAST' })
    const payload = {
      title: setForm.title,
      description: setForm.description || null,
      subjectId: setForm.subjectId,
      timeLimit: setForm.timeLimit ? Number(setForm.timeLimit) * 60 : null,
      isPublished: setForm.isPublished,
      tagIds: setForm.tagIds,
    }

    if (isNew) {
      createSetMutation.mutate(payload)
    } else {
      updateSetMutation.mutate(payload)
    }
  }

  function handleSaveQuestion(index: number) {
    clearAutoSaveTimer(index)
    const question = questions[index]
    dispatch({ type: 'CLEAR_TOAST' })

    if (!question.body.trim()) {
      showToast({
        type: 'error',
        message: `問題 ${index + 1}: 問題文を入力してください`,
      })
      return
    }
    if (question.choices.some((c) => !c.body.trim())) {
      showToast({
        type: 'error',
        message: `問題 ${index + 1}: 空の選択肢があります`,
      })
      return
    }
    if (!question.choices.some((c) => c.isCorrect)) {
      showToast({
        type: 'error',
        message: `問題 ${index + 1}: 正解の選択肢を1つ以上チェックしてください`,
      })
      return
    }
    if (question.choices.every((c) => c.isCorrect)) {
      showToast({
        type: 'error',
        message: `問題 ${index + 1}: すべての選択肢を正解にすることはできません`,
      })
      return
    }

    const payload = {
      body: question.body,
      explanation: question.explanation || null,
      isMultiAnswer: question.isMultiAnswer,
      sortOrder: question.sortOrder,
      tagIds: question.tagIds,
      choices: question.choices.map((c) => ({
        ...(c.id ? { id: c.id } : {}),
        body: c.body,
        isCorrect: c.isCorrect,
        explanation: c.explanation || null,
        sortOrder: c.sortOrder,
      })),
    }

    dispatch({ type: 'SET_SAVE_STATUS', index, status: 'saving' })
    saveQuestionMutation.mutate({
      questionIndex: index,
      questionId: question.id,
      payload,
    })
  }

  function handleNavigateToQuestion(index: number) {
    dispatch({ type: 'SET_ACTIVE', index })
    dispatch({ type: 'EXPAND_QUESTION', index })
    requestAnimationFrame(() => {
      const el = questionRefs.current.get(index)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function handleTagToggle(tagId: string) {
    const newTagIds = setForm.tagIds.includes(tagId)
      ? setForm.tagIds.filter((t) => t !== tagId)
      : [...setForm.tagIds, tagId]
    handleSetFieldChange('tagIds', newTagIds)
  }

  function getQuestionStates(): Map<number, QuestionState> {
    const states = new Map<number, QuestionState>()
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.id) {
        states.set(i, 'new')
      } else if (ui.dirtyQuestions.has(i)) {
        states.set(i, 'dirty')
      } else {
        states.set(i, 'saved')
      }
    }
    return states
  }

  if (!isNew && setQuery.isLoading) {
    return <LoadingSkeleton />
  }

  if (!isNew && setQuery.error) {
    return <ErrorMessage message={setQuery.error.message} />
  }

  const subjects = subjectsQuery.data?.data ?? []
  const tags = tagsQuery.data?.data ?? []
  const isSaving =
    createSetMutation.isPending ||
    updateSetMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/admin/workbooks"
          className="text-sm text-primary hover:underline"
        >
          &larr; 問題集一覧に戻る
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">
        {isNew ? '新規問題集' : '問題集を編集'}
      </h1>

      <Collapsible
        open={ui.setDetailOpen}
        onOpenChange={(open) => dispatch({ type: 'SET_DETAIL_OPEN', open })}
        title="セット詳細"
        badge={
          !ui.setDetailOpen && setForm.title ? (
            <span className="text-sm font-normal text-muted-foreground">
              {setForm.title}
            </span>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="set-title"
                className="mb-1 block text-sm font-medium"
              >
                タイトル
              </label>
              <input
                id="set-title"
                type="text"
                required
                value={setForm.title}
                onChange={(e) =>
                  handleSetFieldChange('title', e.target.value)
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label
                htmlFor="set-subject"
                className="mb-1 block text-sm font-medium"
              >
                科目
              </label>
              <select
                id="set-subject"
                value={setForm.subjectId}
                onChange={(e) =>
                  handleSetFieldChange('subjectId', e.target.value)
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">科目を選択</option>
                {subjects.map((subj) => (
                  <option key={subj.id} value={subj.id}>
                    {subj.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="set-description"
              className="mb-1 block text-sm font-medium"
            >
              説明
            </label>
            <textarea
              id="set-description"
              value={setForm.description}
              onChange={(e) =>
                handleSetFieldChange('description', e.target.value)
              }
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="set-time-limit"
                className="mb-1 block text-sm font-medium"
              >
                制限時間（分）
              </label>
              <input
                id="set-time-limit"
                type="number"
                min="0"
                value={setForm.timeLimit}
                onChange={(e) =>
                  handleSetFieldChange('timeLimit', e.target.value)
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-end pb-2">
              <ToggleSwitch
                checked={setForm.isPublished}
                onChange={(v) => handleSetFieldChange('isPublished', v)}
                label="公開"
              />
            </div>
          </div>

          {tags.length > 0 && (
            <fieldset>
              <legend className="mb-1 block text-sm font-medium">タグ</legend>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = setForm.tagIds.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'border bg-background hover:bg-muted'
                      }`}
                    >
                      {tag.name}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          )}

          <button
            type="button"
            onClick={handleSaveSet}
            disabled={isSaving || !setForm.title || !setForm.subjectId}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving
              ? '保存中...'
              : isNew
                ? '問題集を作成'
                : 'セット詳細を保存'}
          </button>
        </div>
      </Collapsible>

      {!isNew && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            問題 ({questions.length})
          </h2>

          {questions.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                問題がまだありません。最初の問題を追加してください。
              </p>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="w-full rounded-md border border-dashed py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                + 問題を追加
              </button>
            </div>
          ) : (
            <>
            <div className="pb-4 md:hidden">
              <QuestionNavigator
                totalQuestions={questions.length}
                questionStates={getQuestionStates()}
                activeIndex={ui.activeQuestionIndex}
                onNavigate={handleNavigateToQuestion}
                onTipsClick={tipsModal.open}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <div className="space-y-4 md:col-span-3">
                {questions.map((question, idx) => (
                  <div
                    key={question.id ?? `new-${idx}`}
                    ref={(el) => {
                      if (el) {
                        questionRefs.current.set(idx, el)
                      } else {
                        questionRefs.current.delete(idx)
                      }
                    }}
                  >
                    <QuestionEditor
                      question={question}
                      index={idx}
                      totalQuestions={questions.length}
                      availableTags={tags}
                      onChange={(updated) => handleQuestionChange(idx, updated)}
                      onRemove={() => handleRemoveQuestion(idx)}
                      onMoveUp={() => handleMoveQuestion(idx, 'up')}
                      onMoveDown={() => handleMoveQuestion(idx, 'down')}
                      isOpen={ui.expandedQuestions.has(idx)}
                      onOpenChange={(open) => {
                        dispatch(
                          open
                            ? { type: 'EXPAND_QUESTION', index: idx }
                            : { type: 'COLLAPSE_QUESTION', index: idx },
                        )
                        if (open) {
                          dispatch({ type: 'SET_ACTIVE', index: idx })
                        }
                      }}
                      onSave={() => handleSaveQuestion(idx)}
                      saveStatus={ui.saveStatuses.get(idx)}
                      confidenceLevel={
                        question.id
                          ? ((confidenceMap[question.id] ?? 0) as ConfidenceLevel)
                          : undefined
                      }
                      onConfidenceChange={(level) => {
                        if (question.id) {
                          setConfidenceMap((prev) => ({
                            ...prev,
                            [question.id!]: level,
                          }))
                        }
                      }}
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="w-full rounded-md border border-dashed py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  + 問題を追加
                </button>
              </div>

              <div className="hidden md:block md:col-span-1">
                <div className="sticky top-[6.5rem]">
                  <QuestionNavigator
                    totalQuestions={questions.length}
                    questionStates={getQuestionStates()}
                    activeIndex={ui.activeQuestionIndex}
                    onNavigate={handleNavigateToQuestion}
                    onTipsClick={tipsModal.open}
                  />
                </div>
              </div>
            </div>
            </>
          )}
        </section>
      )}

      <WritingTipsModal
        isOpen={tipsModal.isOpen}
        onClose={tipsModal.close}
        modalRef={tipsModal.modalRef}
      />

      {ui.toast && (
        <div className="fixed bottom-20 right-4 z-50 max-w-sm md:bottom-4">
          <Toast toast={ui.toast} onClose={() => dispatch({ type: 'CLEAR_TOAST' })} />
        </div>
      )}
    </div>
  )
}
