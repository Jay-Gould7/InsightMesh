const truthy = new Set(["1", "true", "yes", "on"]);

function read(name: string, fallback = "") {
  return process.env[name] ?? fallback;
}

function normalizePrivateKey(value: string) {
  if (!value) return "";
  return value.startsWith("0x") ? value : `0x${value}`;
}

export const env = {
  appName: read("NEXT_PUBLIC_APP_NAME", "InsightMesh"),
  demoMode: truthy.has(read("NEXT_PUBLIC_DEMO_MODE", "true").toLowerCase()),
  geminiApiKey: read("GEMINI_API_KEY"),
  geminiModel: read("GEMINI_MODEL", "gemini-2.5-flash"),
  databaseUrl: read("DATABASE_URL", "file:./dev.db"),
  coreRpcUrl: read("CONFLUX_CORE_RPC_URL", "https://test.confluxrpc.com"),
  coreNetworkId: Number(read("CONFLUX_CORE_NETWORK_ID", "1")),
  coreRegistryAddress: read("CONFLUX_CORE_REGISTRY_ADDRESS"),
  coreSubmissionAddress: read("CONFLUX_CORE_SUBMISSION_ADDRESS"),
  coreRelayerPrivateKey: normalizePrivateKey(read("CONFLUX_CORE_RELAYER_PRIVATE_KEY")),
  eSpaceRpcUrl: read("ESPACE_RPC_URL", "https://evmtestnet.confluxrpc.com"),
  eSpaceChainId: Number(read("ESPACE_CHAIN_ID", "71")),
  eSpaceRewardVaultAddress: read("ESPACE_REWARD_VAULT_ADDRESS"),
  eSpaceUsdt0Address: read("ESPACE_USDT0_ADDRESS"),
  eSpaceRelayerPrivateKey: normalizePrivateKey(read("ESPACE_RELAYER_PRIVATE_KEY")),
};

export function hasGeminiAccess() {
  return Boolean(env.geminiApiKey);
}

export function hasCoreContractConfig() {
  return Boolean(env.coreRegistryAddress && env.coreSubmissionAddress);
}

export function hasCoreChainAccess() {
  return Boolean(hasCoreContractConfig() && env.coreRelayerPrivateKey);
}

export function hasRewardVaultConfig() {
  return Boolean(env.eSpaceRewardVaultAddress && env.eSpaceUsdt0Address);
}

export function hasESpaceAccess() {
  return Boolean(hasRewardVaultConfig() && env.eSpaceRelayerPrivateKey);
}
