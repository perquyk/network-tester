import asyncio
import websockets
import subprocess
import re
import json
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(SCRIPT_DIR, "agent_config.json")

def get_config():
    """Get configuration from file or prompt user"""

    # Check for reconfigure flag
    if '--reconfigure' in sys.argv or '--setup' in sys.argv:
        if os.path.exists(CONFIG_FILE):
            os.remove(CONFIG_FILE)
            print("Configuration cleared. Please enter new settings.\n")

    # Try to load existing ocnfig
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                print(f"Loaded config for device: {config['device_id']}")
                print(f"Server: {config['server_url']}\n")
                return config
        except Exception as e:
            print(f"Error reading config file: {e}")
            print("Will create new configuration...\n")

    # No config file, prompt user
    print("=" * 60)
    print("Network Testing Agent - Configuration")
    print("=" * 60)

    # Get deviceID
    while True:
        device_id = input("Enter Device ID (e.g., rpi-1, swat42, pi-field-69): ").strip()
        if device_id:
            break
        print("Device ID cannot be empty!'\n")

    # Get server address (IP or domain)
    while True:
        server_host = input("Enter Server IP or domain (e.g., 192.168.1.100 or dev.example.com): ").strip()
        if server_host:
            break
        print("Server address cannot be empty!\n")

    # Get server port
    server_port = input("Enter Server Port [8000]: ").strip()
    if not server_port:
        server_port = "8000"

    # Ask about SSL/WSS
    use_ssl = input("Use secure WebSocket (WSS)? Recommended for domains with SSL (y/N): ").strip().lower()
    protocol = "wss" if use_ssl == 'y' else "ws"

    # Build config
    config = {
        "device_id": device_id,
        "server_url": f"{protocol}://{server_host}" + (f":{server_port}" if protocol == "ws" else "")
    }

    # confirm
    print("\n" + "=" * 60)
    print("Configuration Summary:")
    print(f"   Device ID: {config['device_id']}")
    print(f"   Server URL: {config['server_url']}")
    print("=" * 60)

    confirm = input("\nSave this configuration? (Y/N): ").strip().lower()
    if confirm == "n":
        print("Configuration cancelled.")
        sys.exit(0)

    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        print(f"/n Configuration save to {CONFIG_FILE}")
    except Exception as e:
        print(f"\nError saving configuration: {e}")
        sys.exit(1)
    print("=" * 60)
    print()

    return config
config = get_config()
DEVICE_ID = config['device_id']
SERVER_URL = config['server_url']

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

async def run_speedtest():
    """Run a speedtest and return results"""
    print("Running speedtest (this may take 30-60 seconds)...")

    try:
        result = subprocess.run(
            ['speedtest', '--format=json', '--accept-license', '--accept-gdpr'],
            capture_output=True,
            text=True,
            timeout=120 #2 minutes max
        )

        if result.returncode != 0:
            return {"error": "Speedtest failed", "stderr": result.stderr}
        
        # Parse the JSON Output
        data = json.loads(result.stdout)

        # Extract relevant information
        results = {
            "download_mbps": round(data['download']['bandwidth'] / 125000, 2),
            "upload_mbps": round(data['upload']['bandwidth'] / 125000, 2),
            "ping_ms": round(data['ping']['latency'], 2),
            "server": data['server']['name'],
            "server_location": data['server']['location'],
            "isp": data['isp']
        }

        return results
    
    except subprocess.TimeoutExpired:
        return {"error": "Speedtest timed out"}
    except json.JSONDecodeError as e:
        return {"error": "Failed to parse speedtest output", "details": str(e)}
    except Exception as e:
        return {"error": str(e)}

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

            if command["test_type"] == "ping":
                print("DEBUG: Running ping...")
                results = await run_ping(
                    target=command["config"]["target"],
                    count=command["config"].get("count", 4),
                    packet_size=command["config"].get("packet_size", 56)
                )
                print(f"DEBUG: Ping results: {results}")
                
            elif command["test_type"] == "speedtest":
                print("DEBUG: Running speedtest...")
                results = await run_speedtest()
                print(f"DEBUG: Speedtest results: {results}")
                
            else:
                print(f"DEBUG: Unknown test type: {command['test_type']}")
                results = {"error": f"Unknown test type: {command['test_type']}"}

            print("DEBUG: About to send results...")

            # Send results back to server
            response = {
                "test_id": command["test_id"],
                "test_type": command["test_type"],
                "status": "completed",
                "result": results
            }

            print(f"DEBUG: Response prepared: {response}")

            await websocket.send(json.dumps(response))
            print("DEBUG: Results sent!")

asyncio.run(connect_to_server())