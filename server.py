from fastapi import FastAPI, WebSocket
from typing import Dict
import subprocess
import re
import json

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Network Testing Server"}

@app.get("/hello/{name}")
def say_hello(name: str):
    return {"message": f"Hello {name}!"}

@app.get("/ping/{target}")
def ping_test(target: str, count: int = 4, packet_size: int = 56):
    try:
        # run the ping command
        result = subprocess.run(
            ['ping', '-c', str(count), '-s', str(packet_size), target],
            capture_output=True,
            text=True,
            timeout=30
        )

        output = result.stdout

        if result.returncode != 0:
            return{
                "status": "error",
                "message": f"Ping failed: {result.stderr or 'unreachable'}"
            }

        results = {
            "target": target,
            "packets_sent": count,
            "packet_size": packet_size
        }

        loss_match = re.search(r'(\d+)% packet loss', output)
        if loss_match :
            results["packet_loss_percent"] = int(loss_match.group(1))
        else:
            return {
                "status": "error",
                "message": "Could not parse ping output"
            }

        time_match = re.search(r'(\d+\.\d+)/(\d+\.\d+)/(\d+\.\d+)/(\d+\.\d+) ms', output)
        if time_match:
            results["rtt_min_ms"] = float(time_match.group(1))
            results["rtt_avg_ms"] = float(time_match.group(2))
            results["rtt_max_ms"] = float(time_match.group(3))
            results["rtt_mdev_ms"] = float(time_match.group(4))
        else:
            results["note"] = "No responses received (100% packet loss)"

        return {"status": "success", "results": results}
    
    except subprocess.TimeoutExpired:
        return {"status": "error", "message": "Ping Timed out"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
@app.websocket("/ws/test")
async def websocket_test(websocket: WebSocket):
    #accept the connection
    await websocket.accept()
    print("Someone Connected!")

    #send a welcome message
    await websocket.send_text("hello from the server!")

    #wait for a message from the client
    message = await websocket.receive_text()
    print(f"Received: {message}")

    #send a response
    await websocket.send_text(f"you said: {message}")

active_devices: Dict[str, WebSocket] = {}

@app.websocket("/ws/{device_id}")
async def device_connection(websocket: WebSocket, device_id: str):
    await websocket.accept()
    print(f"Device {device_id} connected!")
    
    # Store this connection so we can send commands to it later
    active_devices[device_id] = websocket
    
    try:
        while True:
            # Wait for messages from the device (test results)
            data = await websocket.receive_text()
            message = json.loads(data)
            
            print(f"Received from {device_id}: {message}")
    
    except Exception as e:
        print(f"Device {device_id} disconnected: {e}")
        # Remove from active devices when disconnected
        if device_id in active_devices:
            del active_devices[device_id]

@app.get("/device/{device_id}/test")
async def trigger_test(device_id: str, target: str, count: int = 4):
    """Tel a device to run a test"""
    
    # Check if device is connected
    if device_id not in active_devices:
        return {"status": "errror", "message": f"Device {device_id} not connected"}
    
    #build the command
    command = {
        "test_id": 123,
        "test_type": "ping",
        "config": {
            "target": target, 
            "count": count,
            "packet_size": 56
        }
    }

    #send command to the device
    websocket = active_devices[device_id]
    await websocket.send_text(json.dumps(command))

    return {"Status": "command_sent", "device": device_id, "command": command}