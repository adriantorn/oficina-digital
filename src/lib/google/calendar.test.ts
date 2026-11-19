import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("./connection", () => ({ accessToken: vi.fn(async () => "token"), getConnection: vi.fn(async () => ({ calendar_id: "office" })) }));
import { deleteGoogleEvent, getPersonalBusyBlocks, resolveOfficeCalendar, syncGoogleEvent } from "./calendar";
import type { AppointmentDetail } from "@/lib/types";

const appointment: AppointmentDetail = { id:"11111111-1111-4111-8111-111111111111",title:"Visita actualizada",description:null,appointmentType:"visit",startsAt:"2027-01-01T09:00:00.000Z",endsAt:"2027-01-01T10:00:00.000Z",timeZone:"Europe/Madrid",status:"scheduled",reminderMinutes:null,contactId:null,contactName:null,location:null,googleEventId:"remote-event",googleEventEtag:'"etag-1"',googleSyncStatus:"synced",googleSyncError:null,createdAt:"",updatedAt:"" };
const jsonResponse=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json"}});

describe("Google Calendar adapter",()=>{
  beforeEach(()=>vi.stubGlobal("fetch",vi.fn()));
  it("actualiza un evento existente con PUT e If-Match",async()=>{vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({id:"remote-event",etag:'"etag-2"'}));const result=await syncGoogleEvent("owner",appointment);expect(result.etag).toBe('"etag-2"');expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/events/remote-event"),expect.objectContaining({method:"PUT",headers:expect.objectContaining({"If-Match":'"etag-1"'})}));});
  it("un 409 obliga a verificar y reemplazar, no se acepta como éxito",async()=>{vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({},409)).mockResolvedValueOnce(jsonResponse({id:appointment.id.replaceAll("-",""),etag:'"old"',extendedProperties:{private:{oficinaDigitalId:appointment.id}}})).mockResolvedValueOnce(jsonResponse({id:appointment.id.replaceAll("-",""),etag:'"new"'}));const result=await syncGoogleEvent("owner",{...appointment,googleEventId:null,googleEventEtag:null,googleSyncStatus:"local"});expect(result.etag).toBe('"new"');expect(fetch).toHaveBeenCalledTimes(3);expect(vi.mocked(fetch).mock.calls[2][1]?.method).toBe("PUT");});
  it("rechaza errores internos de FreeBusy aunque HTTP sea 200",async()=>{vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({calendars:{primary:{errors:[{reason:"notFound"}]}}}));await expect(getPersonalBusyBlocks("owner","a","b")).rejects.toThrow(/error.*disponibilidad/i);});
  it("reutiliza un calendario laboral accesible al reconectar",async()=>{vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({id:"existing"}));await expect(resolveOfficeCalendar("token","existing")).resolves.toEqual({calendarId:"existing",reused:true});expect(fetch).toHaveBeenCalledTimes(1);});
  it("crea uno nuevo solo cuando el anterior ya no es accesible",async()=>{vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({},404)).mockResolvedValueOnce(jsonResponse({id:"new-office"}));await expect(resolveOfficeCalendar("token","old")).resolves.toEqual({calendarId:"new-office",reused:false});});
  it("reintenta una cancelación remota ante fallos temporales",async()=>{vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({},503)).mockResolvedValueOnce(new Response(null,{status:204}));await deleteGoogleEvent("owner",appointment.id);expect(fetch).toHaveBeenCalledTimes(2);});
  it("mantiene como error una cancelación remota rechazada",async()=>{vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({},403));await expect(deleteGoogleEvent("owner",appointment.id)).rejects.toThrow(/cancelar.*Google/i);});
});
