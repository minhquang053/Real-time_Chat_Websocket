import asyncio
import threading
import datetime
import json
import websockets
import tkinter as tk


# Create the tkinter application window
root = tk.Tk()
# root.protocol("WM_DELETE_WINDOW", )
user = "minhquang"
to_user = "tester"
global ws
seq = 0
sqlt = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

async def update_gui():
    while True:
        root.update()
        await asyncio.sleep(0.01)

def send():
    if not len(e.get()):
        return
    send = f"{user} -> " + e.get()
    asyncio.create_task(push_message(e.get(), ws))
    txt.insert(tk.END, "\n" + send)
    txt.see(tk.END)
    e.delete(0, tk.END)

root.title("Real-time Chat")
BG_GRAY = "#ABB2B9"
BG_COLOR = "#17202A"
TEXT_COLOR = "#EAECEE"
FONT = "Helvetica 14"
FONT_BOLD = "Helvetica 13 bold"
label1 = tk.Label(root, bg=BG_COLOR, fg=TEXT_COLOR, text="Massengar", anchor="center", font=FONT_BOLD, pady=10, width=20, height=1)
label1.grid(row=0,column=1)
txt = tk.Text(root, bg=BG_COLOR, fg=TEXT_COLOR, font=FONT, width=70)
txt.grid(row=1, column=0, columnspan=3)
scrollbar = tk.Scrollbar(txt)
scrollbar.place(relheight=1, relx=0.982)
e = tk.Entry(root, bg="#2C3E50", fg=TEXT_COLOR, font=FONT, width=70)
e.grid(row=2, column=0, columnspan=3)
button = tk.Button(root, text="Send", font=FONT_BOLD, bg=BG_GRAY,
                   command=send).grid(row=3, column=2, sticky="NSEW")
 

# websocket handler
def get_login_info():
    return json.dumps({
        "username": "minhquang",
        "password": "test",
        "receiver": "tester"
    })

async def pull_message(websocket):
    async for message in websocket:
        data = json.loads(message)
        if data['type'] == "notification":
             pass   
        elif data['type'] == "message":
            txt.delete("1.0", tk.END)
            for message in data['messages']:
                txt.insert(tk.END, "\n" + message)
            txt.see(tk.END)

async def push_message(message, websocket):
    global seq, sqlt
    sql_datetime = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    if sql_datetime == sqlt:
        seq += 1
    else:
        sqlt = sql_datetime
        seq = 0
    final = {
        "receiver": to_user,
        "datetime": datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "message": message,
        "seq": seq
    }
    await websocket.send(json.dumps(final))

async def client():
    uri = "ws://localhost:8080"
    async with websockets.connect(uri, extra_headers={
        "authorization": get_login_info()
    }) as websocket:
        global ws
        ws = websocket
        await asyncio.gather(
            pull_message(websocket), update_gui()
        )

asyncio.run(client())