import { RootState } from "../../redux/store";
import React, { ReactNode } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import NotPermitted from "./NotPermitted";

interface ProtectedRouteProps {
  children: ReactNode;
}

const RoleBaseRoute = ({ children }: ProtectedRouteProps) => {
  const isAdminRoute = window.location.pathname.startsWith("/admin");
  const user = useSelector((state: RootState) => state.account.user);
  const userRole = user.role;

  if (isAdminRoute && userRole === "ADMIN") {
    return <>{children}</>;
  } else {
    return <NotPermitted />;
  }
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useSelector(
    (state: RootState) => state.account.isAuthenticated
  );
  return (
    <>
      {isAuthenticated ? (
        <>
          <RoleBaseRoute>{children}</RoleBaseRoute>
        </>
      ) : (
        <Navigate to={"/login"} replace />
      )}
    </>
  );
}
