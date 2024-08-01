'use strict';

var User = require('../Models/User');
var Reservacion = require('../Models/Reservacion');
var Reservacion = require('../Models/Reservacion');
var Empresa = require('../Models/Empresa');
var Caracteristicas = require('../Models/Caracteristicas');
var CuentaAdmin = require('../Models/CuentaAdmin');
var Cuenta = require('../Models/Cuenta');
var Contacto = require('../Models/Contacto');
var Suscripcion = require('../Models/Suscripcion');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../Helpers/jwt');
const moment = require('moment');

var fs = require('fs');
var handlebars = require('handlebars');
var ejs = require('ejs');
var nodemailer = require('nodemailer');
var { google } = require('googleapis');
const { whatsapp } = require('../lib/whatsapp');
var { v4: uuidv4 } = require('uuid');

const CLIENT_ID = '465301277520-vtde6k9bjbp9bifqst4fv5bupa48i2aj.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04sJf7uMw1AsqCgYIARAAGAQSNwF-L9Ir_Ily6OK3hR9-mvciq4t6FPbD84aaLB4gitOiulmdrIc2A3nZ9Oq6GT2tHFaQ6c6029Q';

const registro_user = async function (req, res) {
  //Obtiene los parámetros del cliente
  var data = req.body;
  var users_arr = [];

  //Generar un aleatorio de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000);

  //Verifica que no exista correo repetido
  users_arr = await User.find({ email: data.email });

  if (users_arr.length == 0) {
    //Registro del usuario

    if (data.password) {
      bcrypt.hash(data.password, null, null, async function (err, hash) {
        if (hash) {
          data.password = hash;
          data.codigo = code;
          var reg = await User.create(data);
          res.status(200).send({
            data: reg,
            token: jwt.createToken(reg)
          });
        } else {
          res.status(200).send({ message: "Error server", data: undefined });
        }
      });
    } else {
      res
        .status(200)
        .send({ message: "No hay una contraseña", data: undefined });
    }
  } else {
    res
      .status(200)
      .send({
        message: "El correo ya está registrado por otro usuario",
        data: undefined,
      });
  }
}

const enviar_correo_confirmacion = async function (req, res) {

  var id = req.params['id'];

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

  // const accessToken = await oauth2Client.getAccessToken();

  var readHTMLFile = function (path, callback) {
    fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
      if (err) {
        throw err;
        callback(err);
      }
      else {
        callback(null, html);
      }
    });
  };

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'reservatugrass@gmail.com',
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN
      // accessToken: accessToken
    }
  });

  //cliente _id fecha data subtotal

  var user = await User.findById({ _id: id });

  readHTMLFile(process.cwd() + '/mail-verficar-user.html', (err, html) => {

    let rest_html = ejs.render(html, {
      cliente: user.nombres,
      codigo: user.codigo
    });

    var template = handlebars.compile(rest_html);
    var htmlToSend = template({ op: true });

    var mailOptions = {
      from: 'reservatugrass@gmail.com',
      to: user.email,
      subject: 'Verificación de correo',
      html: htmlToSend
    };
    res.status(200).send({ data: true });

    enviar_whatsapp_confirmacion(user);

    transporter.sendMail(mailOptions, function (error, info) {
      if (!error) {
        console.log('Email sent: ' + info.response);
      }
    });

  });
}

const enviar_whatsapp_confirmacion = async (user) => {
  const tel = '+51' + user.telefono;
  const chatId = tel.substring(1) + "@c.us";
  const number_details = await whatsapp.getNumberId(chatId);
  if (number_details) {
    const mensaje = `Hola ${user.nombres}, gracias por registrarte en nuestra página, introduce el código \n${user.codigo} \nen el campo que le solicita luego de su registro. \nTambién se envió una copia al correo registrado: ${user.email}.`;
    await whatsapp.sendMessage(chatId, mensaje);
  } else {
    console.log('Whatsapp no existe');
  }
}

const login_user = async function (req, res) {
  var data = req.body;
  var users_arr = [];

  //Busca un cliente mediante el correo
  users_arr = await User.find({ email: data.email });

  if (users_arr.length == 0) {
    res
      .status(200)
      .send({ message: "Correo o contraseña incorrectos", data: undefined });
  } else {
    //Si existe el cliente se manda al login
    let user = users_arr[0];

    //Comparar contraseñas
    bcrypt.compare(data.password, user.password, async function (error, check) {
      if (check) {
        res.status(200).send({
          data: user,
          token: jwt.createToken(user),
        });
      } else {
        res
          .status(200)
          .send({ message: "Correo o contraseña incorrectos", data: undefined });
      }
    });
  }
}

const actualizar_user_verificado = async function (req, res) {

  var id = req.params['id'];
  var codigo = req.params['codigo'];

  var user = await User.findById({ _id: id });

  if (codigo == user.codigo) {
    var reg = await User.findByIdAndUpdate({ _id: id }, { verificado: true });

    res.status(200).send({ data: reg });
  } else if (codigo != user.codigo) {
    res.status(200).send({ data: undefined });
  }
}

const obtener_user = async function (req, res) {
  if (req.user) {

    var id = req.params['id'];

    try {
      var reg = await User.findById({ _id: id });
      res.status(200).send({ data: reg });

    } catch (error) {
      res.status(200).send({ data: undefined });
    }

  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const actualizar_user = async function (req, res) {
  if (req.user) {
    var id = req.params['id'];
    var data = req.body;

    var reg = await User.findByIdAndUpdate({ _id: id }, {
      nombres: data.nombres,
      ciudad: data.ciudad,
      telefono: data.telefono
    });

    res.status(200).send({ data: reg });

  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const comparar_password = async function (req, res) {
  var data = req.body;
  var users_arr = [];

  //Busca un cliente mediante el correo
  users_arr = await User.find({ email: data.email });

  if (users_arr.length == 0) {
    res
      .status(200)
      .send({ message: "Correo o contraseña incorrectos", data: undefined });
  } else {
    //Si existe el cliente se manda al login
    let user = users_arr[0];

    //Comparar contraseñas
    bcrypt.compare(data.password, user.password, async function (error, check) {
      if (check) {
        res.status(200).send({ data: true });
      } else {
        res
          .status(200)
          .send({ message: "Contraseña incorrecta", data: undefined });
      }
    });
  }
}

const actualizar_password_user = async function (req, res) {
  if (req.user) {
    var id = req.params['id'];
    var data = req.body;

    if (data.password) {
      bcrypt.hash(data.password, null, null, async function (err, hash) {
        if (hash) {
          data.password = hash;
          var reg = await User.findByIdAndUpdate({ _id: id }, {
            password: data.password
          });

          res.status(200).send({ data: true });

        } else {
          res.status(200).send({ message: "Error server", data: undefined });
        }
      });
    }

  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const eliminar_cuenta_user = async function (req, res) {
  try {
    if (req.user) {
      var id = req.params['id'];

      // Obtener las reservaciones del usuario
      const reservacionesUsuario = await Reservacion.find({ cliente: id });

      // Actualizar el campo cliente en las reservaciones
      await Reservacion.updateMany({ cliente: id }, { cliente: '65a89082d0979c1b8c050008' });

      // Eliminar al usuario por _id
      let reg = await User.findByIdAndRemove({ _id: id });

      res.status(200).send({ data: reg, reservacionesUsuario });
    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } catch (error) {
    console.error('Error al eliminar la cuenta del usuario:', error);
  }
}

const registro_token_cambio_pass = async function (req, res) {
  //Obtiene los parámetros del cliente
  var data = req.body;
  var users_arr = [];

  //Verifica que no exista correo repetido
  users_arr = await User.find({ email: data.correo });

  const uniqueString = uuidv4();

  if (users_arr.length == 1) {
    let reg = await User.findOneAndUpdate({ email: data.correo }, { token_pass: uniqueString });
    res.status(200).send({ data: reg });

  } else if (users_arr == 0) {
    res
      .status(200)
      .send({
        message: "El correo ingresado no pertenece a nungún usuario",
        data: undefined,
      });
  }
}

const enviar_correo_token_cambio_pass = async function (req, res) {

  var correo = req.params['correo'];

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

  // const accessToken = await oauth2Client.getAccessToken();

  var readHTMLFile = function (path, callback) {
    fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
      if (err) {
        throw err;
        callback(err);
      }
      else {
        callback(null, html);
      }
    });
  };

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'reservatugrass@gmail.com',
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN
      // accessToken: accessToken
    }
  });

  //cliente _id fecha data subtotal

  var user = await User.findOne({ email: correo });

  readHTMLFile(process.cwd() + '/mail-cambio-pass.html', (err, html) => {

    let rest_html = ejs.render(html, {
      nombres: user.nombres,
      token: user.token_pass
    });

    var template = handlebars.compile(rest_html);
    var htmlToSend = template({ op: true });

    var mailOptions = {
      from: 'reservatugrass@gmail.com',
      to: user.email,
      subject: 'Cambio de contraseña, Reserva Tu Grass.',
      html: htmlToSend
    };
    res.status(200).send({ data: true });
    enviar_whatsapp_cambio_pass(user);

    transporter.sendMail(mailOptions, function (error, info) {
      if (!error) {
        console.log('Email sent: ' + info.response);
      }
    });

  });
}

const enviar_whatsapp_cambio_pass = async (user) => {
  const tel = '+51' + user.telefono;
  const chatId = tel.substring(1) + "@c.us";
  const number_details = await whatsapp.getNumberId(chatId);
  if (number_details) {
    const mensaje = `Hola ${user.nombres}, su solicitud de cambio de contraseña se realizó de manera correcta, revise su bandeja de entrada de \n${user.email}.`;
    await whatsapp.sendMessage(chatId, mensaje);
  } else {
    console.log('Whatsapp no existe');
  }
}

const verificar_token_cambio_pass = async function (req, res) {
  var token = req.params['token'];

  var reg = await User.findOne({ token_pass: token });

  if (reg) {
    res.status(200).send({ data: true });
  } else {
    res.status(200).send({ message: "No existe el código de verificación", data: undefined });
  }
}

const cambiar_password_user = async function (req, res) {
  var token = req.params['token'];
  var data = req.body;

  if (data.password) {
    bcrypt.hash(data.password, null, null, async function (err, hash) {
      if (hash) {
        data.password = hash;
        var reg = await User.findOneAndUpdate({ token_pass: token }, {
          password: data.password,
          token_pass: 'N0TokenHaveV01Ddew'
        });

        res.status(200).send({ data: true });

      } else {
        res.status(200).send({ message: "Error server", data: undefined });
      }
    });
  }
}


// Reservaciones
const crear_reservacion_user = async function (req, res) {
  try {
    if (req.user && req.user.role === 'USER') {
      const data = req.body;

      // Calcular la hora de fin de la nueva reserva
      const horaFinNuevaReserva = data.hora_fin;

      // Verificar si hay reservas existentes que se solapen con la nueva reserva
      const reservasExistente = await Reservacion.find({
        cancha: data.cancha,
        fecha: data.fecha,
        $or: [
          {
            $and: [
              { hora_inicio: { $lt: horaFinNuevaReserva } },
              { hora_fin: { $gt: data.hora_inicio } }
            ]
          },
          {
            $and: [
              { hora_inicio: { $lte: data.hora_inicio } },
              { hora_fin: { $gte: horaFinNuevaReserva } }
            ]
          },
          {
            $and: [
              { hora_inicio: { $lte: data.hora_fin } },
              { hora_fin: { $gte: horaFinNuevaReserva } },
              { hora_fin: { $lte: data.hora_inicio } }
            ]
          }
        ]
      });

      // Si hay reservas existentes, enviar un mensaje de conflicto
      if (reservasExistente.length > 0) {
        res.status(200).send({ data: undefined, message: 'La cancha ya está reservada para ese horario' });
      } else {
        // Si no hay conflictos, crear la reserva
        const reg = await Reservacion.create(data);
        res.status(200).send({ data: reg });
      }

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } catch (error) {
    console.error('Error al crear la reserva:', error);
    res.status(500).send({ message: 'Error al crear la reserva' });
  }
}

const obtener_reservaciones_user = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'USER') {
      let id = req.params['id'];

      let reservas = [];
      try {
        reservas = await Reservacion.find({ cliente: id }).sort({ createdAt: -1 }).populate('empresa').populate('cancha');
        res.status(200).send({ data: reservas });
      } catch (error) {
        res.status(200).send({ data: undefined });
      }
    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const obtener_reservaciones_public = async function (req, res) {
  let id = req.params['id'];

  let reservas = [];
  try {
    reservas = await Reservacion.find({ cancha: id }).sort({ createdAt: -1 }).populate('empresa').populate('cancha');
    res.status(200).send({ data: reservas });
  } catch (error) {
    res.status(200).send({ data: undefined });
  }
}

const obtener_reservaciones_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'ADMIN') {

      let reservaciones = [];
      try {
        reservaciones = await Reservacion.find().sort({ createdAt: -1 })
          .populate('empresa')
          .populate('cancha')
          .populate({ path: 'cliente', model: 'user' });

        res.status(200).send({ data: reservaciones });
      } catch (error) {
        res.status(200).send({ data: undefined });
      }
    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const obtener_reservacion_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'ADMIN') {

      let id = req.params['id'];

      try {
        let reg = await Reservacion.findById({ _id: id })
          .populate('empresa')
          .populate('cancha')
          .populate({ path: 'cliente', model: 'user' });
        res.status(200).send({ data: reg });
      } catch (error) {
        res.status(200).send({ data: undefined });
      }

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const actualizar_reserva_reservado_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'ADMIN') {

      var id = req.params['id'];

      var reg = await Reservacion.findByIdAndUpdate({ _id: id }, { estado: 'Reservado' });
      var user = await User.findById({ _id: reg.cliente });

      res.status(200).send({ data: reg });
      enviar_whatsapp_reservado_admin(user, reg);

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const enviar_whatsapp_reservado_admin = async (user, reservacion) => {
  const tel = '+51' + user.telefono;
  const chatId = tel.substring(1) + "@c.us";
  const number_details = await whatsapp.getNumberId(chatId);
  if (number_details) {
    const mensaje = `Hola ${user.nombres}, tu reservación con código ${reservacion._id} fue confirmado. \nGracias por preferirnos y disfrute de su partido!.`;
    await whatsapp.sendMessage(chatId, mensaje);
  } else {
    console.log('Whatsapp no existe');
  }
}


// Función para eliminar reservas vencidas
const eliminarReservasVencidas = async () => {
  try {
    // Define el límite de tiempo para las reservas (en minutos)
    const limiteTiempo = 15;

    // Calcula la fecha límite para eliminar las reservas
    const fechaLimite = moment().subtract(limiteTiempo, 'minutes');

    // Busca las reservas con estado 'Ocupado' y fecha de creación anterior a la fecha límite
    const reservasVencidas = await Reservacion.find({
      estado: 'Ocupado',
      createdAt: { $lte: fechaLimite.toDate() }
    });

    // Elimina las reservas vencidas
    for (const reserva of reservasVencidas) {
      await Reservacion.findByIdAndDelete(reserva._id);

    }
  } catch (error) {
    console.error('Error al eliminar reservas vencidas:', error);
  }
}

setInterval(eliminarReservasVencidas, updateField, 60 * 1000);

// Función para actualizar el estado de las reservas
const actualizarEstadoReservas = async () => {
  try {
    // Obtiene la fecha y hora actual
    const ahora = new Date();
    const horaActual = ahora.getHours();

    // Busca las reservas con estado 'Reservado' y fecha y hora de fin menor o igual a la fecha y hora actual
    const reservasPendientes = await Reservacion.find({
      estado: 'Reservado',
      $or: [
        {
          $and: [
            { fecha: { $lt: ahora.toISOString().split('T')[0] } }, // Fecha pasada
            { hora_fin: { $lte: horaActual } } // Hora pasada o igual
          ]
        },
        {
          $and: [
            { fecha: ahora.toISOString().split('T')[0] }, // Fecha actual
            { hora_fin: { $lte: horaActual } } // Hora pasada o igual
          ]
        }
      ]
    });

    // Actualiza el estado de las reservas encontradas a 'Finalizado'
    for (const reserva of reservasPendientes) {
      await Reservacion.findByIdAndUpdate(reserva._id, { estado: 'Finalizado' });
    }
  } catch (error) {
    console.error('Error al actualizar el estado de las reservas:', error);
  }
}

// Configura un temporizador para verificar y ejecutar la función cada minuto
setInterval(actualizarEstadoReservas, 60 * 1000);

//Suscripciones Empresa
const obtener_suscripciones_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'ADMIN') {

      var reg = await Suscripcion.find().sort({ createdAt: -1 }).populate('empresa');
      if (reg.length >= 1) {
        res.status(200).send({ data: reg });

      } else if (reg.length == 0) {
        res.status(200).send({ data: undefined });
      }
    } else {
      res.status(500).send({ message: 'NoAccess' });
    }

  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const obtener_suscripcion_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'ADMIN') {

      let id = req.params['id'];

      try {
        let reg = await Suscripcion.findById({ _id: id }).populate('empresa');
        res.status(200).send({ data: reg });
      } catch (error) {
        res.status(200).send({ data: undefined });
      }

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const actualizar_suscripcion_confirmado_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'ADMIN') {

      var id = req.params['id'];

      var reg = await Suscripcion.findByIdAndUpdate({ _id: id }, { estado: 'Confirmado' });
      var empresa = await Empresa.findById({ _id: reg.empresa });

      res.status(200).send({ data: reg });
      enviar_whatsapp_suscripcion(empresa, reg);

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const enviar_whatsapp_suscripcion = async (user, reservacion) => {
  const tel = '+51' + user.telefono;
  const chatId = tel.substring(1) + "@c.us";
  const number_details = await whatsapp.getNumberId(chatId);
  if (number_details) {
    const mensaje = `Hola ${user.nombre}, tu suscripción con código ${reservacion._id} fue confirmado. \nGracias por preferirnos y disfrute de la plataforma!.`;
    await whatsapp.sendMessage(chatId, mensaje);
  } else {
    console.log('Whatsapp no existe');
  }
}

function updateField() {
  Suscripcion.find((err, results) => {
    if (err) {
      console.error(err);
      return;
    }
    results.forEach((result) => {
      const miliActual = new Date().getTime(); // Un mes en milisegundos
      const miliVencimiento = result.vencimiento.getTime(); // Un mes en milisegundos

      const fechaActual = new Date();
      const hora_actual = fechaActual.getHours();
      const minutos_actual = fechaActual.getMinutes();

      //Función de actualizar el estado vencido de los pagos
      if (miliActual >= miliVencimiento) {
        result.estado = 'Vencido';
        result.save((err) => {
          if (err) {
            console.error(err);
            return;
          }
        });
      }
    });
  });
}

//Cuentas ADMIN
const registro_cuenta_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'ADMIN') {

      var data = req.body;

      let reg = await CuentaAdmin.create(data);
      res.status(200).send({ data: reg });

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const obtener_cuentas_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'ADMIN') {
      let id = req.params['id'];

      let cuentas = [];
      try {
        cuentas = await CuentaAdmin.find().sort({ createdAt: -1 });
        res.status(200).send({ data: cuentas });
      } catch (error) {
        res.status(200).send({ data: undefined });
      }
    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const obtener_cuenta_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'ADMIN') {

      var id = req.params['id'];

      let cuenta;

      try {
        cuenta = await CuentaAdmin.findById({ _id: id });
        res.status(200).send({ data: cuenta });
      } catch (error) {
        res.status(200).send({ data: undefined });
      }
    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const eliminar_cuenta_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'ADMIN') {

      var id = req.params['id'];
      let reg = await CuentaAdmin.findByIdAndRemove({ _id: id });
      res.status(200).send({ data: reg });

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const actualizar_cuenta_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'ADMIN') {

      var id = req.params['id'];
      var data = req.body;

      var reg = await CuentaAdmin.findByIdAndUpdate({ _id: id }, {
        banco: data.banco,
        titular: data.titular,
        cuenta: data.cuenta,
        cci: data.cci,
        color: data.color
      });

      res.status(200).send({ data: reg });

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const obtener_cuentas_de_admin = async function (req, res) {
  if (req.user) {

    let cuentas = [];
    try {
      cuentas = await CuentaAdmin.find();
      res.status(200).send({ data: cuentas });
    } catch (error) {
      res.status(200).send({ data: undefined });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

//EMPRESA
const obtener_empresas_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'ADMIN') {

      let empresas = [];
      try {
        empresas = await Caracteristicas.find().sort({ createdAt: -1 }).populate('empresa');
        res.status(200).send({ data: empresas });
      } catch (error) {
        res.status(200).send({ data: undefined });
      }
    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const actualizar_empresa_verificado_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'ADMIN') {

      var id = req.params['id'];

      var reg = await Empresa.findByIdAndUpdate({ _id: id }, { verificado: true });

      res.status(200).send({ data: reg });
      enviar_whatsapp_empresa_verificado(reg);

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const enviar_whatsapp_empresa_verificado = async (user) => {
  const tel = '+51' + user.telefono;
  const chatId = tel.substring(1) + "@c.us";
  const number_details = await whatsapp.getNumberId(chatId);
  if (number_details) {
    const mensaje = `Hola ${user.nombre}, el registro de tu empresa fue confirmado. Puedes acceder a tu cuenta desde www.reservatugrass.com/login. \nGracias por preferirnos!.`;
    await whatsapp.sendMessage(chatId, mensaje);
  } else {
    console.log('Whatsapp no existe');
  }
}

const obtener_caracteristicas_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'ADMIN') {
      let id = req.params['id'];

      let caracteristicas = await Caracteristicas.find({ empresa: id });


      if (caracteristicas.length >= 1) {
        res.status(200).send({ data: caracteristicas });
      } else {
        res.status(200).send({ data: undefined });
      }
    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const eliminar_empresa_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role === 'ADMIN') {
      var id = req.params['id'];

      try {
        // Eliminar la empresa por _id
        let reg = await Empresa.findByIdAndRemove({ _id: id });

        // Eliminar características por el campo empresa
        let reg1 = await Caracteristicas.deleteMany({ empresa: id });

        res.status(200).send({ data: reg, reg1 });
      } catch (error) {
        res.status(200).send({ data: undefined, message: error });
      }

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const obtener_cuentas_de_empresa_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'ADMIN') {
      let id = req.params['id'];

      let cuentas = [];
      try {
        cuentas = await Cuenta.find({ empresa: id }).sort({ createdAt: -1 });
        res.status(200).send({ data: cuentas });
      } catch (error) {
        res.status(200).send({ data: undefined });
      }
    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

////CLIENTES
const obtener_clientes_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'ADMIN') {

      let clientes = [];
      try {
        clientes = await User.find().sort({ createdAt: -1 });
        res.status(200).send({ data: clientes });
      } catch (error) {
        res.status(200).send({ data: undefined });
      }
    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

/////KPI ADMIN
const kpi_ganancias_mensuales_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'ADMIN') {
      var enero = 0;
      var febrero = 0;
      var marzo = 0;
      var abril = 0;
      var mayo = 0;
      var junio = 0;
      var julio = 0;
      var agosto = 0;
      var septiembre = 0;
      var octubre = 0;
      var noviembre = 0;
      var diciembre = 0;

      var ganancia_total = 0;
      var total_mes = 0;
      var total = 0;
      var total_mes_anterior = 0;
      var count_ventas = 0;

      var reg = await Reservacion.find({
        $or: [
          { estado: 'Reservado' },
          { estado: 'Finalizado' }
        ],
        cliente: { $ne: '65a89082d0979c1b8c050008' } // Excluye al cliente generado por grass mediante su ID
      });

      let current_date = new Date();
      let current_year = current_date.getFullYear();
      let current_month = current_date.getMonth() + 1;

      for (var item of reg) {
        let createdAt_date = new Date(item.createdAt);
        let mes = createdAt_date.getMonth() + 1;

        if (createdAt_date.getFullYear() == current_year) {

          ganancia_total += item.subtotal / 10;

          if (mes == current_month) {
            total_mes += item.subtotal / 10;
            count_ventas = count_ventas + 1;
          }

          if (mes == current_month - 1) {
            total_mes_anterior += item.subtotal / 10;
          }

          if (mes == 1) {
            enero += item.subtotal / 10;

          } else if (mes == 2) {
            febrero += item.subtotal / 10;

          } else if (mes == 3) {
            marzo += item.subtotal / 10;

          } else if (mes == 4) {
            abril += item.subtotal / 10;

          } else if (mes == 5) {
            mayo = mayo + item.subtotal / 10;

          } else if (mes == 6) {
            junio += item.subtotal / 10;

          } else if (mes == 7) {
            julio += item.subtotal / 10;

          } else if (mes == 8) {
            agosto += item.subtotal / 10;

          } else if (mes == 9) {
            septiembre += item.subtotal / 10;

          } else if (mes == 10) {
            octubre += item.subtotal / 10;

          } else if (mes == 11) {
            noviembre += item.subtotal / 10;

          } else if (mes == 12) {
            diciembre += item.subtotal / 10;

          }
        }
      }

      res.status(200).send({
        enero: enero,
        febrero: febrero,
        marzo: marzo,
        abril: abril,
        mayo: mayo,
        junio: junio,
        julio: julio,
        agosto: agosto,
        septiembre: septiembre,
        octubre: octubre,
        noviembre: noviembre,
        diciembre: diciembre,

        ganancia_total: ganancia_total,
        total_mes: total_mes,
        total_mes_anterior: total_mes_anterior,
        count_ventas: count_ventas
      });

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}


////////CONTACTO
const enviar_mensaje_contacto = async function (req, res) {
  let data = req.body;
  data.estado = 'Abierto';
  let reg = await Contacto.create(data);

  res.status(200).send({ data: reg })
}

const obtener_mensajes_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'ADMIN') {

      let reg = await Contacto.find().sort({ createdAt: -1 });

      res.status(200).send({ data: reg });

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const cerrar_mensaje_admin = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'ADMIN') {

      let id = req.params['id'];

      let reg = await Contacto.findByIdAndUpdate({ _id: id }, { estado: 'Cerrado' });

      res.status(200).send({ data: reg });

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

module.exports = {
  registro_user,
  enviar_correo_confirmacion,
  login_user,
  actualizar_user_verificado,
  obtener_user,
  actualizar_user,
  comparar_password,
  actualizar_password_user,
  eliminar_cuenta_user,
  registro_token_cambio_pass,
  enviar_correo_token_cambio_pass,
  verificar_token_cambio_pass,
  cambiar_password_user,
  crear_reservacion_user,
  obtener_reservaciones_user,
  obtener_reservaciones_public,
  obtener_reservaciones_admin,
  obtener_reservacion_admin,
  actualizar_reserva_reservado_admin,
  obtener_suscripciones_admin,
  obtener_suscripcion_admin,
  actualizar_suscripcion_confirmado_admin,
  registro_cuenta_admin,
  obtener_cuentas_admin,
  obtener_cuenta_admin,
  eliminar_cuenta_admin,
  actualizar_cuenta_admin,
  obtener_cuentas_de_admin,
  obtener_empresas_admin,
  actualizar_empresa_verificado_admin,
  obtener_caracteristicas_admin,
  eliminar_empresa_admin,
  obtener_cuentas_de_empresa_admin,
  obtener_clientes_admin,
  kpi_ganancias_mensuales_admin,

  enviar_mensaje_contacto,
  obtener_mensajes_admin,
  cerrar_mensaje_admin
}