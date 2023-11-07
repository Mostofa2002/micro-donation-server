const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0jbjnlh.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const foodCollection = client.db("Donation").collection("allFood");
    const requestCollection = client.db("Donation").collection("request");

    // get limit food items from the database
    app.get("/allFood/limited", async (req, res) => {
      try {
        const query = {};
        const options = { sort: { quantity: -1 } };
        const cursor = foodCollection.find(query, options);
        const result = await cursor.limit(6).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // get all food items from the database
    app.get("/allFood", async (req, res) => {
      try {
        const sort = req.query.sort;
        const search = req.query.search;

        // return res.send(search);
        const query = { food_name: { $regex: search, $options: "i" } };

        const options = {
          sort: { expiration_date: sort === "asc" ? 1 : -1 },
        };
        const cursor = foodCollection.find(query, options);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/allFoods", async (req, res) => {
      try {
        const cursor = foodCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // get single food from database
    app.get("/singleFood/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await foodCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // add Food to database
    app.post("/allFood", async (req, res) => {
      try {
        const addRequest = req.body;
        const result = await foodCollection.insertOne(addRequest);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    // add requested food to database
    app.post("/request", async (req, res) => {
      try {
        const addRequest = req.body;
        const result = await requestCollection.insertOne(addRequest);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/request", async (req, res) => {
      try {
        const result = await requestCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // food that request user
    app.get("/request/:foodId", async (req, res) => {
      try {
        const { foodId } = req.params;
        const result = await requestCollection
          .find({ foodId: foodId })
          .toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // my request food also jwt here
    app.get("/requests", async (req, res) => {
      try {
        let query = {};
        if (req.query?.email) {
          query = {
            requesterEmail: req.query.email,
          };
        }

        const result = await requestCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/Food", async (req, res) => {
      // also jwt used here
      try {
        let query = {};

        if (req.query?.email) {
          query = {
            donatorEmail: req.query.email,
          };
        }
        const result = await foodCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    app.delete("/allFoodS/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.deleteOne(query);
      res.send(result);
    });

    // update section

    app.get("/updates/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Micros World!");
});

app.listen(port, () => {
  console.log(`Micro donation  app listening on port ${port}`);
});
