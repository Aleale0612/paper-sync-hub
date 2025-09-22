import { Link, useLocation } from "react-router-dom";
import { Plus, History, TrendingUp, LogOut, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/journal/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ChartStyle } from "../ui/chart";

export const Navigation = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { name: "Charts", path: "/journal/TradingViewPages", icon: Brain},
    { name: "Add Trade", path: "/journal/add-trade", icon: Plus },
    { name: "Trade History", path: "/journal/history", icon: History },
    { name: "Analytics", path: "/journal/analytics", icon: TrendingUp },
    { name: "JournalPapersAI", path: "/journal/mentor", icon: Brain },
  ];

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50 theme-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl font-bold bg-gradient-to-r from-primary to-trading-light bg-clip-text text-transparent"
          >
            JournalPapers
          </motion.h1>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            {/* Desktop */}
            <nav className="hidden sm:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <motion.div key={item.path} whileHover={{ scale: 1.05 }}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 theme-transition",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                      )}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Mobile */}
            <nav className="flex sm:hidden space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <motion.div key={item.path} whileHover={{ scale: 1.1 }}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center p-2 rounded-lg text-sm font-medium transition-colors duration-200 theme-transition",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                      )}
                      title={item.name}
                    >
                      <Icon className="w-5 h-5" />
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Right Side */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
