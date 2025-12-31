set -e

echo "============================================================"
echo "Network Testing Agent - Installation"
echo "============================================================"

if [ "$EEID" -ne 0 ]; then 
    echo "Please run as root"
    exit 1
fi

echo "[1/6] Updating system..."
apt-get update -qq && apt-get upgrade -y -qq

echo "[2/6] Installing dependencies..."
apt-get install -y -qq python3 python3-pip python3-venv git iputils-ping curl

echo "[3/6] Creating directory..."
mkdir -p /opt/network-agent
cd /opt/network-agent

echo "[4/6] Downloading agent..."
curl -sSL https://raw.githubusercontent.com/perquyk/network-tester/main/agent.py -o agent.py

echo "[5/6] Setting up Python..."
python3 -m venv venv
source venv/bin/activate
pip install -q websockets

echo "[6/6] Creating service..."
tee /etc/systemd/system/network-agent.service > /dev/null << SERVICEFILE
[Unit]
Description=Network Testing Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/network-agent
ExecStart=/opt/network-agent/venv/bin/python /opt/network-agent/agent.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICEFILE

systemctl daemon-reload

echo ""
echo "Done! Next steps:"
echo "1. cd /opt/network-agent && source venv/bin/activate"
echo "2. python agent.py"
echo "3. systemctl enable network-agent && systemctl start network-agent"
