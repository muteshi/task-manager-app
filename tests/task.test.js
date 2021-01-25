const request = require("supertest");
const app = require("../src/app");
const Task = require("../src/models/task");

const { newUser, newUser2, newTask1, setUpDB } = require("./fixtures/db");

beforeEach(setUpDB);

test("Should create task for user", async () => {
  const res = await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${newUser.tokens[0].token}`)
    .send({ description: "From testing" })
    .expect(201);

  const task = await Task.findById(res.body._id);

  expect(task).not.toBeNull();
  expect(task.completed).toEqual(false);
});

test("Should get tasks for user one", async () => {
  const res = await request(app)
    .get("/tasks")
    .set("Authorization", `Bearer ${newUser.tokens[0].token}`)
    .send()
    .expect(200);

  expect(res.body.length).toEqual(2);
});

test("Should not delete tasks of another user", async () => {
  const res = await request(app)
    .delete(`/tasks/${newTask1._id}`)
    .set("Authorization", `Bearer ${newUser2.tokens[0].token}`)
    .send()
    .expect(404);

  const task = await Task.findById(newTask1._id);
  expect(task).not.toBeNull();
});
