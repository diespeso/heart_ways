const PreferenciaPersonalidad = require('../models/preferencia_personalidad')

const path = require('path')

//create
const createPreferenciaPersonalidad = ((req, res) => {
    const newPreferencia = new PreferenciaPersonalidad({
        id_usuario: req.body.id_usuario,
        preferencia: req.body.preferencia,
        valor: req.body.valor
    })
    newPreferencia.save((err, preferencia) => {
        if(err) return res.status(500).send({message: `fallo al crear preferenciapersonalidad: ${err}`})

        return res.status(200).send({message: `preferenciapersonalidad creada: ${preferencia}`})
    })
})

//read
const readPreferenciaPersonalidad = ((req, res) => {
    const preferencia = req.params.preferencia
    PreferenciaPersonalidad.findById(preferencia, (err, encontrado) => {
        if(err) {
            return res.status(500).send({message: `error al leer preferenciapersonalidad: ${err}`})
        }

        if(!encontrado) {
            return res.status(400).send({message: `preferenciapersonalidad no encontrada: ${preferencia}`})
        }
        return res.status(200).send({message: `preferenciausuario: ${JSON.stringify(encontrado)}`})
    }).lean()
})

//update
const updatePreferenciaPersonalidad = ((req, res) => {
    const preferencia_mod = {
        id: req.params.preferencia,
        update: req.body
    }

    PreferenciaPersonalidad.findOneAndUpdate({_id: preferencia_mod.id},
        preferencia_mod.update, {new: true}, (err, encontrado) => {
        
            if(err) return res.status(500).send({
                message: `no se pudo actualizar preferenciapersonalidad, error: ${err}`
            })

            if(!encontrado) return res.status(400).send({
                messsage: `preferenciapersonalidad no encontrada: ${preferencia_mod.id}`
            })

            return res.status(200).send({message: `actualizado a: ${JSON.stringify(preferencia_mod)}`})
        })
})

//delete
const deletePreferenciaPersonalidad = ((req, res) => {
    const preferencia = req.params.preferencia

    PreferenciaPersonalidad.findById(preferencia, (err, encontrado) => {
        if(err) return res.status(500).send({
            message: `error al encontrar preferenciapersonalidad: ${err}`
        })

        if(!encontrado) return res.status(400).send({
            message: `no se encontró preferenciapersonalidad: ${preferencia}`
        })

        PreferenciaPersonalidad.deleteOne({_id: preferencia}, err => {
            if(err) return res.status(500).send({message: `error al borrar preferenciapersonalidad: ${err}`})
        })
        return res.status(200).send({message: `se borró el usuario: ${encontrado}`})
    })
})

module.exports = {createPreferenciaPersonalidad, readPreferenciaPersonalidad, updatePreferenciaPersonalidad, deletePreferenciaPersonalidad}