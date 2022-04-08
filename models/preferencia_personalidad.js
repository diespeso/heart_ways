var mongoose = require('mongoose')

var Schema = mongoose.Schema

var PreferenciaPersonalidad = new Schema({
    id_usuario: {type: mongoose.Schema.Types.ObjectId, required: true},
    preferencia: {type: String, required: true},
    valor: {type: mongoose.Schema.Types.Boolean} //si es null le da igual
})

module.exports = mongoose.model('PreferenciaPersonalidad', PreferenciaPersonalidad)