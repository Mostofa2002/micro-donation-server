const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const cookie_Parser = require("cookie-parser");

require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;

// middleware
app.use(cors({ origin: ["http://localhost:5174"], credentials: true }));
app.use(express.json());
app.use(cookie_Parser());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0jbjnlh.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
// jwt gateman
const gateman = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log("value of token", token);
  if (!token) {
    return res.status(401).send({
      message: "Unauthorized access token",
    });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    // err
    if (err) {
      console.log(err);
      return res.status(401).send({
        message: "Unauthorized access token",
      });
    }
    // console.log("code is cracked", decoded);
    req.user = decoded;

    next();
  });
};

async function run() {
  try {
    const foodCollection = client.db("Donation").collection("allFood");
    const requestCollection = client.db("Donation").collection("request");

    // jwt process here
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("user from client", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });
    // logOut then removed the token

    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logout from client", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

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
    app.get("/request/:foodId", gateman, async (req, res) => {
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
    app.get("/requests", gateman, async (req, res) => {
      try {
        if (req.user.email !== req.query.email) {
          return res.status(403).send({
            message: "forbidden access",
          });
        }
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

    // also jwt used here
    app.get("/Food", gateman, async (req, res) => {
      try {
        // console.log(req.query.email);
        // console.log("token owner", req.user);
        if (req.user.email !== req.query.email) {
          return res.status(403).send({
            message: "forbidden access",
          });
        }
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

    // delete
    app.delete("/allFoodS/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.deleteOne(query);
      res.send(result);
    });

    app.delete("/request/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await requestCollection.deleteOne(query);
      res.send(result);
    });

    // update section

    app.get("/updates/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });

    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      // console.log("query", query);
      const options = { upsert: true };
      const Updated = req.body;
      const updateDoc = {
        $set: {
          food_name: Updated.food_name,
          additional_notes: Updated.additional_notes,
          location: Updated.location,
          image: Updated.image,
          quantity: Updated.quantity,
          expiration_date: Updated.expiration_date,
          status: Updated.status,
        },
      };
      const result = await foodCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // small delivered patch
    // app.patch("/updateSky/:id", async (req, res) => {
    //   try {
    //     const id = req.params.id;
    //     const query = { _id: new ObjectId(id) };

    //     const updateDoc = {
    //       $set: {
    //         status: "Delivered",
    //       },
    //     };
    //     const result = await foodCollection.updateOne(query, updateDoc);
    //     res.send(result);
    //   } catch (error) {
    //     console.log(error);
    //   }
    // });

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
