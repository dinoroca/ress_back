'use strict';

var express = require('express');
var UserController = require('../Controllers/UserController');
var api = express.Router();
var auth = require('../Middlewares/authenticate');

//Peticiones
api.post('/registro_user', UserController.registro_user);
api.get('/enviar_correo_confirmacion/:id', UserController.enviar_correo_confirmacion);
api.post('/login_user', UserController.login_user);
api.get('/obtener_user/:id', auth.auth, UserController.obtener_user);
api.put('/actualizar_user/:id', auth.auth, UserController.actualizar_user);
api.post('/comparar_password', UserController.comparar_password);
api.put('/actualizar_password_user/:id', auth.auth, UserController.actualizar_password_user);
api.delete('/eliminar_cuenta_user/:id', auth.auth, UserController.eliminar_cuenta_user);

//CAMBIAR password
api.put('/registro_token_cambio_pass', UserController.registro_token_cambio_pass);
api.get('/enviar_correo_token_cambio_pass/:correo', UserController.enviar_correo_token_cambio_pass);
api.get('/verificar_token_cambio_pass/:token', UserController.verificar_token_cambio_pass);
api.put('/cambiar_password_user/:token', UserController.cambiar_password_user);

/////// CUENTAS
api.post('/registro_cuenta_admin', auth.auth, UserController.registro_cuenta_admin);
api.get('/obtener_cuentas_admin/:id', auth.auth, UserController.obtener_cuentas_admin);
api.get('/obtener_cuenta_admin/:id', auth.auth, UserController.obtener_cuenta_admin);
api.delete('/eliminar_cuenta_admin/:id', auth.auth, UserController.eliminar_cuenta_admin);
api.put('/actualizar_cuenta_admin/:id', auth.auth, UserController.actualizar_cuenta_admin);
api.get('/obtener_cuentas_de_admin', auth.auth, UserController.obtener_cuentas_de_admin);

///// Correos de confirmación
api.put('/actualizar_user_verificado/:id/:codigo', UserController.actualizar_user_verificado);

////RESERVACION
api.post('/crear_reservacion_user', auth.auth, UserController.crear_reservacion_user);
api.get('/obtener_reservaciones_user/:id', auth.auth, UserController.obtener_reservaciones_user);
api.get('/obtener_reservaciones_public/:id', UserController.obtener_reservaciones_public);
api.get('/obtener_reservaciones_admin', auth.auth, UserController.obtener_reservaciones_admin);
api.get('/obtener_reservacion_admin/:id', auth.auth, UserController.obtener_reservacion_admin);
api.put('/actualizar_reserva_reservado_admin/:id', auth.auth, UserController.actualizar_reserva_reservado_admin);

//SUSCRIPCIONES
api.get('/obtener_suscripciones_admin', auth.auth, UserController.obtener_suscripciones_admin);
api.get('/obtener_suscripcion_admin/:id', auth.auth, UserController.obtener_suscripcion_admin);
api.put('/actualizar_suscripcion_confirmado_admin/:id', auth.auth, UserController.actualizar_suscripcion_confirmado_admin);

//////EMPRESA
api.get('/obtener_empresas_admin', auth.auth, UserController.obtener_empresas_admin);
api.put('/actualizar_empresa_verificado_admin/:id', auth.auth, UserController.actualizar_empresa_verificado_admin);
api.get('/obtener_caracteristicas_admin/:id', auth.auth, UserController.obtener_caracteristicas_admin);
api.delete('/eliminar_empresa_admin/:id', auth.auth, UserController.eliminar_empresa_admin);
api.get('/obtener_cuentas_de_empresa_admin/:id', auth.auth, UserController.obtener_cuentas_de_empresa_admin);

/////CLIENTES
api.get('/obtener_clientes_admin', auth.auth, UserController.obtener_clientes_admin);

////KPI
api.get('/kpi_ganancias_mensuales_admin', auth.auth, UserController.kpi_ganancias_mensuales_admin);

////Contacto
api.post('/enviar_mensaje_contacto', UserController.enviar_mensaje_contacto);
api.get('/obtener_mensajes_admin', auth.auth, UserController.obtener_mensajes_admin);
api.put('/cerrar_mensaje_admin/:id', auth.auth, UserController.cerrar_mensaje_admin);


//Exportar los módulos
module.exports = api;