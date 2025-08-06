import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/log", label: "Daily Log" },
    { href: "/projects", label: "Projects" },
    { href: "/stack", label: "Stack" },
    { href: "/about", label: "About" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="text-xl font-bold font-mono gradient-text-electric hover:scale-105 transition-all duration-300 hover-lift"
          >
            #100DaysOfAI
          </Link>
          
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                  "hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5",
                  "relative overflow-hidden group",
                  location.pathname === item.href
                    ? "bg-accent text-accent-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="relative z-10">{item.label}</span>
                {location.pathname === item.href && (
                  <div className="absolute inset-0 bg-gradient-to-r from-electric/5 to-cyber/5 shimmer" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;