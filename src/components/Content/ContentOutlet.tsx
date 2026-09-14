import { Outlet } from "react-router-dom";

export default function ContentOutlet() {
    // Scrolling is owned by the parent <Content> so the page and footer scroll as one region.
    // A second scroll container here produced a redundant scrollbar on taller (finance) pages.
    return (
        <div style={{ padding: "8px 8px 8px" }}>
            <Outlet />
        </div>
    );
}
