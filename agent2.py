import asyncio
import websockets
import subprocess
import re
import json

DEVICE_ID = "devbox01" #this will be different for each RPi, please change it!
SERVER_URL = "ws://10.0.0.252:8000" # Change this to reflect where the server is running!

async def run_ping(target, count=4, packet_size=56):
    """run a ping test and return results"""
    print(f"Running ping test to {target}...")

    result = subprocess.run(
        ['ping', '-c', str(count), '-s', str(packet_size), target],
        capture_output=True,
        text=True,
        timeout=30
    )

    output = result.stdout

    results = {
        "target": target,
        "packets_sent": count,
        "packet_size": packet_size
    }

    loss_match = re.search(r'(\d+)% packet loss', output)
    if loss_match:
        results["packet_loss_percent"] = int(loss_match.group(1))
    
    time_match = re.search(r'(\d+\.\d+)/(\d+\.\d+)/(\d+\.\d+)/(\d+\.\d+) ms', output)
    if time_match:
        results["rtt_min_ms"] = float(time_match.group(1))
        results["rtt_avg_ms"] = float(time_match.group(2))
        results["rtt_max_ms"] = float(time_match.group(3))
        results["rtt_mdev_ms"] = float(time_match.group(4))

    return results

async def connect_to_server():
    """connect to server and listen for commands"""

    uri = f"{SERVER_URL}/ws/{DEVICE_ID}"

    print(f"Connecting to {uri}...")

    async with websockets.connect(uri) as websocket:
        print(f"Connected as {DEVICE_ID}")

        #keep listening for commands forever
        while True:
            #Wait for a command from the server
            message = await websocket.recv()
            print(f"Received command: {message}")

            #Parse the command (it will be JSON)
            command = json.loads(message)

            #run teh test based on command type
            if command["test_type"] == "ping":
                results = await run_ping(target=command["config"]["target"], count=command["config"].get("count", 4), packet_size=command["config"].get("packet_size", 56))

                #send results back to server
                response = {
                    "test_id": command["test_id"],
                    "status": "completed",
                    "result": results
                }

                await websocket.send(json.dumps(response))
                print("results sent!")

asyncio.run(connect_to_server())