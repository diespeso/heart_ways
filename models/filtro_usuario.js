var mongoose = require('mongoose')

var Schema = mongoose.Schema

var FiltroUsuarioSchema = new Schema({
    sexo_interes: {type: String, enum: ['M', 'F']},
    id_usuario: {type: mongoose.Types.ObjectId, required: true, unique: true},
    edad_min: Number,
    edad_max: Number
})

module.exports = mongoose.model('FiltroUsuario', FiltroUsuarioSchema)