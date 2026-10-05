import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose-cjs";

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT;

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("wanderlust");
const destinationCollection = db.collection("destinations");
const bookingCollection = db.collection("bookings");

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  // console.log(authHeader , 'Token');
  if (!authHeader) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const token = authHeader.split(" ")[1];
  // console.log(token, 'Token');
  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  try {
    const { payload } = await jwtVerify(token, JWKS);
    //  console.log(payload , 'payload');
    next();
  } catch (error) {
    console.log(error.message, "JWT ERROR");

    return res.status(401).json({
      message: "Forbidden",
    });
  }
};

app.get("/featured", async (req, res) => {
  const result = await destinationCollection.find().limit(3).toArray();
  res.send(result);
});

app.delete("/booking/delete", verifyToken, async (req, res) => {
  const { userId,bookingId } = req.query;
  console.log(userId, "id", bookingId,'bookingId');
  const result = await bookingCollection.deleteOne({ 
    userId: userId,
   _id: new ObjectId(bookingId) 
   });
  res.send(result);
});

app.get("/booking/:userId", verifyToken, async (req, res) => {
  const { userId } = req.params;
  console.log(userId,'userId');
  const result = await bookingCollection.find({ userId: userId }).toArray();
  // console.log(result,'result');
  res.send(result);
});

app.post("/booking", verifyToken, async (req, res) => {
  const bookingData = req.body;
  console.log(bookingData,'bookingData');
  const result = await bookingCollection.insertOne(bookingData);
  console.log(result,'result');
  res.send(result);
});

app.get("/destinations", async (req, res) => {
  const result = await destinationCollection.find().toArray();
  res.send(result);
});

app.get("/destinations/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const result = await destinationCollection.findOne({
    _id: new ObjectId(id),
  });
  console.log(result, "result");
  res.send(result);
});

app.post("/add-destination", verifyToken, async (req, res) => {
  const destinationData = req.body;
  console.log(destinationData);
  const result = await destinationCollection.insertOne(destinationData);
  res.send(result);
});

app.patch("/destinations/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const result = await destinationCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedData },
  );
  res.send(result);
});

app.delete("/destinations/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const result = await destinationCollection.deleteOne({
    _id: new ObjectId(id),
  });
  res.send(result);
});
// await client.connect();

// export async function disconnectFromMongoDB() {
//   //   await client.close();
// }

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// connectToMongoDB();
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
export default app;
