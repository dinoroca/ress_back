'use strict'
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Se crea un modelo de objeto para el carrito de compras
var CaracteristicasSchema = Schema({
    empresa: {type: Schema.ObjectId, ref: 'empresa', required: true},
    techado: {type: Boolean, required: true},
    canchas_futsal: {type: Number, required: true},
    canchas_voley: {type: Number, required: true},
    iluminacion: {type: Boolean, required: true},
    garaje: {type: Boolean, required: true},
    
    createdAt: {type: Date, default: Date.now, required: true}
});

module.exports = mongoose.model('carateristica', CaracteristicasSchema);