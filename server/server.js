const { WebSocket, WebSocketServer } = require('ws')
const { loadConversation, updateConversation } = require('./database.js')
const wss = new WebSocketServer({ port: 8080 })

let msgToDisplay = {
    "type": "messages",
    "messages": []
}

wss.on('connection', function connection(socket, request) {
    const loginInfo = JSON.parse(request.headers.authorization)
    const username = loginInfo.username
    const password = loginInfo.password
    const receiver = loginInfo.receiver
    let msgToStore = []
    if (!authenticateLogin(username, password)) {
        wss.emit('error', 'Authentication')
    } else {
        console.log("Ready for communication")
        // If other user login with the same chatbox, we will directly send the data without query database
        if (msgToDisplay.messages.length > 0) {
            socket.send(JSON.stringify(msgToDisplay))
            console.log("HERE")
        } else {
            const promise = loadConversation(username, receiver, socket).then((result) => {
                msgToDisplay = result
            }).catch((error) => {
                console.error(error)
            })
        }
    }
    socket.on('error', console.error)

    socket.on('message', function message(data) {
        const jsonData = JSON.parse(data.toString('utf-8'))
        let item = {
            "from_user": username,
            "to_user": jsonData.receiver,
            "message": jsonData.message,
            "timestamp": jsonData.datetime,
            "seq": jsonData.seq
        }
        msgToDisplay.messages.push(`${item.from_user} -> ${item.message}`)
        if (msgToDisplay.messages.length > 50) {
            msgToDisplay.messages.shift()
        }
        msgToStore.push(item)
        if (msgToStore.length >= 20) {
            toUpdate = msgToStore.slice(0, 20)
            updateConversation(toUpdate)
            msgToStore = msgToStore.slice(20)
        }
        console.log("received")
    })
})

function authenticateLogin(username, password) {
    console.log(username, password)
    return true
}