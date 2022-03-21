const mongo = require('mongodb');

//starts with: "mongodb+srv://"

const mongo_connection_string;
if (config.secrets.use_env) {
  mongo_connection_string = process.env.mongo_connection_string;
} else {
  mongo_connection_string = config.secrets.mongo_connection_string;
}

let client = new mongo.MongoClient(mongo_connection_string, { useNewUrlParser: true, useUnifiedTopology: true })

module.exports = {
  getDb: async function() {
    await client.connect();
    return client.db('db');
  },
};