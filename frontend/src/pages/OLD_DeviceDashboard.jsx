import {useState, useEffect} from 'react'
import {useParams, useNavigate} from 'react-router-dom'

function DeviceDashboard() {
    const { deviceId } = useParams() // get deviceId from url
    const navigate = useNavigate()
    const [tests, setTests] = useState([])
    const [loading, setLoading] = useState(true)
    const [testTarget, setTestTarget] = useState("8.8.8.8")

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

    return (
        <>
        <div style={{
            padding: '20px', 
            fontFamily: 'Arial, sans-serif'
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
            
            {/* test btns */}
            <div style={{ marginTop: '20px', marginBottom: '30px'}}>
                <h2>Run Test</h2>
                <input name='testTarget' value={testTarget} onChange={handleTestTarget} type="text" style={{padding: '10px 20px', borderRadius: '5px', border: '1px solid #ddd', marginRight: '10px'}}/>
                <button onClick={() => {runPingTest(testTarget)}}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        marginRight: '10px'
                    }}>
                        Run Ping
                    </button>

                    <button onClick={runSpeedtest}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        marginRight: '10px'
                    }}>
                        Run Speedtest
                    </button>
            </div>

            {/* Test Results */}
            <div>
                <h2>Test History</h2>
                {loading ? (
                    <p>Loading Tests...</p>
                ) : (
                    tests.length === 0 ? (
                        <p>No tests yet. run a test above!</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse'}}>
                            <thead>
                                <tr style={{backgroundColor: '#f0f0f0'}}>
                                    <th style={{ padding: '10px', border: '1px solid #ddd'}}>Time</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd'}}>Type</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd'}}>Target</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd'}}>Results</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tests.map(test => (
                                    <tr key={test.id}>
                                        <td style={{padding: '10px', border: '1px solid #ddd'}}>
                                            {new Date(test.timestamp).toLocaleString()}
                                        </td>
                                        <td style={{padding: '10px', border: '1px solid #ddd'}}>
                                            {test.test_type}
                                        </td>
                                        <td style={{padding: '10px', border: '1px solid #ddd'}}>
                                            {test.target || "N/A"}
                                        </td>
                                        <td style={{padding: '10px', border: '1px solid #ddd'}}>
                                            {test.test_type === "ping" ? (
                                                <span>
                                                    Avg: {test.rtt_avg?.toFixed(2)} ms |
                                                    Loss: {test.packet_loss}%
                                                </span>
                                            ) : test.test_type === "speedtest" ? (
                                                <span>
                                                    Down: {test.download_mbps?.toFixed(2)} Mbps |
                                                    Up: {test.upload_mbps?.toFixed(2)} Mbps
                                                </span>
                                            ) : (
                                                "N/A"
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                )}
            </div>
            

        </div>

        </>
    )}

export default DeviceDashboard