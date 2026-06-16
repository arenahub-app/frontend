import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ROLE_LABELS: Record<string, string> = {
  OWNER:   "Dono",
  ADMIN:   "Admin",
  PLAYER:  "Jogador",
  REFEREE: "Árbitro",
}

const STATUS_VARIANT = {
  CONFIRMED:     "success",
  DECLINED:      "danger",
  PENDING:       "warning",
  BANNED_PENDING: "danger",
} as const

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED:      "Confirmado",
  DECLINED:       "Recusou",
  PENDING:        "Pendente",
  BANNED_PENDING: "Banido",
}

interface PlayerCardProps {
  name: string
  photoUrl?: string
  role: "OWNER" | "ADMIN" | "PLAYER" | "REFEREE"
  skill?: number
  status?: "CONFIRMED" | "DECLINED" | "PENDING" | "BANNED_PENDING"
  onAction?: () => void
  actionLabel?: string
  className?: string
}

export function PlayerCard({
  name,
  photoUrl,
  role,
  skill,
  status,
  onAction,
  actionLabel,
  className,
}: PlayerCardProps) {
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
        <p className="text-caption text-arena-muted">
          {ROLE_LABELS[role]}
          {skill !== undefined && (
            <span className="ml-2 text-arena-accent font-medium">
              ★ {skill.toFixed(1)}
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {status && (
          <Badge variant={STATUS_VARIANT[status]}>
            {STATUS_LABELS[status]}
          </Badge>
        )}
        {onAction && actionLabel && (
          <Button variant="ghost" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
