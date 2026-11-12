import { Client, GatewayIntentBits, Partials, User, Events } from 'discord.js';
import { TournamentDatabase } from './database';

export class DiscordService {
  private client: Client | null = null;
  private isConnecting: boolean = false;
  private currentToken: string = '';

  constructor(private db?: TournamentDatabase) {}

  /**
   * Initializes or re-initializes Discord bot client with given token
   */
  public async initializeClient(token?: string): Promise<{ success: boolean; botTag?: string; botId?: string; error?: string }> {
    const botToken = token || (this.db ? this.db.getSetting('discord_bot_token') : this.currentToken);
    if (!botToken || botToken.trim() === '') {
      return { success: false, error: 'No Discord bot token configured.' };
    }

    if (this.client && this.client.isReady() && this.currentToken === botToken.trim()) {
      return { 
        success: true, 
        botTag: this.client.user?.tag, 
        botId: this.client.user?.id 
      };
    }

    // Destroy existing client if token changed
    if (this.client) {
      try {
        await this.client.destroy();
      } catch {}
      this.client = null;
    }

    try {
      this.isConnecting = true;

      // Helper function to connect with given intents
      const connectWithIntents = (intents: GatewayIntentBits[]) => {
        return new Promise<Client>((resolve, reject) => {
          const testClient = new Client({
            intents,
            partials: [Partials.Channel, Partials.Message, Partials.User]
          });

          const timeout = setTimeout(() => {
            testClient.destroy().catch(() => {});
            reject(new Error('Connection timed out after 15 seconds. Please check your token or internet connection.'));
          }, 15000);

          testClient.once(Events.ClientReady, () => {
            clearTimeout(timeout);
            resolve(testClient);
          });

          testClient.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });

          testClient.login(botToken.trim()).catch((err) => {
            clearTimeout(timeout);
            reject(err);
          });
        });
      };

      let activeClient: Client;
      try {
        // Attempt full intents first (includes GuildMembers for username resolution)
        activeClient = await connectWithIntents([
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.DirectMessages
        ]);
      } catch (err: any) {
        // Check if error is due to missing Privileged Server Members Intent in Developer Portal
        const isPrivilegedIntentError = 
          err?.message?.includes('DisAllowedIntents') ||
          err?.message?.includes('Privileged intent') ||
          err?.code === 'DisAllowedIntents' ||
          err?.code === 4014;

        if (isPrivilegedIntentError) {
          console.warn('[DiscordService] Server Members Intent not enabled in Discord Developer Portal. Falling back to basic intents...');
          activeClient = await connectWithIntents([
            GatewayIntentBits.Guilds,
            GatewayIntentBits.DirectMessages
          ]);
        } else {
          throw err;
        }
      }

      this.client = activeClient;
      this.currentToken = botToken.trim();
      this.isConnecting = false;

      return {
        success: true,
        botTag: activeClient.user?.tag,
        botId: activeClient.user?.id
      };
    } catch (err: any) {
      this.isConnecting = false;
      this.client = null;
      return {
        success: false,
        error: err.message || 'Failed to authenticate with Discord API'
      };
    }
  }

  /**
   * Checks current connection status
   */
  public getStatus(): { isReady: boolean; botTag?: string; botId?: string } {
    if (this.client && this.client.isReady()) {
      return {
        isReady: true,
        botTag: this.client.user?.tag,
        botId: this.client.user?.id
      };
    }
    return { isReady: false };
  }

  /**
   * Formats the official Selection DM template (Never includes Room ID or Room Password)
   */
  public static formatSelectionMessage(captainName: string, teamName: string, customTemplate?: string): string {
    if (customTemplate && customTemplate.trim()) {
      return customTemplate
        .replace(/\{captain_name\}/gi, captainName)
        .replace(/\{team_name\}/gi, teamName);
    }
    return `🎉 Congratulations ${captainName}!\n\nYour team, ${teamName}, has been selected for today's tournament match.\n\nPlease stay ready and keep an eye on your Discord messages for room details.\n\nGood luck! 🔥`;
  }

  /**
   * Formats the official Match Details & Room Password DM template
   */
  public static formatRoomMessage(
    captainName: string,
    teamName: string,
    roomId: string,
    roomPassword: string,
    matchTime: string,
    additionalInstructions?: string,
    customTemplate?: string
  ): string {
    if (customTemplate && customTemplate.trim()) {
      return customTemplate
        .replace(/\{captain_name\}/gi, captainName)
        .replace(/\{team_name\}/gi, teamName)
        .replace(/\{room_id\}/gi, roomId)
        .replace(/\{room_password\}/gi, roomPassword)
        .replace(/\{match_time\}/gi, matchTime)
        .replace(/\{instructions\}/gi, additionalInstructions || '');
    }
    let msg = `🎮 **Match Room Details**
Team: **${teamName}**
Room ID: **${roomId}**
Password: **${roomPassword}**`;

    if (additionalInstructions && additionalInstructions.trim()) {
      msg += `\nInstructions: ${additionalInstructions.trim()}`;
    }

    return msg;
  }

  /**
   * Resolves a Discord user by numerical Snowflake ID, Mention, or Username/Tag/Nickname across mutual servers
   */
  public async resolveUser(identifier: string): Promise<User | null> {
    if (!this.client || !identifier || !identifier.trim()) return null;
    let clean = identifier.trim();

    // Handle Discord mention format <@!123456789> or <@123456789>
    const mentionMatch = clean.match(/^<@!?(\d+)>$/);
    if (mentionMatch) {
      clean = mentionMatch[1];
    }
    if (clean.startsWith('@')) clean = clean.slice(1).trim();

    // 1. If 17-20 digit numeric snowflake ID
    if (/^\d{17,20}$/.test(clean)) {
      try {
        const fetched = await this.client.users.fetch(clean);
        if (fetched) return fetched;
      } catch {}
    }

    const lowerClean = clean.toLowerCase();
    const [namePart] = lowerClean.split('#');

    // 2. Check cached users
    const cached = this.client.users.cache.find(u => 
      u.username.toLowerCase() === lowerClean || 
      u.tag.toLowerCase() === lowerClean ||
      u.username.toLowerCase() === namePart ||
      (u.globalName && u.globalName.toLowerCase() === lowerClean)
    );
    if (cached) return cached;

    // 3. Search across guilds the bot has joined
    for (const guild of this.client.guilds.cache.values()) {
      try {
        const members = await guild.members.fetch({ query: clean, limit: 25 });
        const match = members.find(m => 
          m.user.username.toLowerCase() === lowerClean || 
          m.user.tag.toLowerCase() === lowerClean ||
          m.user.username.toLowerCase() === namePart ||
          m.displayName.toLowerCase() === lowerClean ||
          (m.nickname && m.nickname.toLowerCase() === lowerClean) ||
          (m.user.globalName && m.user.globalName.toLowerCase() === lowerClean)
        );
        if (match) return match.user;
      } catch {}

      // Cache search fallback
      try {
        if (guild.memberCount <= 1000 && guild.members.cache.size < guild.memberCount) {
          await guild.members.fetch().catch(() => {});
        }
        const cachedMatch = guild.members.cache.find(m => 
          m.user.username.toLowerCase() === lowerClean || 
          m.user.tag.toLowerCase() === lowerClean ||
          m.user.username.toLowerCase() === namePart ||
          m.displayName.toLowerCase() === lowerClean ||
          (m.nickname && m.nickname.toLowerCase() === lowerClean) ||
          (m.user.globalName && m.user.globalName.toLowerCase() === lowerClean) ||
          m.user.username.toLowerCase().includes(namePart)
        );
        if (cachedMatch) return cachedMatch.user;
      } catch {}
    }

    return null;
  }

  /**
   * Sends a selection congratulations DM to a captain (Never includes room ID or password)
   */
  public async sendSelectionDM(
    selectionId: string, 
    captainDiscordId: string, 
    captainName: string, 
    teamName: string, 
    teamId: string,
    forceRetry: boolean = false,
    customTemplate?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!captainDiscordId || !captainDiscordId.trim()) {
      const err = `Missing Discord User ID/Username for "${teamName}".`;
      if (this.db) {
        this.db.updateSelectionNotificationStatus(selectionId, 'failed', null, err);
        this.db.logNotification({
          type: 'selection_congratulations',
          team_id: teamId,
          captain_discord_id: 'MISSING',
          captain_name: captainName,
          status: 'failed',
          message_content: 'Selection Congratulations Notification',
          error_message: err
        });
      }
      return { success: false, error: err };
    }

    // Ensure client is ready
    const initRes = await this.initializeClient();
    if (!initRes.success || !this.client) {
      const err = initRes.error || 'Discord bot client is not connected. Please check bot token in Settings.';
      if (this.db) {
        this.db.updateSelectionNotificationStatus(selectionId, 'failed', null, err);
      }
      return { success: false, error: err };
    }

    const messageContent = DiscordService.formatSelectionMessage(captainName, teamName, customTemplate);

    try {
      if (this.db) {
        this.db.updateSelectionNotificationStatus(selectionId, 'sending');
      }

      // Fetch user by Discord snowflake or username
      const user = await this.resolveUser(captainDiscordId);
      if (!user) {
        throw new Error(`Discord user "${captainDiscordId}" was not found. Please ensure they have joined the Discord server where this bot is installed, or enter their 17-20 digit Discord User ID.`);
      }

      // Send DM
      const sentMsg = await user.send(messageContent);

      if (this.db) {
        this.db.updateSelectionNotificationStatus(selectionId, 'sent', sentMsg.id);
        this.db.logNotification({
          type: 'selection_congratulations',
          team_id: teamId,
          captain_discord_id: captainDiscordId,
          captain_name: captainName,
          status: 'sent',
          message_content: messageContent,
          message_id: sentMsg.id
        });
      }

      return { success: true, messageId: sentMsg.id };
    } catch (err: any) {
      let friendlyError = err.message || 'Failed to send direct message';
      if (err.code === 50007) {
        friendlyError = `Cannot send DM to ${captainDiscordId}. Their Discord Privacy Settings block direct messages from server bots, or they do not share a mutual server with the bot.`;
      }

      if (this.db) {
        this.db.updateSelectionNotificationStatus(selectionId, 'failed', null, friendlyError);
        this.db.logNotification({
          type: 'selection_congratulations',
          team_id: teamId,
          captain_discord_id: captainDiscordId,
          captain_name: captainName,
          status: 'failed',
          message_content: messageContent,
          error_message: friendlyError
        });
      }

      return { success: false, error: friendlyError };
    }
  }

  /**
   * Sends room ID and password DM to a selected captain
   */
  public async sendRoomDM(
    captainDiscordId: string,
    captainName: string,
    teamName: string,
    teamId: string,
    roomId: string,
    roomPassword: string,
    matchTime: string,
    additionalInstructions?: string,
    customTemplate?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!captainDiscordId || !captainDiscordId.trim()) {
      const err = `Missing Discord User ID/Username for "${teamName}".`;
      if (this.db) {
        this.db.logNotification({
          type: 'room_password',
          team_id: teamId,
          captain_discord_id: 'MISSING',
          captain_name: captainName,
          status: 'failed',
          message_content: 'Match Room Announcement',
          error_message: err
        });
      }
      return { success: false, error: err };
    }

    const initRes = await this.initializeClient();
    if (!initRes.success || !this.client) {
      return { success: false, error: initRes.error || 'Discord bot client is not connected' };
    }

    const messageContent = DiscordService.formatRoomMessage(
      captainName,
      teamName,
      roomId,
      roomPassword,
      matchTime,
      additionalInstructions,
      customTemplate
    );

    const safeLogContent = `Free Fire Tournament Match Details: Room ID ${roomId}`;

    try {
      const user = await this.resolveUser(captainDiscordId);
      if (!user) {
        throw new Error(`Discord user "${captainDiscordId}" was not found. Please ensure they have joined the Discord server where this bot is installed, or enter their 17-20 digit Discord User ID.`);
      }

      const sentMsg = await user.send(messageContent);

      if (this.db) {
        this.db.logNotification({
          type: 'room_password',
          team_id: teamId,
          captain_discord_id: captainDiscordId,
          captain_name: captainName,
          status: 'sent',
          message_content: safeLogContent,
          message_id: sentMsg.id
        });
      }

      return { success: true, messageId: sentMsg.id };
    } catch (err: any) {
      let friendlyError = err.message || 'Failed to send room announcement';
      if (err.code === 50007) {
        friendlyError = `Cannot send DM to ${captainDiscordId}. User privacy settings block direct messages from server bots.`;
      }

      if (this.db) {
        this.db.logNotification({
          type: 'room_password',
          team_id: teamId,
          captain_discord_id: captainDiscordId,
          captain_name: captainName,
          status: 'failed',
          message_content: safeLogContent,
          error_message: friendlyError
        });
      }

      return { success: false, error: friendlyError };
    }
  }

  /**
   * Disconnects the Discord client
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.destroy();
      } catch {}
      this.client = null;
      this.currentToken = '';
    }
  }

  /**
   * Sends a custom direct message to a user
   */
  public async sendDirectMessage(
    captainDiscordId: string,
    messageContent: string,
    teamId?: string,
    captainName?: string,
    teamName?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!captainDiscordId || !captainDiscordId.trim()) {
      const err = `Missing Discord User ID or Username.`;
      if (this.db) {
        this.db.logNotification({
          type: 'custom_dm',
          team_id: teamId || '',
          captain_discord_id: 'MISSING',
          captain_name: captainName || 'Unknown',
          status: 'failed',
          message_content: messageContent,
          error_message: err
        });
      }
      return { success: false, error: err };
    }

    const initRes = await this.initializeClient();
    if (!initRes.success || !this.client) {
      const err = initRes.error || 'Discord bot is not connected. Please check your token in Settings.';
      if (this.db) {
        this.db.logNotification({
          type: 'custom_dm',
          team_id: teamId || '',
          captain_discord_id: captainDiscordId,
          captain_name: captainName || 'Unknown',
          status: 'failed',
          message_content: messageContent,
          error_message: err
        });
      }
      return { success: false, error: err };
    }

    try {
      const user = await this.resolveUser(captainDiscordId);
      if (!user) {
        throw new Error(`Discord user "${captainDiscordId}" was not found. Ensure the user is in the Discord server with the bot.`);
      }

      const sentMsg = await user.send(messageContent);

      if (this.db) {
        this.db.logNotification({
          type: 'custom_dm',
          team_id: teamId || '',
          captain_discord_id: captainDiscordId,
          captain_name: captainName || user.username,
          status: 'sent',
          message_content: messageContent,
          message_id: sentMsg.id
        });
      }

      return { success: true, messageId: sentMsg.id };
    } catch (err: any) {
      let friendlyError = err.message || 'Failed to send direct message';
      if (err.code === 50007) {
        friendlyError = `Cannot send DM to ${captainDiscordId}. User privacy settings block direct messages, or user does not share a server with the bot.`;
      }

      if (this.db) {
        this.db.logNotification({
          type: 'custom_dm',
          team_id: teamId || '',
          captain_discord_id: captainDiscordId,
          captain_name: captainName || 'Unknown',
          status: 'failed',
          message_content: messageContent,
          error_message: friendlyError
        });
      }

      return { success: false, error: friendlyError };
    }
  }
}
