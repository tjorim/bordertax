Generate Base UI primitives here with `pnpm dlx shadcn@latest add <component>`.
`components.json` pins the `base-nova` Base UI style, Lucide icons and `@/lib/utils`;
the root `tsconfig.json` declares the `@/*` alias so the CLI writes to this folder.
Move any file the CLI writes elsewhere into `src/components/ui` and check its
imports, then restyle it with Bordertax tokens and run `pnpm lint`.

Variants use `class-variance-authority` and are exported (`buttonVariants`,
`badgeVariants`, `alertVariants`). `Button` follows the shadcn variant names
(`default`, `outline`, `secondary`, `ghost`, `destructive`, `link`) plus the
Bordertax `outline-primary` and `outline-secondary` label buttons. Forms use
`Field*` helpers with explicit input IDs; checkbox values use Base UI
`onCheckedChange`. Tooltips need a `TooltipProvider` above them.
