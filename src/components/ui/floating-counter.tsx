import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "react-router-dom";

const FloatingCounter = () => {
  const location = useLocation();
  const currentDay = 0; // This could be dynamic based on current date
  const totalDays = 100;
  const progress = (currentDay / totalDays) * 100;

  // Only show on main pages
  const showCounter = ['/', '/log', '/projects', '/stack'].includes(location.pathname);

  if (!showCounter) return null;

  return (
    <div className="floating-counter">
      <Card className="p-3 min-w-[120px] glow-electric animate-glow-pulse">
        <CardContent className="p-0 text-center">
          <div className="text-xs text-muted-foreground mb-1">Progress</div>
          <Badge variant="secondary" className="text-sm font-mono font-bold">
            Day {currentDay}
          </Badge>
          <div className="text-xs text-muted-foreground mt-1">of {totalDays}</div>
          
          {/* Circular progress */}
          <div className="mt-3 relative w-12 h-12 mx-auto">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="stroke-muted"
                strokeWidth="3"
                fill="transparent"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="stroke-electric"
                strokeWidth="3"
                strokeDasharray={`${progress}, 100`}
                strokeLinecap="round"
                fill="transparent"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-mono font-bold text-electric">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FloatingCounter;