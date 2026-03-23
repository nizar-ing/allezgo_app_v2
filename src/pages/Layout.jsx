import {Outlet} from "react-router-dom";


import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

function Layout() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header/>
            <main className="flex-grow bg-sky-50 p-2 pt-24">
                <Outlet/>
            </main>
            <Footer/>
        </div>
    );
}

export default Layout;
