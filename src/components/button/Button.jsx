import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../utils/cn";
import { ArrowPathIcon } from "@heroicons/react/24/solid";

const buttonVariants = {
  variant: {
    primary:
      "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 shadow-md hover:shadow-lg relative overflow-hidden group",
    secondary:
      "bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 active:from-gray-700 active:to-gray-800 shadow-md hover:shadow-lg relative overflow-hidden group",
    success:
      "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 shadow-md hover:shadow-lg relative overflow-hidden group",
    danger:
      "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 shadow-md hover:shadow-lg relative overflow-hidden group",
    blue:
      "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 active:from-blue-700 active:to-indigo-800 shadow-md hover:shadow-lg relative overflow-hidden group",
    outline:
      "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 shadow-sm hover:shadow relative overflow-hidden group",
    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100 relative overflow-hidden group",
    link: "text-red-600 hover:text-red-700 underline-offset-4 hover:underline bg-transparent relative overflow-hidden group",
  },
  size: {
    sm: "h-9 px-3 py-2 text-sm",
    md: "h-10 px-4 py-2 text-sm",
    lg: "h-11 px-6 py-3 text-base",
    icon: "h-10 w-10 p-0",
  },
};

// Ripple effect component
const RippleEffect = ({ x, y }) => {
  return (
    <span
      className="absolute rounded-full bg-white/40 pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: 0,
        height: 0,
        transform: 'translate(-50%, -50%)',
        animation: 'ripple 0.6s ease-out',
      }}
    />
  );
};

// Shine effect overlay
const ShineOverlay = () => {
  return (
    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
    </span>
  );
};

const Button = React.forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ripple = true,
      shine = true,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;
    const [ripples, setRipples] = useState([]);
    const buttonRef = useRef(null);

    // Combine refs
    useEffect(() => {
      if (typeof ref === "function") {
        ref(buttonRef.current);
      } else if (ref) {
        ref.current = buttonRef.current;
      }
    }, [ref]);

    const handleClick = (e) => {
      if (isDisabled || isLoading || !ripple) {
        props.onClick?.(e);
        return;
      }

      const button = buttonRef.current;
      if (!button) {
        props.onClick?.(e);
        return;
      }

      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newRipple = { x, y, id: Date.now() };
      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);

      props.onClick?.(e);
    };

    return (
      <button
        ref={buttonRef}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed relative",
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          isDisabled && variant !== "outline" && variant !== "ghost" && "bg-gray-100 text-gray-500 cursor-not-allowed",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effects */}
        {ripple && !isDisabled && !isLoading && (
          <span className="absolute inset-0 overflow-hidden rounded-lg">
            {ripples.map((ripple) => (
              <RippleEffect key={ripple.id} x={ripple.x} y={ripple.y} />
            ))}
          </span>
        )}

        {/* Shine effect */}
        {shine && !isDisabled && !isLoading && variant !== "link" && (
          <ShineOverlay />
        )}

        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isLoading ? (
            <>
              <ArrowPathIcon className="animate-spin h-4 w-4" />
              {children && <span>{children}</span>}
            </>
          ) : (
            <>
              {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
              {children && <span>{children}</span>}
              {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
            </>
          )}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
export { Button, buttonVariants };
