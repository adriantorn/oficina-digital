import "server-only";
import { requireUser } from "@/lib/data/auth";
import { connectionStatus } from "./connection";
import { getPersonalBusyBlocks } from "./calendar";
import type { BusyBlock } from "@/lib/types";
export async function optionalGoogleAvailability(start:string,end:string):Promise<{blocks:BusyBlock[];connected:boolean;warning:string|null}> { const {user}=await requireUser(); try { const status=await connectionStatus(user.id); if(!status.connected)return{blocks:[],connected:false,warning:null}; return{blocks:await getPersonalBusyBlocks(user.id,start,end),connected:true,warning:null}; } catch { return{blocks:[],connected:true,warning:"No se pudo consultar Google Calendar. No se presupone que el horario esté libre."}; } }
export function overlapsBusyBlock(start:string,end:string,blocks:BusyBlock[]){const a=new Date(start).getTime(),b=new Date(end).getTime();return blocks.some(block=>new Date(block.startsAt).getTime()<b&&new Date(block.endsAt).getTime()>a);}
export async function checkGoogleAvailability(start:string,end:string){const result=await optionalGoogleAvailability(start,end);return{...result,overlap:overlapsBusyBlock(start,end,result.blocks)};}
