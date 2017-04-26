# mergCbusPiServer
Allows a Raspberry Pi to be connect to a MERG Cbus network using either a canpi or a canpiwii.

The system requires that Node.js is installed on the RPI and it is connected to either a canpi on a RPI3 or canpiwii on a RPI Zero.

To configure the RPI edit /boot/config.txt and add the following to the bottom of the file.
```
   dtparam=spi=on  
   dtoverlay=mcp2515-can0,oscillator=16000000,interrupt=25  
   dtoverlay=spi-bcm2835-overlay 
```
Add the following to /etc/network/inerfaces
```
   auto can0
   iface can0 can static
        bitrate 125000 restart-ms 1000
```

To install download the files to a new directory and enter 
```
    npm install
```
To run the cbusPiServer execute:
```
    node cbusPiServer.js
```
