interface PageFooterProps {
  children: React.ReactNode;
  variant?: "main" | "reference";
}

export function PageFooter({ children, variant = "reference" }: PageFooterProps) {
  const className =
    variant === "main"
      ? "tw:text-center tw:text-text-muted tw:text-sm tw:py-4 tw:border-t tw:border-border tw:mt-6"
      : "tw:text-center tw:text-sm tw:py-4 tw:mt-2 ref-page-footer";
  return <footer className={className}>{children}</footer>;
}
