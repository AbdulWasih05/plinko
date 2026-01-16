import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(({
    className,
    variant = 'primary',
    size = 'default',
    isLoading = false,
    children,
    ...props
}, ref) => {
    const variants = {
        primary: "bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(124,58,237,0.5)] border border-primary/50",
        secondary: "bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
        ghost: "hover:bg-surface text-gray-400 hover:text-white",
        danger: "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50",
        outline: "border border-gray-700 bg-transparent hover:bg-gray-800 text-gray-300",
        neon: "bg-gradient-to-r from-primary to-accent text-white font-bold shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:shadow-[0_0_30px_rgba(244,63,94,0.6)] border-none transition-all duration-300 hover:scale-[1.02]"
    };

    const sizes = {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md text-xs",
        lg: "h-12 px-8 rounded-md text-lg",
        icon: "h-10 w-10",
    };

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
                variants[variant],
                sizes[size],
                className
            )}
            ref={ref}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
});

Button.displayName = "Button";

export default Button;
