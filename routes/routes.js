/*jshint esversion: 6*/
const express = require('express');
const path = require('path');

const router = express.Router();

const bcrypt = require('bcrypt');
const salt_rounds = 10;

const { append, json } = require('express/lib/response');

module.exports = router;

const Usuario = require('../models/usuario');
const PreferenciaPersonalidad = require('../models/preferencia_personalidad')
const FiltroUsuario = require('../models/filtro_usuario')
const ws = require('ws');
const config = require('../config')

const ws_server = new ws.WebSocketServer({port: config.ws_port});
console.log('websockets server running at: ws://localhost:%s', config.ws_port)

var user_sockets = {};

var matching_users = {};

var match_sockets = {};

/*estructura
 matching-user[username] = {
    id: id,
    filtros: {
        filtro1,
        filtro2,
        filtro3,
    },
    preferencias: {
        pref1,
        pref2,
        pref3
    }

 }
*/

ws_server.on('connection', function connection(ws, request){

    ws.send(`conectado a server.`)
    //si truena quitar async
    ws.on('message', async function message(data) {
        var json = JSON.parse(data);
        console.log(`se recibió: ${JSON.stringify(json)}`)
        
        if(json.type == 'match_request') {
            console.log(`attempting match for ${json.username}`)
            
            hacer_matching(ws, json)
            

        } else if(json.type == 'match_close') {
            console.log(json.username)
            console.log(matching_users[json.username])
            delete matching_users[json.username]
            console.log('deleted matching user')
            console.log('usuarios haciendo match...')
            console.log(matching_users) 
        } else if(json.type == 'match_resp') {
            console.log(`respuesta del match: ${json.resp}, resto: ${JSON.stringify(json)}`)
            if(json.resp) { //confirmar si la otra persona tambien dijo que sí
                
            } else { //borrar la conversacion con esta persona
                var usuarios = [json.remitente, json.destinatario_actual]
                console.log(`usuarios afuera: ${usuarios}`)
                Usuario.find({
                    'username': {$in: usuarios}
                }, (err, users) => {
                    if(err) {
                        console.log('error al buscar usuarios')
                    }
                    if(!users) {
                        console.log('usuarios no encontrados')
                    }
                    //borrar todos los mensajes entre las 2 personas
                    console.log(`usuario 1: ${users[0]._id}`)
                    Mensaje.deleteMany({
                        "id_remitente": users[0]._id,
                        "id_destinatario": users[1]._id
                    }, err => {
                        console.log(`ERRRRRRORR: ${err}`)
                    })
                    Mensaje.deleteMany({
                        "id_remitente": users[1]._id,
                        "id_destinatario": users[0]._id
                    }, err => {
                        console.log(`ERRRRRRORR: ${err}`)
                    })
                })
            }
        } else if(json.type == 'closing') {
            //no funciona, otra opcion seria captar los usuarios desconectados hasta el momento en que fallen recibir mensajes
            delete user_sockets[json.username]
            console.log(`${json.username} disconnected`)
            console.log(`current sockets: ${JSON.stringify(user_sockets)}`)
        } else if(json.type == 'registration') {
            //enviar el historial de todos los chats anteriores
            //register as user socket
            user_sockets[json.username] = ws
            var usr_dict = {};
            Usuario.findOne({username: json.username}, async (err, usuario) => {
                if(err) {
                    ws.send('fallo')
                    return
                }

                if(!usuario) {
                    ws.send('usuario no encontrado')
                    return
                }

                var x = await Mensaje.aggregate([
                    {
                        $match: {
                            id_destinatario: usuario._id
                        }
                    }
                ])
                var recibidos_ids = [];
                // encontrar todos los usuarios que han mandado mensajes al usuario
                x.forEach((data_mensaje) => {
                    if(recibidos_ids.includes(data_mensaje.id_remitente.toString())) {
                        //pass
                    } else {
                        recibidos_ids.push(data_mensaje.id_remitente.toString())
                    }
                    
                    
                })

                var y = await Mensaje.aggregate([
                    {
                        $match: {
                            id_remitente: usuario._id
                        }
                    }
                ])
                var enviados_ids = [];
                //encontrar los usuarios a los que el usuario ha enviado mensajes
                y.forEach((data_mensaje) => {
                    if(enviados_ids.includes(data_mensaje.id_destinatario.toString())) {
                        //pass
                    } else {
                        enviados_ids.push(data_mensaje.id_destinatario.toString())
                    }
                })

                var interactuados = recibidos_ids.concat(enviados_ids) //ya sea enviados o recibidos

                //var rel_chats = {}

                //find users of all messages
                /*Usuario.find({
                    '_id': {
                        $in: interactuados
                    }
                }, (err, usuarios) => {
                    if(err) {
                        ws.send('fallo')
                        return
                    }

                    if(!usuarios) {
                        ws.send('no encon   trado')
                        return
                    }
                    usuarios.forEach((usuario) => { //crear relacion de ids y usernames
                        rel_chats[usuario._id.toString()] = usuario.username
                        console.log(`heY: ${JSON.stringify(rel_chats)}`)
                    })
                })*/
                //console.log(`@@@@@@@@: ${JSON.stringify(rel_chats)}`)
                //agregar al usuario del inbox a la relacion
                //rel_chats[usuario._id.toString()] = usuario.username
                
                var data = {}
                interactuados.forEach((id) => {
                    data[id] = []
                })
                x.concat(y).forEach((mensaje) => {
                    if(usuario._id.equals(mensaje.id_remitente)) {
                        data[mensaje.id_destinatario.toString()].push(mensaje)
                    } else if(usuario._id.equals(mensaje.id_destinatario)) {
                        data[mensaje.id_remitente.toString()].push(mensaje)
                    }
                })

                //sort mensajes por timestamp
                for(let id in data) {
                    data[id] = data[id].sort(function comparar(a, b) {
                        if(a.timestamp > b.timestamp) return 1
                        if(a.timestamp == b.timestamp) return 0
                        if(a.timestamp < b.timestamp) return -1
                    })
                }
                
                //console.log(`rel_chats: ${JSON.stringify(rel_chats)}`)
                //generación del diccionario de id -> username
                Usuario.find({
                    '_id': {$in: interactuados}
                }, (err, usuarios) => {
                    if(err) ws.send('error')

                    if(!usuarios) ws.send('no encontrado')

                    var rel_chat = {}
                    rel_chat[usuario._id.toString()] = usuario.username //usuario duenio del inbox
                    usuarios.forEach((usuario) => {
                        rel_chat[usuario._id.toString()] = usuario.username
                    })

                    ws.send(
                        JSON.stringify(
                            {
                                type: 'inbox',
                                chats: data,
                                users: rel_chat
                            }
                        )
                    )
                })
            })
        } else if (json.type == 'message') {
            //GUARDAR A BASE DE DATOS
            //TODO: revisar casos donde no hay usuario ni destinatario correctos
            storeMessage(json)
            //delay para esperar a que se escriba en bd
            await new Promise(resolve => setTimeout(resolve, config.message_delay_time));
            //console.log('log mensajes')
            //showMessageLog(json.remitente, json.destinatario_actual)
            user_sockets[json.remitente].send(
                JSON.stringify({
                    type: 'message',
                    destinatario: json.destinatario_actual,
                    remitente: json.remitente,
                    contenido: json.mensaje
                })
            )
            user_sockets[json.destinatario_actual].send(
                JSON.stringify({
                    type: 'message',
                    destinatario: json.destinatario_actual,
                    remitente: json.remitente,
                    contenido: json.mensaje
                })
            )
        } else if(json.type == 'match_message') {
            storeMessage(json)

            await new Promise(resolve => setTimeout(resolve, config.message_delay_time));

            match_sockets[json.remitente].send(
                JSON.stringify({
                    type: 'match_message',
                    destinatario: json.destinatario_actual,
                    remitente: json.remitente,
                    contenido: json.mensaje
                })
            )

            match_sockets[json.destinatario_actual].send(
                JSON.stringify({
                    type: 'match_message',
                    destinatario: json.destinatario_actual,
                    remitente: json.remitente,
                    contenido: json.mensaje
                })
            )

        }
        
        ws.send(`received ${data}`)
    })
})

async function hacer_matching(sock, json) {
    console.log(`attempting match for ${json.username}`)
    //add to poll
    Usuario.findOne({username: json.username}, (err, usuario) => {
        if(!usuario) {
            console.log('no usuario encontrado en matching')
            return
        }
        match_sockets[usuario.username] = sock; //permanent match sockets
        matching_users[usuario.username] = {}
        matching_users[usuario.username].id = usuario._id
        matching_users[usuario.username].socket = sock
        console.log('usuarios haciendo match...')
        console.log(matching_users) 
    })
    //wait but only for data to load, not the queue random wait
    await new Promise(resolve => setTimeout(resolve, config.message_delay_time)); //esperar
    
    var other_matchers = {...matching_users}
    delete other_matchers[json.username]
    console.log(`otros matchers: ${JSON.stringify(other_matchers)}`)
    console.log(`todos: ${JSON.stringify(matching_users)}`)

    var ids = []
    for(var _username in matching_users) {
        ids.push(matching_users[_username].id)
    }

    var match;

    //find out which users work for the filter
    Usuario.find({
        '_id': {
            $in: ids
        }
    }, (err, usuarios) => {
        if(!usuarios) {
            console.log('ningun usuario encontrado en matching')
            return
        }

        var candidatos = [];
        FiltroUsuario.find({
            'id_usuario': {
                $in: ids
            } 
        }, (err, filtros) => {
            console.log(JSON.stringify(filtros))
            var filtro_usuario;
            var filtro_otro;
            for(var i in filtros) {
                if(filtros[i].id_usuario.equals(matching_users[json.username].id)) { //filtro del usuario principal (el que hace match)
                    filtro_usuario = filtros[i]
                }

            }

            console.log("summary")
            for(var i in filtros) {
                console.log(JSON.stringify(filtros[i]))
            }
            for(var j in usuarios) {
                console.log(JSON.stringify(usuarios[j]))
            }
            //hacer 2 veces, la segunda es para comparar si son candidatos usando le filtro usuario
            var this_user;
            if(filtro_usuario && usuarios) { //TODO: aplicar filtro bidireccional       
                for(var i in usuarios) { //guardar usuario principal
                    if(usuarios[i].username == json.username) {
                        this_user = usuarios[i]
                    }
                }      

                for(var i in usuarios) {
                    if(usuarios[i].username == json.username) { //ignorarse a si mismo
                        continue
                    }
                    var hoy = new Date(Date.now())
                    var edad = hoy.getFullYear() - usuarios[i].fecha_nacimiento.getFullYear()
                    if(edad > filtro_usuario.edad_min && edad < filtro_usuario.edad_max && filtro_usuario.sexo_interes == usuarios[i].sexo) {
                        //se paso el filtro del usuario principal, falta aplicar el del secundario
                        console.log(`usuario elegido para el matching: ${JSON.stringify(usuarios[i])} con filtro: ${JSON.stringify(filtro_usuario)}`)                       
                        var filtro_otro;
                        for(var j in filtros) { //buscar el filtro del usuario con el que se es compatible para confirmar de su lado
                            if(filtros[j].id_usuario.equals(usuarios[i]._id)) {
                                filtro_otro = filtros[j]
                            }
                        }
                        var this_edad = hoy.getFullYear() - this_user.fecha_nacimiento.getFullYear()
                        console.log(`edad de el: ${edad}, edad mia: ${this_edad}`)
                        if(check_filtro(this_user, filtro_otro)) {
                            console.log("filtro pasado!")
                            candidatos.push(usuarios[i])
                        } else {
                            console.log("filtro fallado!")
                        }
                        
                    }
                }
            }

            console.log(`candidatos para ${json.username}: ${candidatos}`)

            match = candidatos[Math.floor(Math.random() * candidatos.length)]
            console.log(match)
        })
    })
    await new Promise(resolve => setTimeout(resolve, config.message_delay_time)); //esperar
    if(match) {

        console.log(`user: ${json.username}`)
        sock.send(JSON.stringify({
            type: 'match_found',
            match: match.username
        }))

        console.log(`dest: ${match}`)

        matching_users[match.username].socket.send(JSON.stringify({
            type: 'match_found',
            match: json.username
        }))
    
        console.log(`match: ${match.username}`)
        console.log(`user: ${json.username}`)
    
        delete matching_users[match.username]
        delete matching_users[json.username]
    
        console.log(`matchings restantes: ${JSON.stringify(matching_users)}`)
    }

    /*FiltroUsuario.find({
        'id_usuario': {
            $in: ids
        } 
    }, (err, filtros) => {
        console.log(JSON.stringify(filtros))
        var filtro_usuario;
        for(var i in filtros) {
            if(filtros[i].id_usuario.equals(matching_users[json.username])) { //set users filter
                filtro_usuario = filtros[i]
            } else {

            }
        }

        console.log(`filtro maestro: ${filtro_usuario}`)
    })*/
}

function storeMessage(message) {
    Usuario.findOne({username: message.remitente}, (err, remitente) => {
        if(err) {
            console.log('fallo al grabar mensaje')
            return
        }

        if(!remitente) {
            console.log('no se encontró remitente')
            return
        }

        Usuario.findOne({username: message.destinatario_actual}, (err, destinatario) => {
            if(err) {
                console.log('fallo al grabar mensaje')
                return
            }
    
            if(!destinatario) {
                console.log('no se encontró destinatario')
                return
            }
            //guardar
            const newMensaje = new Mensaje({
                id_destinatario: destinatario._id,
                contenido: message.mensaje,
                timestamp: Date.now(),
                id_remitente: remitente._id
            })
            newMensaje.save((err, mensaje) => {
                if(err) console.log(err)
            })
        })
    })
}

function showMessageLog(remitente, destinatario) {
    Usuario.findOne({username: destinatario}, (err, db_destinatario) => {
        if(err) {
            console.log('fallo al buscar usuario')
            return
        }

        if(!db_destinatario) {
            console.log('destinatario no encontrado')
            return
        }

        Usuario.findOne({username: remitente}, (err, db_remitente) => {
            if(err) {
                console.log('fallo al buscar usuario')
                return
            }
    
            if(!db_destinatario) {
                console.log('remitente no encontrado')
                return
            }

            var relacion = {}
            relacion[`${db_destinatario._id}`] = `${db_destinatario.username}`
            relacion[`${db_remitente._id}`] = `${db_remitente.username}`

            Mensaje.find({
                $or: [
                    {id_remitente: db_remitente._id, id_destinatario: db_destinatario._id},
                    {id_remitente: db_destinatario._id, id_destinatario: db_remitente._id}
                ]
            }, null, {sort: {timestamp: 1}}, (err, mensajes) => {
                if(err) {
                    console.log('fallo al leer mensajes')
                    return
                }

                if(!mensajes) {
                    console.log('no existen mensajes')
                    return
                }

                mensajes.forEach(mensaje_obj => {
                    var usuario = relacion[`${mensaje_obj.id_remitente}`]
                    console.log(`(${usuario}, ${mensaje_obj.timestamp.toTimeString().slice(0, 5)}): ${mensaje_obj.contenido}`)
                })
            })
        })
    })
}


const {readUsuario, createUsuario, updateUsuario, deleteUsuario} = require('../controllers/usuario');
const { createFiltroUsuario, readFiltroUsuario, updateFiltroUsuario, deleteFiltroUsuario } = require('../controllers/filtro_usuario');
const { createPreferenciaPersonalidad, readPreferenciaPersonalidad, updatePreferenciaPersonalidad, deletePreferenciaPersonalidad } = require('../controllers/preferencia_personalidad');
const { createMensaje, readMensaje, updateMensaje, deleteMensaje } = require('../controllers/mensaje');
const res = require('express/lib/response');
const Mensaje = require('../models/mensaje');
const { distinct } = require('../models/usuario');
const usuario = require('../models/usuario');
const { default: mongoose } = require('mongoose');
const { Socket } = require('dgram');
const preferencia_personalidad = require('../models/preferencia_personalidad');
const { match } = require('assert');
const { domainToASCII } = require('url');

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
    res.render('inbox',{ layout: 'modules.hbs',
        username:req.session.username,
        host: config.host})
})

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/')
})

router.get('/matches', (req, res) => {
    res.render('matches', {layout: 'modules.hbs',
    username: req.session.username,
    host: config.host})
})

router.get('/perfil', async (req, res) => {
    console.log(req.session.username)
    var user = {username: req.session.username}
    var datos = {}
    var filtros = {}
    var preferencias = ""
    //datos
    Usuario.findOne({username: req.session.username},
        (err, encontrado) => {
            if(err) {
                return res.status(500)
            }
            if(!encontrado) {
                return res.status(400)
            }
            datos.mail = encontrado["correo"]
            datos.password = "?" //TODO
            datos.sex = encontrado["sexo"]
            var fecha = encontrado["fecha_nacimiento"]
            datos.birth_date = `${fecha.getDate() + 1}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`
            
            FiltroUsuario.findOne({id_usuario: encontrado._id},
            (err, filtro) => {
                if(err) {
                    return res.status(500)
                }
                if(!filtro) {
                    return res.status(400)
                }
                filtros.sex_interest = filtro["sexo_interes"]
                filtros.min_age = filtro["edad_min"]
                filtros.max_age = filtro["edad_max"]
            })

            PreferenciaPersonalidad.find({id_usuario: encontrado._id},
            (err, prefs) => {
                if(err) {
                    return res.status(500)
                }
                if(!prefs) {
                    return res.status(400)
                }

                for(var i in prefs) {
                    var pref = prefs[i]
                    var pref_clone = JSON.parse(JSON.stringify(pref))
                    delete pref_clone["_id"]
                    delete pref_clone["id_usuario"]
                    delete pref_clone["__v"]

                    console.log("preferencias:")
                    console.log(JSON.stringify(pref_clone))
                
                    preferencias += `
                    <div class="col preference-capsule" id="pref_${pref_clone["preferencia"]}">            
                    <span class="preference-title">${pref_clone["preferencia"]}</span>
                    <img class="preference_value"src="${pref_clone["valor"]? '/img/check-mark.png': '/img/remove.png'}">
                    </div>
                    `
                }
            })
        })
    
    //await para enviarlo hasta que esté, tiempo doble porque tarda un poco
    await new Promise(resolve => setTimeout(resolve, config.message_delay_time * 2));

    //preferencias
    
    res.render('perfil', {layout: 'modules.hbs', user: user,
    datos: datos, filtros: filtros, preferencias: preferencias})
})

//utilerias

function check_filtro(usuario, filtro) {
    var hoy = new Date(Date.now())
    var edad = hoy.getFullYear() - usuario.fecha_nacimiento.getFullYear()
    return edad > filtro.edad_min && edad < filtro.edad_max && filtro.sexo_interes == usuario.sexo

}

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