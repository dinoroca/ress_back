'use strict';

var express = require('express');
const { whatsapp } = require('./lib/whatsapp');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var port = process.env.PORT || 4201;

var server = require('http').createServer(app);

var io = require('socket.io')(server, {
  cors: { origin: '*' }
});

io.on('connection', function (socket) {
  socket.on('crear-reserva-ocupado', function (data) {
    io.emit('mostrar-reservas', data);
    console.log(data);
  });

  socket.on('confirmar-reserva-admin', function (data) {
    io.emit('mostrar-reservas-user', data);
    console.log(data);
  });

  socket.on('confirmar-suscripcion-admin', function (data) {
    io.emit('mostrar-suscripciones', data);
    console.log(data);
  });

  socket.on('crear-reserva-ocupado-out', function (data) {
    io.emit('mostrar-reservas-user', data);
    io.emit('mostrar-reservas', data);
    console.log(data);
  });
});

var user_route = require('./Routes/User');
var empresa_route = require('./Routes/Empresa');

whatsapp.initialize();

// Conexión a la base de datos MongoDB local con promesas
mongoose
  .connect('mongodb://127.0.0.1:27017/reservas_grass', {
    useNewUrlParser: true,  // Utilizar el nuevo analizador de URL
    useUnifiedTopology: true,  // Utilizar el nuevo motor de descubrimiento y monitoreo del servidor
  })
  .then(() => {
    console.log('Conexión exitosa a MongoDB');
    server.listen(port, function () {
      console.log('Servidor en funcionamiento en el puerto: ' + port);
    });
  })
  .catch((err) => {
    console.error('Error al conectar a MongoDB:', err);
  });

const cors = require('cors');

app.use(cors({

  origin: '*'

}));

// Para convertir las peticiones en formato JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Access-Control-Allow-Request-Method');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Allow', 'GET, PUT, POST, DELETE, OPTIONS');
  next();
});

app.use('/api', user_route);
app.use('/api', empresa_route);

module.exports = app;
