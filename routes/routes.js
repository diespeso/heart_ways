/*jshint esversion: 6*/
const express = require('express');
const path = require('path');

const router = express.Router();

const { append } = require('express/lib/response');

module.exports = router;


const {readUsuario, createUsuario, updateUsuario, deleteUsuario} = require('../controllers/usuario');
const { createFiltroUsuario, readFiltroUsuario, updateFiltroUsuario, deleteFiltroUsuario } = require('../controllers/filtro_usuario');
const { createPreferenciaPersonalidad, readPreferenciaPersonalidad, updatePreferenciaPersonalidad, deletePreferenciaPersonalidad } = require('../controllers/preferencia_personalidad');
const { createMensaje, readMensaje, updateMensaje, deleteMensaje } = require('../controllers/mensaje');

router.get('/saludo', (req, res) => {
    console.log('sirviendo un get de la página saludo');
    res.render('saludo', {})
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