var mongoose = require('mongoose')

var Schema = mongoose.Schema

var Mensaje = new Schema({
    id_destinatario: {type: mongoose.Schema.Types.ObjectId, required: true},
    contenido: {type: String, required: true},
    timestamp: {type: Date, required: true},
    id_remitente: {type: mongoose.Schema.Types.ObjectId, required: true}
})

module.exports = mongoose.model('Mensaje', Mensaje)