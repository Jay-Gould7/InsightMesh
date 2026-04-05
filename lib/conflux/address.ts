type DecodedAddress = {
  hexAddress: Buffer;
};

type ConfluxAddressModule = {
  decode?: (value: string) => DecodedAddress;
};

let cachedDecoder:
  | ((value: string) => DecodedAddress)
  | null
  | undefined;

function getDecoder() {
  if (cachedDecoder !== undefined) {
    return cachedDecoder;
  }

  try {
    const sdk = require("@conflux-dev/conflux-address-js/lib/pure-js") as ConfluxAddressModule;
    cachedDecoder = sdk.decode ?? null;
  } catch {
    cachedDecoder = null;
  }

  return cachedDecoder;
}

export function normalizeCoreAddress(value: string | null | undefined) {
  const address = typeof value === "string" ? value.trim() : "";
  if (!address) return "";

  if (/^0x[0-9a-f]{40}$/i.test(address)) {
    return `0x${address.slice(2).toLowerCase()}`;
  }

  const decode = getDecoder();
  if (!decode) return address.toLowerCase();

  try {
    return `0x${decode(address).hexAddress.toString("hex").toLowerCase()}`;
  } catch {
    return address.toLowerCase();
  }
}

export function coreAddressesEqual(
  left: string | null | undefined,
  right: string | null | undefined,
) {
  const normalizedLeft = normalizeCoreAddress(left);
  const normalizedRight = normalizeCoreAddress(right);

  return Boolean(normalizedLeft) && normalizedLeft === normalizedRight;
}
