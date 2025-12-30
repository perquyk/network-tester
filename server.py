from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Network Testing Server"}

@app.get("/hello/{name}")
def say_hello(name: str):
    return {"message": f"Hello {name}!"}

@app.get("/ping/{target}")
def ping_test(target: str, count: int = 4, packet_size: int = 56):
    return {
        "target": target,
        "count": count,
        "packet_size": packet_size
    }