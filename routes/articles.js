var express = require("express");
var router = express.Router();
const isLoggedIn = require("./auth").isLoggedIn;
const Article = require("../models/articleSchema");
const UserProfile = require("../models/userProfileSchema");
let articles = [
  { id: 0, author: "Mack", body: "Post 1" },
  { id: 1, author: "Jack", body: "Post 2" },
  { id: 2, author: "Zack", body: "Post 3" },
];

// const getArticles = (req, res) => res.send(articles);

// const getArticle = (req, res) => res.send(articles[req.params.id]);

// const addArticle = (req, res) => {
//   let post = req.body;
//   let article = { id: articles.length, author: post.author, body: post.body };
//   articles.push(article);
//   res.send(articles);
// };

router.get("/articles/:id?", isLoggedIn, async (req, res) => {
  try {
    // Fetch the logged-in user's profile
    const userProfile = await UserProfile.findOne({ user: req.user._id });
    if (!userProfile) return res.status(404).send("User profile not found");

    // Start with the logged-in user's followedUsers
    const authorIds = userProfile.followedUsers;

    // Add the logged-in user's ID to the list
    authorIds.push(req.user._id);

    // Fetch articles where the author is in the list of followedUsers + the logged-in user
    const articles = await Article.find({
      author: { $in: authorIds },
    }).populate("author");

    res.json({ articles: articles.map((article) => article.toJSON()) });
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).send(error.message);
  }
  // try {
  //   let articles;
  //   if (req.params.id) {
  //     if (isNaN(req.params.id)) {
  //       const user = await User.findOne({ username: req.params.id });
  //       if (!user) return res.status(404).send("User not found");
  //       articles = await Article.find({ author: user._id }).populate("author");
  //     } else {
  //       articles = await Article.find({ pid: req.params.id }).populate(
  //         "author"
  //       );
  //     }
  //   } else {
  //     articles = await Article.find({ author: req.user._id }).populate(
  //       "author"
  //     );
  //   }
  //   res.json({ articles: articles.map((article) => article.toJSON()) });
  // } catch (error) {
  //   res.status(500).send(error.message);
  // }
});

router.post("/article", isLoggedIn, async (req, res) => {
  try {
    const count = await Article.countDocuments({ author: req.user._id });

    const article = new Article({
      author: req.user._id,
      text: req.body.text,
      title: req.body.title,
      pid: count + 1,
      comments: [],
    });

    await article.save();
    res.status(201).json({ newArticle: article });
  } catch (error) {
    console.error("Error creating article:", error);
    res.status(500).send(error.message);
  }
});

router.put("/articles/:id", isLoggedIn, async (req, res) => {
  try {
    const article = await Article.findOne({ _id: req.params.id });
    if (!article) return res.status(404).send("Article not found");

    if (req.body.comment !== undefined) {
      if (req.body.commentId === undefined || req.body.commentId === -1) {
        article.comments.push({
          commenter: req.body.comment.commenter,
          text: req.body.comment.text,
          date: new Date(),
        });
      } else {
        if (article.comments[req.body.commentId]) {
          article.comments[req.body.commentId].text = req.body.comment.text;
        } else {
          return res.status(404).send("Comment not found");
        }
      }
    } else {
      if (!article.author.equals(req.user._id)) {
        return res.status(403).send("Forbidden");
      }
      article.text = req.body.text;
      article.title = req.body.title;
      article.image = req.body.image;
    }

    await article.save();
    res.json({ articles: [article.toJSON()] });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// router.get("/", isLoggedIn, getArticles);
// router.get("/:id", isLoggedIn, getArticle);
// router.post("/", isLoggedIn, addArticle);

module.exports = router;
