'use strict'
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Se crea un modelo de objeto para el cliente
var CuentaAdminSchema = Schema({
    admin: {type: Schema.ObjectId, ref: 'admin', required: true},
    banco: {type: String, required: true},
    titular: {type: String, required: true},
    cuenta: {type: Number, required: false},
    cci: {type: Number, required: false},
    color: {type: String, required: true},
    
    createdAt: {type: Date, default: Date.now, required: true}
});

module.exports = mongoose.model('cuenta_admin', CuentaAdminSchema);