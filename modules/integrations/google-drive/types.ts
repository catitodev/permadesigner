/**
 * Google Drive integration types.
 */

export interface GoogleDriveTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

export interface GoogleDriveIntegration {
  /** Whether the user has connected their Drive. */
  readonly connected: boolean;

  /** Upload a file (PDF buffer) to the user's Drive folder. */
  uploadFile(params: {
    fileName: string;
    mimeType: string;
    buffer: Buffer;
    folderId?: string;
  }): Promise<{ fileId: string; webViewLink: string }>;

  /** Create the "PermaDesigner" folder if it doesn't exist, return its ID. */
  getOrCreateFolder(): Promise<string>;

  /** Revoke the access token at Google's endpoint. */
  revokeAccess(): Promise<void>;
}
