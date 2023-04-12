// const express = require('express');
// const { MongoClient } = require('mongodb');
// const bodyParser = require('body-parser');
// const { body, validationResult } = require('express-validator');
// const { ObjectId } = require('mongodb');


// const app = express();
// const port = 3000;
// const url = 'mongodb+srv://KW:notpassword@cluster0.4tieh42.mongodb.net/Test?retryWrites=true&w=majority';

// // 连接到 MongoDB 数据库
// const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
// client.connect().then(() => {
//   console.log("Connected successfully to MongoDB server");
// }).catch((err) => {
//   console.log("Error:", err.stack);
// });

// // 使用 body-parser 中间件
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());
// app.set('view engine', 'ejs');


// // 处理 GET 请求
// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/page/login.html');
// });

// app.get('/signup', (req, res) => {
//   res.sendFile(__dirname + '/page/signup.html');
// });

// app.get('/login', (req, res) => {
//   res.sendFile(__dirname + '/page/login.html');
// });

// app.get('/main', async (req, res) => {
//   try {
//     const db = client.db('Test');
//     const userCollection = db.collection('User');
//     const postCollection = db.collection('Post');

//     const query = req.query.q; // get the search query from the URL query string
//     let users, posts;
//     if (query) {
//       // Search for users by ID or username
//       users = await userCollection.find({ $or: [
//         { _id: query }, // search for exact ID match
//         { username: { $regex: query, $options: 'i' } } // search for username containing the query (case-insensitive)
//       ]}).toArray();

//       // Search for posts by title or content
//       posts = await postCollection.find({ $or: [
//         { title: { $regex: query, $options: 'i' } }, // search for title containing the query (case-insensitive)
//         { content: { $regex: query, $options: 'i' } } // search for content containing the query (case-insensitive)
//       ]}).toArray();
//     } else {
//       // Load all users and posts if no search query is provided
//       users = await userCollection.find().toArray();
//       posts = await postCollection.find().toArray();
//     }

//     res.render('main', { users, posts }); // render the main page with the search or all users and posts
//   } catch (err) {
//     console.error('Error loading data:', err);
//     res.status(500).send('Error loading data');
//   }
// });


// app.get('/logout', (req, res) => {
//   res.sendFile(__dirname + '/page/logout.html');
// });

// app.get('/signup_s', (req, res) => {
//   res.sendFile(__dirname + '/page/signup_s.html');
// });

// app.get('/admin', async (req, res) => {
//   try {
//     const db = client.db('Test');
//     const collection = db.collection('User');
//     const users = await collection.find().toArray();
//     res.render('admin', { users }); // Pass the 'users' variable to the 'admin' template
//   } catch (err) {
//     console.log("Error:", err.stack);
//     res.sendStatus(500);
//   }
// });

// app.get('/profile', (req, res) => {
//   res.sendFile(__dirname + '/page/profile.html');
// });

// app.get('/create', (req, res) => {
//   res.sendFile(__dirname + '/page/create.html');
// });

// // 处理 POST 请求 signup
// app.post('/signup',
//   body('username').notEmpty().withMessage('Username is required'),
//   body('password').notEmpty().withMessage('Password is required'),
//   async (req, res) => {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//       }

//       const db = client.db('Test');
//       const collection = db.collection('User');
//       const { username, password } = req.body;
//       const existingUser = await collection.findOne({ username });
//       if (existingUser) {
//         return res.redirect('/signup?error=1');
//       }
//       const user = {
//         username,
//         password,
//         isAdmin: false,
//         status: true
//       };
//       const result = await collection.insertOne(user);
//       console.log(result);
//       res.redirect('/signup_s');
//     } catch (err) {
//       console.log("Error:", err.stack);
//       res.sendStatus(500);
//     }
//   }
// );

// // 处理 POST 请求 login
// app.post('/login', async (req, res) => {
//   try {
//     const db = client.db('Test');
//     const collection = db.collection('User');
//     const user = await collection.findOne({ username: req.body.username, password: req.body.password });
//     if (user) {
//       req.user = {}; // Create the req.user object first
//       req.user.username = user.username;
//       req.user.isAdmin = user.isAdmin;
//       if (user.isAdmin) {
//         res.redirect('/admin');
//       } else {
//         res.redirect('/main');
//       }
//     } else {
//       res.redirect('/login?error=1');
//     }
//   } catch (err) {
//     console.log("Error:", err.stack);
//     res.sendStatus(500);
//   }
// });

// app.post('/create',

//   body('title').notEmpty().withMessage('Title is required'),
//   body('body').notEmpty().withMessage('Body is required'),
//   async (req, res) => {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//       }

//       const db = client.db('Test');
//       const collection = db.collection('Post'); // Use the "Post" collection instead of "User"
//       const { title, body } = req.body;
//       const post = {
//         title,
//         body,
//         createdAt: new Date() // Add a createdAt timestamp
//       };
//       const result = await collection.insertOne(post);
//       console.log(result);
//       res.redirect('/create?action=create_success');
//     } catch (err) {
//       console.log("Error:", err.stack);
//       res.sendStatus(500);
//     }
//   }
// );


// app.put('/admin/users/123', async (req, res) => {
//   try {
//     const db = client.db('Test');
//     const collection = db.collection('User');
//     const result = await collection.updateOne({ username: req.params.username }, { $set: { status: false } });
//     if (result.modifiedCount === 1) {
//       res.sendStatus(200); // If the update is successful, send a 200 OK response
//     } else {
//       res.sendStatus(404); // If the user is not found, send a 404 Not Found response
//     }
//   } catch (err) {
//     console.log("Error:", err.stack);
//     res.sendStatus(500); // If there's an error, send a 500 Internal Server Error response
//   }
// });

// app.post('/edit-profile', function(req, res) {
//   // Check if the new password and confirm password match
//   if (req.body.password !== req.body.confirmPassword) {
//     return res.status(400).send('Passwords do not match');
//   }

//   // Update the user's profile with the new name and password
//   User.findById(req.user._id, function(err, user) {
//     if (err) {
//       console.error('Error updating user profile:', err);
//       return res.status(500).send('Error updating user profile');
//     }

//     user.name = req.body.name;
//     user.password = req.body.password;

//     user.save(function(err) {
//       if (err) {
//         console.error('Error updating user profile:', err);
//         return res.status(500).send('Error updating user profile');
//       }

//       res.redirect('/profile');
//     });
//   });
// });

// app.post('/like/:postId', async (req, res) => {
//   try {
//     const db = client.db('Test');
//     const postCollection = db.collection('Post');

//     const postId = new ObjectId(req.params.postId);

//     // Find the post by ID
//     const post = await postCollection.findOne({ _id: postId });

//     // Decrement the like counter
//     const updatedPost = await postCollection.updateOne(
//       { _id: postId },
//       { $inc: { likes: 1 } }
//     );

//     res.redirect('/main');
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Internal server error');
//   }
// });

// app.post('/dislike/:postId', async (req, res) => {
//   try {
//     const db = client.db('Test');
//     const postCollection = db.collection('Post');

//     const postId = new ObjectId(req.params.postId);

//     // Find the post by ID
//     const post = await postCollection.findOne({ _id: postId });

//     // Decrement the like counter
//     const updatedPost = await postCollection.updateOne(
//       { _id: postId },
//       { $inc: { unlikes: -1 } }
//     );

//     res.redirect('/main');
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Internal server error');
//   }
// });

// app.post('/comment/:postId', async (req, res) => {
//   try {

//     const db = client.db('Test');
//     const postCollection = db.collection('Post');

//     const postId = new ObjectId(req.params.postId);
//     const { comment } = req.body;

//     // Create a new comment document
//     const newComment = {
//       comment,
//       createdAt: new Date(),
//     };

//     // Insert the new comment document into the Comments collection
//     const result = await postCollection.insertOne(newComment);
//     console.log(newComment)
//     // Update the post document to include the new comment ID
//     await postCollection.updateOne(
//       { _id: postId },
//       { $push: { comments: result.insertedId } }
//     );

//     res.redirect('/main');
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Internal server error');
//   }
// });



// // 关闭 MongoDB 数据库连接
// process.on('SIGINT', () => {
//   client.close().then(() => {
//     console.log("Closed MongoDB client connection");
//     process.exit();
//   }).catch((err) => {
//     console.log("Error:", err.stack);
//     process.exit();
//   });
// });


// // 启动服务器
// app.listen(port, () => {
//   console.log("Server-connect...");
// });