interface PageFooterProps {
  children: React.ReactNode;
  variant?: "main" | "reference";
}

export function PageFooter({ children, variant = "reference" }: PageFooterProps) {
  const className =
    variant === "main"
      ? "text-center text-text-muted text-sm py-4 border-t border-border mt-6"
      : "text-center text-sm py-4 mt-2 ref-page-footer";
  return <footer className={className}>{children}</footer>;
}
