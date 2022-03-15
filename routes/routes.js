/*jshint esversion: 6*/
const express = require('express');
const path = require('path');

const router = express.Router();

var mysql = require('mysql');
const { append } = require('express/lib/response');

module.exports = router;

router.get('/saludo', (req, res) => {
    console.log('sirviendo un get de la página saludo');
    res.render('saludo', {})
})