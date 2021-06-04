const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const cors = require("cors");
const mongoose = require("mongoose");

app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

const mongoDB = `mongodb+srv://SahyogAdmin:${process.env.DB_PASSWORD}@sahyog.upfyh.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

mongoose
  .connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Database Connected..."))
  .catch((err) => console.log("Error connecting database", err));

mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);

const Room = require("./models/Room");

app.post("/join_room", async (req, res) => {
  const room_id = req.body.room_id;
  const oyo_room = await Room.findOne({ uID: room_id }).catch((err) => {
    console.log("error occured while checking room", err);
  });

  flag = false;
  if (oyo_room) {
    if (oyo_room.noOfUser < 2) {
      oyo_room.noOfUser++;
      const doc = await oyo_room.save();

      res.status(200).json({ doc });
    } else {
      //Room is full
      res.status(200).json({ err: "Room is Full can't join " });
    }
  } else {
    res.status(200).json({ err: "Enter Valid Room ID" });
  }
});

app.get("/create_room", (req, res) => {
  var alphabet = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
  ];

  let result = "";
  for (let index = 0; index < 5; index++) {
    result += alphabet[Math.floor(Math.random() * 10000) % 25];
  }

  const room = new Room({ uID: result, noOfUser: 1 });
  room
    .save()
    .then(() => {
      console.log("room created", result);
    })
    .catch((err) => {
      console.log("err creating room", err);
    });

  res.json(result);
});

app.get("/", (req, res) => {
  res.send({ message: "We did it!" });
});

io.on("connection", (socket) => {
  socket.on("join", async (room_id) => {
    console.log("user joined", room_id);
    socket.join(room_id);

    const oyo_room = await Room.findOne({ uID: room_id }).catch((err) => {
      console.log("error occured while checking room", err);
    });

    if (oyo_room && oyo_room.noOfUser === 2) {
      io.to(room_id).emit("youCanPLayNow");
    }
  });

  socket.on("sendMessage", async ({ message, name, user_id, room_id }) => {
    const msgToStore = {
      name,
      user_id,
      room_id,
      text: message,
    };

    io.to(room_id).emit("messageReceived", msgToStore);
  });

  socket.on("squareClicked", ({ i, name, user_id, room_id }) => {
    const click = {
      i,
      name,
      user_id,
      room_id,
    };
    console.log(`${name} clicked ${i} square in room ${room_id}`);
    io.to(room_id).emit("squareClickedReceived", click);
  });

  socket.on("playAgain", (room_id) => {
    io.to(room_id).emit("playAgainReceived");
  });
});

const PORT = process.env.PORT || 8000;
http.listen(PORT, () => {
  console.log("Backend Server listing at PORT:", PORT);
});
