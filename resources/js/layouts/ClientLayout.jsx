import { Outlet } from "react-router-dom";

export default function ClientLayout() {
  return (
    <div className="client">
      <Sidebar />
      <div className="content">
        <h1>Je suis là</h1>
        <Topbar />
        <Outlet />
      </div>
    </div>
  );
}
