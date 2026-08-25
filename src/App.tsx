import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import DatasetCompletionBootstrap from "./components/DatasetCompletionBootstrap";
import Landing from "./pages/Landing";
import IDE from "./pages/IDE";
import PocketBIHandoff from "./pages/PocketBIHandoff";
import PocketBICallback from "./pages/PocketBICallback";
import RuntimeLab from "./pages/RuntimeLab";
import SharedCode from "./pages/SharedCode";
import NotFound from "./pages/NotFound";
import Features from "./pages/Features";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support";
import Testimonials from "./pages/Testimonials";
import DataScienceStudents from "./pages/use-cases/DataScienceStudents";
import StatisticsR from "./pages/use-cases/StatisticsR";
import MobileCoding from "./pages/use-cases/MobileCoding";
import VsGoogleColab from "./pages/comparisons/VsGoogleColab";
import BlogIndex from "./pages/blog/BlogIndex";
import DocsIndex from "./pages/docs/DocsIndex";
import PythonDocs from "./pages/docs/PythonDocs";
import RDocs from "./pages/docs/RDocs";
import JavaScriptDocs from "./pages/docs/JavaScriptDocs";
import SQLDocs from "./pages/docs/SQLDocs";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
          <TooltipProvider delayDuration={0}>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <DatasetCompletionBootstrap />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/ide" element={<IDE />} />
                <Route path="/pocketbi-handoff" element={<PocketBIHandoff />} />
                <Route path="/auth/pocketbi/callback" element={<PocketBICallback />} />
                <Route path="/runtime-lab" element={<RuntimeLab />} />
                <Route path="/features" element={<Features />} />
                <Route path="/tutorials" element={<Navigate to="/docs" replace />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/account" element={<Account />} />
                <Route path="/upgrade" element={<Navigate to="/account" replace />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/support" element={<Support />} />
                <Route path="/testimonials" element={<Testimonials />} />
                <Route path="/share/:shortId" element={<SharedCode />} />
                <Route path="/use-cases/data-science-students" element={<DataScienceStudents />} />
                <Route path="/use-cases/statistics-r-programming" element={<StatisticsR />} />
                <Route path="/use-cases/mobile-coding" element={<MobileCoding />} />
                <Route path="/comparisons/bide-vs-google-colab" element={<VsGoogleColab />} />
                <Route path="/comparisons/openide-vs-google-colab" element={<VsGoogleColab />} />
                <Route path="/blog" element={<BlogIndex />} />
                <Route path="/docs" element={<DocsIndex />} />
                <Route path="/docs/python" element={<PythonDocs />} />
                <Route path="/docs/r" element={<RDocs />} />
                <Route path="/docs/javascript" element={<JavaScriptDocs />} />
                <Route path="/docs/sql" element={<SQLDocs />} />
                <Route path="/docs/php" element={<Navigate to="/docs" replace />} />
                <Route path="/docs/ruby" element={<Navigate to="/docs" replace />} />
                <Route path="/docs/lua" element={<Navigate to="/docs" replace />} />
                <Route path="/docs/java" element={<Navigate to="/docs" replace />} />
                <Route path="/docs/typescript" element={<Navigate to="/docs" replace />} />
                <Route path="/docs/cpp" element={<Navigate to="/docs" replace />} />
                <Route path="/docs/c" element={<Navigate to="/docs" replace />} />
                <Route path="/docs/rust" element={<Navigate to="/docs" replace />} />
                <Route path="/docs/go" element={<Navigate to="/docs" replace />} />
                <Route path="/docs/swift" element={<Navigate to="/docs" replace />} />
                <Route path="/docs/kotlin" element={<Navigate to="/docs" replace />} />
                <Route path="/docs/csharp" element={<Navigate to="/docs" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
