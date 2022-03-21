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

//based on config currencies, set up web servers

//config.enabled_coins