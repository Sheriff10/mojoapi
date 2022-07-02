const mysql = require("mysql");

const con = mysql.createPool({
  host: "sql6.freemysqlhosting.net",
  user: "sql6502900",
  password: "cWx4qHdI57",
  database: "sql6502900",
  connectionLimit: 10,
  connectTimeout: 60 * 60 * 1000,
  acquireTimeout: 60 * 60 * 1000,
  timeout: 60 * 60 * 1000,
});

module.exports = con;
