"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-background/80 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl",
                    description: "group-[.toast]:text-muted-foreground text-xs",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-medium rounded-lg",
                    cancelButton:
                        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-medium rounded-lg",
                    success: "group-[.toast]:border-emerald-500/50 group-[.toast]:bg-emerald-500/10 group-[.toast]:text-emerald-600 dark:group-[.toast]:text-emerald-400",
                    error: "group-[.toast]:border-destructive/50 group-[.toast]:bg-destructive/10 group-[.toast]:text-destructive dark:group-[.toast]:text-red-400",
                    warning: "group-[.toast]:border-amber-500/50 group-[.toast]:bg-amber-500/10 group-[.toast]:text-amber-600 dark:group-[.toast]:text-amber-400",
                    info: "group-[.toast]:border-blue-500/50 group-[.toast]:bg-blue-500/10 group-[.toast]:text-blue-600 dark:group-[.toast]:text-blue-400",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
