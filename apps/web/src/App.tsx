import { Navigate, Route, Routes } from "react-router-dom";
import { CasesListPage } from "./pages/CasesListPage";
import { CaseDetailPage } from "./pages/CaseDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { AdminThresholdPage } from "./pages/AdminThresholdPage";
import { AdminMerchantsPage } from "./pages/AdminMerchantsPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { NavBar } from "./components/NavBar";

export function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/cases" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/cases"
          element={
            <ProtectedRoute>
              <CasesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cases/:id"
          element={
            <ProtectedRoute>
              <CaseDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/threshold"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "AUDITOR"]}>
              <AdminThresholdPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/merchants"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "AUDITOR"]}>
              <AdminMerchantsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "AUDITOR"]}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
