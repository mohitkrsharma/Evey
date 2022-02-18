const express = require('express');
const app = require('express')();
module.exports = app; // for testing
const path = require('path');
// const open = require('open');
const compression = require('compression');
const fs = require('fs');
const https = require('https');
const port = process.env.port || 3001;

app.use(compression());
app.use(express.static('dist'));

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, './dist/index.html'));
});


// const httpsOptions = {
//   key: fs.readFileSync('/home/rahullahariya/secureKeys/key.pem'),
//   cert: fs.readFileSync('/home/rahullahariya/secureKeys/cert.pem')
// }
// const server = https.createServer(httpsOptions, app).listen(port, () => {
// })


app.listen(port, function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log("Asdasdasdasd",port);
///    open('http://3.16.170.246:3001');
    //open('http://52.34.207.5:5129')
    //open('+'http://52.39.212.226'+':${port}');
  }
});


