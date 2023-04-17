const mysql = require('mysql')
const WebSocket = require('ws')

function createConnection() {
    return mysql.createConnection({
        host: 'db4free.net',
        user: 'minhquang053',
        password: '.SyLys6BTyA9gdu',
        database: 'mqchatapp'
    })
}

function loadConversation(from_user, to_user, socket) {
    const connection = createConnection()
    query = "select `message`, `from_user` from (" + "select `message`, `from_user`, `timestamp`, `seq` from `user_message` where \
    (`from_user` = '" + from_user + "' and `to_user` = '" + to_user + "') \
    or (`from_user` = '" + to_user + "' and `to_user` = '" + from_user + "')\
    order by `timestamp` desc, `seq` desc limit 100" + ") as os order by `timestamp` asc, `seq` asc;"
    let data = {
        "type": "message",
        "messages": []
    }
    return new Promise((resolve, reject) => {
        connection.query(query, (err, result) => {
            if (err) {
                reject(err)
            }
            for (let record of result) {
                data.messages.push(record.from_user + " -> " + record.message)
            }
            socket.send(JSON.stringify(data))
            resolve(data)
        })})
}

function updateConversation(items) {
    const connection = createConnection()
    const insertQueries = []
    for (let item of items) {
        insertQueries.push(
            "INSERT INTO `user_message` (`from_user`, `to_user`, `message`, `timestamp`, `seq`)\
            VALUES (\"" + item.from_user + "\",\"" + item.to_user + "\",\"" + item.message + "\",\"" + item.timestamp + "\",\"" + item.seq+ "\")"
        )
    }
    for (let insertQuery of insertQueries) {
        connection.query(insertQuery, (err, result) => {
            if (err) throw err;
            console.log('Number of rows affected:', result.affectedRows);
        })
    }
    connection.end((err) => {
        if (err) throw err;
        console.log("closed")
    })
}
// console.log(result[0])

module.exports = {
    loadConversation,
    updateConversation
}