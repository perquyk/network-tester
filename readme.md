```
git clone https://github.com/perquyk/network-tester.git
cd network-tester
```
### For Server:
#### First run:
```
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### change API_URI in ./dashboard.html
### run server:
```
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### For Agent:
```
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
### inside ./agent.py change the name and IP at the top

```
python agent.py
```
