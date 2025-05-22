const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URI
const uri = process.env.MONGODB_URI;

// Create a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Database connection function
async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    const db = client.db("greenGarden");
    return {
      tipsCollection: db.collection("tips"),
      usersCollection: db.collection("users")
    };
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
}

app.get('/', (req, res) => {
  res.send('Green Garden API is running!');
});

// Start server and connect to DB
async function startServer() {
  try {
    const { tipsCollection, usersCollection } = await connectToDatabase();

    // Tips Routes
    app.get('/api/tips', async (req, res) => {
      try {
        const tips = await tipsCollection.find({}).toArray();
        res.json(tips);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/tips/:id', async (req, res) => {
      try {
        const id = req.params.id;
        let tip = await tipsCollection.findOne({ id: parseInt(id) });
        if (!tip) {
          try {
            tip = await tipsCollection.findOne({ _id: new ObjectId(id) });
          } catch {}
        }
        if (!tip) return res.status(404).json({ message: "Tip not found" });
        res.json(tip);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/tips', async (req, res) => {
      try {
        const newTip = req.body;
        const result = await tipsCollection.insertOne(newTip);
        res.status(201).json({ success: true, insertedId: result.insertedId, ...newTip });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.put('/api/tips/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updatedTip = req.body;
        let result;

        if (!isNaN(parseInt(id))) {
          result = await tipsCollection.updateOne({ id: parseInt(id) }, { $set: updatedTip });
        } else {
          result = await tipsCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedTip });
        }

        if (result.matchedCount === 0) return res.status(404).json({ message: "Tip not found" });
        res.json({ success: true, message: "Tip updated successfully" });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.delete('/api/tips/:id', async (req, res) => {
      try {
        const id = req.params.id;
        let result;

        if (!isNaN(parseInt(id))) {
          result = await tipsCollection.deleteOne({ id: parseInt(id) });
        } else {
          result = await tipsCollection.deleteOne({ _id: new ObjectId(id) });
        }

        if (result.deletedCount === 0) return res.status(404).json({ message: "Tip not found" });
        res.json({ success: true, message: "Tip deleted successfully" });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // User Routes
    app.get('/api/users', async (req, res) => {
      try {
        const users = await usersCollection.find({}).toArray();
        res.json(users);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/users/:id', async (req, res) => {
      try {
        const id = req.params.id;
        let user = await usersCollection.findOne({ id: parseInt(id) });
        if (!user) {
          try {
            user = await usersCollection.findOne({ _id: new ObjectId(id) });
          } catch {}
        }
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Registration (without bcrypt)
    app.post('/api/register', async (req, res) => {
      try {
        const { email, password, name } = req.body;
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists with this email' });

        const newUser = { email, password, name, createdAt: new Date() };
        const result = await usersCollection.insertOne(newUser);
        res.status(201).json({ success: true, message: 'User registered successfully', userId: result.insertedId });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Login (without bcrypt)
    app.post('/api/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        const user = await usersCollection.findOne({ email });

        if (!user || user.password !== password) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.json({
          success: true,
          message: 'Login successful',
          user: {
            id: user._id,
            name: user.name,
            email: user.email
          }
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/users', async (req, res) => {
      try {
        const newUser = req.body;
        const result = await usersCollection.insertOne(newUser);
        res.status(201).json({ success: true, insertedId: result.insertedId, ...newUser });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.put('/api/users/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updatedUser = req.body;
        let result;

        if (!isNaN(parseInt(id))) {
          result = await usersCollection.updateOne({ id: parseInt(id) }, { $set: updatedUser });
        } else {
          result = await usersCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedUser });
        }

        if (result.matchedCount === 0) return res.status(404).json({ message: "User not found" });
        res.json({ success: true, message: "User updated successfully" });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.delete('/api/users/:id', async (req, res) => {
      try {
        const id = req.params.id;
        let result;

        if (!isNaN(parseInt(id))) {
          result = await usersCollection.deleteOne({ id: parseInt(id) });
        } else {
          result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
        }

        if (result.deletedCount === 0) return res.status(404).json({ message: "User not found" });
        res.json({ success: true, message: "User deleted successfully" });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer();

process.on('SIGINT', async () => {
  await client.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});
