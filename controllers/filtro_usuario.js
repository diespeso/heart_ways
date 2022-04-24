const FiltroUsuario = require('../models/filtro_usuario')

const path = require('path')

//create
const createFiltroUsuario = ((req, res) => {
    const newFiltroUsuario = new FiltroUsuario({
        sexo_interes: req.body.sexo_interes,
        id_usuario: req.body.id_usuario,
        edad_min: req.body.edad_min,
        edad_max: req.body.edad_max
    })
    newFiltroUsuario.save((err, filtroUsuario) => {
        if(err) return res.status(500).send({message: `fallo al crear filtrousuario: ${err}`})

        return res.status(200).send({message: `filtrousuario creado: ${newFiltroUsuario._id}`})
    })
})

//read
const readFiltroUsuario = ((req, res) => {
    const fusuario = req.params.filtro_usuario
    FiltroUsuario.findById(req.params.filtro_usuario, (err, encontrado) => {
        if(err) {
            return res.status(500).send({message: `error al leer filtrousuario: ${err}`})
        }

        if(!encontrado) {
            return res.status(400).send({message: `filtrousuario no encontrado: ${fusuario}`})
        }
        return res.status(200).send({message: `filtrousuario: ${JSON.stringify(encontrado)}`})
    }).lean()
})

//update
const updateFiltroUsuario = ((req, res) => {
    const fusr_mod = {
        id: req.params.filtro_usuario,
        update: req.body
    }

    FiltroUsuario.findOneAndUpdate({_id: fusr_mod.id}, fusr_mod.update, {new: true}, (err, encontrado) => {
        if(err) return res.status(500).send({
            message: `no se pudo actualizar filtrousuario, error: ${err}`
        })

        if(!encontrado) return res.status(400).send({
            messsage: `filtrousuario no encontrado: ${fusr_mod.id}`
        })

        return res.status(200).send({message: `actualizado a ${encontrado}`})
    })
})

//delete
const deleteFiltroUsuario = ((req, res) => {
    const fusuario = req.params.filtro_usuario
    FiltroUsuario.findById(fusuario, (err, encontrado) => {
        if(err) return res.status(500).send({
            message: `error al encontrar filtrousuario: ${err}`
        })
        
        if(!encontrado) return res.status(400).send({
            message: `no se encontró filtrousuario ${fusuario}`
        })

        FiltroUsuario.deleteOne({_id: fusuario}, err => {
            if(err) return res.status(500).send({
                message: `error al borrar filtrousuario: ${err}`
            })
            return res.status(200).send({message: `se borró el filtrousuario: ${encontrado}`})
        })
    })
})

module.exports = {createFiltroUsuario, readFiltroUsuario, updateFiltroUsuario, deleteFiltroUsuario}