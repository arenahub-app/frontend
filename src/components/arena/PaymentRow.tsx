import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const STATUS_VARIANT = {
  PENDING:  "warning",
  APPROVED: "success",
  REJECTED: "danger",
} as const

const STATUS_LABELS: Record<string, string> = {
  PENDING:  "Pendente",
  APPROVED: "Pago",
  REJECTED: "Reprovado",
}

interface PaymentRowProps {
  name: string
  photoUrl?: string
  amount: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  type: "DAILY" | "SUBSCRIPTION"
  referenceLabel?: string
  onAction?: () => void
  actionLabel?: string
  className?: string
}

export function PaymentRow({
  name,
  photoUrl,
  amount,
  status,
  type,
  referenceLabel,
  onAction,
  actionLabel,
  className,
}: PaymentRowProps) {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount)

  const typeLabel = type === "DAILY" ? "Diária" : "Mensalidade"
  const secondary = [typeLabel, referenceLabel].filter(Boolean).join(" · ")

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 min-h-[64px] bg-arena-surface border-b border-arena-border last:border-b-0",
        className
      )}
    >
      <Avatar name={name} src={photoUrl} size="md" />

      <div className="flex-1 min-w-0">
        <p className="text-body text-arena-text truncate">{name}</p>
        <p className="text-caption text-arena-muted">{secondary}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <p className="text-body font-medium text-arena-text">{formattedAmount}</p>
          <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>
        </div>
        {onAction && actionLabel && (
          <Button variant="ghost" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
