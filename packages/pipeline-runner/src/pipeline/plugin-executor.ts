import { init } from "@module-federation/enhanced/runtime";
import type { Plugin, PluginState } from "@usersdotfun/core-sdk";

type ModuleFederation = ReturnType<typeof init>;

interface ExecuteMessage {
  operation: 'execute';
  pluginName: string;
  remoteUrl: string;
  input: Record<string, unknown>;
  state?: PluginState;
}

interface InitializeMessage {
  operation: 'initialize';
  pluginName: string;
  remoteUrl: string;
  config: Record<string, unknown>;
}

type PluginMessage = ExecuteMessage | InitializeMessage;

const getPluginConstructor = async (
  mf: ModuleFederation,
  pluginName: string,
  remoteUrl: string
): Promise<new () => Plugin<any, any, any>> => {
  const remoteName = pluginName.toLowerCase().replace(/[@/]/g, "_");
  
  await mf.registerRemotes([{ name: remoteName, entry: remoteUrl }]);

  const container = await mf.loadRemote(`${remoteName}/plugin`);
  
  // Diagnostic logging
  console.error(`[DIAGNOSTIC] Received container for ${pluginName}:`, container);

  if (!container) {
    throw new Error(`MF: No container returned for plugin ${pluginName}`);
  }

  const Constructor = (container as any)?.default ?? container;
  if (typeof Constructor !== 'function') {
    throw new Error(`MF: Failed to load a valid plugin constructor from ${pluginName}`);
  }

  return Constructor;
};

const sendResult = (result: any) => {
  // Write to stdout for the parent process to read
  console.log(JSON.stringify({ type: 'result', data: result }));
};

const sendError = (error: any) => {
  // Write to stderr for the parent process to read
  console.error(JSON.stringify({
    type: 'error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  }));
};

const readStdin = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      let data = "";
      process.stdin.on('readable', () => {
        let chunk;
        while ((chunk = process.stdin.read()) !== null) {
          data += chunk;
        }
      });
      process.stdin.on('end', () => resolve(data));
      process.stdin.on('error', err => reject(err));
    });
};

const main = async () => {
    // Each child process gets its own lightweight MF instance.
    const mf = init({
        name: `plugin-executor-${process.pid}`,
        remotes: [],
    });

    try {
        const stdin = await readStdin();
        if (!stdin) {
            throw new Error("No input received from stdin.");
        }
        const message: PluginMessage = JSON.parse(stdin);

        const PluginConstructor = await getPluginConstructor(mf, message.pluginName, message.remoteUrl);
        const plugin = new PluginConstructor();

        switch (message.operation) {
        case 'initialize':
            const state = await plugin.initialize(message.config);
            sendResult(state || {});
            break;
        case 'execute':
            const output = await plugin.execute(message.input, message.state);
            sendResult(output);
            break;
        }
    } catch (error: any) {
        sendError(error);
        process.exit(1);
    }
}

main();
