import { Outlet } from "react-router-dom";
import ClientMenu from "../Components/client/ClientMenu";

export default function ClientLayout() {
  return (
    <main className="py-5" style={{ background: "#fbf7ec", minHeight: "calc(100vh - 140px)" }}>
      <div className="container">
        <div className="row g-4 align-items-start">
          <div className="col-12 col-lg-4 col-xl-3">
            <ClientMenu />
          </div>
          <div className="col-12 col-lg-8 col-xl-9">
            <Outlet />
          </div>
        </div>
      </div>
    </main>
  );
}
