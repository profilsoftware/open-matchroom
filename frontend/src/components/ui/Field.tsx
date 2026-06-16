import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

export interface FieldProps {
  label: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

/** Shared control styling for inputs, selects and textareas. */
const CONTROL =
  "w-full rounded-[9px] border border-line bg-surface-2 px-3 py-2.5 text-[14px] text-ink transition-colors focus:border-brand focus:bg-surface focus:shadow-[0_0_0_3px_var(--brand-tint)] focus:outline-none";

/** Labelled form row (`<label>` + control). Wrap an Input / Select / Textarea. */
export function Field({ label, htmlFor, children, className }: FieldProps) {
  return (
    <div className={cn("mb-3.5 flex flex-col gap-1.5", className)}>
      <label className="font-semibold text-[12px] text-ink-2" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(CONTROL, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, className)} {...props} />;
}
