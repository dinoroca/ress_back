'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SuscripcionSchema = Schema({
    empresa: {type: Schema.ObjectId, ref: 'empresa', required: true},
    subtotal: {type: Number, required: true},
    transaccion: {type: String, required: true},
    estado: {type: String, required: true},
    createdAt: {type: Date, required: true},
    vencimiento: {type: Date, required: true}
});

module.exports = mongoose.model('suscripcion', SuscripcionSchema);