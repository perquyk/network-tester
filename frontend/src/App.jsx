import {BrowserRouter, Routes, Route } from 'react-router-dom'
import DeviceList from './pages/DeviceList'
import DeviceDashboard from './pages/DeviceDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DeviceList />} />
        <Route path="/device/:deviceId" element={<DeviceDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App