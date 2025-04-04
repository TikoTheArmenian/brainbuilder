import { useReactFlow } from "@xyflow/react";
import { ZoomIn, ZoomOut, Maximize, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function Controls({
  onInteractivityChange,
  isInteractive = true,
}: {
  onInteractivityChange?: (isInteractive: boolean) => void;
  isInteractive?: boolean;
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { theme, setTheme } = useTheme();

  return (
    <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="size-10 bg-background/50 hover:bg-accent/50"
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => zoomIn()}
        className="size-10 bg-background/50 hover:bg-accent/50"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => zoomOut()}
        className="size-10 bg-background/50 hover:bg-accent/50"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => fitView({ duration: 500 })}
        className="size-10 bg-background/50 hover:bg-accent/50"
      >
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  );
} 