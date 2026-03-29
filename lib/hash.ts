import { keccak256, toUtf8Bytes } from "ethers";

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortValue((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  return value;
}

export function canonicalJson(value: unknown) {
  return JSON.stringify(sortValue(value));
}

export function hashContent(value: unknown) {
  return keccak256(toUtf8Bytes(canonicalJson(value)));
}
