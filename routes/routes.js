/*jshint esversion: 6*/
const express = require('express');
const path = require('path');

const router = express.Router();

const { append } = require('express/lib/response');

module.exports = router;


const {readUsuario, createUsuario, updateUsuario, deleteUsuario} = require('../controllers/usuario');

router.get('/saludo', (req, res) => {
    console.log('sirviendo un get de la página saludo');
    res.render('saludo', {})
})

//cruds
router.post('/api/usuario', createUsuario)
router.get('/api/usuario/:usuario', readUsuario)
router.put('/api/usuario/:usuario', updateUsuario)
router.delete('/api/usuario/:usuario', deleteUsuario)