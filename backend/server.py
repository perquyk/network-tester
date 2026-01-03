from fastapi import FastAPI, WebSocket
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import subprocess
import re
import json
from database import register_device, save_test_results, get_all_tests, get_devices
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    print(f"Device {device_id} connected")

    # Register device in database
    register_device(device_id)

    # Store Connection
    active_devices[device_id] = websocket

    try:
        while True:
            # Wait for messages from device (test results)
            data = await websocket.receive_text()
            message = json.loads(data)

            print(f"Received from {device_id}: {message}")

            #Save to database!
            if message.get('status') == 'completed':
                result = message.get('result', {})
                test_type = message.get('test_type', 'unknown')  # GET FROM MESSAGE
                
                test_id = save_test_results( 
                    device_id=device_id,
                    test_type=test_type,  
                    target=result.get('target'),
                    results=result
                )
                print(f"Saved {test_type} test result with ID: {test_id}")
    except Exception as e:
        print(f"Device {device_id} disconnected: {e}")
        if device_id in active_devices:
            del active_devices[device_id]

@app.get("/device/{device_id}/test/")
async def trigger_test(device_id: str, target: str = "8.8.8.8", count: int = 4):
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

    return {"status": "command_sent", "device": device_id, "command": command}

@app.get("/device/{device_id}/speedtest")
async def trigger_speedtest(device_id: str):
    """Tell a device to run a speedtest"""
    if device_id not in active_devices:
        return {"status": "error", "message": f"Device {device_id} not connected"}
    
    command = {
        "test_id": int(time.time()),
        "test_type": "speedtest",
        "config": {}
    }

    websocket = active_devices[device_id]
    await websocket.send_text(json.dumps(command))
    return {"status": "command_sent", "device": device_id, "command": command}

@app.get("/device/{device_id}/arp")
async def trigger_arp(device_id: str):
    """Tell a deivce to get an arp table"""
    if device_id not in active_devices:
        return {"status": "error", "message": f"Device {device_id} not connected"}

    command = {
        "test_id": int(time.time()),
        "test_type": "arp",
        "config": {}
    }

    websocket = active_devices[device_id]
    await websocket.send_text(json.dumps(command))
    return {"status": "command_sent", "device": device_id, "command": command}



@app.get("/devices")
def list_devices():
    """List all registered devices"""
    devices = get_devices()
    print(f"DEBUG: get_devices() returned {len(devices)} devices")
    print(f"DEBUG: Raw data: {devices}")
    
    result = {
        "devices": [
            {
                "device_id": row[0],
                "name": row[1],
                "last_seen": row[2]
            }
            for row in devices
        ]
    }
    print(f"DEBUG: Returning: {result}")
    return result

@app.get("/tests")
def list_tests(device_id: str = None, limit: int = 50):
    """list test results, optionally filtered by device"""
    tests = get_all_tests(device_id, limit)
    return {
        "tests": [
            {
                "id": row[0],
                "device_id": row[1],
                "test_type": row[2],
                "target": row[3],
                "timestamp": row[4],
                "packet_loss": row[5],
                "rtt_avg": row[6],
                "rtt_min": row[7],
                "rtt_max": row[8],
                "download_mbps": row[9],
                "upload_mbps": row[10],
                "result_json": row[11]
            }
            for row in tests
        ]
    }