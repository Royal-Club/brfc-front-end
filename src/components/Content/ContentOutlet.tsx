import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

export default function ContentOutlet() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);
    
    return (
        <div
            style={{
                padding: "10px 10px 10px",
                maxHeight: isMobile ? "calc(100vh - 64px)" : "calc(100vh - 64px)",
                overflow: "auto",
            }}
            className="slimScroll"
        >
            <Outlet />
        </div>
    );
}
