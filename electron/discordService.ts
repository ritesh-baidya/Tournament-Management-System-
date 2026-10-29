import { Client, GatewayIntentBits, Partials, User } from 'discord.js';
import { TournamentDatabase } from './database';

export class DiscordService {
  private client: Client | null = null;
  private isConnecting: boolean = false;
  private currentToken: string = '';

  constructor(private db: TournamentDatabase) {}

  /**
   * Initializes or re-initializes Discord bot client with given token
   */
  public async initializeClient(token?: string): Promise<{ success: boolean; botTag?: string; botId?: string; error?: string }> {
    const botToken = token || this.db.getSetting('discord_bot_token');
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
      const client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.DirectMessages
        ],
        partials: [Partials.Channel, Partials.Message, Partials.User]
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timed out after 15 seconds. Please check your token or internet connection.'));
        }, 15000);

        client.once('ready', () => {
          clearTimeout(timeout);
          resolve();
        });

        client.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });

        client.login(botToken.trim()).catch((err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      this.client = client;
      this.currentToken = botToken.trim();
      this.isConnecting = false;

      return {
        success: true,
        botTag: client.user?.tag,
        botId: client.user?.id
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
   * Formats the official Selection DM template
   */
  public static formatSelectionMessage(captainName: string, teamName: string): string {
    return `🎉 Congratulations, ${captainName}!

Your team, ${teamName}, has been selected for today's Free Fire tournament match.

Your match details and room password will be sent later. Please stay ready and keep an eye on your Discord messages.

Good luck! 🔥`;
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
    additionalInstructions?: string
  ): string {
    let msg = `🔥 Free Fire Tournament — Match Details

Hello ${captainName}!

Your team ${teamName} has been selected for this match.

Room ID: ${roomId}
Room Password: ${roomPassword}
Match Time: ${matchTime}

Please join on time and follow the tournament rules.

Good luck! 🎮`;

    if (additionalInstructions && additionalInstructions.trim()) {
      msg += `\n\n📌 Instructions: ${additionalInstructions.trim()}`;
    }

    return msg;
  }

  /**
   * Sends a selection congratulations DM to a captain
   */
  public async sendSelectionDM(
    selectionId: string, 
    captainDiscordId: string, 
    captainName: string, 
    teamName: string, 
    teamId: string,
    forceRetry: boolean = false
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Validate Discord ID
    if (!captainDiscordId || !/^\d{17,20}$/.test(captainDiscordId.trim())) {
      const err = `Invalid Discord Snowflake ID: "${captainDiscordId}". Must be 17-20 digits.`;
      this.db.updateSelectionNotificationStatus(selectionId, 'failed', null, err);
      this.db.logNotification({
        type: 'selection_dm',
        team_id: teamId,
        captain_discord_id: captainDiscordId || 'MISSING',
        captain_name: captainName,
        status: 'failed',
        message_content: 'Selection Notification',
        error_message: err
      });
      return { success: false, error: err };
    }

    // Ensure client is ready
    const initRes = await this.initializeClient();
    if (!initRes.success || !this.client) {
      const err = initRes.error || 'Discord bot client is not connected';
      this.db.updateSelectionNotificationStatus(selectionId, 'failed', null, err);
      return { success: false, error: err };
    }

    const messageContent = DiscordService.formatSelectionMessage(captainName, teamName);

    try {
      this.db.updateSelectionNotificationStatus(selectionId, 'sending');

      // Fetch user by Discord snowflake
      const user: User = await this.client.users.fetch(captainDiscordId.trim());
      if (!user) {
        throw new Error(`Discord user with ID ${captainDiscordId} not found.`);
      }

      // Send DM
      const sentMsg = await user.send(messageContent);

      this.db.updateSelectionNotificationStatus(selectionId, 'sent', sentMsg.id);
      this.db.logNotification({
        type: 'selection_dm',
        team_id: teamId,
        captain_discord_id: captainDiscordId,
        captain_name: captainName,
        status: 'sent',
        message_content: messageContent,
        message_id: sentMsg.id
      });

      return { success: true, messageId: sentMsg.id };
    } catch (err: any) {
      let friendlyError = err.message || 'Failed to send direct message';
      if (err.code === 50007) {
        friendlyError = 'Cannot send messages to this user (DMs are closed or user does not share a server with the bot).';
      }

      this.db.updateSelectionNotificationStatus(selectionId, 'failed', null, friendlyError);
      this.db.logNotification({
        type: 'selection_dm',
        team_id: teamId,
        captain_discord_id: captainDiscordId,
        captain_name: captainName,
        status: 'failed',
        message_content: messageContent,
        error_message: friendlyError
      });

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
    additionalInstructions?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!captainDiscordId || !/^\d{17,20}$/.test(captainDiscordId.trim())) {
      const err = `Invalid Discord Snowflake ID: "${captainDiscordId}".`;
      this.db.logNotification({
        type: 'room_dm',
        team_id: teamId,
        captain_discord_id: captainDiscordId || 'MISSING',
        captain_name: captainName,
        status: 'failed',
        message_content: 'Match Room Announcement',
        error_message: err
      });
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
      additionalInstructions
    );

    // Notice: we log without exposing room password in general logs
    const safeLogContent = `Free Fire Tournament Match Details: Room ID ${roomId}, Match Time ${matchTime}`;

    try {
      const user = await this.client.users.fetch(captainDiscordId.trim());
      if (!user) {
        throw new Error(`Discord user with ID ${captainDiscordId} not found.`);
      }

      const sentMsg = await user.send(messageContent);

      this.db.logNotification({
        type: 'room_dm',
        team_id: teamId,
        captain_discord_id: captainDiscordId,
        captain_name: captainName,
        status: 'sent',
        message_content: safeLogContent,
        message_id: sentMsg.id
      });

      return { success: true, messageId: sentMsg.id };
    } catch (err: any) {
      let friendlyError = err.message || 'Failed to send room announcement';
      if (err.code === 50007) {
        friendlyError = 'Cannot send DM to this user. User privacy settings block direct messages from server bots.';
      }

      this.db.logNotification({
        type: 'room_dm',
        team_id: teamId,
        captain_discord_id: captainDiscordId,
        captain_name: captainName,
        status: 'failed',
        message_content: safeLogContent,
        error_message: friendlyError
      });

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
}
