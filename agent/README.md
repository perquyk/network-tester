# Remote Network Tester - Agent
## Overview
This is the Agent module for the Remote Network Tester. This should be installed on the clients that are connected to the network you want to monitor.

## Installation
just download and run the agent_install.sh script

```
curl -sL https://raw.githubusercontent.com/perquyk/network-tester/refs/heads/main/agent/install_agent.sh | bash
```
After that you can follow the steps in your terminal.

## Configuration
On the first run of the agent.py script it will prompt you to add some settings used to connect to your server.

if you want to reconfigure the agent, you can do it with the following commands:
```
cd /opt/network-agent && source venv/bin/activate
python agent.py --reconfigure
systemctl restart network-agent
```
