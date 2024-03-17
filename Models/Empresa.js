'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EmpresaSchema = Schema({
    verificado: {type: Boolean, default: false, required: true},
    portada: {type: Object, required: false},
    token_pass: {type: String, required: false},
    nombre: {type: String, required: true},
    email: {type: String, required: true},
    direccion: {type: String, required: true},
    telefono: {type: String, required: true},
    region: {type: String, required: false},
    provincia: {type: String, required: false},
    distrito: {type: String, required: false},
    ubicacion: {type: String, required: false},
    password: {type: String, required: true},
    role: {type: String, default: 'GRASS', required: true},

    createdAt: {type: Date, default: Date.now, required: true}
});

module.exports = mongoose.model('empresa', EmpresaSchema);