const config = require("./config.js");
const express = require('express');
const nunjucks = require('nunjucks');

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

//db
let db = mongo.getDb();
let collection;
//collection.find({}).forEach(console.dir)
db.then((db) => {collection = db.collection("collection"); 
});

async function insert(addr,value) {
  await collection.insertOne({"address":addr,"value":value});
}

async function replace(addr,newvalue) {
  await collection.replaceOne({"address":addr}, {"address":addr,"value":newvalue});
}

async function find(addr) {
  return await collection.findOne({"address":addr});
}

async function count(query) {
  return await collection.count(query);
}

//templating, web server
nunjucks.configure('templates', { autoescape: true });

const app = express();

app.use(express.static('files'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(cookieParser());

//based on config currencies, set up web servers and import currencies
if (config.enabled_coins.includes('banano')) {
  async function banano_get_handler(req, res) {
    //
  }
  async function banano_post_handler(req, res) {
    //
  }
  //I am aware we can set a variable to the url path, but I think this is more readable
  if (config.banano.default) {
    app.get('/', banano_get_handler);
    app.post('/', banano_post_handler);
  } else {
    app.get('/banano', banano_get_handler);
    app.post('/banano', banano_post_handler);
  }
}

app.listen(8081, async () => {
  //recieve banano deposits
  if (config.enabled_coins.includes('banano')) {
    await banano.receive_deposits();
  }
  console.log(`App on`);
});