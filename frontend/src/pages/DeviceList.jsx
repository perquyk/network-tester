import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function DeviceList() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/devices`)
      .then(response => response.json())
      .then(data => {
        setDevices(data.devices)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error:', error)
        setLoading(false)
      })
  }, [])
  
  const handleDeviceClick = (deviceId) => {
    navigate(`/device/${deviceId}`)
  }
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🌐 Network Testing Dashboard</h1>
      <p>Select a device to view details and run tests</p>
      
      <div style={{ marginTop: '20px' }}>
        {loading ? (
          <p>Loading devices...</p>
        ) : (
          <div>
            <p>Found {devices.length} device(s)</p>
            {devices.map(device => (
              <div 
                key={device.device_id}
                onClick={() => handleDeviceClick(device.device_id)}
                style={{ 
                  padding: '15px', 
                  margin: '10px 0', 
                  border: '2px solid #4CAF50',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: 'white'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                <strong style={{ fontSize: '18px' }}>{device.device_id}</strong>
                <br />
                <span style={{ color: '#666' }}>{device.name}</span>
                <br />
                <small style={{ color: '#999' }}>
                  Last seen: {new Date(device.last_seen).toLocaleString()}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DeviceList