import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';

const PORT = process.env.PORT || 8081;
const app = express();
app.use(cors());

app.get('/', (req,res)=> res.send('KinoFap CoWatch WS is running'));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// rooms: roomId -> Set of clients
const rooms = new Map();

function joinRoom(ws, room){
  if(!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room).add(ws);
  ws._room = room;
  broadcast(room, {type:'presence', count: rooms.get(room).size});
}
function leaveRoom(ws){
  const room = ws._room;
  if(room && rooms.has(room)){
    rooms.get(room).delete(ws);
    if(rooms.get(room).size===0) rooms.delete(room);
    else broadcast(room, {type:'presence', count: rooms.get(room).size});
  }
}

function broadcast(room, data){
  const set = rooms.get(room);
  if(!set) return;
  const str = JSON.stringify(data);
  for (const client of set){
    if(client.readyState === 1){
      client.send(str);
    }
  }
}

wss.on('connection', (ws, req)=>{
  const url = new URL(req.url, 'http://localhost');
  const room = url.searchParams.get('room') || 'default';
  joinRoom(ws, room);

  ws.on('message', (buf)=>{
    let msg = {};
    try{ msg = JSON.parse(buf.toString()); }catch{}
    // relay only known types
    if(['chat','start','pause','resync'].includes(msg.type)){
      broadcast(ws._room, msg);
    }
  });

  ws.on('close', ()=> leaveRoom(ws));
});

server.listen(PORT, ()=> console.log('WS server on', PORT));
