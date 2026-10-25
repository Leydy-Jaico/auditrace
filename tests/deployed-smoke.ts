import "dotenv/config";
import assert from "node:assert/strict";
import {io,type Socket} from "socket.io-client";
const base=process.env.TEST_BASE_URL||"http://localhost:3001";
const sockets:Socket[]=[];
const key=process.env.HOST_ACCESS_KEY;
assert.ok(key,"HOST_ACCESS_KEY requerido");
async function request(route:string,body?:unknown,credential?:string){
 const response=await fetch(base+route,{method:body?"POST":"GET",headers:{"Content-Type":"application/json",...(credential?{Authorization:"Bearer "+credential}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(90000)});
 const data=await response.json();return {status:response.status,data};
}
try{
 const health=await request("/api/health");assert.equal(health.status,200);assert.equal(health.data.storage,"postgresql");
 const host=(await request("/api/rooms",{key})).data;assert.ok(host.token);
 const roomPath="/api/rooms/"+host.code;
 const act=(action:unknown,credential=host.token)=>request(roomPath+"/action",action,credential);
 const participants=await Promise.all(Array.from({length:12},(_,i)=>request(roomPath+"/join",{alias:"Prueba_"+String(i+1).padStart(2,"0")})));
 assert.ok(participants.every(r=>r.status===200));
 const people=participants.map(p=>p.data);
 let latest:any;
 for(const p of [host,...people.slice(0,3)]){
  const socket=io(base,{auth:p,transports:["websocket"],timeout:30000});sockets.push(socket);
  if(p===host)socket.on("state",state=>{latest=state});
  await new Promise<void>((resolve,reject)=>{socket.once("connect",resolve);socket.once("connect_error",reject)});
 }
 await act({type:"start"});
 await Promise.all(people.map(async p=>{for(const [question,answer] of [[0,0],[1,1],[2,2]])assert.equal((await act({type:"answer",question,answer},p.token)).status,200)}));
 let snapshot=(await request(roomPath,undefined,host.token)).data;
 assert.equal(snapshot.people.length,12);assert.deepEqual(snapshot.votes,[[12,0,0],[0,12,0],[0,0,12]]);
 const denied=await act({type:"next"},people[1].token);assert.equal(denied.status,400);
 await act({type:"next"});
 const person=(await request(roomPath,undefined,people[0].token)).data.me;
 await act({type:"role",id:person.id,role:"Docente"});
 let changed=await act({type:"operation",operation:"UPDATE",gradeId:1,value:16,reason:"Prueba de revisión"},people[0].token);
 assert.equal(changed.data.grades[0].current,16);
 let blocked=await act({type:"operation",operation:"UPDATE",gradeId:1,value:20,reason:"Intento sin permiso"},people[1].token);
 assert.equal(blocked.data.grades[0].current,16);assert.equal(blocked.data.events[0].ok,false);
 await act({type:"pause"});assert.equal((await act({type:"operation",operation:"SELECT",gradeId:1},people[0].token)).status,400);await act({type:"pause"});
 await act({type:"surprise"});
 await act({type:"next"});
 await Promise.all(people.map(p=>act({type:"investigate",order:["login","update","role","select","logout"],culprit:"admin_02",clue:"update"},p.token)));
 await act({type:"next"});
 const policy={UPDATE:true,SELECT:false,DELETE:false,LOGIN:true,PERMISSION:true,FAILED:true};
 await Promise.all(people.map(p=>act({type:"policy",policy},p.token)));
 await act({type:"next"});
 snapshot=(await request(roomPath,undefined,host.token)).data;
 assert.ok(snapshot.people.every((p:any)=>p.score===100));assert.match(snapshot.solution,/admin_02/);
 assert.ok(latest,"El expositor recibe eventos en vivo");
 const cors=await fetch(base+"/api/health",{headers:{Origin:"https://untrusted.example"}});
 // Health is intentionally public; mutation routes enforce same origin.
 const forbidden=await fetch(base+roomPath,{headers:{Origin:"https://untrusted.example",Authorization:"Bearer "+host.token}});assert.equal(forbidden.status,403);
 const recovered=(await request(roomPath+"/recover",{key})).data;assert.ok(recovered.token);assert.equal((await request(roomPath,undefined,host.token)).status,403);
 await request(roomPath+"/action",{type:"end"},recovered.token);
 const end=(await request(roomPath,undefined,recovered.token)).data;assert.equal(end.ended,true);
 console.log(JSON.stringify({ok:true,url:base,room:host.code,participants:12,phase:end.phase,score:100,postgresql:true,websocket:true,authorization:true,recovery:true,cors:true,events:end.events.length,checkedAt:new Date().toISOString()},null,2));
}finally{sockets.forEach(s=>s.disconnect())}

