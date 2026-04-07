import { useCallback, type KeyboardEvent } from 'react'

type MarkdownAction = {
  prefix: string
  suffix: string
  placeholder: string
}

const SHORTCUTS: Record<string, MarkdownAction> = {
  b: { prefix: '**', suffix: '**', placeholder: 'bold' },
  i: { prefix: '*', suffix: '*', placeholder: 'italic' },
  e: { prefix: '`', suffix: '`', placeholder: 'code' },
}

function applyMarkdown(
  textarea: HTMLTextAreaElement,
  action: MarkdownAction,
): string {
  const { selectionStart, selectionEnd, value } = textarea
  const selected = value.slice(selectionStart, selectionEnd)

  const alreadyWrapped =
    selectionStart >= action.prefix.length &&
    value.slice(selectionStart - action.prefix.length, selectionStart) === action.prefix &&
    value.slice(selectionEnd, selectionEnd + action.suffix.length) === action.suffix

  if (alreadyWrapped) {
    const newValue =
      value.slice(0, selectionStart - action.prefix.length) +
      selected +
      value.slice(selectionEnd + action.suffix.length)

    requestAnimationFrame(() => {
      textarea.selectionStart = selectionStart - action.prefix.length
      textarea.selectionEnd = selectionEnd - action.prefix.length
    })

    return newValue
  }

  const insertion = selected || action.placeholder
  const newValue =
    value.slice(0, selectionStart) +
    action.prefix +
    insertion +
    action.suffix +
    value.slice(selectionEnd)

  requestAnimationFrame(() => {
    if (selected) {
      textarea.selectionStart = selectionStart + action.prefix.length
      textarea.selectionEnd = selectionEnd + action.prefix.length
    } else {
      textarea.selectionStart = selectionStart + action.prefix.length
      textarea.selectionEnd = selectionStart + action.prefix.length + insertion.length
    }
  })

  return newValue
}

export function useMarkdownShortcuts(
  onChange: (value: string) => void,
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!e.metaKey && !e.ctrlKey) return
      const action = SHORTCUTS[e.key]
      if (!action) return

      e.preventDefault()
      const newValue = applyMarkdown(e.currentTarget, action)
      onChange(newValue)
    },
    [onChange],
  )

  return handleKeyDown
}
