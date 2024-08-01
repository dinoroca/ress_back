'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = Schema({
    verificado: {type: Boolean, default: false, required: true},
    codigo: {type: String, required: true},
    token_pass: {type: String, required: false},
    nombres: {type: String, required: true},
    email: {type: String, required: true},
    ciudad: {type: String, required: true},
    telefono: {type: String, required: true},
    password: {type: String, required: true},
    role: {type: String, default: 'USER', required: true},

    createdAt: {type: Date, default: Date.now, required: true}
});

module.exports = mongoose.model('user', UserSchema);