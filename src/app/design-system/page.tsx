import { notFound } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Divider } from "@/components/ui/divider"
import { PlayerCard } from "@/components/arena/PlayerCard"
import { TeamBadge, getTeamColor } from "@/components/arena/TeamBadge"
import { PaymentRow } from "@/components/arena/PaymentRow"
import { MatchHeader } from "@/components/arena/MatchHeader"

if (process.env.NODE_ENV === "production") notFound()

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PLAYERS = [
  { name: "Carlos Drummond",  role: "OWNER",   skill: 5.2, status: "CONFIRMED" },
  { name: "Rafael Souza",     role: "ADMIN",   skill: 4.8, status: "CONFIRMED" },
  { name: "Felipe Andrade",   role: "PLAYER",  skill: 3.5, status: "PENDING"   },
  { name: "Thiago Almeida",   role: "PLAYER",  skill: 2.9, status: "DECLINED"  },
  { name: "Bruno Ferreira",   role: "REFEREE", skill: undefined, status: undefined },
] as const

const MOCK_TEAMS = [
  {
    name: "Time A",
    averageSkill: 4.6,
    players: [
      { name: "Carlos Drummond" },
      { name: "Felipe Andrade" },
      { name: "João Mendes" },
      { name: "Lucas Pereira" },
    ],
  },
  {
    name: "Time B",
    averageSkill: 4.4,
    players: [
      { name: "Rafael Souza" },
      { name: "Thiago Almeida" },
      { name: "Diego Costa" },
      { name: "Anderson Lima" },
    ],
  },
]

const MOCK_PAYMENTS = [
  { name: "Carlos Drummond", amount: 30, status: "APPROVED", type: "DAILY",        referenceLabel: "Partida 15/06" },
  { name: "Felipe Andrade",  amount: 30, status: "PENDING",  type: "DAILY",        referenceLabel: "Partida 15/06" },
  { name: "Rafael Souza",    amount: 80, status: "REJECTED", type: "SUBSCRIPTION", referenceLabel: "Junho/2026"    },
] as const

// ─── Seção genérica ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-title text-arena-text uppercase tracking-wide border-b border-arena-border pb-2">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Row({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {label && <p className="text-label text-arena-muted">{label}</p>}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-arena-bg px-4 py-8 flex flex-col gap-12 max-w-lg mx-auto">
      <header>
        <h1 className="font-display text-hero text-arena-text uppercase">Design System</h1>
        <p className="text-caption text-arena-muted mt-1">ArenaHub · dark-first · mobile-first</p>
      </header>

      {/* 1. Paleta */}
      <Section title="1. Paleta">
        {(
          [
            ["arena-bg",          "#0f1117", "Fundo principal"],
            ["arena-surface",     "#181c25", "Cards e listas"],
            ["arena-raised",      "#1e2330", "Modais / bottom sheets"],
            ["arena-border",      "#ffffff14","Bordas"],
            ["arena-accent",      "#f97316", "CTA principal"],
            ["arena-accent-dim",  "#ea6c0a", "Hover do acento"],
            ["arena-success",     "#22c55e", "Confirmado / pago"],
            ["arena-warning",     "#eab308", "Pendente"],
            ["arena-danger",      "#ef4444", "Ausente / erro"],
            ["arena-text",        "#f1f5f9", "Texto principal"],
            ["arena-muted",       "#64748b", "Texto secundário"],
          ] as [string, string, string][]
        ).map(([token, hex, desc]) => (
          <div key={token} className="flex items-center gap-3">
            <span
              className="size-10 rounded-card shrink-0 border border-arena-border"
              style={{ backgroundColor: hex }}
            />
            <div>
              <p className="text-body text-arena-text font-mono">{token}</p>
              <p className="text-caption text-arena-muted">{hex} · {desc}</p>
            </div>
          </div>
        ))}
      </Section>

      {/* 2. Tipografia */}
      <Section title="2. Tipografia">
        <div className="font-display text-hero text-arena-text uppercase">Hero Display</div>
        <div className="font-display text-title text-arena-text uppercase">Título Display</div>
        <div className="text-body text-arena-text">Texto corrido — DM Sans body regular 15px</div>
        <div className="text-caption text-arena-muted">Caption — informação secundária, 13px</div>
        <div className="text-label text-arena-muted">Label · uppercase · espaçado</div>
      </Section>

      {/* 3. Primitivos */}
      <Section title="3. Primitivos">
        {/* Button */}
        <Row label="Button — variantes">
          <Button variant="primary" size="sm">Confirmar</Button>
          <Button variant="default" size="sm">Default</Button>
          <Button variant="outline" size="sm">Outline</Button>
          <Button variant="ghost" size="sm">Ghost</Button>
          <Button variant="danger" size="sm">Danger</Button>
        </Row>
        <Row label="Button — tamanhos arena">
          <Button variant="primary" size="sm">sm 44px</Button>
          <Button variant="primary" size="md">md 44px</Button>
          <Button variant="primary" size="lg">lg 48px</Button>
        </Row>
        <Row label="Button — estados">
          <Button variant="primary" size="sm" loading>Carregando</Button>
          <Button variant="primary" size="sm" disabled>Desabilitado</Button>
        </Row>

        {/* Badge */}
        <Row label="Badge — semânticos">
          <Badge variant="success">Confirmado</Badge>
          <Badge variant="warning">Pendente</Badge>
          <Badge variant="danger">Ausente</Badge>
          <Badge variant="neutral">Neutro</Badge>
        </Row>

        {/* Avatar */}
        <Row label="Avatar — iniciais (assinatura camiseta)">
          <Avatar name="Carlos Drummond" size="sm" />
          <Avatar name="Rafael Souza"    size="md" />
          <Avatar name="Felipe Andrade"  size="lg" />
        </Row>
        <Row label="Avatar — número (camiseta)">
          <Avatar name="Carlos Drummond" size="sm" number={7}  />
          <Avatar name="Rafael Souza"    size="md" number={10} />
          <Avatar name="Felipe Andrade"  size="lg" number={1}  />
        </Row>

        {/* Card */}
        <Card>
          <CardHeader><CardTitle>Card padrão</CardTitle></CardHeader>
          <CardContent>
            <p className="text-body text-arena-muted">Conteúdo do card com arena-surface e rounded-card.</p>
          </CardContent>
        </Card>
        <Card pressable>
          <CardHeader><CardTitle>Card pressable</CardTitle></CardHeader>
          <CardContent>
            <p className="text-body text-arena-muted">active:scale-[0.98] — toque para sentir.</p>
          </CardContent>
        </Card>

        {/* Divider */}
        <Row label="Divider">
          <div className="w-full flex flex-col gap-3">
            <Divider />
            <Divider label="Time A · 4 jogadores" />
          </div>
        </Row>

        {/* Loading */}
        <Row label="Loading icon">
          <Loader2 className="animate-spin text-arena-accent size-5" />
        </Row>
      </Section>

      {/* 4. Assinatura visual */}
      <Section title="4. Assinatura visual — Avatar camiseta">
        <p className="text-caption text-arena-muted">
          Quando o jogador não tem foto, as iniciais do nome são exibidas com a fonte display
          sobre uma cor derivada deterministicamente do nome — sempre a mesma cor para o mesmo
          jogador em qualquer lista ou partida do app.
        </p>
        <div className="flex items-end gap-4 flex-wrap">
          {MOCK_PLAYERS.map((p) => (
            <div key={p.name} className="flex flex-col items-center gap-1">
              <Avatar name={p.name} size="lg" />
              <span className="text-caption text-arena-muted text-center">
                {p.name.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* 5. Componentes de domínio */}
      <Section title="5. PlayerCard">
        <div className="rounded-card overflow-hidden border border-arena-border">
          {MOCK_PLAYERS.map((p) => (
            <PlayerCard
              key={p.name}
              name={p.name}
              role={p.role as "OWNER" | "ADMIN" | "PLAYER" | "REFEREE"}
              skill={p.skill}
              status={p.status as "CONFIRMED" | "DECLINED" | "PENDING" | undefined}
              onAction={p.status === "PENDING" ? () => {} : undefined}
              actionLabel={p.status === "PENDING" ? "Cobrar" : undefined}
            />
          ))}
        </div>
      </Section>

      <Section title="5. TeamBadge">
        <div className="flex flex-col gap-3">
          {MOCK_TEAMS.map((team, i) => (
            <TeamBadge
              key={team.name}
              name={team.name}
              color={getTeamColor(i)}
              averageSkill={team.averageSkill}
              players={team.players}
            />
          ))}
        </div>
      </Section>

      <Section title="5. PaymentRow">
        <div className="rounded-card overflow-hidden border border-arena-border">
          {MOCK_PAYMENTS.map((p) => (
            <PaymentRow
              key={p.name}
              name={p.name}
              amount={p.amount}
              status={p.status as "PENDING" | "APPROVED" | "REJECTED"}
              type={p.type as "DAILY" | "SUBSCRIPTION"}
              referenceLabel={p.referenceLabel}
              onAction={p.status === "PENDING" ? () => {} : undefined}
              actionLabel={p.status === "PENDING" ? "Cobrar" : undefined}
            />
          ))}
        </div>
      </Section>

      <Section title="5. MatchHeader">
        <MatchHeader
          groupName="Pelada do Bairro"
          scheduledAt={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()}
          location={{ name: "Quadra do Zé", address: "Rua das Acácias, 120" }}
          maxPlayers={14}
          confirmedCount={9}
          matchStatus="SCHEDULED"
          presenceListStatus="OPEN"
          userPresenceStatus={null}
          onAction={() => {}}
        />
        <MatchHeader
          groupName="Pelada do Bairro"
          scheduledAt={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()}
          location={{ name: "Quadra do Zé" }}
          maxPlayers={14}
          confirmedCount={14}
          matchStatus="SCHEDULED"
          presenceListStatus="OPEN"
          userPresenceStatus="CONFIRMED"
          onAction={() => {}}
        />
        <MatchHeader
          groupName="Liga Amadora"
          scheduledAt={new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()}
          location={{ name: "Arena Central" }}
          maxPlayers={10}
          confirmedCount={10}
          matchStatus="COMPLETED"
          presenceListStatus="CLOSED"
        />
      </Section>
    </div>
  )
}
