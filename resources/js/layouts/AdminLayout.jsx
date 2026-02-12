import { Outlet } from "react-router-dom";
import Header from "../Components/website/Header";

export default function AdminLayout() {

  return (
    <>
        <Header/>

    <Outlet/>
    </>
  );
}
