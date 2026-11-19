import { describe, expect, it } from "vitest";
import { overlapsBusyBlock } from "./availability";
const blocks=[{startsAt:"2027-01-01T09:00:00.000Z",endsAt:"2027-01-01T10:00:00.000Z",source:"google" as const}];
describe("solapamientos FreeBusy",()=>{it("detecta intersección real",()=>expect(overlapsBusyBlock("2027-01-01T09:30:00.000Z","2027-01-01T10:30:00.000Z",blocks)).toBe(true));it("permite intervalos adyacentes",()=>expect(overlapsBusyBlock("2027-01-01T10:00:00.000Z","2027-01-01T11:00:00.000Z",blocks)).toBe(false));});
