require('dotenv/config')

const net = require('net');

const client = new net.Socket()

client.connect(process.env.PORT, process.env.HOST, () => {
  console.log('Client connected!')
  client.write('You are Joining!')
})

client.on('connection', (ct) => {
  console.log(ct, 'QQQQQQ')
})

client.on('data', (data) => {
	console.log('Received: ' + data);

  if(data.toString().startsWith('!stop'))
  	client.destroy(); 
});

client.on('close', () => {
	console.log('Connection closed');
});