'use strict';

var express = require('express');
var EmpresaController = require('../Controllers/EmpresaController');
var api = express.Router();
var auth = require('../Middlewares/authenticate');

var multiparty = require('connect-multiparty');
const path = multiparty({uploadDir: './uploads/empresas'});

//Peticiones Emoresa
api.post('/registro_empresa', EmpresaController.registro_empresa);
api.post('/login_empresa', EmpresaController.login_empresa);
api.get('/obtener_empresa/:id', auth.auth, EmpresaController.obtener_empresa);
api.get('/obtener_empresa_publico/:id', EmpresaController.obtener_empresa_publico);
api.put('/actualizar_empresa/:id', auth.auth, EmpresaController.actualizar_empresa);
api.get('/listar_empresas_publico', EmpresaController.listar_empresas_publico);

//características
api.post('/crear_caracteristicas_empresa/:id', auth.auth, EmpresaController.crear_caracteristicas_empresa);
api.get('/obtener_caracteristicas_empresa/:id', auth.auth, EmpresaController.obtener_caracteristicas_empresa);
api.put('/actualizar_caracteristicas_empresa/:id', auth.auth, EmpresaController.actualizar_caracteristicas_empresa);
api.get('/obtener_caracteristicas_empresa_publico', EmpresaController.obtener_caracteristicas_empresa_publico);

//Canchas
api.post('/crear_cancha_empresa/:id', auth.auth, EmpresaController.crear_cancha_empresa);
api.get('/obtener_canchas_empresa/:id', auth.auth, EmpresaController.obtener_canchas_empresa);
api.get('/obtener_cancha_empresa/:id', auth.auth, EmpresaController.obtener_cancha_empresa);
api.put('/actualizar_cancha_empresa/:id', auth.auth, EmpresaController.actualizar_cancha_empresa);
api.delete('/eliminar_cancha_empresa/:id', auth.auth, EmpresaController.eliminar_cancha_empresa);
api.get('/obtener_canchas/:id', EmpresaController.obtener_canchas);
api.get('/obtener_cancha_publico/:id', EmpresaController.obtener_cancha_publico);

//REservaciones
api.post('/registro_reservacion_grass', auth.auth, EmpresaController.registro_reservacion_grass);
api.get('/obtener_reservaciones_empresa/:id', auth.auth, EmpresaController.obtener_reservaciones_empresa);
api.get('/obtener_reservacion_empresa/:id', auth.auth, EmpresaController.obtener_reservacion_empresa);
api.get('/obtener_clientes_empresa/:id', auth.auth, EmpresaController.obtener_clientes_empresa);
api.delete('/eliminar_reservacion_empresa/:id', auth.auth, EmpresaController.eliminar_reservacion_empresa);

////KPI
api.get('/kpi_ganancias_mensuales_grass/:id', auth.auth, EmpresaController.kpi_ganancias_mensuales_grass);

/////GALERÍA
api.put('/agregar_imagen_galeria_cancha/:id', [auth.auth, path], EmpresaController.agregar_imagen_galeria_cancha);
api.put('/eliminar_imagen_galeria_cancha/:id', auth.auth, EmpresaController.eliminar_imagen_galeria_cancha);

api.put('/agregar_imagen_portada/:id', [auth.auth, path], EmpresaController.agregar_imagen_portada);
api.put('/eliminar_imagen_portada/:id', auth.auth, EmpresaController.eliminar_imagen_portada);

api.get('/obtener_galeria_cancha/:img', EmpresaController.obtener_galeria_cancha);
api.get('/obtener_imagen_portada/:img', EmpresaController.obtener_imagen_portada);

/////// CUENTAS
api.post('/registro_cuenta_grass', auth.auth, EmpresaController.registro_cuenta_grass);
api.get('/obtener_cuentas_grass/:id', auth.auth, EmpresaController.obtener_cuentas_grass);
api.get('/obtener_cuenta_grass/:id', auth.auth, EmpresaController.obtener_cuenta_grass);
api.delete('/eliminar_cuenta_grass/:id', auth.auth, EmpresaController.eliminar_cuenta_grass);
api.put('/actualizar_cuenta_grass/:id', auth.auth, EmpresaController.actualizar_cuenta_grass);
api.get('/obtener_cuentas', auth.auth, EmpresaController.obtener_cuentas);

//Buscar empresa
api.get('/listar_empresas_filtro/:filtro?', EmpresaController.listar_empresas_filtro);
api.get('/listar_empresas_region/:region?', EmpresaController.listar_empresas_region);
api.get('/listar_empresas_prov/:region?/:provincia?', EmpresaController.listar_empresas_prov);
api.get('/listar_empresas_dist/:region?/:provincia?/:distrito?', EmpresaController.listar_empresas_dist);
api.get('/listar_empresas_user/:region?', auth.auth, EmpresaController.listar_empresas_user);



//Exportar los módulos
module.exports = api;