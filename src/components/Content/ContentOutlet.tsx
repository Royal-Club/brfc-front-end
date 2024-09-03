import { Outlet } from "react-router-dom";
import colors from "../../utils/colors";

export default function ContentOutlet() {
    return (
        <div
            style={{
                padding: "16px 16px 0 16px",
                backgroundColor: colors.background,
            }}
        >
            <Outlet />
        </div>
    );
}
