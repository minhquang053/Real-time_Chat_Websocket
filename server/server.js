const { WebSocket, WebSocketServer } = require('ws')
const { loadConversation, updateConversation, getUserPassword } = require('./database.js')
const wss = new WebSocketServer({ port: 8080 })

const msgToDisplay = {}

const sockets = {}

let account_info = {}

getUserPassword().then((result) => {account_info = result}).catch((error) => {console.error(error)})

wss.on('connection', function connection(socket, request) {
    const loginInfo = JSON.parse(request.headers.authorization)
    const username = loginInfo.username
    const password = loginInfo.password
    const receiver = loginInfo.receiver
    let chatcode = username + "@" + receiver
    if (!authenticateLogin(username, password)) {
        socket.close(1001, "Authorization failed")
        wss.emit('close')
        wss.emit('error', 'Authentication')
    } else {
        console.log("Ready for communication")
        sockets[username] = socket
        // If other user login with the same chatbox, we will directly send the data without query database
        if (msgToDisplay[chatcode]?.messages?.length) {
            socket.send(JSON.stringify(msgToDisplay[chatcode]))
        } else if (msgToDisplay[receiver+"@"+username]?.messages?.length) {
            chatcode = receiver + "@" + username
            socket.send(JSON.stringify(msgToDisplay[chatcode]))
        } else {
            loadConversation(username, receiver, socket).then((result) => {
                msgToDisplay[chatcode] = result
            }).catch((error) => {
                console.error(error)
            })
        }
    }
    socket.on('error', console.error)

    socket.on('close', () => {
        console.log("Connection closed")
        delete sockets[username]
    })
        
    socket.on('message', function message(data) {
        const jsonData = JSON.parse(data.toString('utf-8'))
        let record = {
            "from_user": username,
            "to_user": jsonData.receiver,
            "message": jsonData.message,
            "timestamp": jsonData.datetime,
            "seq": jsonData.seq
        }
        msgToDisplay[chatcode].messages.push(`${record.from_user} -> ${record.message}`)
        if (receiver in sockets) {
            sockets[receiver].send(JSON.stringify(msgToDisplay[chatcode]))
        }
        if (msgToDisplay[chatcode].messages.length > 50) {
            msgToDisplay[chatcode].messages.shift()
        }
        updateConversation(record)
        console.log("received")
    })
})

wss.on('error', (err) => {
    console.log("Authorization failed")
})

function authenticateLogin(username, password) {
    if (account_info[username] === password) {
        return true
    }
    return false
}