const net = require('net')
const can = require('socketcan')

const channel = can.createRawChannel("can0", true)
//var header = ':SBFA0N'; //This is a standard header for a software node

const NET_PORT = 5550
const NET_ADDRESS = "localhost"

const pr1 = 2
const pr2 = 3
const canId = 90
const outHeader = (((pr1 * 4) + pr2) * 128) + canId

const client = new net.Socket()

// Log any message
channel.addListener("onMessage", function (msg) {
    const output = msg.data.toString('hex').toUpperCase()
    const header = msg.id << 5
    console.log(`Cbus Message Recieved from CAN : S${header.toString(16).toUpperCase()} N ${output} ;`)
    client.write(':S' + header.toString(16).toUpperCase() + 'N' + output + ';')
});

client.connect(NET_PORT, NET_ADDRESS, function () {
    console.log('Client Connected')
})

client.on('data', function (data) {
    var outMsg = data.toString().split(";") //Sometimes multiple events appear in a single network package.
    for (var i = 0; i < outMsg.length - 1; i++) { //loop through each event.
        var datastr = outMsg[i].toString().substr(7, outMsg[i].toString().length - 7)
        var dataOut = []
        for (var x = 0; x < datastr.length - 1; x += 2) {
            dataOut.push(parseInt(datastr.substr(x, 2), 16))
        }
        var output = {"id": outHeader, "data": Buffer.from(dataOut)}
        channel.send(output)
    }
})

client.on('error', function (err) {
    console.log(err);
});

client.on('end', function (err) {
    console.log('disconnected from server');
});

channel.start();


var clients = [];

var server = net.createServer(function (socket) {
    socket.setKeepAlive(true, 60000);
    clients.push(socket);
    console.log(`Client Connected to Server ${clients.length}`);
    socket.on('data', function (data) {
        var outMsg = data.toString().split(";")
        for (var i = 0; i < outMsg.length - 1; i++) {
            broadcast(outMsg[i].toString()+';', socket);
            console.log('Server Broadcast: ' + outMsg[i].toString()+';');
        }
    });

    socket.on('end', function () {
        clients.splice(clients.indexOf(socket), 1);
        console.log('Client Disconnected from Server');
    });

    socket.on("error", function (err) {
        clients.splice(clients.indexOf(socket), 1);
        console.log("Caught flash policy server socket error: ");
        console.log(err.stack);
    });

    function broadcast(data, sender) {
        clients.forEach(function (client) {
            //console.log(`Broadcast to Client ${data}`)
            if (client === sender)
                return;
            client.write(data);
        });
    };
});

server.listen(NET_PORT);


