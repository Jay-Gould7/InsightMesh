import { randomBytes } from "node:crypto";

export function fakeTxHash(prefix = "0x") {
  return `${prefix}${randomBytes(32).toString("hex")}`;
}

export function fakeSnapshotKey() {
  return `snapshot_${randomBytes(8).toString("hex")}`;
}
