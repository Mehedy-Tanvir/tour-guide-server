const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;

// middlewares
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(cookieParser());

// my middlewares
const verifyId = async (req, res, next) => {
  const id = req.params.id;
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  if (!isValidObjectId) {
    return res.status(404).send({ error: "invalid id" });
  }
  next();
};

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

    // auth related api
    app.post("/jwt", async (req, res) => {
      try {
        const user = req.body;
        const token = jwt.sign(
          {
            email: user.email,
          },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "10h" }
        );
        res
          .cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
          })
          .send({ success: true });
      } catch (error) {
        console.log(error);
      }
    });
    app.post("/logout", async (req, res) => {
      try {
        res.clearCookie("token", { maxAge: 0 }).send({ success: true });
      } catch (error) {
        console.log(error);
      }
    });

    // services related apis
    app.post("/services", async (req, res) => {
      try {
        const service = req.body;
        const result = await servicesCollection.insertOne(service);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    app.get("/services", async (req, res) => {
      try {
        const result = await servicesCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    app.get("/myServices", async (req, res) => {
      try {
        const myEmail = req.query.email;
        const query = { providerEmail: myEmail };
        const result = await servicesCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    app.get("/myService/:id", verifyId, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await servicesCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    app.put("/myService/:id", verifyId, async (req, res) => {
      try {
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
      } catch (error) {
        console.log(error);
      }
    });
    app.delete("/myService/:id", verifyId, async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const result = await servicesCollection.deleteOne(filter);

        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/serviceDetails/:id", verifyId, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await servicesCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // bookings related api
    app.post("/bookings", async (req, res) => {
      try {
        const booking = req.body;
        const result = await bookingsCollection.insertOne(booking);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    app.get("/myBookings", async (req, res) => {
      try {
        const myEmail = req.query.email;
        const query = { bookerEmail: myEmail };
        const result = await bookingsCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    app.get("/myPendingWorks", async (req, res) => {
      try {
        const myEmail = req.query.email;
        const query = { providerEmail: myEmail };
        const result = await bookingsCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    app.patch("/updateStatus/:id", verifyId, async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      try {
        const result = await bookingsCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status,
            },
          }
        );

        if (result.matchedCount === 1) {
          res.json({ message: "Status updated successfully" });
        } else {
          res.status(404).json({ message: "Booking not found" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
      }
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
