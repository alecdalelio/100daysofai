import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./theme/ThemeProvider";
import { AuthProvider } from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";
import Header from "./components/Header";
import Account from "./pages/Account";
import MyLogs from "./pages/MyLogs";
import Onboarding from "./pages/Onboarding";
import Syllabus from "./pages/Syllabus";
import Home from "./pages/Home";
import DailyLog from "./pages/DailyLog";
import LogEntry from "./pages/LogEntry";
import NewLog from "./pages/NewLog";
import Projects from "./pages/Projects";
import Stack from "./pages/Stack";
import About from "./pages/About";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/log" element={<DailyLog />} />
            <Route path="/log/:id" element={<LogEntry />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/stack" element={<Stack />} />
            <Route path="/about" element={<About />} />
            
            {/* Protected routes */}
            <Route
              path="/new-log"
              element={
                <ProtectedRoute>
                  <NewLog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/syllabus/:id"
              element={
                <ProtectedRoute>
                  <Syllabus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my/logs"
              element={
                <ProtectedRoute>
                  <MyLogs />
                </ProtectedRoute>
              }
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
