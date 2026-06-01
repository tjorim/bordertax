interface PageFooterProps {
  children: React.ReactNode;
  variant?: "main" | "reference";
}

export function PageFooter({ children, variant = "reference" }: PageFooterProps) {
  const className =
    variant === "main"
      ? "text-center text-muted small py-3 border-top mt-4"
      : "text-center small py-3 mt-2 ref-page-footer";
  return <footer className={className}>{children}</footer>;
}
