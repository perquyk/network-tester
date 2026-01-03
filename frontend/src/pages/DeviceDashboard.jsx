import {useState, useEffect} from 'react'
import {useParams, useNavigate} from 'react-router-dom'

function NewDeviceDashboard() {
    const { deviceId } = useParams()
    const navigate = useNavigate()
    const [tests, setTests] = useState([])
    const [loading, setLoading] = useState(true)
    const [testTarget, setTestTarget] = useState("8.8.8.8")
    const [expandedCard, setExpandedCard] = useState('ping') // Track which accordion is open

    useEffect(() => {
        // Initial fetch
        fetch(`${import.meta.env.VITE_API_URL}/tests?device_id=${deviceId}`)
            .then(response => response.json())
            .then(data => {
                setTests(data.tests)
                setLoading(false)
            })
            .catch(error => {
                console.error('Error: ', error)
                setLoading(false)
            })

        // Set up interval for subsequent fetches
        const interval = setInterval(() => {
            fetch(`${import.meta.env.VITE_API_URL}/tests?device_id=${deviceId}`)
                .then(response => response.json())
                .then(data => setTests(data.tests))
                .catch(error => console.error('Error: ', error))
        }, 10000)

        // Cleanup function
        return () => clearInterval(interval)
    }, [deviceId])

    const runPingTest = () => {
        fetch(`${import.meta.env.VITE_API_URL}/device/${deviceId}/test?target=${testTarget}&count=4`)
            .then(response => response.json())
            .then(data => {
                alert('Ping test started! Refresh in a few seconds.')
            })
    }

    const runSpeedtest = () => {
        fetch(`${import.meta.env.VITE_API_URL}/device/${deviceId}/speedtest`)
            .then(response => response.json())
            .then(data => {
                alert('Speedtest started! This takes 30-60 seconds. Refresh page after.')
        })
    }

    const handleTestTarget = (e) => {
        setTestTarget(e.target.value)
    }

    const toggleCard = (cardType) => {
        setExpandedCard(expandedCard === cardType ? null : cardType)
    }

    // Filter tests by type
    const pingTests = tests.filter(test => test.test_type === 'ping')
    const speedtests = tests.filter(test => test.test_type === 'speedtest')

    // Accordion Card Component
    const AccordionCard = ({ title, testType, children, count }) => {
        const isExpanded = expandedCard === testType

        return (
            <div style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                marginBottom: '15px',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <div
                    onClick={() => toggleCard(testType)}
                    style={{
                        padding: '15px 20px',
                        backgroundColor: isExpanded ? '#4caf50' : '#f5f5f5',
                        color: isExpanded ? 'white' : '#333',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background-color 0.3s'
                    }}
                >
                    <h3 style={{ margin: 0 }}>{title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{
                            backgroundColor: isExpanded ? 'rgba(255,255,255,0.2)' : '#4caf50',
                            color: isExpanded ? 'white' : 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}>
                            {count} tests
                        </span>
                        <span style={{ fontSize: '20px' }}>
                            {isExpanded ? '▲' : '▼'}
                        </span>
                    </div>
                </div>
                {isExpanded && (
                    <div style={{
                        padding: '20px',
                        backgroundColor: 'white',
                        borderTop: '1px solid #ddd'
                    }}>
                        {children}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div style={{
            padding: '20px',
            fontFamily: 'Arial, sans-serif',
            maxWidth: '1200px',
            margin: '0 auto'
        }}>
            <button onClick={() => navigate('/')} style={{
                padding: '10px 20px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginBottom: '20px'
            }}>Back to Devices</button>

            <h1>Device: {deviceId}</h1>

            {/* Test Controls */}
            <div style={{
                marginTop: '20px',
                marginBottom: '30px',
                padding: '20px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px solid #ddd'
            }}>
                <h2 style={{ marginTop: 0 }}>Run Test</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        name='testTarget'
                        value={testTarget}
                        onChange={handleTestTarget}
                        type="text"
                        placeholder="Target IP/hostname"
                        style={{
                            padding: '10px 15px',
                            borderRadius: '5px',
                            border: '1px solid #ddd',
                            flex: '1',
                            minWidth: '200px'
                        }}
                    />
                    <button onClick={() => {runPingTest(testTarget)}}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}>
                        Run Ping
                    </button>
                    <button onClick={runSpeedtest}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}>
                        Run Speedtest
                    </button>
                </div>
            </div>

            {/* Test Results - Accordion Cards */}
            <div>
                <h2>Test History</h2>
                {loading ? (
                    <p>Loading Tests...</p>
                ) : tests.length === 0 ? (
                    <p>No tests yet. Run a test above!</p>
                ) : (
                    <>
                        {/* Ping Tests Card */}
                        <AccordionCard
                            title="Ping Tests"
                            testType="ping"
                            count={pingTests.length}
                        >
                            {pingTests.length === 0 ? (
                                <p>No ping tests yet.</p>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Time</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Target</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Avg RTT</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Min RTT</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Max RTT</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Packet Loss</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pingTests.map(test => (
                                            <tr key={test.id}>
                                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                    {new Date(test.timestamp).toLocaleString('en-US', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit',
                                                        hour12: false
                                                    })}
                                                </td>
                                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                    {test.target || "N/A"}
                                                </td>
                                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                    {test.rtt_avg?.toFixed(2)} ms
                                                </td>
                                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                    {test.rtt_min?.toFixed(2)} ms
                                                </td>
                                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                    {test.rtt_max?.toFixed(2)} ms
                                                </td>
                                                <td style={{
                                                    padding: '10px',
                                                    border: '1px solid #ddd',
                                                    color: test.packet_loss > 0 ? '#f44336' : '#4caf50',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {test.packet_loss}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </AccordionCard>

                        {/* Speedtest Card */}
                        <AccordionCard
                            title="Speed Tests"
                            testType="speedtest"
                            count={speedtests.length}
                        >
                            {speedtests.length === 0 ? (
                                <p>No speed tests yet.</p>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Time</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Download</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Upload</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Ping</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Server</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {speedtests.map(test => (
                                            <tr key={test.id}>
                                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                    {new Date(test.timestamp).toLocaleString('en-US', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit',
                                                        hour12: false
                                                    })}
                                                </td>
                                                <td style={{
                                                    padding: '10px',
                                                    border: '1px solid #ddd',
                                                    fontWeight: 'bold',
                                                    color: '#2196F3'
                                                }}>
                                                    {test.download_mbps?.toFixed(2)} Mbps
                                                </td>
                                                <td style={{
                                                    padding: '10px',
                                                    border: '1px solid #ddd',
                                                    fontWeight: 'bold',
                                                    color: '#FF9800'
                                                }}>
                                                    {test.upload_mbps?.toFixed(2)} Mbps
                                                </td>
                                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                    {test.ping_ms?.toFixed(2)} ms
                                                </td>
                                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                    {test.server_name || test.target || "N/A"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </AccordionCard>
                    </>
                )}
            </div>
        </div>
    )
}

export default NewDeviceDashboard
