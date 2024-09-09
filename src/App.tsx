import { Layout } from "antd";
import { useLayoutEffect, useState } from "react";
import "./App.css";
import ContentComponent from "./components/Content/ContentComponent";
import LeftSidebarComponent from "./components/Sidebar/LeftSidebarComponent";
import { useAuthHook } from "./hooks/useAuthHook";
import { checkTockenValidity } from "./utils/utils";

function App() {
    const [collapsed, setCollapsed] = useState(false);
    const { login, user } = useAuthHook();

    const handleToggleCollapse = (value: boolean) => {
        setCollapsed(value);
    };

    useLayoutEffect(() => {
        const tokenContent = localStorage.getItem("tokenContent");
        if (tokenContent && checkTockenValidity(tokenContent)) {
            login(tokenContent);
        }
    }, []);

    return (
        <Layout
           
        >
            {user?.token && (
                <LeftSidebarComponent
                    collapsed={collapsed}
                    onToggleCollapse={handleToggleCollapse}
                />
            )}
            <ContentComponent
                collapsed={collapsed}
                onToggleCollapse={handleToggleCollapse}
            />
        </Layout>
    );
}

export default App;
