import type { ComponentType } from 'react'
import {
  DashboardIcon,
  HistoryIcon,
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
  { to: '/stats', label: '履歴' },
]

export const adminNavItems: NavItem[] = [
  { to: '/admin/workbooks', label: '問題集' },
  { to: '/admin/subjects', label: '科目' },
  { to: '/admin/tags', label: 'タグ' },
  { to: '/admin/import-export', label: 'インポート/エクスポート' },
]

export const sidebarNavGroups: NavGroup[] = [
  {
    label: '',
    items: [
      { to: '/dashboard', label: 'ダッシュボード', icon: DashboardIcon },
      { to: '/stats', label: '履歴', icon: HistoryIcon },
    ],
  },
  {
    label: '管理',
    items: [
      { to: '/admin/workbooks', label: '問題集', icon: FileListIcon },
      { to: '/admin/subjects', label: '科目', icon: FolderIcon },
      { to: '/admin/tags', label: 'タグ', icon: TagIcon },
      { to: '/admin/import-export', label: 'インポート/エクスポート', icon: ArrowsIcon },
    ],
  },
]
