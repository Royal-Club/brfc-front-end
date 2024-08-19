import { Layout } from 'antd';
import { useState } from 'react';
import './App.css';
import ContentComponent from './components/Content/ContentComponent';
import LeftSidebarComponent from './components/Sidebar/LeftSidebarComponent';

function App() {

  const [collapsed, setCollapsed] = useState(false);

  const handleToggleCollapse = (value: boolean) => {
    setCollapsed(value);
  };

  
  return (
    <div className="App">
        <Layout>
          <LeftSidebarComponent collapsed={collapsed} onToggleCollapse={handleToggleCollapse}/>
          <ContentComponent collapsed={collapsed} onToggleCollapse={handleToggleCollapse}/>
        </Layout>
    </div>
  );
}

export default App;
