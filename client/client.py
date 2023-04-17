import asyncio
import threading
import datetime
import json
import websockets
import tkinter as tk
from tkinter import messagebox

from_user = None
password = None 
to_user = None 

def login():
    global from_user, password, to_user
    from_user = username_entry.get()
    password = password_entry.get()
    to_user = touser_entry.get()
    auth.destroy()

    
auth = tk.Tk()
auth.title("Login Screen")

logined = False
mbox = True

# Create username and password labels and entry fields
username_label = tk.Label(auth, text="Username:")
username_label.pack()
username_entry = tk.Entry(auth)
username_entry.pack()

password_label = tk.Label(auth, text="Password:")
password_label.pack()
password_entry = tk.Entry(auth, show="*")
password_entry.pack()

touser_label = tk.Label(auth, text="To user:")
touser_label.pack()
touser_entry = tk.Entry(auth)
touser_entry.pack()


# Create login button
login_button = tk.Button(auth, text="Login", command=login)
login_button.pack()

# Create message label
message_label = tk.Label(auth, text="")
message_label.pack()

auth.wait_window()

# Create the tkinter application window
root = tk.Tk()

global ws
seq = 0
sqlt = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
running = True

def on_closing():
    global mbox
    mbox = False
    global running
    running = False
    # raise KeyboardInterrupt

async def update_gui():
    while running:
        root.update()
        await asyncio.sleep(0.01)
    

def send():
    if not len(e.get()):
        return
    send = f"{from_user} -> " + e.get()
    asyncio.create_task(push_message(e.get(), ws))
    txt.insert(tk.END, "\n" + send)
    txt.see(tk.END)
    e.delete(0, tk.END)

root.title("Real-time Chat")
root.protocol("WM_DELETE_WINDOW", on_closing)
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
        "username": from_user,
        "password": password,
        "receiver": to_user
    })

async def pull_message(websocket):
    async for message in websocket:
        data = json.loads(message) 
        if data['type'] == "message":
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
        msg_task = asyncio.create_task(pull_message(websocket))
        gui_task = asyncio.create_task(update_gui())
        # await asyncio.gather(
        #     pull_message(websocket), update_gui()
        # )
        done, pending = await asyncio.wait(
            [msg_task, gui_task],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()
    if mbox:
        root.withdraw()
        messagebox.showerror("Error", "An error has occured. Most likely you enter wrong username or password")

asyncio.run(client())

