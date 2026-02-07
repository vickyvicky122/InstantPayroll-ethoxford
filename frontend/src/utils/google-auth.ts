// Ambient types for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }): { requestAccessToken(): void };
        };
      };
    };
  }
}

/**
 * Dynamically loads the Google Identity Services script if not already present.
 */
export function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services script"));
    document.head.appendChild(script);
  });
}

/**
 * Opens the Google OAuth popup and returns an access token.
 */
export async function requestGoogleAccessToken(clientId: string): Promise<string> {
  await loadGoogleScript();

  if (!window.google?.accounts?.oauth2) {
    throw new Error("Google Identity Services not available");
  }

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.metadata.readonly",
      callback: (response) => {
        if (response.error) {
          reject(new Error(`Google OAuth error: ${response.error}`));
        } else if (response.access_token) {
          resolve(response.access_token);
        } else {
          reject(new Error("No access token received"));
        }
      },
    });
    client.requestAccessToken();
  });
}

/**
 * Extracts a Google Doc file ID from a URL like
 * https://docs.google.com/document/d/FILE_ID/edit
 * or returns the input as-is if it's already a raw ID.
 */
export function parseGoogleDocId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // Also handle spreadsheets/presentations in case user pastes those
  const altMatch = trimmed.match(/\/(?:spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/);
  if (altMatch) return altMatch[1];
  return trimmed;
}
