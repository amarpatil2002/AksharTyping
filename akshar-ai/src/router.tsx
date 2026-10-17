import { createBrowserRouter, Navigate } from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout";
import AuthLayout from "./layouts/AuthLayout";
import AppLayout from "./layouts/AppLayout";

import LandingPage from "./pages/LandingPage";
import NotFoundPage from "./pages/PageNotfound";
import PlaceholderPage from "./pages/PlaceholderPage";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import TypingTestPage from "./pages/TypingTestPage";
import PassagesPage from "./pages/PassagePage";
import ExamPracticePage from "./pages/exams/ExamPracticePage";
import ExamInstructionsPage from "./pages/exams/ExamInstructionsPage";
import ExamKeyboardTestPage from "./pages/exams/ExamKeyboardTestPage";
import ExamBreakPage from "./pages/exams/ExamBreakPage";
import ExamTestPage from "./pages/exams/ExamTestPage";
import ExamResultsPage from "./pages/exams/ExamResultsPage";

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/signup",
        element: <SignupPage />,
      },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      {
        path: "/passages",
        element: <PassagesPage />,
      },
      {
        path: "/typing",
        element: <TypingTestPage />,
      },
      {
        path: "exam",
        element: <ExamPracticePage />,
      },
      {
        path: "exam/:examId/instructions",
        element: <ExamInstructionsPage />,
      },
      {
        path: "exam/:examId/keyboard-test",
        element: <ExamKeyboardTestPage />,
      },
      {
        path: "exam/:examId/break",
        element: <ExamBreakPage />,
      },
      {
        path: "exam/:examId/test",
        element: <ExamTestPage />,
      },
      {
        path: "exam/:examId/result",
        element: <ExamResultsPage />,
      },
      {
        path: "/ai-coach",
        element: <PlaceholderPage title="AI Coach" />,
      },
      {
        path: "/analytics",
        element: <PlaceholderPage title="Analytics" />,
      },
      {
        path: "/achievements",
        element: <PlaceholderPage title="Achievements" />,
      },

      {
        path: "/profile",
        element: <PlaceholderPage title="Profile" />,
      },
    ],
  },
  {
    path: "/home",
    element: <Navigate to="/" replace />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
