import {Outlet} from "react-router-dom";

import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import SocialFloatingWidget from "../components/SocialFloatingWidget.jsx";
import useSettings from "../custom-hooks/useSettings.js";

function Layout() {
    useSettings(); // syncs apiClient.benefitRate from DB for all users/pages
    return (
        <div className="flex flex-col min-h-screen">
            <Header/>
            <main className="flex-grow bg-sky-50 p-2 pt-24">
                <Outlet/>
            </main>
            <Footer/>
            <SocialFloatingWidget />
        </div>
    );
}

export default Layout;
