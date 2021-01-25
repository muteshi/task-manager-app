const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user");
const { newUser, newUserId, setUpDB } = require("./fixtures/db");

beforeEach(setUpDB);

test("Should register new user", async () => {
  const response = await request(app)
    .post("/users")
    .send({
      name: "Muteshi",
      email: "muteshi@gmail.com",
      password: "HiiNipass",
    })
    .expect(201);
  //expect that the db was changed correctly
  const user = await User.findById(response.body.newUser._id);
  expect(user).not.toBeNull();
  //assertions about response
  expect(response.body).toMatchObject({
    newUser: {
      name: "Muteshi",
      email: "muteshi@gmail.com",
    },
    token: user.tokens[0].token,
  });
  //passwords should not be plain
  expect(user.password).not.toBe("HiiNipass");
});

test("Should login user", async () => {
  const res = await request(app)
    .post("/users/login")
    .send({
      email: newUser.email,
      password: newUser.password,
    })
    .expect(200);
  //user second token matches token in response
  const user = await User.findById(newUserId);
  expect(user.tokens[1].token).toBe(res.body.token);
});

test("Should not login non existent user", async () => {
  await request(app)
    .post("/users/login")
    .send({
      email: "mimi@gmail.com",
      password: "mimi543",
    })
    .expect(400);
});

test("Should get profile for user", async () => {
  await request(app)
    .get("/users/profile")
    .set("Authorization", `Bearer ${newUser.tokens[0].token}`)
    .send()
    .expect(200);
});

test("Should not get profile for unauthenticated  user", async () => {
  await request(app).get("/users/profile").send().expect(401);
});

test("Should delete account for  user", async () => {
  const res = await request(app)
    .delete("/users/delete-account")
    .set("Authorization", `Bearer ${newUser.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(res.body._id);

  expect(user).toBeNull();
});

test("Should not delete account for unauthenticated user", async () => {
  await request(app).delete("/users/delete-account").send().expect(401);
});

test("Should upload avatar image", async () => {
  await request(app)
    .post("/users/profile/avatar")
    .set("Authorization", `Bearer ${newUser.tokens[0].token}`)
    .attach("avatar", "tests/fixtures/profile-pic.jpg")
    .expect(200);

  const user = await User.findById(newUserId);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test("Should update valid user fields", async () => {
  await request(app)
    .patch("/users/edit-account")
    .set("Authorization", `Bearer ${newUser.tokens[0].token}`)
    .send({ name: "Paul Muteshi" })
    .expect(200);
  const user = await User.findById(newUserId);
  expect(user.name).toEqual("Paul Muteshi");
});

test("Should not update invalid user fields", async () => {
  await request(app)
    .patch("/users/edit-account")
    .set("Authorization", `Bearer ${newUser.tokens[0].token}`)
    .send({ location: "Kitengela" })
    .expect(400);
});
