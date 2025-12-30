from fastapi import FastAPI
import subprocess
import re

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