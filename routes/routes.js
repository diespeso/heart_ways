/*jshint esversion: 6*/
const express = require('express');
const path = require('path');

const router = express.Router();

const { append } = require('express/lib/response');

module.exports = router;


const {readUsuario, createUsuario, updateUsuario, deleteUsuario} = require('../controllers/usuario');
const { createFiltroUsuario, readFiltroUsuario, updateFiltroUsuario, deleteFiltroUsuario } = require('../controllers/filtro_usuario');

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