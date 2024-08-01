'use strict'
var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'R3S3RV45GR4S5T0K3N';

exports.createToken = function(user) {
    var payload = {
        sub: user._id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email,
        role: user.role,
        iat: moment().unix(),
        exp: moment().add(7, 'days').unix()
    }

    return jwt.encode(payload, secret);
}