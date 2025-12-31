#!/bin/bash

# Network Testing Agent - Automated Installation Script
# Usage: bash install_agent.sh
# Or: curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/network-tester/main/install_agent.sh | bash

set -e  # Exit on any error

echo "============================================================"
echo "Network Testing Agent - Installation"
echo "============================================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo or run as root user)"
    exit 1
fi

# Update system
echo "[1/6] Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# Install dependencies
echo "[2/6] Installing dependencies..."
apt-get install -y -qq python3 python3-pip python3-venv git iputils-ping net-tools curl

# Create installation directory
INSTALL_DIR="/opt/network-agent"
echo "[3/6] Creating installation directory: $INSTALL_DIR"
mkdir -p $INSTALL_DIR
cd $INSTALL_DIR

# Download agent.py
echo "[4/6] Downloading agent code..."
# Replace YOUR_USERNAME with your actual GitHub username
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/network-tester/main/agent.py -o agent.py

# If download failed, show error
if [ ! -f "agent.py" ]; then
    echo "Error: Failed to download agent.py"
    echo "Please check the URL and try again"
    exit 1
fi

# Create virtual environment
echo "[5/6] Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -q --upgrade pip
pip install -q websockets

# Create systemd service
echo "[6/6] Creating systemd service..."
cat > /etc/systemd/system/network-agent.service << 'EOF'
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
EOF

systemctl daemon-reload

echo ""
echo "============================================================"
echo "Installation Complete!"
echo "============================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure the agent (run once):"
echo "   cd /opt/network-agent"
echo "   source venv/bin/activate"
echo "   python agent.py"
echo ""
echo "2. After configuration, enable auto-start:"
echo "   systemctl enable network-agent"
echo "   systemctl start network-agent"
echo ""
echo "3. Check status:"
echo "   systemctl status network-agent"
echo ""
echo "4. View logs:"
echo "   journalctl -u network-agent -f"
echo ""
echo "5. To reconfigure later:"
echo "   cd /opt/network-agent"
echo "   source venv/bin/activate"
echo "   python agent.py --reconfigure"
echo ""
echo "============================================================"
