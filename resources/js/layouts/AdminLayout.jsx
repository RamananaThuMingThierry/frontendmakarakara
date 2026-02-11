import { Outlet } from "react-router-dom";
import Footer from "../components/common/Footer";

export default function AdminLayout() {

  const user = {
    name: "Admin User",
    avatar: null 
  };

  const handleToggleSidebar = () => {
    document.body.classList.toggle("sb-sidenav-toggled");
  }

  const handleChangeLang = (lang) => {
    console.log("Change language to:", lang);
  }

  const handleLogout = () => {
    console.log("Logout");
  }

  return (
    <div className="sb-nav-fixed">
      <Nav 
        onToggleSidebar={handleToggleSidebar}
        onChangeLang={handleChangeLang}
        onLogout={handleLogout}
        user={user}
        locale="fr"
        assetsBaseUrl="/"
       />
       <div id="layoutSidenav">
          <div id="layoutSidenav_nav">
            <Sidebar />
          </div>
          <div id="layoutSidenav_content" style={{ backgroundColor: "#f8f9fa" }}>  
            <main>
              <div className="container-fluid">
                <Outlet />
              </div>  
            </main>
            <Footer/>
          </div>
       </div>
  
    </div>
  );
}
