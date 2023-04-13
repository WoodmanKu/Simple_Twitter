const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const session = require('express-session');
const mime = require('mime');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
fs = require('fs');
const { Binary } = require('mongodb');

//openai support for rating chat
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);

async function generateCompletion(prompt) {
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    temperature: 0,
    max_tokens: 2048,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  });

  return response.data.choices[0].text;
}

const app = express();
const port = 3000;
const url = 'mongodb+srv://KW:notpassword@cluster0.4tieh42.mongodb.net/Test?retryWrites=true&w=majority';

app.use(session({
  secret: 'okok',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Allow cookie transmission over non-HTTPS connections
}));

// app.use(express.static('public', {
//   setHeaders: function(res, path) {
//     res.setHeader('Content-Type', mime.getType(path));
//   }
// }));
app.use(express.static(__dirname + '/public')); //Serves resources from public folder


app.use(express.static(__dirname + '/views'));
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    client.connect().then(() => {
      console.log("Connected successfully to MongoDB server");
    }).catch((err) => {
      console.log("Error:", err.stack);
  });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/page/login.html');
});

app.get('/signup', (req, res) => {
  res.sendFile(__dirname + '/page/signup.html');
});

app.get('/404', (req, res) => {
  res.sendFile(__dirname + '/page/404.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/page/login.html');
});

app.get('/main', async (req, res) => {
  try {
    if (!req.session.user) { // Check if the user is not logged in
      res.redirect('/login'); // Redirect to the login page if the user is not logged in
      return;
    }

    const db = client.db('Test');
    const userCollection = db.collection('User');
    const postCollection = db.collection('Post');
    const commentCollection = db.collection('Comments');

    const currentUser = await userCollection.findOne({ username: req.session.user.username });

    const followingUsernames = currentUser.following || [];

    // Add the current user's username to the list of usernames

    const postQuery = [
      {
        $match: {
          username: { $in: [...followingUsernames, currentUser.username] }
        }
      },
      {
        $lookup: {
          from: 'Comments',
          localField: '_id',
          foreignField: 'postId',
          as: 'comments'
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ];
    
    const posts = await postCollection.aggregate(postQuery).toArray();
    //console.log(posts)

    const repostedPostIds = currentUser.repost || [];
    const repostedPostQuery = { _id: { $in: repostedPostIds } };
    const repostPosts = await postCollection.find(repostedPostQuery).toArray();
    const originalPostIds = repostPosts.map(post => post.originalPostId);
    const postIds = Array.from(new Set(originalPostIds));
    const repostQuery = {
      _id: { $in: postIds.map(postId => new ObjectId(postId)) }
    };

    const reposts = await postCollection.find(repostQuery).toArray();

    console.log(followingUsernames)
    const reposted = [];
    const followingUsers = await userCollection.find({ username: { $in: followingUsernames } }).toArray();
    for (const followingUser of followingUsers) {
      const followingReposted = followingUser.repost || [];
      reposted.push(...followingReposted);
    }

    const frepostedPostQuery = { _id: { $in: reposted } };
    const frepostPosts = await postCollection.find(frepostedPostQuery).toArray();
    const foriginalPostIds = frepostPosts.map(post => post.originalPostId);
    const fpostIds = Array.from(new Set(foriginalPostIds));
    const frepostQuery = {
      _id: { $in: fpostIds.map(fpostId => new ObjectId(fpostId)) }
    };
    
    const freposts = await postCollection.find(frepostQuery).toArray();
    
    for (let i = 0; i < freposts.length; i++) {
      const frepost = freposts[i];
      const frepostPost = frepostPosts.find(post => post.originalPostId === frepost._id.toString());
    
      if (frepostPost) {
        frepost.author = frepostPost.author;
      }
    }
    
    // console.log(freposts);


    
    
    
    const query = req.query.q;
    let users = [];

    if (query) {
      const userQuery = {
        $or: [
          { _id: query },
          { username: { $regex: query, $options: 'i' } }
        ]
      };
      users = await userCollection.find(userQuery)
        .sort({ username: 1 })
        .toArray();
    }

    res.render('main', { currentUser, posts, freposts, users, query });

  } catch (err) {
    console.error('Error loading data:', err);
    res.status(500).send(err.message);
  }
});

app.get('/logout', (req, res) => {
  res.sendFile(__dirname + '/page/logout.html');
});

app.get('/signup_s', (req, res) => {
  res.sendFile(__dirname + '/page/signup_s.html');
});

app.get('/admin', async (req, res) => {
  try {
    if (!req.session.user && !user.isAdmin) { // Check if the user is not logged in
      res.redirect('/login'); // Redirect to the login page if the user is not logged in
      return;
    }
    const db = client.db('Test');
    const collection = db.collection('User');
    const users = await collection.find().toArray();
    res.render('admin', { users }); // Pass the 'users' variable to the 'admin' template
  } catch (err) {
    console.log("Error:", err.stack);
    res.sendStatus(500);
  }
});

app.get('/profile', async (req, res) => {
  if (!req.session.user) {
    res.redirect('/login');
    return;
  }

  try {
    const db = client.db('Test');
    const userCollection = db.collection('User');
    const postCollection = db.collection('Post');
    const user = await userCollection.findOne({ username: req.session.user.username });
    
    const postQuery = [
      {
        $match: {
          username: { $in: [user.username] }
        }
      },
      {
        $lookup: {
          from: 'Comments',
          localField: '_id',
          foreignField: 'postId',
          as: 'comments'
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ];
    
    const posts = await postCollection.aggregate(postQuery).toArray();


    const repostedPostIds = user.repost || [];
    const repostedPostQuery = { _id: { $in: repostedPostIds } };
    const repostPosts = await postCollection.find(repostedPostQuery).toArray();
    const originalPostIds = repostPosts.map(post => post.originalPostId);
    const postIds = Array.from(new Set(originalPostIds));
    const repostQuery = {
      _id: { $in: postIds.map(postId => new ObjectId(postId)) }
    };
    const reposts = await postCollection.find(repostQuery).toArray();
    
    
    console.log(user)
    //console.log(reposts)
    //console.log(posts)
    res.render('profile', { user,reposts,posts});
  } catch (err) {
    console.error(err);
    res.redirect('/profile');
  }
});

app.get('/create', (req, res) => {
  if (!req.session.user) { // Check if the user is not logged in
    res.redirect('/login'); // Redirect to the login page if the user is not logged in
    return;
  }
  res.sendFile(__dirname + '/page/create.html');
});

app.get('/ForUser', async (req, res) => {
  const db = client.db('Test');
  const postCollection = db.collection('Post');
  const postQuery = [
    {
      $lookup: {
        from: 'Comments',
        localField: '_id',
        foreignField: 'postId',
        as: 'comments'
      }
    },
    {
      $addFields: {
        sentimentRating: {
          $toInt: {
            $substr: [
              {
                $regexFind: {
                  input: {
                    $text: {
                      $search: "Rate the sentiment in this tweet from 1 to 10"
                    }
                  },
                  regex: /(?<=Rate the sentiment in this tweet from 1 to 10 where 1 for very negative\(Hate speech, Harrassment, Violence\),10 for very positive\(Inspirational, Motivational, Educational, Positive new and stories, Community-building\):\n\n)[\d]+/
                }
              },
              0,
              -1
            ]
          }
        }
      }
    },
    {
      $sort: {
        likeCount: -1,
        sentimentRating: -1
      }
    },
    {
      $limit: 10
    }
  ];
  const posts = await postCollection.aggregate(postQuery).toArray();
  res.render('ForUser', { posts });
});

app.post('/signup',
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('cpassword').notEmpty().withMessage('comfirm-password is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { username, password, cpassword } = req.body;
      if(password !== cpassword){
        return res.redirect('/signup?error=2');
      }
      const db = client.db('Test');
      const collection = db.collection('User');

      const existingUser = await collection.findOne({ username });
      if (existingUser) {
        return res.redirect('/signup?error=1');
      }
      const user = {
        username,
        username1: username,
        password,
        isAdmin: false,
        status: true,
        followers: [],
        following: [],
        posts: [],
        repost: []
      };
      const result = await collection.insertOne(user);

      res.redirect('/signup_s');
    } catch (err) {
      console.log("Error:", err.stack);
      res.sendStatus(500);
    }
  }
);

app.post('/login', async (req, res) => {
  try {
    const db = client.db('Test');
    const collection = db.collection('User');
    const user = await collection.findOne({ username: req.body.username, password: req.body.password });
    if (user) {
      req.session.user = { // Create the req.session.user object to store the logged-in user's data
        username: user.username,
        isAdmin: user.isAdmin,
        isActive: user.status
      };
      console.log('Logged in successfully:', req.session.user); // Log the value of req.session.user
      console.log(req.session.user.isActive)
      console.log(req.session.user.isAdmin)

      if (req.session.user.isAdmin) {
        res.redirect('/admin');
      } else if(req.session.user.isActive){
        res.redirect('/main');
      }else if(!req.session.user.isActive){
        res.redirect('/login?error=2');
      } 
    }else {
      res.redirect('/login?error=1');
    }
  } catch (err) {
    console.log("Error:", err.stack);
    res.sendStatus(500);
  }
});

app.post('/create', upload.single('photo'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('body').notEmpty().withMessage('Body is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const db = client.db('Test');
      const postCollection = db.collection('Post');
      const userCollection = db.collection('User');
      const { title, body } = req.body;

      const currentUser = req.session.user;

      if (!currentUser || !currentUser.username) {
        return res.status(401).json({ error: 'User not found' });
      }

      const prompt = `Rate the sentiment in this tweet from 1 to 10 where 1 for very negative(Hate speech, Harrassment, Violence),10 for very positive(Inspirational, Motivational, Educational, Positive new and stories, Community-building),notice you should return 1 integer only:\n\n1. "${body}"\n`;

      const sentiment = await generateCompletion(prompt);
      console.log('Sentiment rating: ', sentiment);

      const post = {
        title,
        body,
        sentiment,
        createdAt: new Date(),
        likecount: 0,
        userLike: 0,
        type: true,
        username: currentUser.username
      };

      if (req.file) {
        // Read the image file into a buffer
        const imageBuffer = fs.readFileSync(req.file.path);

        // Insert the image buffer into a document
        post.image = new Binary(imageBuffer);
      }

      const result = await postCollection.insertOne(post);
      //console.log(result);

      const postId = result.insertedId;
      //console.log(currentUser._id )
      //console.log(postId)

      await userCollection.updateOne(
        { username: currentUser.username },
        { $push: { posts: postId } }
      );

      res.redirect('/create?action=create_success');
    } catch (err) {
      console.log('Error:', err.stack);
      res.sendStatus(500);
    }
  }
);

app.put('/users/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const db = client.db('Test');
    const collection = db.collection('User');

    const query = { username };
    const update = { $set: { status: false } };
    const options = { returnOriginal: false };

    const result = await collection.findOneAndUpdate(query, update, options);

    if (!result.value) {
      // If no user was found with the provided username, return a 404 (Not Found) response
      console.log("no")
      return res.sendStatus(404);
    }
    // If the update was successful, return a 200 (OK) response with the updated user object
    
    res.status(200).json(result.value);
  } catch (error) {
    // If an error occurred during the update, return a 500 (Internal Server Error) response
    console.log(error)
    res.status(500).send(error);
  }
});

app.post('/like/:postId', async (req, res) => {
  console.log("like")
  try {
    const postId = new ObjectId(req.params.postId);
    const userId = req.session.user.username;
    console.log(userId)
    // Create a new MongoClient
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

    // Connect to the MongoDB server
    await client.connect();

    // Select the database and collection
    const db = client.db('Test');
    const postCollection = db.collection('Post');

    // Find the post by ID
    const post = await postCollection.findOne({ _id: postId });

    // Get the likes object for the current post, or create a new one if it doesn't exist
    const likes = post.likes || {};

    // Check if the user has already liked or disliked the post
    if (likes[userId] === 1) {
      throw new Error("User has already liked this post");
    } else if (likes[userId] === -1) {
      // User has disliked the post, so toggle their choice to like
      likes[userId] = 1;
      post.userLike = 1;
    } else {
      // User hasn't liked or disliked the post, so add their choice to the likes object
      likes[userId] = 1;
      post.userLike = 1;
    }

    // Update the post document with the new likes object and counts
    const updatedPost = await postCollection.updateOne(
      { _id: postId },
      { $set: { likes: likes, userLike: post.userLike }, $inc: { likeCount: likes[userId] === 1 ? 1 : likes[userId] === -1 ? -1 : 0 } }
    );

    // Close the client connection
    await client.close();

    res.redirect('/main');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

app.post('/dislike/:postId', async (req, res) => {
  console.log("dislike")
  try {
    const postId = new ObjectId(req.params.postId);
    const userId = req.session.user.username;

    // Create a new MongoClient
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

    // Connect to the MongoDB server
    await client.connect();

    // Select the database and collection
    const db = client.db('Test');
    const postCollection = db.collection('Post');

    // Find the post by ID
    const post = await postCollection.findOne({ _id: postId });

    // Get the likes object for the current post, or create a new one if it doesn't exist
    const likes = post.likes || {};

    // Check if the user has already liked or disliked the post
    if (likes[userId] === -1) {
      throw new Error("User has already disliked this post");
    } else if (likes[userId] === 1) {
      // User has liked the post, so toggle their choice to dislike
      likes[userId] = -1;
      post.userLike = -1;
    } else {
      // User hasn't liked or disliked the post, so add their choice to the likes object
      likes[userId] = -1;
      post.userLike = -1;
    }

    // Update the post document with the new likes object and counts
    const updatedPost = await postCollection.updateOne(
      { _id: postId },
      { $set: { likes: likes, userLike: post.userLike }, $inc: { likeCount: likes[userId] === -1 ? -1 : likes[userId] === 1 ? 1 : 0 } }
    );

    // Close the client connection
    await client.close();

    res.redirect('/main');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

app.post('/comment/:postId', async (req, res) => {
  try {
    const db = client.db('Test');
    const postCollection = db.collection('Post');
    const commentCollection = db.collection('Comments'); // Add a new collection for comments
    const user = req.session.user;
    const postId = new ObjectId(req.params.postId);
    const { comment } = req.body;
    const newComment = {
      username: user.username,
      content: comment,
      postId: postId,
      createdAt: new Date(),
    };
    const result = await commentCollection.insertOne(newComment); // Save the comment to the Comments collection
    await postCollection.updateOne(
      { _id: postId },
      { $set: { type: false }, $push: { comments: result.insertedId } } // Use $set operator to update type field and $push operator to add comment ID to comments array
    );
    res.redirect('/main'); // Redirect to the main page after leaving a comment
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

app.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    const users = await User.find({ username: { $regex: query, $options: 'i' } });
    res.render('main', { users, searched: true, req }); // Pass the req object to the template
  } catch (err) {
    console.log("Error:", err.stack);
    res.sendStatus(500);
  }
});

app.post('/edit-profile', async (req, res) => {
  try {
    const db = client.db('Test');
    const userCollection = db.collection('User');
    const { name, password, confirmPassword } = req.body;
    const user = await db.collection('User').findOne({ username: req.session.user.username });

    // Check if new name is different from current name and update it
    if (name !== user.username1) {
      user.username1 = name;
      await db.collection('User').updateOne({ username: req.session.user.username }, { $set: { username1: name } });
     }

    // Check if new password is different from current password
    if (password && password !== '') {
      // Check if confirm password matches new password
      if (password !== confirmPassword) {
        req.flash('error', 'Confirm password does not match');
        return res.redirect('/edit-profile');
      }

      // Save old password as previousPassword and update user password
      const oldPassword = user.password;
      user.previousPassword = oldPassword;
      user.password = password;
      await db.collection('User').updateOne({ username: req.session.user.username }, { $set: { previousPassword: oldPassword, password: password } });
    }

    console.log("success")
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    console.log("fail")
    res.redirect('/edit-profile');
  }
});

app.post('/retweet', async (req, res) => {
  try {
    if (!req.session.user) {
      res.redirect('/login');
      return;
    }

    const db = client.db('Test');
    const postCollection = db.collection('Post');
    const userCollection = db.collection('User'); // Initialize userCollection variable
    const currentUsername = req.session.user.username;
    const postId = req.body.postId;

    //console.log(req.body)
    //console.log(postId)

    // Find the original post being retweeted
    const originalPost = await postCollection.findOne({ _id: new ObjectId(postId) });

    // Create a new post with the retweet content and reference to the original post
    const retweet = {
      content: `RT @${originalPost.author}: ${originalPost.content}`,
      author: currentUsername,
      originalPostId: postId
    };

    // Insert the new retweet post into the database
    const result = await postCollection.insertOne(retweet);

    // Add the new post to the user's repost
    await userCollection.updateOne(
      { username: currentUsername },
      { $addToSet: { repost: result.insertedId } }
    );

    res.redirect('/main');
    console.log("Retweet successful");
  } catch (err) {
    console.error('Error retweeting post:', err);
    res.status(500).send(err.message);
  }
});

app.post('/follow', async (req, res) => {
  try {
    if (!req.session.user) {
      res.redirect('/login');
      return;
    }

    const db = client.db('Test');
    const userCollection = db.collection('User');
    const currentUsername = req.session.user.username;
    const usernameToFollow = req.body.username;

    // Add the user being followed to the current user's following list
    await userCollection.updateOne(
      { username: currentUsername },
      { $addToSet: { following: usernameToFollow } }
    );

    // Add the current user to the user being followed's followers list
    await userCollection.updateOne(
      { username: usernameToFollow },
      { $addToSet: { followers: currentUsername } }
    );

    res.redirect('/main');
    console.log("suc")
  } catch (err) {
    console.error('Error following user:', err);
    res.status(500).send(err.message);
  }
});

app.post('/delete/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).send('Post not found');
    }
    await post.remove();
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

process.on('SIGINT', () => {
  client.close().then(() => {
    console.log("Closed MongoDB client connection");
    process.exit();
  }).catch((err) => {
    console.log("Error:", err.stack);
    process.exit();
  });
});

app.listen(port, () => {
  console.log("Server-connect...");
});