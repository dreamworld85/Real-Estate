import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-ink text-cream hover:bg-forest active:bg-ink/90 disabled:bg-slate/40",
  secondary:
    "bg-transparent text-ink border border-ink/20 hover:bg-sage",
  ghost: "bg-transparent text-ink hover:bg-sage",
  destructive:
    "bg-transparent text-coral border border-coral/30 hover:bg-coral/5",
};

export default function Button({
  variant = "primary",
  fullWidth = true,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`font-display font-semibold text-[15px] rounded-2xl py-3.5 px-5 transition-colors duration-150 disabled:cursor-not-allowed ${
        fullWidth ? "w-full" : ""
      } ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
