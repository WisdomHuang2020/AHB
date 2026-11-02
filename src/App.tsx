import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Fundamentals from './pages/Fundamentals'
import Operation from './pages/Operation'
import Derivations from './pages/Derivations'
import Curves from './pages/Curves'
import Designer from './pages/Designer'
import Report from './pages/Report'
import Feedback from './pages/Feedback'
import Admin from './pages/Admin'
import { DesignProvider } from './lib/DesignContext'

function App() {
  return (
    <DesignProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fundamentals" element={<Fundamentals />} />
            <Route path="/operation" element={<Operation />} />
            <Route path="/derivations" element={<Derivations />} />
            <Route path="/curves" element={<Curves />} />
            <Route path="/designer" element={<Designer />} />
            <Route path="/report" element={<Report />} />
            <Route path="/feedback" element={<Feedback />} />
            {/* 后台不在导航中露出，仅通过直达 URL 访问。真正的边界在服务端。 */}
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </DesignProvider>
  )
}

export default App
