import { useCountUp } from '../../hooks/use-count-up'

interface AnimatedNumberProps {
  value: number
  duration?: number
  delay?: number
  enabled?: boolean
  decimals?: number
  suffix?: string
  className?: string
}

export function AnimatedNumber({
  value,
  duration = 800,
  delay = 0,
  enabled = true,
  decimals = 0,
  suffix = '',
  className,
}: AnimatedNumberProps) {
  const animatedValue = useCountUp({ end: value, duration, delay, enabled, decimals })

  return (
    <span className={className}>
      {decimals > 0 ? animatedValue.toFixed(decimals) : animatedValue}
      {suffix}
    </span>
  )
}
