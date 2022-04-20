/*jshint esversion: 6*/
const express = require('express');
const path = require('path');

const router = express.Router();

const bcrypt = require('bcrypt');
const salt_rounds = 10;

const { append } = require('express/lib/response');

module.exports = router;

const Usuario = require('../models/usuario');

const ws = require('ws');
const config = require('../config')

const ws_server = new ws.WebSocketServer({port: config.ws_port});
console.log('websockets server running at: ws://localhost:%s', config.ws_port)

var user_sockets = {};

ws_server.on('connection', function connection(ws, request){

    ws.send(`conectado a server.`)
    //si truena quitar async
    ws.on('message', async function message(data) {
        console.log('received data: %s', data)
        var json = JSON.parse(data);
        console.log(json)
        if(json.type == 'registration') {
            console.log(`REGISTRATION: ${json.username}`)
        } else if (json.type == 'message') {
            //GUARDAR A BASE DE DATOS
            //TODO: revisar casos donde no hay usuario ni destinatario correctos
            Usuario.findOne({username: json.remitente}, (err, remitente) => {
                if(err) return res.status(500)

                if(!remitente) {
                    return res.status(400)
                }

                Usuario.findOne({username: json.destinatario_actual}, (err, destinatario) => {
                    if(err) return res.status(500)

                    if(!destinatario) {
                        return res.status(400)
                    }
                    //guardar a bd el mensaje
                    const newMensaje = new Mensaje({
                        id_destinatario: destinatario._id,
                        contenido: json.mensaje,
                        timestamp: Date.now(),
                        id_remitente: remitente._id
                    })
                    newMensaje.save((err, mensaje) => {
                        if(err) console.log(err)
                    })
                })
            })
            //delay para esperar a que se escriba en bd
            await new Promise(resolve => setTimeout(resolve, config.message_delay_time));
            console.log('log mensajes')
            Usuario.findOne({username: json.remitente}, (err, remitente) => {
                if(err) return res.status(500)

                if(!remitente) return res.status(400)

                console.log(`remiente: ${remitente._id}`)

                Usuario.findOne({username: json.destinatario_actual}, function(err, destinatario) {
                    if(err) return res.status(500)

                    if(!destinatario) return res.status(400)

                    console.log(`destinatario: ${destinatario._id}`)

                    var relacion = {}
                    relacion[`${destinatario._id}`] = `${destinatario.username}`
                    relacion[`${remitente._id}`] = `${remitente.username}`

                    console.log(relacion)

                    Mensaje.find({$or: [
                        {id_remitente: remitente._id, id_destinatario: destinatario._id},
                        {id_remitente: destinatario._id, id_destinatario: remitente._id}
                    ]}, null, {sort: {timestamp: 1}}, (err, mensajes) => {
                        if(err) return res.status(500)

                        if(!mensajes) return res.status(400)

                        //console.log(mensajes)
                        mensajes.forEach(mensaje_obj => {
                            var usuario = relacion[`${mensaje_obj.id_remitente}`]
                            console.log(`(${usuario}, ${mensaje_obj.timestamp.toTimeString().slice(0, 5)}): ${mensaje_obj.contenido}`)
                        })
                    })

                })

                /*Mensaje.find({id_remitente: remitente._id}, (err, mensajes) => {
                    if(err) return res.status(500)

                    if(!mensajes) return res.status(400)

                    console.log(mensajes)
                })*/
            })
    
        }
        
        ws.send(`received ${data}`)
    })
})


const {readUsuario, createUsuario, updateUsuario, deleteUsuario} = require('../controllers/usuario');
const { createFiltroUsuario, readFiltroUsuario, updateFiltroUsuario, deleteFiltroUsuario } = require('../controllers/filtro_usuario');
const { createPreferenciaPersonalidad, readPreferenciaPersonalidad, updatePreferenciaPersonalidad, deletePreferenciaPersonalidad } = require('../controllers/preferencia_personalidad');
const { createMensaje, readMensaje, updateMensaje, deleteMensaje } = require('../controllers/mensaje');
const res = require('express/lib/response');
const Mensaje = require('../models/mensaje');

router.get('/', (req, res) => {
    console.log("SESION")
    console.log(req.session)
    if(req.session.username) {
        //console.log(`session USER: ${req.session.username}`)
        return res.redirect('/inbox')
    }
    console.log('sirviendo pagina principal')
    return res.render('main', {})
})

router.post('/signup', (req, res) => {
    console.log('sign up attempted')
    //codigo de usuario.js, recopiar (sorry)
    var pass = req.body.pass;
    bcrypt.genSalt(salt_rounds, (err, salt) => {
        bcrypt.hash(pass, salt, (err, hash) => {
            console.log(hash);
            const newUsuario = new Usuario({
                username: req.body.username,
                correo: req.body.correo,
                fecha_nacimiento: req.body.fecha_nacimiento,
                sexo: req.body.sexo,
                pass: hash
            });
            newUsuario.save((err, user) => {
                if(err) {
                    console.log(`fallo en creación de usuario: ${err}`)
                    return res.status(500).send({message: `${err}`}) //TODO: pagina error
                }
        
                return res.status(200).redirect('/saludo')
        
            })
        })
    })
})

router.post('/login', (req, res) => {
    console.log('log in attempted')
    console.log(req.body)
    var username = req.body.username;
    var pass = req.body.pass;
    if(username == '' || pass == '') return res.status(500).send({message: 'no introdujo usuario o contra'})
    Usuario.findOne({username: username}, (err, encontrado) => {
        if(err) {
            return res.status(500).send({message: `error al leer usuario: ${err}`}) //TODO: pagina error
        }

        if(!encontrado) {
            return res.status(400).send({message: `usuario no encontrado: ${username}`}) //TODO: pagina no encontrado
        }
        //return res.status(200).send({message: `usuario: ${JSON.stringify(encontrado)}`})
        bcrypt.compare(pass, encontrado.pass, (err, cmp) => {
            if(err) return res.status(500).send({message: `${err}`})

            if(cmp) {
                session = req.session;
                req.session.username = encontrado.username;
                console.log("SESSION")
                console.log(session)
                return res.redirect('/inbox')
                //return res.status(200).send({message: `todo bien`}) //cambiar a inbox
            } else {
                return res.status(400).send({message: 'contrasenia incorrecta'})
            }
        })
        //return res.status(200).redirect('/saludo')
    }).lean()
})

router.get('/saludo', (req, res) => {
    console.log('sirviendo un get de la página saludo');
    res.render('saludo', {})
})

router.get('/inbox', (req, res) => {
    res.render('inbox', {
        username:req.session.username})
})

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.status(200)
})

//crud usuario
router.post('/api/usuario', createUsuario)
router.get('/api/usuario/:usuario', readUsuario)
router.put('/api/usuario/:usuario', updateUsuario)
router.delete('/api/usuario/:usuario', deleteUsuario)

//crud filtrousuario
router.post('/api/filtro_usuario', createFiltroUsuario)
router.get('/api/filtro_usuario/:filtro_usuario', readFiltroUsuario)
router.put('/api/filtro_usuario/:filtro_usuario', updateFiltroUsuario)
router.delete('/api/filtro_usuario/:filtro_usuario', deleteFiltroUsuario)

//crud preferenciapersonalidad
router.post('/api/preferencia_personalidad', createPreferenciaPersonalidad)
router.get('/api/preferencia_personalidad/:preferencia', readPreferenciaPersonalidad)
router.put('/api/preferencia_personalidad/:preferencia', updatePreferenciaPersonalidad)
router.delete('/api/preferencia_personalidad/:preferencia', deletePreferenciaPersonalidad)

//crud mensaje
router.post('/api/mensaje', createMensaje)
router.get('/api/mensaje/:mensaje', readMensaje)
router.put('/api/mensaje/:mensaje', updateMensaje)
router.delete('/api/mensaje/:mensaje', deleteMensaje)