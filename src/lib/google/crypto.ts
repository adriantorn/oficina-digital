import "server-only";
import { createCipheriv,createDecipheriv,randomBytes } from "node:crypto";
import { googleConfig } from "./config";
function key(){const raw=googleConfig().encryptionKey;if(!raw)throw new Error("Clave de cifrado no configurada.");const value=Buffer.from(raw,"base64");if(value.length!==32)throw new Error("La clave debe contener 32 bytes.");return value;}
export function encryptToken(value:string){const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key(),iv),encrypted=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);return ["v1",iv.toString("base64url"),cipher.getAuthTag().toString("base64url"),encrypted.toString("base64url")].join(".");}
export function decryptToken(value:string){const[v,iv,tag,data]=value.split(".");if(v!=="v1"||!iv||!tag||!data)throw new Error("Token cifrado no válido.");const d=createDecipheriv("aes-256-gcm",key(),Buffer.from(iv,"base64url"));d.setAuthTag(Buffer.from(tag,"base64url"));return Buffer.concat([d.update(Buffer.from(data,"base64url")),d.final()]).toString("utf8");}
