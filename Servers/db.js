
var mssql = require('mssql');

var db = {};

var config = {
  user: 'hds166813246', password: '942Yhc520', server: 'hds166813246.my3w.com', database: 'hds166813246_db', port: 1433,
  options: {
    encrypt: true // Use this if you're on Windows Azure
  },
  pool: {
    min: 0,
    max: 10,
    idleTimeoutMillis: 3000
  }
};


db.sql = (sql, callBack) => {
  var connection = new mssql.ConnectionPool(config, function (err) {
    if (err) {
      console.log(err);
      return;
    }

    var ps = new mssql.PreparedStatement(connection);

    ps.prepare(sql, (err) => {
      if (err) {
        console.log(err);
        return;
      }
      ps.execute('', (err, result) => {
        if (err) {
          console.log(err);
          return;
        }
        ps.unprepare((err) => {
          if (err) {
            console.log(err);
            callback(err, null);
            return;
          }
          callBack(err, result);
        });

      });

    });

  });
};

module.exports = db;