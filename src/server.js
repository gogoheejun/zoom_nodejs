import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));

const handleListen = () => console.log("listening to http://localhost");

const server = http.createServer(app);
const wss = new WebSocket.Server({ server }); //독자적으로 만들 수 있지만, 3000포트에 http랑 동시에 서버를 열고 싶어서 이렇게 함

function onSocketClose() {
  console.log("Disconnected from the Broweser!");
}

const sockets = [];

wss.on("connection", (socket) => {
  sockets.push(socket);
  socket["nickname"] = "익명";
  console.log("connected to brower!");
  socket.on("close", onSocketClose);
  socket.on("message", (msg) => {
    const message = JSON.parse(msg); //string으로 전달된 json을 Json으로 변환
    switch (message.type) {
      case "new_message":
        sockets.forEach((aSocket) =>
          aSocket.send(`${socket.nickname}: ${message.payload}`)
        );
      case "nickname":
        socket["nickname"] = message.payload; //소켓에다가 새로운 속성을 넣은 것임
    }
  });
});

server.listen(3000, handleListen);