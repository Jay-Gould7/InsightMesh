type RpcValue = string | number | bigint | null | undefined;

type CoreRpcSuccess<T> = {
  jsonrpc: string;
  id: number | string | null;
  result: T;
};

type CoreRpcFailure = {
  jsonrpc: string;
  id: number | string | null;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
};

export type RawCoreStatus = {
  chainId: RpcValue;
  networkId: RpcValue;
};

export type RawCoreEstimate = {
  gasLimit: RpcValue;
  storageCollateralized: RpcValue;
};

export type RawCoreTransaction = {
  from: string;
  to?: string | null;
  data: string;
  value?: RpcValue;
};

export type RawCoreReceipt = {
  transactionHash: string;
  from: string;
  to?: string | null;
  outcomeStatus: RpcValue;
  gasCoveredBySponsor?: boolean;
  storageCoveredBySponsor?: boolean;
  logs?: Array<{
    address?: string;
    data: string;
    topics: string[];
  }>;
};

function isFailure<T>(payload: CoreRpcSuccess<T> | CoreRpcFailure): payload is CoreRpcFailure {
  return "error" in payload;
}

export function rpcValueToBigInt(value: RpcValue) {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string") {
    return value.startsWith("0x") ? BigInt(value) : BigInt(value);
  }
  throw new Error("Missing RPC numeric value.");
}

export function rpcValueToNumber(value: RpcValue) {
  return Number(rpcValueToBigInt(value));
}

export function bigintToRpcHex(value: bigint) {
  return `0x${value.toString(16)}`;
}

export async function callCoreRpc<T>(rpcUrl: string, method: string, params: unknown[] = []) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as CoreRpcSuccess<T> | CoreRpcFailure;
  if (!response.ok) {
    throw new Error(`Core RPC request failed with status ${response.status}.`);
  }

  if (isFailure(payload)) {
    throw new Error(payload.error.message || `Core RPC ${method} failed.`);
  }

  return payload.result;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForCoreReceipt(
  rpcUrl: string,
  txHash: string,
  options: { attempts?: number; delayMs?: number } = {},
) {
  const attempts = options.attempts ?? 45;
  const delayMs = options.delayMs ?? 2000;

  for (let index = 0; index < attempts; index += 1) {
    const receipt = await callCoreRpc<RawCoreReceipt | null>(rpcUrl, "cfx_getTransactionReceipt", [txHash]);
    if (receipt) {
      return receipt;
    }

    await sleep(delayMs);
  }

  throw new Error("Timed out waiting for the Core transaction receipt.");
}
