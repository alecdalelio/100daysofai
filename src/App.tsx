import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/ui/navigation";
import Home from "./pages/Home";
import DailyLog from "./pages/DailyLog";
import LogEntry from "./pages/LogEntry";
import NewLog from "./pages/NewLog";
import Projects from "./pages/Projects";
import Stack from "./pages/Stack";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/log" element={<DailyLog />} />
          <Route path="/log/:id" element={<LogEntry />} />
          <Route path="/new-log" element={<NewLog />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/stack" element={<Stack />} />
          <Route path="/about" element={<About />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
