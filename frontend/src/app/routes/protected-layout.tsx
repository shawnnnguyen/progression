import { Outlet } from "react-router-dom";
import { CurrentUserProvider } from "@/features/auth/components/CurrentUserProvider";

export default function ProtectedLayout() {
  return (
    <CurrentUserProvider>
      <Outlet />
    </CurrentUserProvider>
  );
}
