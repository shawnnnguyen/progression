import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedLayout from "./routes/protected-layout";
import RequireOrgLayout from "./routes/require-org-layout";
import LoginRoute from "./routes/login";
import SignUpRoute from "./routes/signup";
import OnboardingRoute from "./routes/onboarding";
import AcceptInviteRoute from "./routes/accept-invite";
import DashboardRoute from "./routes/dashboard";
import ProjectBoardRoute from "./routes/project-board";
import ProjectListRoute from "./routes/project-list";
import ProjectSprintsRoute from "./routes/project-sprints";
import TicketDetailRoute from "./routes/ticket-detail";
import NotFoundRoute from "./routes/not-found";

export const router = createBrowserRouter([
  { path: "login", element: <LoginRoute /> },
  { path: "signup", element: <SignUpRoute /> },
  {
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "onboarding", element: <OnboardingRoute /> },
      { path: "invites/:inviteId/accept", element: <AcceptInviteRoute /> },
      {
        element: <RequireOrgLayout />,
        children: [
          { path: "dashboard", element: <DashboardRoute /> },
          { path: "projects/:projectId/board", element: <ProjectBoardRoute /> },
          { path: "projects/:projectId/list", element: <ProjectListRoute /> },
          { path: "projects/:projectId/sprints", element: <ProjectSprintsRoute /> },
          { path: "projects/:projectId/tickets/:ticketNumber", element: <TicketDetailRoute /> },
          { path: "*", element: <NotFoundRoute /> },
        ],
      },
    ],
  },
]);
