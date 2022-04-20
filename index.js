'use strict'

const express = require('express')
const hbs = require('express-handlebars')
const sessions = require('express-session')
//const cookieParser = require('cookie-parser')
const app = express()
const oneDay = 1000 * 60 * 60 * 24;

const ws = require('ws') //websocket

app.use(sessions({
    secret: 'secretstringuwu',
    saveUninitialized: true,
    cookie: {maxAge: oneDay},
    resave: false
}))
//app.use(cookieParser());


app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.use(express.static(__dirname + '/public'))
app.engine('.hbs', hbs.engine({
    defaultLayout: 'index',
    extname: '.hbs'
}))

app.set('view engine', '.hbs')

const router = require('./routes/routes')
app.use('/', router)

const config = require('./config')
const { default: mongoose } = require('mongoose')

mongoose.connect(config.db, config.urlParser, (err, res) => {
    if(err) {
        return console.log(`Error al conectar a BD: ${err}`)
    }

   
    console.log(`DB: ${config.db}`);
    app.listen(config.port, () => {
        console.log(`Server running at: http://localhost:${config.port}`)
    })

})