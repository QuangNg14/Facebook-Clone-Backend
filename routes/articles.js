var express = require("express");
var router = express.Router();
const isLoggedIn = require("./auth").isLoggedIn;
const Article = require("../models/articleSchema");

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
    let articles;
    if (req.params.id) {
      if (isNaN(req.params.id)) {
        const user = await User.findOne({ username: req.params.id });
        if (!user) return res.status(404).send("User not found");
        articles = await Article.find({ author: user._id }).populate("author");
      } else {
        articles = await Article.find({ pid: req.params.id }).populate(
          "author"
        );
      }
    } else {
      articles = await Article.find({ author: req.user._id }).populate(
        "author"
      );
    }
    res.json({ articles: articles.map((article) => article.toJSON()) });
  } catch (error) {
    res.status(500).send(error.message);
  }
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
    const article = await Article.findOne({ pid: req.params.id });
    if (!article) return res.status(404).send("Article not found");

    if (!article.author.equals(req.user._id)) {
      return res.status(403).send("Forbidden");
    }

    if (req.body.commentId !== undefined) {
      if (req.body.commentId === -1) {
        article.comments.push(req.body.text);
      } else {
        article.comments[req.body.commentId] = req.body.text;
      }
    } else {
      article.text = req.body.text;
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
