const Mensaje = require('../models/mensaje')

const path = require('path')

//create
const createMensaje = ((req, res) => {
    const newMensaje = new Mensaje({
        id_destinatario: req.body.id_destinatario,
        contenido: req.body.contenido,
        timestamp: req.body.timestamp,
        id_remitente: req.body.id_remitente
    })

    newMensaje.save((err, mensaje) => {
        if(err) return res.status(500).send({message: `fallo al crear mensaje: ${err}`})

        return res.status(200).send({message: `mensaje creado: ${newMensaje}`})
    })
})

//read
const readMensaje = ((req, res) => {
    const mensaje = req.params.mensaje
    Mensaje.findById(mensaje, (err, encontrado) => {
        if(err) return res.status(500).send({message: `error al leer mensaje: ${err}`})

        if(!encontrado) return res.status(400).send({message: `mensaje no encontrado: ${mensaje}`})

        return res.status(200).send({message: `mensaje: ${JSON.stringify(encontrado)}`})
    })
})

//update
const updateMensaje = ((req, res) => {
    const mensaje_mod = {
        id: req.params.mensaje,
        update: req.body
    }

    Mensaje.findOneAndUpdate({_id: mensaje_mod.id}, mensaje_mod.update, {new: true}, (err, encontrado) => {
        if(err) return res.status(500).send({message: `no se pudo encontrar mensaje: ${err}`})

        if(!encontrado) return res.status(400).send({message: `mensaje no encontrado: ${mensaje_mod.id}`})

        return res.status(200).send({message: `actualizado a ${encontrado}`})
    })
})

//delete
const deleteMensaje = ((req, res) => {
    const mensaje = req.params.mensaje
    Mensaje.findById(mensaje, (err, encontrado) => {
        if(err) return res.status(500).send({message: `error al encontrar filtrousuario: ${err}`})

        if(!encontrado) return res.status(400).send({message: `no se encontró mensaje: ${mensaje}`})

        Mensaje.deleteOne({_id: mensaje}, err => {
            if(err) return res.status(500).send({message: `error al borrar mensaje: ${err}`})

            return res.status(200).send({message: `se borró el mensaje: ${mensaje}`})
        })
    })
})

module.exports = {createMensaje, readMensaje, updateMensaje, deleteMensaje}