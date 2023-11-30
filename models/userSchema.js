const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
  },
  authType: { type: String, default: "local" },
  thirdPartyId: String,
});

UserSchema.plugin(passportLocalMongoose, {
  usernameField: "username",
});

module.exports = mongoose.model("User", UserSchema);
