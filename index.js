const express = require("express");
const app = express();
const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Hello Micros World!");
});

app.listen(port, () => {
  console.log(`Micro donation  app listening on port ${port}`);
});
