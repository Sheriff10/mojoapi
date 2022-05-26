const mysql = require('mysql');

const con = mysql.createPool({
    host     : 'sql11.freemysqlhosting.net',
    user     : 'sql11494855',
    password : 'tJ7C7YpzLu',
    database : 'sql11494855',
    connectionLimit: 100
});

module.exports = con