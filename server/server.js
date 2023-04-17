const { WebSocket, WebSocketServer } = require('ws')
const { loadConversation, updateConversation } = require('./database.js')
const wss = new WebSocketServer({ port: 8080 })

wss.on('connection', function connection(socket, request) {
    const msgToDisplay = []
    let msgToStore = []
    const loginInfo = JSON.parse(request.headers.authorization)
    const username = loginInfo.username
    const password = loginInfo.password
    if (!authenticateLogin(username, password)) {
        wss.emit('error', 'Authentication')
    } else {
        console.log("Ready for communication")
    }
    socket.on('error', console.error)

    socket.on('message', function message(data) {
        const jsonData = JSON.parse(data.toString('utf-8'))
        let item = {
            "from_user": username,
            "to_user": jsonData.receiver,
            "message": jsonData.message,
            "timestamp": jsonData.datetime
        }
        msgToDisplay.push(item)
        if (msgToDisplay.length > 50) {
            msgToDisplay.shift()
        }
        msgToStore.push(item)
        if (msgToStore.length >= 20) {
            updateConversation(msgToStore.slice(0, 20))
            msgToStore = msgToStore.slice(20)
        }
    })
})

function authenticateLogin(username, password) {
    console.log(username, password)
    return true
}