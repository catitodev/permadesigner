/**
 * Google Drive adapter — implements GoogleDriveIntegration using googleapis.
 * All operations happen server-side. Tokens are decrypted just-in-time.
 */

import { google } from "googleapis";
import { Readable } from "stream";
import type { GoogleDriveIntegration, GoogleDriveTokens } from "./types";

const FOLDER_NAME = "PermaDesigner";

export class GoogleDriveAdapter implements GoogleDriveIntegration {
  private tokens: GoogleDriveTokens;
  private oauth2Client;

  constructor(tokens: GoogleDriveTokens) {
    this.tokens = tokens;
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    this.oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });
  }

  get connected(): boolean {
    return !!this.tokens.refresh_token;
  }

  async getOrCreateFolder(): Promise<string> {
    const drive = google.drive({ version: "v3", auth: this.oauth2Client });

    // Search for existing folder
    const res = await drive.files.list({
      q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id)",
      spaces: "drive",
    });

    if (res.data.files && res.data.files.length > 0) {
      return res.data.files[0].id!;
    }

    // Create folder
    const folder = await drive.files.create({
      requestBody: {
        name: FOLDER_NAME,
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id",
    });

    return folder.data.id!;
  }

  async uploadFile(params: {
    fileName: string;
    mimeType: string;
    buffer: Buffer;
    folderId?: string;
  }): Promise<{ fileId: string; webViewLink: string }> {
    const drive = google.drive({ version: "v3", auth: this.oauth2Client });
    const folderId = params.folderId ?? await this.getOrCreateFolder();

    const stream = new Readable();
    stream.push(params.buffer);
    stream.push(null);

    const file = await drive.files.create({
      requestBody: {
        name: params.fileName,
        parents: [folderId],
      },
      media: {
        mimeType: params.mimeType,
        body: stream,
      },
      fields: "id, webViewLink",
    });

    return {
      fileId: file.data.id!,
      webViewLink: file.data.webViewLink ?? "",
    };
  }

  async revokeAccess(): Promise<void> {
    try {
      await this.oauth2Client.revokeToken(this.tokens.access_token);
    } catch {
      // Best effort — token might already be invalid
    }
  }
}
