module.exports = {
    port: process.env.PORT || 3030,
    ws_port: 80,
    db: process.env.MONGODB || 'mongodb://localhost:27017/heart_ways',
    message_delay_time: 10, //milisegundos necesarios para que se sincronice con la db
    urlParser: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
}