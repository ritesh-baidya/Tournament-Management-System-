import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import { DiscordService } from '../electron/discordService';

const CONFIG_FILE = path.join(process.cwd(), 'discord-config.json');

function getStoredToken(): string {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return data.discord_bot_token || '';
    }
  } catch {}
  return '';
}

function saveStoredToken(token: string) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ discord_bot_token: token.trim() }, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[discordDevServer] Could not write discord-config.json:', err);
  }
}

// Shared singleton service for Vite dev server
let devDiscordService: DiscordService | null = null;

function getDiscordService(): DiscordService {
  if (!devDiscordService) {
    devDiscordService = new DiscordService();
  }
  return devDiscordService;
}

function parseJsonBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res: any, status: number, data: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export function discordApiPlugin(): Plugin {
  // Never attach during Vitest test runner
  if (process.env.VITEST) {
    return { name: 'discord-api-middleware' };
  }

  return {
    name: 'discord-api-middleware',
    configureServer(server) {
      const svc = getDiscordService();

      // Auto-connect on dev server boot if token was saved
      const initialToken = getStoredToken();
      if (initialToken) {
        svc.initializeClient(initialToken).then((res) => {
          if (res.success) {
            console.log(`[discordDevServer] Discord Bot auto-connected as: ${res.botTag} (${res.botId})`);
          } else {
            console.warn(`[discordDevServer] Discord Bot auto-connect failed:`, res.error);
          }
        }).catch(() => {});
      }

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/api/discord/')) {
          return next();
        }

        try {
          if (url === '/api/discord/status' && req.method === 'GET') {
            const status = svc.getStatus();
            return sendJson(res, 200, { success: true, data: status });
          }

          if (url === '/api/discord/test-connection' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const token = (body.token || '').trim();
            if (!token) {
              return sendJson(res, 200, { success: false, error: 'Token is required' });
            }

            const result = await svc.initializeClient(token);
            if (result.success) {
              saveStoredToken(token);
            }
            return sendJson(res, 200, result);
          }

          if (url === '/api/discord/save-token' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const token = (body.token || '').trim();
            if (token) {
              saveStoredToken(token);
              const result = await svc.initializeClient(token);
              return sendJson(res, 200, result);
            }
            return sendJson(res, 200, { success: true });
          }

          if (url === '/api/discord/send-selection-dm' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const { selectionId, captainDiscordId, captainName, teamName, teamId, token, customTemplate } = body;

            // Auto-init if token provided or stored
            const activeToken = token?.trim() || getStoredToken();
            if (!svc.getStatus().isReady && activeToken) {
              await svc.initializeClient(activeToken);
            }

            console.log(`[discordDevServer] Sending Selection DM to ${captainName} (${captainDiscordId}) for team ${teamName}...`);
            const result = await svc.sendSelectionDM(
              selectionId || `sel_${Date.now()}`,
              captainDiscordId || '',
              captainName || 'Captain',
              teamName || 'Team',
              teamId || '',
              true,
              customTemplate
            );
            console.log(`[discordDevServer] Selection DM result:`, result);
            return sendJson(res, 200, result);
          }

          if (url === '/api/discord/send-room-dm' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const { captainDiscordId, captainName, teamName, teamId, roomId, roomPassword, matchTime, additionalInstructions, token, customTemplate } = body;

            const activeToken = token?.trim() || getStoredToken();
            if (!svc.getStatus().isReady && activeToken) {
              await svc.initializeClient(activeToken);
            }

            console.log(`[discordDevServer] Sending Room DM to ${captainName} (${captainDiscordId})...`);
            const result = await svc.sendRoomDM(
              captainDiscordId || '',
              captainName || 'Captain',
              teamName || 'Team',
              teamId || '',
              roomId || '',
              roomPassword || '',
              matchTime || '',
              additionalInstructions,
              customTemplate
            );
            console.log(`[discordDevServer] Room DM result:`, result);
            return sendJson(res, 200, result);
          }

          if (url === '/api/discord/send-direct-message' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const { captainDiscordId, messageContent, teamId, captainName, teamName, token } = body;

            const activeToken = token?.trim() || getStoredToken();
            if (!svc.getStatus().isReady && activeToken) {
              await svc.initializeClient(activeToken);
            }

            console.log(`[discordDevServer] Sending Custom DM to ${captainDiscordId}...`);
            const result = await svc.sendDirectMessage(
              captainDiscordId || '',
              messageContent || '',
              teamId,
              captainName,
              teamName
            );
            console.log(`[discordDevServer] Custom DM result:`, result);
            return sendJson(res, 200, result);
          }

          return sendJson(res, 404, { success: false, error: 'Endpoint not found' });
        } catch (err: any) {
          console.error('[discordDevServer] Error handling Discord API request:', err);
          return sendJson(res, 500, { success: false, error: err.message || 'Internal server error' });
        }
      });
    }
  };
}
