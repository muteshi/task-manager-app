const express = require("express");
const auth = require("../middleware/auth");
const User = require("../models/user");
const sharp = require("sharp");
const router = new express.Router();
const multer = require("multer");
const {
  sendWelcomeEmail,
  sendAccountDeleteEmail,
} = require("../email/account");

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpeg|jpg|png)$/)) {
      return cb(new Error("Please upload a valid image"));
    }
    cb(undefined, true);
  },
});

router.post("/users", async (req, res) => {
  const newUser = new User(req.body);
  try {
    await newUser.save();
    sendWelcomeEmail(newUser.email, newUser.name);
    const token = await newUser.generateUserAuthToken();
    res.status(201).send({ newUser, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.loginUser(req.body.email, req.body.password);
    const token = await user.generateUserAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send();
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((t) => t.token !== req.token);

    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

router.post("/users/logout-all", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

router.get("/users/profile", auth, async (req, res) => {
  res.send(req.user);
});

router.get("/users/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send();
    }
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch("/users/edit-account", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));

    await req.user.save();

    res.send(req.user);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete("/users/delete-account", auth, async (req, res) => {
  try {
    const user = req.user;
    await user.remove();
    sendAccountDeleteEmail(user.email, user.name);
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post(
  "/users/profile/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();

    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete("/users/profile/delete-avatar", auth, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (error) {
    res.status(404).send();
  }
});

module.exports = router;
