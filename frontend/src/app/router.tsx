import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShellLayout } from "@/components/layout/AppShellLayout";
import DashboardRoute from "./routes/dashboard";
import ProjectBoardRoute from "./routes/project-board";
import ProjectListRoute from "./routes/project-list";
import NotFoundRoute from "./routes/not-found";

export const router = createBrowserRouter([
  {
    element: <AppShellLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardRoute /> },
      { path: "projects/:projectId/board", element: <ProjectBoardRoute /> },
      { path: "projects/:projectId/list", element: <ProjectListRoute /> },
      { path: "*", element: <NotFoundRoute /> },
    ],
  },
]);
