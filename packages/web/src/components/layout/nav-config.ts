import type { ComponentType } from 'react'
import {
  DashboardIcon,
  ChartIcon,
  FolderIcon,
  FileListIcon,
  TagIcon,
  ArrowsIcon,
} from './sidebar-icons'

export interface NavItem {
  to: string
  label: string
  icon?: ComponentType<{ className?: string }>
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navItems: NavItem[] = [
  { to: '/dashboard', label: 'ダッシュボード' },
  { to: '/stats', label: '統計' },
]

export const adminNavItems: NavItem[] = [
  { to: '/admin/question-sets', label: '問題セット' },
  { to: '/admin/categories', label: 'カテゴリ' },
  { to: '/admin/tags', label: 'タグ' },
  { to: '/admin/import-export', label: 'インポート/エクスポート' },
]

export const sidebarNavGroups: NavGroup[] = [
  {
    label: '',
    items: [
      { to: '/dashboard', label: 'ダッシュボード', icon: DashboardIcon },
      { to: '/stats', label: '統計', icon: ChartIcon },
    ],
  },
  {
    label: '管理',
    items: [
      { to: '/admin/question-sets', label: '問題セット', icon: FileListIcon },
      { to: '/admin/categories', label: 'カテゴリ', icon: FolderIcon },
      { to: '/admin/tags', label: 'タグ', icon: TagIcon },
      { to: '/admin/import-export', label: 'インポート/エクスポート', icon: ArrowsIcon },
    ],
  },
]
