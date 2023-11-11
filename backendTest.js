const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("./index"); // Import your Express app
const { expect } = chai;
const User = require("./models/userSchema");
const UserProfile = require("./models/userProfileSchema");

chai.use(chaiHttp);

describe("Backend Tests", function () {
  let testUserId = "testUser" + Date.now();
  let cookie = "";
  let articleId;
  let agent = chai.request.agent(app);

  before(async function () {});

  after(async function () {
    try {
      await User.deleteOne({ username: testUserId });

      await UserProfile.deleteOne({ username: testUserId });

      console.log("Cleanup successful: Test user removed from the database.");
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  });

  it("should register a new user", function (done) {
    let user = {
      username: testUserId,
      email: "hello@gmail.com",
      password: "12345678",
      phone: 1231231234,
      zipcode: 77005,
    };
    agent
      .post("/register")
      .send(user)
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body.result).to.equal("success");
        expect(res.body.username).to.equal(testUserId);
        done();
      });
  });

  it("should log in as the registered user", function (done) {
    agent
      .post("/login")
      .send({
        username: testUserId,
        password: "12345678",
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.result).to.equal("success");
        cookie = res.headers["set-cookie"]
          .find((cookie) => cookie.startsWith("sid="))
          .split(";")[0];
        done();
      });
  });

  it("should create a new article", function (done) {
    agent
      .post("/article")
      .set("Cookie", cookie)
      .send({
        text: "This is a test article",
        title: "Main test article",
      })
      .end((err, res) => {
        expect(res).to.have.status(201);
        articleId = res.body.newArticle.pid; // Save the article ID for later tests
        done();
      });
  });

  it("should update the status headline", function (done) {
    agent
      .put(`/headline`)
      .set("Cookie", cookie)
      .send({
        headline: "Updated headline",
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.headline).to.equal("Updated headline");
        done();
      });
  });

  it("should log out the user", function (done) {
    agent
      .put("/logout")
      .set("Cookie", cookie)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });
});
