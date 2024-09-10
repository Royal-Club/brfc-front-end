import { Outlet } from "react-router-dom";

export default function ContentOutlet() {
    
    return (
        <div
            style={{
                padding: "10px 10px  10px",
                maxHeight: "calc(100vh - 64px)",
                overflow: "auto",
            }}
            className="slimScroll"
        >
            <Outlet />
        </div>
    );
}
