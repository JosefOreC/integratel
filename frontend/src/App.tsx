import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { ClientesPage } from "./pages/ClientesPage";
import { PrediccionPage } from "./pages/PrediccionPage";
import { ReportesPage } from "./pages/ReportesPage";
import { ChatPage } from "./pages/ChatPage";
import { ImportarPage } from "./pages/ImportarPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"  element={<DashboardPage />} />
          <Route path="/clientes"   element={<ClientesPage />} />
          <Route path="/prediccion" element={<PrediccionPage />} />
          <Route path="/reportes"   element={<ReportesPage />} />
          <Route path="/chat"       element={<ChatPage />} />
          <Route path="/importar"  element={<ImportarPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
