import { Input } from '@/components/ui/input'
import { CURRENCY } from '@/lib/utils/currency'
import { cn } from '@/lib/utils'

interface CurrencyInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  error?: boolean
  id?: string
  min?: string
  step?: string
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  className,
  error = false,
  id,
  min = "0",
  step = "1"
}: CurrencyInputProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="number"
        step={step}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "pl-12",
          error && "border-red-500",
          className
        )}
      />
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">
        {CURRENCY.SYMBOL}
      </span>
    </div>
  )
}