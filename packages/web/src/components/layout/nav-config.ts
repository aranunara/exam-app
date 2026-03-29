export interface NavItem {
  to: string
  label: string
}

export const navItems: NavItem[] = [
  { to: '/dashboard', label: 'ダッシュボード' },
  { to: '/stats', label: '統計' },
]

export const adminNavItems: NavItem[] = [
  { to: '/admin/categories', label: 'カテゴリ' },
  { to: '/admin/question-sets', label: '問題セット' },
  { to: '/admin/import-export', label: 'インポート/エクスポート' },
]
