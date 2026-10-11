'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const WebSocket = require('ws');
const PORT = Number(process.env.PORT || 3000);
const MAX_MESSAGE = 512 * 1024;
const rooms = new Map();
const html = path.join(__dirname, 'index.html');
const server = http.createServer((req,res)=>{
  if(req.url === '/' || req.url?.startsWith('/?') || req.url === '/index.html'){
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    fs.createReadStream(html).pipe(res);
  } else if(req.url==='/health') {res.writeHead(200,{'Content-Type':'text/plain'});res.end('ok');}
  else {res.writeHead(404);res.end('Not found');}
});
const wss=new WebSocket.Server({server,path:'/ws',maxPayload:MAX_MESSAGE,perMessageDeflate:false});
const send=(ws,data)=>{if(ws?.readyState===WebSocket.OPEN&&ws.bufferedAmount<2_000_000)ws.send(JSON.stringify(data));};
const validChampion=id=>['mage','glad','reap','time','vesper','silke'].includes(id)?id:'mage';
function newCode(){let code;do{code=crypto.randomBytes(4).toString('hex').slice(0,6).toUpperCase();}while(rooms.has(code));return code;}
function leave(ws){const r=ws.room;if(!r)return;ws.room=null;ws.role=null;
  if(r.host===ws){rooms.delete(r.code);send(r.guest,{type:'left'});if(r.guest){r.guest.room=null;r.guest.role=null;}}
  else if(r.guest===ws){r.guest=null;send(r.host,{type:'left'});}
}
wss.on('connection',ws=>{
  ws.isAlive=true;ws.on('pong',()=>{ws.isAlive=true;});
  const counters={t:Date.now(),messages:0};
  ws.on('message',raw=>{
    if(Date.now()-counters.t>1000){counters.t=Date.now();counters.messages=0;}
    if(++counters.messages>100)return;
    let m;try{m=JSON.parse(raw.toString());}catch{return;}
    if(!m||typeof m!=='object'||typeof m.type!=='string')return;
    if(m.type==='create'){
      leave(ws);const code=newCode();const r={code,host:ws,guest:null};rooms.set(code,r);ws.room=r;ws.role='host';ws.champ=validChampion(m.champ);send(ws,{type:'created',room:code});return;
    }
    if(m.type==='join'){
      const code=String(m.room||'').toUpperCase();const r=rooms.get(code);
      if(!r||r.guest||r.host===ws){send(ws,{type:'error',message:'Raum existiert nicht oder ist bereits voll.'});return;}
      leave(ws);r.guest=ws;ws.room=r;ws.role='guest';ws.champ=validChampion(m.champ);
      send(ws,{type:'joined',room:code});send(r.host,{type:'ready',champ:ws.champ});send(ws,{type:'ready',champ:r.host.champ});return;
    }
    const r=ws.room;if(!r)return;
    if(m.type==='champ'){ws.champ=validChampion(m.id);send(ws===r.host?r.guest:r.host,{type:'champ',id:ws.champ});return;}
    if(m.type==='state'&&ws===r.host&&r.guest){send(r.guest,{type:'state',data:m.data});return;}
    if(m.type==='restart'&&ws===r.host&&r.guest){send(r.guest,{type:'restart'});return;}
    if(m.type==='input'&&ws===r.guest&&r.host){send(r.host,{type:'input',input:m.input});return;}
    if(m.type==='buff'&&ws===r.guest&&r.host){send(r.host,{type:'buff',index:m.index});}
  });
  ws.on('close',()=>leave(ws));ws.on('error',()=>leave(ws));
});
setInterval(()=>{for(const ws of wss.clients){if(!ws.isAlive){ws.terminate();continue;}ws.isAlive=false;ws.ping();}},30000).unref();
server.listen(PORT,'0.0.0.0',()=>console.log(`Aschenarena Online läuft auf Port ${PORT}`));
