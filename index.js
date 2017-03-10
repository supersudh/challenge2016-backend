const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const morgan = require('morgan');
var jsonfile = require('jsonfile')
const app = express();
// const router = require('./router');
const cors = require('cors');
var dataBase;
// App Setup
app.use(morgan('combined'));
app.use(cors());
app.use(bodyParser.json({ type: '*/*' }));
var fs = require('fs');

var userDetails = [];
var ready = false;
// router(app);

// Server Setup
const port = process.env.PORT || 8080;
const server = http.createServer(app);
server.listen(port);
console.log('Server listening on:', port);


if (fs.existsSync(__dirname + '/database.json')) {
  jsonfile.readFile(__dirname + '/database.json', function (err, data) {
    dataBase = data;
    ready = true;
  })
}
else {
  require('./csvOp')().then(data => {
    dataBase = data;
    ready = true;
  }, err => {
    console.log("Err index", err);
  });
}

var GLOBAL_USER_POOL = [];

function verifyKey(key) {
  let flag = GLOBAL_USER_POOL[key] ? true : false; 
  return flag;
}

app.get('**',(req,res,next) => {
  if(!ready) {
    res.send({Error: "Come Back when I am ready... Wait for 1-2 minutes bro."}).status(500);
  }
  else {
    next();
  }
});

app.get('/countries', (req, res) => {
  res.send(dataBase.countries);
});

app.get('/states', (req, res) => {
  res.send(dataBase.states.filter(state => state.country_code == req.query.country_code));
});

app.get('/cities', (req, res) => {
  res.send(dataBase.cities.filter(city => ((city.country_code == req.query.country_code) && (city.province_code == req.query.province_code))));
});

app.get('/state', (req,res) => {
  res.send(GLOBAL_USER_POOL);
});

app.post('/initialize',(req,res) => {
  let unique = false;
  while(!unique) {
    let ran = Math.random();
    let flag = GLOBAL_USER_POOL.some(t => t.ran == ran );
    if(!flag) {
      unique = true;
      GLOBAL_USER_POOL[ran] = [];
      return res.send({key: ran}).status(200);
    }
  }
});

app.post('/create_distributor', (req, res) => {
  let { name, is_child, is_child_of, key } = req.body;
  if(!key) {
    return res.send({ Error: "Key is missing" }).status(400);
  }
  if(!verifyKey(key))  return res.send({ Error: "Invalid Key" }).status(400);
  if (!(GLOBAL_USER_POOL.some(t => t.name == name))) {
    let id = GLOBAL_USER_POOL.length + 1;
    GLOBAL_USER_POOL[key].push({ name, id, permissions: [], banned: [], is_child, is_child_of });
    return res.send(GLOBAL_USER_POOL);
  }
  else {
    return res.send({ Error: "Distributor Name already Taken." }).status(400);
  }
});

app.post('/add_permission', (req, res) => {
  let { country_code, province_code, city_code, id, key } = req.body;
  if(!key) {
    return res.send({ Error: "Key is missing" }).status(400);
  }
  if(!verifyKey(key))  return res.send({ Error: "Invalid Key" }).status(400);
  for (let i in GLOBAL_USER_POOL[key]) {
    if (GLOBAL_USER_POOL[i].id == id) {
      GLOBAL_USER_POOL[i].permissions.push({ country_code, province_code, city_code });
      break;
    }
  }
  return res.send(GLOBAL_USER_POOL);
});

app.post('/block_permission', (req, res) => {
  let { country_code, province_code, city_code, id, key } = req.body;
  if(!key) {
    return res.send({ Error: "Key is missing" }).status(400);
  }
  if(!verifyKey(key))  return res.send({ Error: "Invalid Key" }).status(400);

  for (let i in GLOBAL_USER_POOL[key]) {
    if (GLOBAL_USER_POOL[i].id == id) {
      GLOBAL_USER_POOL[i].banned.push({ country_code, province_code, city_code });
      break;
    }
  }
  return res.send(GLOBAL_USER_POOL);
});

app.post('check_permissions', (req, res) => {
  let { country_code, province_code, city_code, id, key } = req.body;
  if(!key) {
    return res.send({ Error: "Key is missing" }).status(400);
  }
  if(!verifyKey(key))  return res.send({ Error: "Invalid Key" }).status(400);

  let data;
  for (let i in GLOBAL_USER_POOL[key]) {
    if (GLOBAL_USER_POOL[i][key].id == id) {
      let user = GLOBAL_USER_POOL[key][i];
      if (user.banned.some(t => (t.country_code == country_code || t.province_code == province_code || t.city_code == city_code))) {
        return res.send({ data: "NO" }).status(200);
      }
      if (!user.is_child) {
        return res.send({ data: "YES" }).status(200);
      }
      else {
        if (user.permissions.every(t => (t.country_code == country_code || t.province_code == province_code || t.city_code == city_code))) {
          return res.send({ data: "YES" }).status(200);
        }
        else {
          return res.send({ data: "NO" }).status(200);
        }
      }
    }
  }
});

