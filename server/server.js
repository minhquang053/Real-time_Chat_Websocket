const { WebSocket, WebSocketServer } = require('ws')

const wss = new WebSocketServer({ port: 8080 })

wss.on('connection', function connection(socket) {
    console.log('new connection')
    socket.on('error', console.error)

    socket.on('message', function message(data) {

    })
})

wss.handleUpgrade = (request, socket, head) => {
    // Perform custom validation here
    const login_info = JSON.parse(request.headers.authorization)
    const username = login_info.username
    const password = login_info.password
    if (!authenticateLogin(username, password)) {
        ws.close()
        return
    }
    // Create a new WebSocket instance
    const ws = new WebSocket(request, { socket, head })

    // Manually perform the WebSocket handshake
    // response is the response from the server to client and we are examining it
    ws.on('upgrade', (response) => {
        // Verify the response from the server
        if (response.statusCode != 101) {
            ws.close()
            return
        }
        // WebSocket connection is established, emit a 'connection' event
        ws.send('Connection established!')
        wss.emit('connection', ws, request)
    })
}

function authenticateLogin(username, password) {
    console.log(username, password)
    return true
}