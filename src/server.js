import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer); //독자적으로 만들 수 있지만, 3000포트에 http랑 동시에 서버를 열고 싶어서 이렇게 함

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  // console.log("romms:", wsServer.sockets.adapter.rooms);
  // console.log("sids:", wsServer.sockets.adapter.sids);
  rooms.forEach((_, key) => {
    //foreach는 value,key 순임
    // console.log("====================");
    // console.log(_);
    // console.log("key:", key);
    // console.log("sids.get(key):", sids.get(key));
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  // console.log("publicRooms:", publicRooms);
  return publicRooms;
}

//방에 몇명있는지 세기
function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  socket["nickname"] = "익명";
  socket.onAny((event) => {
    console.log(`Socket Events:${event}`);
  });
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done();
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    wsServer.sockets.emit("room_change", publicRooms()); //메시지를 모든 socket에 보냄
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });
  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("new_message", (msg, room, done) => {
    console.log(msg);
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });
  socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});

// const sockets = [];

// wss.on("connection", (socket) => {
//   sockets.push(socket);
//   socket["nickname"] = "익명";
//   console.log("connected to brower!");
//   socket.on("close", onSocketClose);
//   socket.on("message", (msg) => {
//     const message = JSON.parse(msg); //string으로 전달된 json을 Json으로 변환
//     switch (message.type) {
//       case "new_message":
//         sockets.forEach((aSocket) =>
//           aSocket.send(`${socket.nickname}: ${message.payload}`)
//         );
//       case "nickname":
//         socket["nickname"] = message.payload; //소켓에다가 새로운 속성을 넣은 것임
//     }
//   });
// });

const handleListen = () => console.log("listening to http://localhost");
httpServer.listen(3000, handleListen);
