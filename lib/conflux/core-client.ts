import { env, hasCoreChainAccess } from "@/lib/env";

export async function getCoreContext() {
  if (env.demoMode || !hasCoreChainAccess()) {
    return null;
  }

  const sdk = await import("js-conflux-sdk");
  const Conflux = (sdk as { Conflux: new (...args: unknown[]) => unknown }).Conflux;
  return new Conflux({
    url: env.coreRpcUrl,
    networkId: env.coreNetworkId,
  });
}
