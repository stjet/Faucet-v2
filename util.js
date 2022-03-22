const mongo = require('./mongo.js');

//turns milliseconds to a more readable format, such as minutes, hours, days
function milliseconds_to_readable(milliseconds) {
  //turns milliseconds to seconds
  let seconds = Math.round(milliseconds/1000);
  //if is a multiple of a day exactly
  if (seconds % (60*60*24) == 0) {
    let days = String(seconds / (60*60*24));
    if (days == "1") {
      return days+" day";
    } else {
      return days+" days";
    }
  } else if (seconds % (60*60)) {
    //multiple of an hour
    let hours = String(seconds / (60*60));
    if (hours > 48) {
      //get combinations of hours and days
      let days = Math.floor(hours/24);
      hours = hours - days*24;
      let readable = "";
      if (days == 1) {
        readable += String(days)+" day";
      } else {
        readable += String(days)+" days";
      }
      readable += " and ";
      if (hours == 1) {
        readable += String(hours)+" hour";
      } else {
        readable += String(hours)+" hours"
      }
      return readable;
    }
    if (hours == "1") {
      return hours+" hour";
    } else {
      return hours+" hours";
    }
  } else if (seconds > (60*60)) {
    //if more than an hour, but not an increment. Eg, 90*60 seconds would be 1.5 hours and 121*60 seconds would be 2.0166666666... hours.
    //Not ideal, but if someone is trying to set the claim frequency to some bizzare number it is their problem.
    return String(seconds / (60*60))+" hours";
  } else {
    //calculate in minutes
    return String(Math.floor(seconds / 60))+ "minutes";
  }
}

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

module.exports = {
  milliseconds_to_readable: milliseconds_to_readable,
	insert: insert,
	replace: replace,
	find: find,
	count: count
}