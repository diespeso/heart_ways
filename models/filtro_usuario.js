var mongoose = require('mongoose')

var Schema = mongoose.Schema

var FiltroUsuarioSchema = new Schema({
    sexo_interes: {type: String, enum: ['M', 'F']},
    edad_min: Number,
    edad_max: Number
})

module.exports = mongoose.model('FiltroUsuario', FiltroUsuarioSchema)