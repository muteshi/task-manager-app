const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../../src/models/user");
const Task = require("../../src/models/task");

const newUserId = new mongoose.Types.ObjectId();
const newUser = {
  _id: newUserId,
  name: "Sara",
  email: "sara@gmail.com",
  password: "12345678",
  tokens: [
    {
      token: jwt.sign({ _id: newUserId }, process.env.JWT_SECRET),
    },
  ],
};

const newUser2Id = new mongoose.Types.ObjectId();
const newUser2 = {
  _id: newUser2Id,
  name: "Msangi",
  email: "msangi@gmail.com",
  password: "12345678",
  tokens: [
    {
      token: jwt.sign({ _id: newUser2Id }, process.env.JWT_SECRET),
    },
  ],
};

const newTask1 = {
  _id: new mongoose.Types.ObjectId(),
  description: "First testing task",
  completed: false,
  owner: newUserId,
};

const newTask2 = {
  _id: new mongoose.Types.ObjectId(),
  description: "Second testing task",
  completed: true,
  owner: newUserId,
};
const newTask3 = {
  _id: new mongoose.Types.ObjectId(),
  description: "Third testing task",
  completed: true,
  owner: newUser2Id,
};

const setUpDB = async () => {
  await User.deleteMany();
  await Task.deleteMany();
  await new User(newUser).save();
  await new User(newUser2).save();
  await new Task(newTask1).save();
  await new Task(newTask2).save();
  await new Task(newTask3).save();
};

module.exports = {
  newUserId,
  newTask1,
  newTask2,
  newTask3,
  newUser2,
  newUser,
  setUpDB,
};
