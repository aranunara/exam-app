import { Children, type ElementType, type ReactNode } from 'react'

interface StaggerChildrenProps {
  children: ReactNode
  staggerMs?: number
  className?: string
  as?: ElementType
}

export function StaggerChildren({
  children,
  staggerMs = 50,
  className,
  as: Component = 'div',
}: StaggerChildrenProps) {
  return (
    <Component className={className}>
      {Children.map(children, (child, index) =>
        child ? (
          <div
            className="motion-safe:motion-preset-slide-up motion-safe:motion-duration-300"
            style={{ animationDelay: `${index * staggerMs}ms` }}
          >
            {child}
          </div>
        ) : null,
      )}
    </Component>
  )
}
