// import { MongoClient } from "mongodb";
const { MongoClient } = require('mongodb')

const mqtt = require('mqtt');

// Replace the uri string with your MongoDB deployment's connection string.
var config   = require('./config');
var mongoUri = 'mongodb://' + config.mongodb.hostname + ':' + config.mongodb.port + '/' + config.mongodb.database;
var date_time = new Date();
// Create a new client and connect to MongoDB
const mongoClient = new MongoClient(mongoUri);

var mqttUri  = 'mqtt://' + config.mqtt.hostname + ':' + config.mqtt.port;
const mqttClient = mqtt.connect(mqttUri);

async function run() {
  try {
    const database = mongoClient.db(config.mongodb.database);
    const user = database.collection("user");

    const user1 = {
      name: "yo",
      led1: "ON",
      led2: "OFF",
      led3: "ON",
      led4: "ON",
    }
    const user2 = {
      name: "yo no",
      led1: "OFF",
      led2: "OFF",
      led3: "ON",
      led4: "ON",
    }

    const result1 = await user.insertOne(user1);
    console.log(`A document was inserted with the _id: ${result1.insertedId}`);

    const result2 = await user.insertOne(user2);
    console.log(`A document was inserted with the _id: ${result2.insertedId}`);

  } finally {
    await mongoClient.close();
  }
}
// Run the function and handle any errors
run().catch(console.dir);

mqttClient.on("connect", () => {
  mqttClient.subscribe("+", (err) => {
    if (!err) {
      console.log("Client connected");
    }
  });
});

mqttClient.on("activate", (topic, message) => {
  // message is Buffer
  console.log("activate: ");
  console.log(message.toString());
  activate(message.toString()).catch(console.dir);
});

async function activate(name) {
  try {
    // Find the user document by name
    const userObj = await userCollection.findOne({ name: name });

    if (!userObj) {
      console.error(`User "${name}" not found`);
      return;
    }

    // Fetch the LED state from the user object
    const ledState = userObj.led1;

    // Publish the LED state to the LED topic
    mqttClient.publish("LED", ledState, (err) => {
      if (err) {
        console.error("Error publishing message:", err);
      } else {
        console.log(`Message "${ledState}" sent to topic "LED" for user ${name}`);
      }
    });
  } catch (error) {
    console.error("Error fetching user:", error);
  }
}