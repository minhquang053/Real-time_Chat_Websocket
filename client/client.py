import asyncio
import json
from websockets.client import connect

def get_login_info():
    return json.dumps({
        "username": "minhquang",
        "password": "test",
    })

async def main():
    async with connect("ws://localhost:8080", extra_headers={
        "Authorization": get_login_info()
    }) as socket:
        message = await socket.recv()
        print(message)

asyncio.get_event_loop().run_until_complete(main())
# json.parse(socket.getresponse)