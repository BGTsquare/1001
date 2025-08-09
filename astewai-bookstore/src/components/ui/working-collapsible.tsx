"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface CollapsibleContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextType | null>(null)

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ children, className, defaultOpen = false, open: controlledOpen, onOpenChange, ...props }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
    
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = React.useCallback((newOpen: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(newOpen)
      }
      onOpenChange?.(newOpen)
    }, [controlledOpen, onOpenChange])

    return (
      <CollapsibleContext.Provider value={{ open, setOpen }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props}>
          {children}
        </div>
      </CollapsibleContext.Provider>
    )
  }
)
Collapsible.displayName = "Collapsible"

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children, className, onClick, asChild, ...props }, ref) => {
  const context = React.useContext(CollapsibleContext)
  
  if (!context) {
    throw new Error("CollapsibleTrigger must be used within a Collapsible")
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    context.setOpen(!context.open)
    onClick?.(event)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...children.props,
      onClick: handleClick,
    })
  }

  return (
    <button
      ref={ref}
      type="button"
      className={cn("flex w-full items-center justify-between", className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
})
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  const context = React.useContext(CollapsibleContext)
  
  if (!context) {
    throw new Error("CollapsibleContent must be used within a Collapsible")
  }

  if (!context.open) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn("overflow-hidden transition-all duration-200", className)}
      {...props}
    >
      {children}
    </div>
  )
})
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }