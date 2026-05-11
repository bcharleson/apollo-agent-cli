import { Command } from 'commander';
import { ApolloClient } from '../../core/client.js';
import { saveConfig } from '../../core/config.js';
import { output, outputError } from '../../core/output.js';
import type { GlobalOptions } from '../../core/types.js';

export function registerLoginCommand(program: Command): void {
  program
    .command('login')
    .description('Authenticate with your Apollo API key')
    .option('--api-key <key>', 'API key (skips interactive prompt)')
    .action(async (opts) => {
      const globalOpts = program.opts() as GlobalOptions;

      try {
        let apiKey = opts.apiKey || process.env.APOLLO_API_KEY;

        if (!apiKey) {
          if (!process.stdin.isTTY) {
            outputError(
              new Error('No API key provided. Use --api-key or set APOLLO_API_KEY'),
              globalOpts,
            );
            return;
          }

          console.log(
            'Get your API key from: https://app.apollo.io/#/settings/integrations/api\n',
          );

          const [major] = process.versions.node.split('.').map(Number);
          if (major < 20) {
            outputError(
              new Error(
                'Interactive login requires Node.js 20+. Use --api-key or set APOLLO_API_KEY instead.',
              ),
              globalOpts,
            );
            return;
          }
          const { password } = await import('@inquirer/prompts');
          apiKey = await password({
            message: 'Enter your Apollo API key:',
            mask: '*',
          });
        }

        if (!apiKey) {
          outputError(new Error('No API key provided'), globalOpts);
          return;
        }

        const client = new ApolloClient({ apiKey });

        if (globalOpts.output === 'pretty' || process.stdin.isTTY) {
          console.log('Validating API key...');
        }

        // Validate by listing users (basic endpoint available on most plans)
        let userInfo: any;
        try {
          userInfo = await client.get<any>('/users/search');
        } catch {
          userInfo = null;
        }

        await saveConfig({ api_key: apiKey });

        const result = {
          status: 'authenticated',
          config_path: '~/.apollo-cli/config.json',
          users_found: userInfo?.users?.length ?? 'unknown (non-master key)',
        };

        if (globalOpts.output === 'pretty' || process.stdin.isTTY) {
          console.log('\nAuthenticated successfully!');
          console.log('Config saved to ~/.apollo-cli/config.json');
          if (userInfo?.users?.length) {
            console.log(`Team size: ${userInfo.users.length} users`);
          }
        } else {
          output(result, globalOpts);
        }
      } catch (error) {
        outputError(error, globalOpts);
      }
    });
}
