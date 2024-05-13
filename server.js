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

const collectionName = "user";

async function run() {
  try {
    const database = mongoClient.db(config.mongodb.database);
    const user = database.collection(collectionName);

    try {
      const deleteResult = await user.deleteMany({});
      console.log(`${deleteResult.deletedCount} documents deleted from the "user" collection`);
    } catch (error) {
      console.error("Error clearing user collection:", error);
    }

    const user1 = {
      name: "yo",
      conf: "1",
      led1: "ON",
      led2: "OFF",
      led3: "ON",
      led4: "ON",
    }
    const user2 = {
      name: "yo no",
      conf: "1",
      led1: "OFF",
      led2: "OFF",
      led3: "ON",
      led4: "ON",
    }

    const result1 = await user.insertOne(user1);
    console.log(`A document was inserted with the _id: ${result1.insertedId}`);

    const result2 = await user.insertOne(user2);
    console.log(`A document was inserted with the _id: ${result2.insertedId}`);

  } catch (error) {
    console.dir(error);
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

mqttClient.on("message", (topic, message) => {
  // message is Buffer
  console.log("topic: " + topic.toString());
  console.log("message: " + message.toString());

  const parts = topic.split("/");
  switch (parts[0]) {
    case "activate":
      break;
    default:
      break;
  }
});

async function activate(name, conf) {
  try {
    const database = mongoClient.db(config.mongodb.database);
    const user = database.collection(collectionName);
    // Find the user document by name
    const userObj = await user.findOne({ name: name, conf: conf });

    if (!userObj) {
      console.error(`User "${name}" or config "${conf}" not found`);
      return;
    }

    // Fetch the LED state from the user object
    const ledStates = [userObj.led1, userObj.led2, userObj.led3, userObj.led4];

    for (let i = 0; i < ledStates.length; i++) {
      mqttClient.publish("LED" + i.toString(), ledStates[i], (err) => {
        if (err) {
          console.error("Error publishing message:", err);
        } else {
          console.log(`Message "${ledStates[i]}" sent to topic "LED${i}" for user ${name}`);
        }
      });
    }
  } catch (error) {
    console.error("Error fetching user:", error);
  }
}