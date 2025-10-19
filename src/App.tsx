import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Landing from "./pages/Landing";
import IDE from "./pages/IDE";
import SharedCode from "./pages/SharedCode";
import NotFound from "./pages/NotFound";
import Features from "./pages/Features";
import Tutorials from "./pages/Tutorials";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import Upgrade from "./pages/Upgrade";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support";
import Testimonials from "./pages/Testimonials";
import DataScienceStudents from "./pages/use-cases/DataScienceStudents";
import StatisticsR from "./pages/use-cases/StatisticsR";
import MobileCoding from "./pages/use-cases/MobileCoding";
import VsGoogleColab from "./pages/comparisons/VsGoogleColab";
import BlogIndex from "./pages/blog/BlogIndex";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider delayDuration={0}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/ide" element={<IDE />} />
              <Route path="/features" element={<Features />} />
              <Route path="/tutorials" element={<Tutorials />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/account" element={<Account />} />
              <Route path="/upgrade" element={<Upgrade />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/support" element={<Support />} />
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/share/:shortId" element={<SharedCode />} />
              
              {/* Use Case Pages */}
              <Route path="/use-cases/data-science-students" element={<DataScienceStudents />} />
              <Route path="/use-cases/statistics-r-programming" element={<StatisticsR />} />
              <Route path="/use-cases/mobile-coding" element={<MobileCoding />} />
              
              {/* Comparison Pages */}
              <Route path="/comparisons/bide-vs-google-colab" element={<VsGoogleColab />} />
              <Route path="/comparisons/openide-vs-google-colab" element={<VsGoogleColab />} />
              
              {/* Blog */}
              <Route path="/blog" element={<BlogIndex />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
