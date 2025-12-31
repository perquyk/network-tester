# Installation Instruction

## Server
```
# clone the repo and change directory
git clone https://github.com/perquyk/network-tester.git
cd network-tester

# first run preparations
sudo apt install python3 python3-pip python3-venv
sudo python3 -m venv venv
sudo source venv/bin/activate
sudo pip install -r requirements.txt

#run the server
uvicorn server:app --host 0.0.0.0 --port 8000
```

## Agent
```
Run installer script (one command)
curl -sSL https://raw.githubusercontent.com/perquyk/network-tester/refs/heads/main/install_agent.py | bash


```


## Enable autostart
```
# Server
sudo systemctl enable ...
sudo systemctl start ...

# Agent
sudo systemctl enable network-agent
sudo systemctl start network-agent
