const http = require('http')
const express = require('express');
const app = express();
const server = http.createServer(app)
const static = require('serve-static');

// Settings
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(static(__dirname + '/public'));

var homepage = function(req, res) {
  res.render('index', {});
}

app.get('/', homepage);

server.listen(app.get('port'), function(){
    console.log('HexEmpireAI is listening on port ' + app.get('port'));
});
