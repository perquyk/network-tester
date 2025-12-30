## how to install/work on this:


```
git clone https://github.com/YOUR_USERNAME/network-tester.git
cd network-tester
```

### Create their own venv
```
python3 -m venv venv
source venv/bin/activate
```
### Install all dependencies from your requirements.txt
```
pip install -r requirements.txt
```
### Run the server
```
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```