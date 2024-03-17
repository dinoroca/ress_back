'use strict'
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Se crea un modelo de objeto para el carrito de compras
var CanchaSchema = Schema({
    empresa: {type: Schema.ObjectId, ref: 'empresa', required: true},
    galeria: [{type: Object, required: false}],
    nombre: {type: String, required: false},
    descripcion: {type: String, required: false},
    tipo: {type: String, required: true},
    largo: {type: Number, required: true},
    ancho: {type: Number, required: true},
    largo_voley: {type: Number, required: false},
    ancho_voley: {type: Number, required: false},
    precio_dia: {type: Number, required: true},
    precio_noche: {type: Number, required: true},
    precio_dia_voley: {type: Number, required: false},
    precio_noche_voley: {type: Number, required: false},
    n_reservas: {type: Number, required: false},
    
    createdAt: {type: Date, default: Date.now, required: true}
});

module.exports = mongoose.model('cancha', CanchaSchema);