const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;

// middlewares
app.use(express.json());
app.use(cors());
app.get("/", (req, res) => {
  res.send("Tour guide server running");
});
// console.log(process.env.DB_USER, process.env.DB_PASSWORD);
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster1.vnja0wm.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  // Send a ping to confirm a successful connection
  try {
    // Get the database and collection on which to run the operation

    const database = client.db("tourServicesDB");

    const servicesCollection = database.collection("services");
    const bookingsCollection = database.collection("bookings");

    // services related apis
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await servicesCollection.insertOne(service);
      res.send(result);
    });
    app.get("/services", async (req, res) => {
      const result = await servicesCollection.find().toArray();
      res.send(result);
    });
    app.get("/myServices", async (req, res) => {
      const myEmail = req.query.email;
      const query = { providerEmail: myEmail };
      const result = await servicesCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/myService/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await servicesCollection.findOne(query);
      res.send(result);
    });
    app.put("/myService/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const { serviceName, serviceImage, serviceArea, price, description } =
        req.body;
      const options = { upsert: true };
      const updateService = {
        $set: {
          serviceName,
          serviceImage,
          serviceArea,
          price,
          description,
        },
      };
      const result = await servicesCollection.updateOne(
        filter,
        updateService,
        options
      );
      res.send(result);
    });
    app.delete("/myService/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await servicesCollection.deleteOne(filter);

      res.send(result);
    });

    app.get("/serviceDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await servicesCollection.findOne(query);
      res.send(result);
    });

    // bookings related api
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });
    app.get("/myBookings", async (req, res) => {
      const myEmail = req.query.email;
      const query = { bookerEmail: myEmail };
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/myPendingWorks", async (req, res) => {
      const myEmail = req.query.email;
      const query = { providerEmail: myEmail };
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    });

    // db ping
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
    // console.log("db not connecting");
  }
}
run().catch(console.dir);
app.listen(port, (req, res) => {
  console.log(`Listening at port ${port}`);
});
