import React from "react";
import { getDefinition } from "@/data/glossary";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface GlossaryHintProps {
  term: string;
  children?: React.ReactNode;
  className?: string;
}

export function GlossaryHint({ term, children, className }: GlossaryHintProps) {
  const definition = getDefinition(term);
  
  // If no definition found, render just the children/term without tooltip
  if (!definition) {
    return <span className={className}>{children ?? term}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "cursor-help border-b border-dotted border-current",
              className
            )}
            tabIndex={0}
            aria-describedby={`glossary-${term.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {children ?? term}
          </span>
        </TooltipTrigger>
        <TooltipContent
          id={`glossary-${term.toLowerCase().replace(/\s+/g, '-')}`}
          className="max-w-xs"
        >
          <p className="font-medium">{definition.term}</p>
          <p className="text-sm text-muted-foreground">{definition.short}</p>
          {definition.aka && definition.aka.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Also known as: {definition.aka.join(", ")}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
