var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var UsuarioSchema = new Schema({
    username: {type: String, unique: true, required: true},
    correo: {type: String, required: true},
    fecha_nacimiento: {type: Date, required: true},
    sexo: {type: String, required: true, enum: ['M', 'F']}
});

module.exports = mongoose.model('Usuario', UsuarioSchema)