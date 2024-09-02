import { Layout } from "antd";
import { useLayoutEffect, useState } from "react";
import "./App.css";
import ContentComponent from "./components/Content/ContentComponent";
import LeftSidebarComponent from "./components/Sidebar/LeftSidebarComponent";
import { useSelector } from "react-redux";
import {
    selectLoginInfo,
    setAllData,
    setToken,
} from "./state/slices/loginInfoSlice";
import { useDispatch } from "react-redux";

function App() {
    const [collapsed, setCollapsed] = useState(false);
    const dispatch = useDispatch();
    const loginInfo = useSelector(selectLoginInfo);

    const handleToggleCollapse = (value: boolean) => {
        setCollapsed(value);
    };

    useLayoutEffect(() => {
        const tokenContent = localStorage.getItem("tokenContent");
        if (tokenContent) {
            const contentData = JSON.parse(tokenContent);
            dispatch(setAllData(contentData));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    return (
        <div className="App">
            <Layout>
                {loginInfo?.token && (
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
        </div>
    );
}

export default App;
