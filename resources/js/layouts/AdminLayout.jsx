import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="admin">
      <Sidebar />
      <div className="content">
        <h1>Je suis là</h1>
        <Topbar />
        <Outlet />
      </div>
    </div>
  );
}
