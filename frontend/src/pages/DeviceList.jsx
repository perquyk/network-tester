import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function DeviceList() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showOnlineOnly, setShowOnlineOnly] = useState(false)
  const [showAllDevices, setShowAllDevices] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Initial fetch
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

    // Set up interval to refresh device list every 5 seconds
    const interval = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/devices`)
        .then(response => response.json())
        .then(data => setDevices(data.devices))
        .catch(error => console.error('Error:', error))
    }, 5000)

    // Cleanup function
    return () => clearInterval(interval)
  }, [])
  
  const handleDeviceClick = (deviceId) => {
    navigate(`/device/${deviceId}`)
  }

  const isDeviceRecentlyActive = (device) => {
    const lastSeenTime = new Date(device.last_seen).getTime()
    const currentTime = new Date().getTime()
    const oneHourInMs = 60 * 60 * 1000
    return (currentTime - lastSeenTime) <= oneHourInMs
  }

  const filteredDevices = devices
    .filter(device => {
      // Filter by online status if enabled
      if (showOnlineOnly && !device.online) return false

      // Filter by recently active (within 1 hour) unless showAllDevices is enabled
      if (!showAllDevices && !isDeviceRecentlyActive(device)) return false

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          device.device_id.toLowerCase().includes(query) ||
          (device.name && device.name.toLowerCase().includes(query))
        )
      }

      return true
    })

  const onlineCount = devices.filter(device => device.online).length
  const recentDevicesCount = devices.filter(device => isDeviceRecentlyActive(device)).length
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🌐 Network Testing Dashboard</h1>
      <p>Select a device to view details and run tests</p>
      
      <div style={{ marginTop: '20px' }}>
        {loading ? (
          <p>Loading devices...</p>
        ) : (
          <div>
            <div style={{
              marginBottom: '15px',
              padding: '15px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <p style={{ margin: 0 }}>
                  Found {devices.length} device(s) | {onlineCount} online | {recentDevicesCount} active in last hour
                </p>
              </div>

              <input
                type="text"
                placeholder="Search devices by ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '15px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showOnlineOnly}
                    onChange={(e) => setShowOnlineOnly(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Show online only</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showAllDevices}
                    onChange={(e) => setShowAllDevices(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Show all devices (including inactive &gt;1h)</span>
                </label>
              </div>
            </div>
            {filteredDevices.map(device => (
              <div
                key={device.device_id}
                onClick={() => handleDeviceClick(device.device_id)}
                style={{
                  padding: '15px',
                  margin: '10px 0',
                  border: device.online ? '2px solid #4CAF50' : '2px solid #ccc',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: 'white',
                  position: 'relative'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '18px' }}>{device.device_id}</strong>
                    <br />
                    <span style={{ color: '#666' }}>{device.name}</span>
                    <br />
                    <small style={{ color: '#999' }}>
                      Last seen: {new Date(device.last_seen).toLocaleString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      })}
                    </small>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    backgroundColor: device.online ? '#4CAF50' : '#999',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      display: 'inline-block'
                    }}></span>
                    {device.online ? 'ONLINE' : 'OFFLINE'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DeviceList