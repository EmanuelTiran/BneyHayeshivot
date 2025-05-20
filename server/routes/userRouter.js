const userService = require("../services/userServices");

const express = require("express"),
  router = express.Router();


router.get("/",  async (req, res) => {
  const cars = await userService.getAllusers();
  res.json(cars);
});
router.get("/:id",  async (req, res) => {
  const car = await userService.getuserById(req.params.id);
  res.json(car);
});

router.post("/", async (req, res) => {
  console.log(req.body)
  const user = await userService.createuser(req.body);
  res.status(201).json(user);
 });

router.delete("/:id", async (req, res) => { });

module.exports = router;