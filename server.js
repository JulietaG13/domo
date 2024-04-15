// import { MongoClient } from "mongodb";
const { MongoClient } = require('mongodb')

const mqtt = require("mqtt");

// Replace the uri string with your MongoDB deployment's connection string.
var config   = require('./config');
var mongoUri = 'mongodb://' + config.mongodb.hostname + ':' + config.mongodb.port + '/' + config.mongodb.database;
var date_time = new Date();
// Create a new client and connect to MongoDB
const mongoClient = new MongoClient(mongoUri);

var mqttUri  = 'mqtt://' + config.mqtt.hostname + ':' + config.mqtt.port;
const mqttClient = mqtt.connect(mqttUri);

async function run(msg) {
  try {
    // Connect to the "insertDB" database and access its "haiku" collection
    const database = mongoClient.db(config.mongodb.database);
    const haiku = database.collection("message");
    
    // Create a document to insert
    const doc = {
//      title: "Record of a Shriveled Datum",
      fecha: date_time,
      content: msg,
    }
    // Insert the defined document into the "haiku" collection
    const result = await haiku.insertOne(doc);

    // Print the ID of the inserted document
    console.log(`A document was inserted with the _id: ${result.insertedId}`);
  } finally {
     // Close the MongoDB client connection
    await mongoClient.close();
  }
}
// Run the function and handle any errors
//run().catch(console.dir);

mqttClient.on("connect", () => {
  mqttClient.subscribe("+", (err) => {
    if (!err) {
      console.log("Client connected");
    }
  });
});

mqttClient.on("message", (topic, message) => {
  // message is Buffer
  console.log(message.toString());
  run(message.toString()).catch(console.dir);
});
