const mongo = require('./mongo.js');
const config = require('./config.js');

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
//we want seperate collections for each currency
let collections = {};
db.then((db) => {
	//we want to see what currencies are supported, and get a collection for each one
	let enabled_coins = config.enabled_coins;
	for (let i=0; i < enabled_coins.length; i++) {
		collections[enabled_coins[i]] = db.collection(enabled_coins[i]);
	}
});

async function insert(address, value, coin) {
  await collections[coin].insertOne({"address":address,"value":value});
}

async function replace(address, newvalue, coin) {
  await collections[coin].replaceOne({"address":address}, {"address":address,"value":newvalue});
}

async function find(address, coin) {
  return await collections[coin].findOne({"address":address});
}

async function count(query, coin) {
  return await collections[coin].count(query);
}

async function claim_too_soon_db(address, coin) {
	let address_info = await find(address, coin);
	if (!address_info) {
		return false;
	}
	if (Date.now() > (address_info.value+config[coin].claim_frequency)) {
		return false;
	} else {
		return true;
	}
}

async claim_too_soon_cookies(req_cookies, coin) {
	if (Date.now() > Number(req_cookies["last_claim_"+coin])+config[coin].claim_frequency) {
		return false;
	}
	return true;
}

module.exports = {
  milliseconds_to_readable: milliseconds_to_readable,
	insert: insert,
	replace: replace,
	find: find,
	count: count,
	claim_too_soon_db: claim_too_soon_db,
	claim_too_soon_cookies: claim_too_soon_cookies
}