//Declareition
var messages;
var longg, latt, fech, tiem, fech2, fech3, velorpm, employee, ids;

//DATABASE
var mysql = require('mysql');
const config = {
    host: 'design.ck9qlt1qutiu.us-east-1.rds.amazonaws.com',
    user: 'dark', //user
    password: 'mr01121998',
    port: '3306', // puerto, puede ser otro
    database: 'blodreina'
};
const pool = mysql.createPool(config); // Create a MySQL pool
module.exports = pool; // Export the pool

// Sniffer
const dgram = require('dgram');
const server = dgram.createSocket('udp4');
server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});
server.on('message', (msg, rinfo) => {
    console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    messages = msg;
    console.log(messages.length); //se puede tachar
    idt = messages.slice(39, 46); //turck's id
    idt = idt.toString();
    console.log(idt); //check for track2

    fech3 = messages.slice(6, 19); //datetime convertion
    fech2 = new Date(parseFloat(fech3) - 18000000);
    fech = fech2.toISOString();
    tiem = new Date(fech).toLocaleTimeString('en',
        { timeStyle: 'short', hour12: false, timeZone: 'UTC' });

    if (idt == 'WANHEDA') {  //according to the truck, proccesing the dgram
        longg = parseFloat(messages.slice(19, 28));
        latt = parseFloat(messages.slice(28, 36));
        velorpm = '0';
        ids = idt;
    } else {
        longg = parseFloat(messages.slice(19, 28));
        latt = parseFloat(messages.slice(28, 36));
        l = messages.slice(36, 38);
        l = l.toString();
        m = messages.slice(38, 40);
        m = m.toString();
        velorpm = (parseInt('0X' + l + m)) / 4; //caculate rpm form
        ids = 'BLODREINA';
        ids = ids.toString();
    }

    employee = { fecha: fech, hora: tiem, lat: latt, lon: longg, dat: ids, velo: velorpm }; //insert into mysql
    sql = 'INSERT INTO blodreina SET ?';
    pool.query(sql, employee, (err, res) => {
        if (err) throw err;
        console.log("new row inserted");
    });
});

//doStuffwithTheResult(data);
server.on('listening', () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
});
server.bind(50000, '172.31.58.154');

// Web Server
const express = require('express');
const app = express();
var hbs = require('express-hbs');
const path = require('path')
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); //Arregla la petici�n , la hace bonita
app.engine('hbs', hbs.express4({
    partialsDir: __dirname + '/views'
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')))   // static files
app.set('port', process.env.PORT || 8080);
app.listen(app.get('port'), () => {
    console.log('server on port', app.get('port'))
});
app.get('/', (req, res) => {
    res.render('index', {
    })
})
app.get('/historicos', (req, res) => {
    res.render('historicos', {
    })
})
app.get('/inicio', (req, res) => {
    res.render('inicio', {
    })
})
//real time requests
var compare = 'BLODREINA';
app.get('/refresh', (req, res) => { // as� se llama a blodreina en la p�gina web o alguna funci�n que utilice lo contenido en blodreina de la p�gina

    if (ids == compare) {
        var sql2 = 'SELECT * FROM blodreina ORDER BY idblodreina DESC limit 1';
    } else {

        var sql2 = 'SELECT * FROM blodreina ORDER BY idblodreina DESC limit 1';
    }
    pool.query(sql2, (err, result, fields) => { // selecciona de el error, las columnas y los campos de blodreina que es la tabla de la$
        if (err) throw err;
        let mensaje = [
            result[0].fecha,
            result[0].hora,
            result[0].lat,
            result[0].lon,
            result[0].dat,
            result[0].velo
        ];
        res.json(mensaje);
    });
});

//historics requests
app.post("/endpoint", (req, res) => {
    var value = [
        req.body.fecha1,
        req.body.fecha2,
        req.body.chooser,
    ];
    fec1 = value[0];
    fec1 = fec1.toString();
    fec2 = value[1];
    fec2 = fec2.toString();
    if (value[2] == 1) {
        var sql = "SELECT * FROM blodreina where dat = 'BLODREINA' and fecha between ? and ?";
    } else if (value[2] == 2) {
        var sql = "SELECT * FROM blodreina where dat = 'WANHEDA' and fecha between ? and ?";
    } else if (value[2] == 0) {
        var sql = "SELECT * FROM blodreina where fecha between ? and ?";

    } else {

    }
    pool.query(sql, value, function (err, result) {
        if (err) throw err;
        console.log(result);
        res.json(result);

    });
});

//slider
app.get('/historicos2', (req, res) => {
    res.render('historicos2', {
    })
})

app.get('/refresh1', (req, res) => { // as� se llama a blodreina en la p�gina web o alguna funci�n que utilice lo contenido en blodreina de la p�gina
    var sql2 = 'SELECT * FROM blodreina ORDER BY idblodreina DESC limit 1';
    pool.query(sql2, (err, result, fields) => { // selecciona de el error, las columnas y los campos de blodreina que es la tabla de la$
        if (err) throw err;
        let mensaje = [
            result[0].fecha,
            result[0].hora,
            result[0].lat,
            result[0].lon,
            result[0].dat,
            result[0].velo
        ];
        res.json(mensaje);
        
    });
});

app.post("/htrc2", (req, res) => {

    var value = [
        req.body.lat1,
        req.body.lon,
        req.body.lat2,
        req.body.radio,
        req.body.f1,
        req.body.idsy,
    ];
    var sql = "SELECT *, lat, lon, ( 6371 * acos(cos(radians(?)) * cos(radians(lat)) * cos(radians(lon) - radians(?)) + sin(radians(?)) * sin(radians(lat)))) AS distance FROM blodreina HAVING distance < ? AND fecha LIKE ? and dat = ? ORDER BY idblodreina;";
    pool.query(sql, value, function (e, result) {
        if (e) throw e;
        res.json(result);
        console.log(result);
    });

})

