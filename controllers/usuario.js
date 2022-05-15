const Usuario = require('../models/usuario');

const path = require('path');

 //create
const createUsuario = ((req, res) => {
    const newUsuario = new Usuario({
        username: req.body.username,
        correo: req.body.correo,
        fecha_nacimiento: req.body.fecha_nacimiento,
        sexo: req.body.sexo,
        pass: req.body.pass
    });
    newUsuario.save((err, user) => {
        if(err) {
            console.log(`fallo en creación de usuario: ${err}`)
            return res.status(500).send({message: `${err}`})
        }

        return res.status(200).send({message: `usuario creado: ${newUsuario.username}`})

    })
})

//read
const readUsuario = ((req, res) => {
    let usuario = req.params.usuario
    console.log(usuario)
    Usuario.findOne({username: usuario}, (err, encontrado) => {
        if(err) {
            return res.status(500).send({message: `error al leer usuario: ${err}`})
        }

        if(!encontrado) {
            return res.status(400).send({message: `usuario no encontrado: ${usuario}`})
        }
        return res.status(200).send({message: `usuario: ${JSON.stringify(encontrado)}`})
    }).lean()
})

//update
const updateUsuario = ((req, res) => {
    const usr_mod = {
        username: req.params.usuario,
        update: req.body
    }

    console.log(JSON.stringify(usr_mod))

    Usuario.findOneAndUpdate({username: usr_mod.username},
        usr_mod.update, {new: true}, (err, usuario) => {
            if(err) return res.status(500).send({
                message: `no se pudo actualizar usuario, error: ${err}`
            })

            if(!usuario) return res.status(400).send({
                messsage: `usuario no encontrado: ${usr_mod.username}`
            })
            console.log('terminado')
            return res.status(200).send({message: `actualizado a: ${usuario}`})
    })
})

//delete
const deleteUsuario = ((req, res) => {
    const usuario = req.params.usuario

    Usuario.findOne({username: usuario}, (err, encontrado) => {
        if(err) return res.status(500).send({
            message: `error al encontrar usuario: ${err}`
        })

        if(!encontrado) return res.status(400).send({
            message: `no se encontró usuario ${usuario}`
        })

        Usuario.deleteOne({username: usuario}, err => {
            if(err) return res.status(500).send({
                message: `error al borrar usuario: ${err}`
            })
            return res.status(200).send({message: `se borró el usuario: ${encontrado}`})
        })

        
    })
})
module.exports = {createUsuario, readUsuario, updateUsuario, deleteUsuario};