'use strict';

var Empresa = require('../Models/Empresa');
var Caracteristicas = require('../Models/Caracteristicas');
var Cancha = require('../Models/Cancha');
var Cuenta = require('../Models/Cuenta');
var Reservacion = require('../Models/Reservacion');
var Suscripcion = require('../Models/Suscripcion');
var User = require('../Models/User');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../Helpers/jwt');

var fs = require('fs');
var path = require('path');

var handlebars = require('handlebars');
var ejs = require('ejs');
var nodemailer = require('nodemailer');
const { whatsapp } = require('../lib/whatsapp');

const registro_empresa = async function (req, res) {
  //Obtiene los parámetros del cliente
  var data = req.body;
  var empresas_arr = [];

  //Verifica que no exista correo repetido
  empresas_arr = await Empresa.find({ email: data.email });

  if (empresas_arr.length == 0) {
    //Registro de empresa

    if (data.password) {
      bcrypt.hash(data.password, null, null, async function (err, hash) {
        if (hash) {
          data.password = hash;
          var reg = await Empresa.create(data);
          res.status(200).send({
            data: reg,
            token: jwt.createToken(reg)
          });
          enviar_whatsapp_verificacion(data);
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

const enviar_whatsapp_verificacion = async (data) => {
  const tel = '+51915237901';
  const chatId = tel.substring(1) + "@c.us";
  const number_details = await whatsapp.getNumberId(chatId);
  if (number_details) {
    const mensaje = `Hola, verifica el registro de la empresa \n${data.nombre} \ndesde www.reservatugrass.com/admin/empresas`;
    await whatsapp.sendMessage(chatId, mensaje);
  } else {
    console.log('Whatsapp no existe');
  }
}

const login_empresa = async function (req, res) {
  var data = req.body;
  var empresas_arr = [];

  //Busca un cliente mediante el correo
  empresas_arr = await Empresa.find({ email: data.email });

  if (empresas_arr.length == 0) {
    res
      .status(200)
      .send({ message: "Correo o contraseña incorrectos", data: undefined });
  } else {
    //Si existe el cliente se manda al login
    let user = empresas_arr[0];

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

const obtener_empresa = async function (req, res) {
  if (req.user) {

    var id = req.params['id'];

    try {
      var reg = await Empresa.findById({ _id: id });
      res.status(200).send({ data: reg });

    } catch (error) {
      res.status(200).send({ data: undefined });
    }

  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const obtener_empresa_publico = async function (req, res) {
  var id = req.params['id'];

  try {
    var reg = await Empresa.findById({ _id: id });
    res.status(200).send({ data: reg });

  } catch (error) {
    res.status(200).send({ data: undefined });
  }
}

const listar_empresas_filtro = async function (req, res) {

  let filtro = req.params['filtro'];

  let reg = await Empresa.find({ nombre: new RegExp(filtro, 'i') }).sort({ createdAt: -1 }).limit(10);
  if (reg.length > 0) {
    res.status(200).send({ data: reg });
  } else {
    res.status(200).send({ data: undefined });
  }
}

const listar_empresas_publico = async function (req, res) {

  let reg = await Empresa.find().sort({ createdAt: 1 });
  if (reg.length > 0) {
    res.status(200).send({ data: reg });
  } else {
    res.status(200).send({ data: undefined });
  }
}

const listar_empresas_user = async function (req, res) {
  if (req.user) {

    let region = req.params['region'];

    let reg = await Empresa.find({ region: new RegExp(region, 'i') }).sort({ createdAt: 1 });
    if (reg.length > 0) {
      res.status(200).send({ data: reg });
    } else {
      res.status(200).send({ data: undefined });
    }

  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const listar_empresas_region = async function (req, res) {

  let region = req.params['region'];

  let reg = await Empresa.find({ region: new RegExp(region, 'i') }).sort({ createdAt: -1 }).limit(20);
  if (reg.length > 0) {
    res.status(200).send({ data: reg });
  } else {
    res.status(200).send({ data: undefined });
  }
}

const listar_empresas_prov = async function (req, res) {

  let region = req.params['region'];
  let provincia = req.params['provincia'];

  let reg = await Empresa.find({
    $and: [
      { provincia: provincia },
      { region: region }
    ]
  }).sort({ createdAt: -1 }).limit(20);

  if (reg.length > 0) {
    res.status(200).send({ data: reg });
  } else {
    res.status(200).send({ data: undefined });
  }
}

const listar_empresas_dist = async function (req, res) {

  let region = req.params['region'];
  let provincia = req.params['provincia'];
  let distrito = req.params['distrito'];

  let reg = await Empresa.find({
    $and: [
      { provincia: provincia },
      { region: region },
      { distrito: distrito }
    ]
  }).sort({ createdAt: -1 }).limit(20);

  if (reg.length > 0) {
    res.status(200).send({ data: reg });
  } else {
    res.status(200).send({ data: undefined });
  }
}

const actualizar_empresa = async function (req, res) {
  if (req.user) {
    var id = req.params['id'];
    var data = req.body;

    var reg = await Empresa.findByIdAndUpdate({ _id: id }, {
      nombre: data.nombre,
      direccion: data.direccion,
      telefono: data.telefono,
      ubicacion: data.ubicacion,
    });

    res.status(200).send({ data: reg });

  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

//Características

const crear_caracteristicas_empresa = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {
      var data = req.body;
      try {
        var reg = await Caracteristicas.create(data);
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

const obtener_caracteristicas_empresa = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {
      let id = req.params['id'];
      let caracteristicas = await Caracteristicas.find({ empresa: id }).populate('empresa');

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

const actualizar_caracteristicas_empresa = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {

      var id = req.params['id'];
      var data = req.body;

      try {
        var reg = await Caracteristicas.updateOne({ empresa: id }, {
          techado: data.techado,
          canchas_futsal: data.canchas_futsal,
          canchas_voley: data.canchas_voley,
          iluminacion: data.iluminacion,
          garaje: data.garaje
        });
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

const obtener_caracteristicas_empresa_publico = async function (req, res) {
  let caracteristicas = await Caracteristicas.find().populate('empresa');

  if (caracteristicas.length >= 1) {
    res.status(200).send({ data: caracteristicas });
  } else {
    res.status(200).send({ data: undefined });
  }
}

//Canchas
const crear_cancha_empresa = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {
      var data = req.body;
      try {
        var reg = await Cancha.create(data);
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

const obtener_canchas_empresa = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {
      let id = req.params['id'];
      let canchas = await Cancha.find({ empresa: id }).sort({ createdAt: 1 }).populate('empresa');

      if (canchas.length >= 1) {
        res.status(200).send({ data: canchas });
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

const obtener_cancha_empresa = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {

      var id = req.params['id'];

      let cancha;

      try {
        cancha = await Cancha.findById({ _id: id });
        res.status(200).send({ data: cancha });
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

const obtener_cancha_publico = async function (req, res) {
  var id = req.params['id'];

  let cancha;

  try {
    cancha = await Cancha.findById({ _id: id }).populate('empresa');
    res.status(200).send({ data: cancha });
  } catch (error) {
    res.status(200).send({ data: undefined });
  }
}

const actualizar_cancha_empresa = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {

      var id = req.params['id'];
      var data = req.body;

      var reg = await Cancha.findByIdAndUpdate({ _id: id }, {
        descripcion: data.descripcion,
        tipo: data.tipo,
        largo: data.largo,
        ancho: data.ancho,
        precio_dia: data.precio_dia,
        precio_noche: data.precio_noche
      });

      res.status(200).send({ data: reg });

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const eliminar_cancha_empresa = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {

      var id = req.params['id'];
      let reg = await Cancha.findByIdAndRemove({ _id: id });
      res.status(200).send({ data: reg });

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const obtener_canchas = async function (req, res) {
  let id = req.params['id'];
  let canchas = await Cancha.find({ empresa: id }).sort({ createdAt: 1 }).populate('empresa');

  if (canchas.length >= 1) {
    res.status(200).send({ data: canchas });
  } else {
    res.status(200).send({ data: undefined });
  }
}

/////RESERVACIONES
const registro_reservacion_grass = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {

      var data = req.body;

      let reg = await Reservacion.create(data);
      res.status(200).send({ data: reg });

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const obtener_reservaciones_empresa = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {
      let id = req.params['id'];

      let reservas = await Reservacion.find({ empresa: id })
        .sort({ createdAt: -1 })
        .populate('empresa')
        .populate('cancha')
        .populate({ path: 'cliente', model: 'user' });
      

      if (reservas.length >= 1) {
        res.status(200).send({ data: reservas });
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

const obtener_reservacion_empresa = async function (req, res) {
  if (req.user) {
      if (req.user.role == 'GRASS') {

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

const actualizar_reserva_reservado_empresa = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {

      var id = req.params['id'];

      var reg = await Reservacion.findByIdAndUpdate({ _id: id }, { estado: 'Reservado' });
      var user = await User.findById({ _id: reg.cliente });

      res.status(200).send({ data: reg });
      enviar_whatsapp_reservado(user, reg);

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const enviar_whatsapp_reservado = async (user, reservacion) => {
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

const obtener_clientes_empresa = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {
      let id = req.params['id'];

      let reservas = await Reservacion.find({ empresa: id }).sort({ createdAt: -1 })
        .populate('empresa').populate('cancha').populate({ path: 'cliente', model: 'user' });

      let uniqueClients = new Set();

      reservas.forEach(reserva => { 
        if (!uniqueClients.has(reserva.cliente)) { 
          uniqueClients.add(reserva.cliente); 
        } 
      });

      if (uniqueClients.size >= 1) {
        res.status(200).send({ data: Array.from(uniqueClients) });
      } else {
        res.status(200).send({ data: undefined });
      }
    } else { res.status(500).send({ message: 'NoAccess' }); }
  } else { res.status(500).send({ message: 'NoAccess' }); }
}

const eliminar_reservacion_empresa = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {

      var id = req.params['id'];
      let reg = await Reservacion.findByIdAndRemove({ _id: id });
      res.status(200).send({ data: reg });

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

///SUSCRIPCIONES
const registro_suscripcion_prueba = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {
      var data = req.body;

      const fechaActual = new Date();
      const fechaNueva = new Date();

      fechaNueva.setDate(fechaActual.getDate() + 10);

      data.estado = 'Confirmado';
      data.createdAt = fechaActual;
      data.vencimiento = fechaNueva;

      let suscripcion = await Suscripcion.create(data);

      res.status(200).send({ data: suscripcion });

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }

  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const registro_suscripcion_empresa = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {
      var data = req.body;

      const fechaActual = new Date();
      const fechaNueva = new Date();

      fechaNueva.setMonth(fechaActual.getMonth() + 1);

      data.estado = 'Reservado';
      data.createdAt = fechaActual;
      data.vencimiento = fechaNueva;

      let suscripcion = await Suscripcion.create(data);

      res.status(200).send({ data: suscripcion });
    } else {
      res.status(500).send({ message: 'NoAccess' });
    }

  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const obtener_suscripciones_empresa = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {
      var id = req.params['id'];

      var reg = await Suscripcion.find({ empresa: id }).sort({ createdAt: -1 });
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

/////KPI
const kpi_ganancias_mensuales_grass = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {
      let id = req.params['id'];
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

      var total_ventas = 0;
      var total_mes = 0;
      var total_mes_anterior = 0;
      var count_ventas = 0;

      var reg = await Reservacion.find({
        $and: [{ $or: [{ estado: 'Reservado' }, { estado: 'Finalizado' }] }, { cancha: id }]
      });

      let current_date = new Date();
      let current_year = current_date.getFullYear();
      let current_month = current_date.getMonth() + 1;

      for (var item of reg) {
        let createdAt_date = new Date(item.createdAt);
        let mes = createdAt_date.getMonth() + 1;

        if (createdAt_date.getFullYear() == current_year) {

          total_ventas += 1;

          if (mes == current_month) {
            total_mes += 1;
            count_ventas += 1;
          }

          if (mes == current_month - 1) {
            total_mes_anterior += 1;
          }

          if (mes == 1) {
            enero += 1;
          } else if (mes == 2) {
            febrero += 1;
          } else if (mes == 3) {
            marzo += 1;
          } else if (mes == 4) {
            abril += 1;
          } else if (mes == 5) {
            mayo += 1;
          } else if (mes == 6) {
            junio += 1;
          } else if (mes == 7) {
            julio += 1;
          } else if (mes == 8) {
            agosto += 1;
          } else if (mes == 9) {
            septiembre += 1;
          } else if (mes == 10) {
            octubre += 1;
          } else if (mes == 11) {
            noviembre += 1;
          } else if (mes == 12) {
            diciembre += 1;
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

        total_ventas: total_ventas,
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

//Galería CANCHA
const agregar_imagen_galeria_cancha = async function (req, res) {

  if (req.user) {
    if (req.user.role == 'GRASS') {

      let id = req.params['id'];
      let data = req.body;

      var img_path = req.files.imagen.path;
      var name = img_path.split('\\');
      var imagen_name = name[2];

      let reg = await Cancha.findByIdAndUpdate({ _id: id }, {
        $push: {
          galeria: {
            imagen: imagen_name,
            _id: data._id
          }
        }
      });

      res.status(200).send({ data: reg });


    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const eliminar_imagen_galeria_cancha = async function (req, res) {

  if (req.user) {
    if (req.user.role == 'GRASS') {

      let id = req.params['id'];
      let data = req.body;



      let reg = await Cancha.findByIdAndUpdate({ _id: id }, {
        $pull: {
          galeria: { _id: data._id }
        }
      });

      res.status(200).send({ data: reg });


    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const obtener_galeria_cancha = async function (req, res) {
  var img = req.params['img'];

  fs.stat('./uploads/empresas/' + img, function (err) {
    if (!err) {
      let path_img = './uploads/empresas/' + img;
      res.status(200).sendFile(path.resolve(path_img));
    } else {
      let path_img = './uploads/default.jpg';
      res.status(200).sendFile(path.resolve(path_img));
    }
  });
}

//PORTADA DE GRASS
const agregar_imagen_portada = async function (req, res) {

  if (req.user) {
    if (req.user.role == 'GRASS') {

      let id = req.params['id'];
      let data = req.body;

      var img_path = req.files.imagen.path;
      var name = img_path.split('\\');
      console.log(name);
      var imagen_name = name[2];

      let reg = await Empresa.findByIdAndUpdate({ _id: id }, {
        $push: {
          portada: {
            imagen: imagen_name,
            _id: data._id
          }
        }
      });

      res.status(200).send({ data: reg });


    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const eliminar_imagen_portada = async function (req, res) {

  if (req.user) {
    if (req.user.role == 'GRASS') {

      let id = req.params['id'];
      let data = req.body;



      let reg = await Empresa.findByIdAndUpdate({ _id: id }, {
        $pull: {
          portada: { _id: data._id }
        }
      });

      res.status(200).send({ data: reg });


    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const obtener_imagen_portada = async function (req, res) {
  var img = req.params['img'];

  fs.stat('./uploads/empresas/' + img, function (err) {
    if (!err) {
      let path_img = './uploads/empresas/' + img;
      res.status(200).sendFile(path.resolve(path_img));
    } else {
      let path_img = './uploads/empresas/default-portada.jpg';
      res.status(200).sendFile(path.resolve(path_img));
    }
  });
}

//Cuentas
const registro_cuenta_grass = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {

      var data = req.body;

      let reg = await Cuenta.create(data);
      res.status(200).send({ data: reg });

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const obtener_cuentas_grass = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {
      let id = req.params['id'];

      let cuentas = [];
      try {
        cuentas = await Cuenta.find({ empresa: id }).sort({ createdAt: -1 }).populate('empresa');
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

const obtener_cuenta_grass = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {

      var id = req.params['id'];

      let cuenta;

      try {
        cuenta = await Cuenta.findById({ _id: id });
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

const eliminar_cuenta_grass = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {

      var id = req.params['id'];
      let reg = await Cuenta.findByIdAndRemove({ _id: id });
      res.status(200).send({ data: reg });

    } else {
      res.status(500).send({ message: 'NoAccess' });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const actualizar_cuenta_grass = async function (req, res) {
  if (req.user) {
    if (req.user.role == 'GRASS') {

      var id = req.params['id'];
      var data = req.body;

      var reg = await Cuenta.findByIdAndUpdate({ _id: id }, {
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

const obtener_cuentas = async function (req, res) {
  if (req.user) {

    let cuentas = [];
    try {
      cuentas = await Cuenta.find();
      res.status(200).send({ data: cuentas });
    } catch (error) {
      res.status(200).send({ data: undefined });
    }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}

const obtener_cuentas_de_grass = async function (req, res) {
  if (req.user) {
    let id = req.params['id'];

      let cuentas = [];
      try {
        cuentas = await Cuenta.find({ empresa: id }).sort({ createdAt: -1 }).populate('empresa');
        res.status(200).send({ data: cuentas });
      } catch (error) {
        res.status(200).send({ data: undefined });
      }
  } else {
    res.status(500).send({ message: 'NoAccess' });
  }
}


module.exports = {
  registro_empresa,
  login_empresa,
  obtener_empresa,
  obtener_empresa_publico,
  listar_empresas_filtro,
  listar_empresas_region,
  listar_empresas_prov,
  listar_empresas_dist,
  actualizar_empresa,
  crear_caracteristicas_empresa,
  obtener_caracteristicas_empresa,
  obtener_caracteristicas_empresa_publico,
  listar_empresas_publico,
  listar_empresas_user,
  actualizar_caracteristicas_empresa,
  crear_cancha_empresa,
  obtener_canchas_empresa,
  obtener_cancha_publico,
  obtener_canchas,
  registro_reservacion_grass,
  obtener_reservaciones_empresa,
  obtener_reservacion_empresa,
  actualizar_reserva_reservado_empresa,
  obtener_clientes_empresa,
  eliminar_reservacion_empresa,
  registro_suscripcion_prueba,
  registro_suscripcion_empresa,
  obtener_suscripciones_empresa,
  kpi_ganancias_mensuales_grass,
  obtener_cancha_empresa,
  actualizar_cancha_empresa,
  eliminar_cancha_empresa,
  agregar_imagen_galeria_cancha,
  eliminar_imagen_galeria_cancha,
  obtener_galeria_cancha,
  agregar_imagen_portada,
  eliminar_imagen_portada,
  obtener_imagen_portada,
  registro_cuenta_grass,
  obtener_cuentas_grass,
  obtener_cuenta_grass,
  eliminar_cuenta_grass,
  actualizar_cuenta_grass,
  obtener_cuentas,
  obtener_cuentas_de_grass
}