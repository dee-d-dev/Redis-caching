const express = require("express");
const redis = require("redis");
const fetch = require("axios");

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const app = express();
const client = redis.createClient(REDIS_PORT);

(async () => {
  await client.connect();
})();

client.on("connect", () => console.log("Redis Client Connected"));
client.on("error", (err) => console.log("Redis Client Connection Error", err));

const setResponse = (username, result) => {
  return `<h2>${username} has ${result} in their bio</h2>`;
};
//get repos
const getRepos = async (req, res, next) => {
  try {
    const { username } = req.params;
    const response = await fetch(`https://api.github.com/users/${username}`);
    const result = response.data.bio;
    console.log("fetching the data");

    //set to redis
    client.setEx(username, 3600, result);

    res.send(setResponse(username, result));
  } catch (err) {
    res.status(500).send(err.message);
    console.log(err.message);
  }
};

//cache
const cache = (req, res, next) => {
  const { username } = req.params;
  client.get(username, (err, data) => {
    if (err) throw err;
    if (data != null) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  });
};

app.get("/repos/:username", cache, getRepos);

app.listen(PORT, (req, res) => {
  console.log(`server running on ${PORT} `);
});
