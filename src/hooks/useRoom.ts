import {useEffect,useRef,useState} from "react";
import {io} from "socket.io-client";
import type {View} from "../../shared/types";
export type Credential={code:string;token:string};
async function request(url:string,body?:unknown,token?:string){
 const response=await fetch(url,{method:body?"POST":"GET",headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(90000)});
 const contentType=response.headers.get("content-type")||"";
 if(!contentType.includes("application/json"))throw new Error("El servidor está despertando. Espera unos segundos y vuelve a intentarlo.");
 const data=await response.json();
 if(!response.ok)throw new Error(data.error||"No se pudo completar la solicitud.");
 return data;
}
export function useRoom(){
 const [credential,setCredential]=useState<Credential|null>(()=>{try{return JSON.parse(sessionStorage.getItem("auditrace")||"null")}catch{return null}});
 const [room,setRoom]=useState<View|null>(null),[connected,setConnected]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const activeCredential=useRef(credential);
 activeCredential.current=credential;
 const busyRef=useRef(false);
 function accept(incoming:View){setRoom(previous=>previous&&previous.code===incoming.code&&previous.revision>incoming.revision?previous:incoming)}
 useEffect(()=>{
  if(!credential)return;
  let active=true;setRoom(null);setError("");
  request("/api/rooms/"+credential.code,undefined,credential.token).then(r=>{if(active)accept(r)}).catch(e=>{if(active)setError(e.message)});
  const socket=io({auth:credential,reconnection:true,reconnectionDelay:1000,reconnectionDelayMax:5000,timeout:20000});
  socket.on("state",r=>{if(active){accept(r);setError(old=>old.startsWith("Sin conexión")?"":old)}});
  socket.on("connect",()=>{if(active){setConnected(true);setError(old=>old.startsWith("Sin conexión")?"":old)}});
  socket.on("disconnect",()=>{if(active)setConnected(false)});
  socket.on("connect_error",()=>{if(active)setError("Sin conexión con la sala. Intentando reconectar…")});
  const sync=()=>{if(document.visibilityState==="visible"){if(!socket.connected)socket.connect();request("/api/rooms/"+credential.code,undefined,credential.token).then(r=>{if(active)accept(r)}).catch(()=>{})}};
  document.addEventListener("visibilitychange",sync);window.addEventListener("online",sync);
  return()=>{active=false;socket.disconnect();setConnected(false);document.removeEventListener("visibilitychange",sync);window.removeEventListener("online",sync)};
 },[credential]);
 async function run<T>(fn:()=>Promise<T>){if(busyRef.current)return null;busyRef.current=true;setBusy(true);setError("");try{return await fn()}catch(e){setError((e as Error).name==="TimeoutError"?"La conexión tardó demasiado. Inténtalo de nuevo.":(e as Error).message);return null}finally{busyRef.current=false;setBusy(false)}}
 function enter(c:Credential){sessionStorage.setItem("auditrace",JSON.stringify(c));setCredential(c)}
 async function create(key:string,recoverCode=""){const c=await run(()=>request(recoverCode?"/api/rooms/"+recoverCode.toUpperCase()+"/recover":"/api/rooms",{key}));if(c)enter(c)}
 async function join(code:string,alias:string){const c=await run(()=>request("/api/rooms/"+code.toUpperCase()+"/join",{alias}));if(c)enter(c)}
 async function act(action:unknown){if(!credential)return null;const current=credential;return run(async()=>{const r:View=await request("/api/rooms/"+current.code+"/action",action,current.token);if(activeCredential.current?.token===current.token)accept(r);return r})}
 function leave(){sessionStorage.removeItem("auditrace");setCredential(null);setRoom(null);setError("");history.replaceState(null,"",location.pathname)}
 return{room,credential,connected,busy,error,setError,create,join,act,leave};
}

