var net = require('net');
var can = require('socketcan');

var channel = can.createRawChannel("can0", true);
//var header = ':SBFA0N'; //This is a standard header for a software node

var NET_PORT = 5550;
var NET_ADDRESS = "localhost";

var pr1 = 2;
var pr2 = 3;
var canId = 00;
var outHeader = (((pr1*4)+pr2)*128)+canId;

var client = new net.Socket();

// Log any message
channel.addListener("onMessage", function(msg) {
    var output=msg.data.toString('hex').toUpperCase();
    var header = msg.id << 5;
    client.write(':S'+header.toString(16).toUpperCase()+'N'+output+';');
} );

client.connect(NET_PORT, NET_ADDRESS, function () {
    console.log('Client Connected');
});

client.on('data', function (data) {
//    data = data.toString();
    console.log('Network : '+data.toString());
    var outMsg = data.toString().split(";"); //Sometimes multiple events appear in a single network package.
    console.log('Out Message : '+outMsg);
    for (var i = 0; i < outMsg.length - 1; i++) { //loop through each event.
        var datastr = outMsg[i].toString().substr(7,outMsg[i].toString().length-7);
        //console.log('canPi: ' + datastr);
        //console.log('Length : '+datastr.length);
        //console.log('Sub    : '+datastr.substr(4,4));
        var dataOut = [];
        for (var x=0; x < datastr.length-1; x+=2) {
           dataOut.push(parseInt(datastr.substr(x,2),16));
        };
        var output = {"id":outHeader,"data":Buffer.from(dataOut)};
	console.log('Client Loop : '+datastr);
        console.log(output);
        channel.send(output);
    };
});

client.on('error', function(err) {
    console.log(err);
});

client.on('end', function(err) {
    console.log('disconnected from server');
});

//channel.addListener("onMessage", channel.send, channel);

channel.start();


var clients = [];

var server = net.createServer(function (socket) {
    socket.setKeepAlive(true,60000);
    clients.push(socket);
    console.log('Client Connected to Server');
    socket.on('data', function (data) {
        broadcast(data.toString(), socket);
        console.log('Server : ' + data.toString());
    });

    socket.on('end', function () {
        clients.splice(clients.indexOf(socket), 1);
        console.log('Client Disconnected from Server');
    });

    socket.on("error", function(err) {
        clients.splice(clients.indexOf(socket), 1);
        console.log("Caught flash policy server socket error: ");
        console.log(err.stack);
    });

    function broadcast(data, sender) {
        clients.forEach(function (client) {
            // Don't want to send it to sender
            if (client === sender)
                return;
            client.write(data);
        });
    };
});

server.listen(NET_PORT);

