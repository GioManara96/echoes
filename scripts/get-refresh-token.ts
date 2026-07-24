// One-time script: obtains the Spotify refresh token via the OAuth Authorization Code flow.
// Run from the project root: node --env-file=.env.local scripts/get-refresh-token.ts
// Then open http://127.0.0.1:8888 in the browser and follow the login.
import { createServer } from "node:http";

type TokenResponse = {
  refresh_token: string;
};

const redirectUri = requestEnv("SPOTIFY_REDIRECT_URI");
const clientId = requestEnv("SPOTIFY_CLIENT_ID");
const clientSecret = requestEnv("SPOTIFY_CLIENT_SECRET");

const url = new URL("https://accounts.spotify.com/authorize");
url.searchParams.set("client_id", clientId);
url.searchParams.set("response_type", "code");
url.searchParams.set("redirect_uri", redirectUri);
url.searchParams.set("scope", "user-read-currently-playing user-top-read user-read-recently-played");

// Minimal HTTP server hosting the OAuth dance. Node calls this handler once per
// incoming request; req describes what the browser asked for, res is our reply
// (every branch must call res.end(), or the browser hangs waiting).
const server = createServer((req, res) => {
  // req.url is a relative string ("/callback?code=..."): rebuild a full URL to parse it
  const requestUrl = new URL(req.url ?? "", "http://127.0.0.1:8888");
  const code = requestUrl.searchParams.get("code");
  if (requestUrl.pathname === "/") {
    // Entry point: bounce the browser to Spotify's consent page (302 = redirect)
    res.writeHead(302, { Location: url.toString() });
    res.end();
  } else if (requestUrl.pathname === "/callback" && code) {
    // Spotify redirected back with a short-lived, single-use authorization code.
    // The http handler is synchronous, so the async exchange runs in an IIFE.
    (async () => {
      try {
        const tokenResponse = await getToken(code);
        console.log("Refresh token:", tokenResponse.refresh_token);
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Token received. Go back to the terminal to continue.");
      } catch (error) {
        console.error(error);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Failed to get the token. Go back to the terminal for details.");
      }
      // Stop accepting connections so the script exits on its own
      server.close();
    })();
  } else {
    // Anything else (typically /favicon.ico) must end here: redirecting it to
    // Spotify would silently trigger a second OAuth round
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});

// listen() binds the port and keeps the process alive waiting for requests
server.listen(8888, () => {
  console.log("Server is running on port 8888");
});

// Reads a required env var, failing fast with a clear message if missing
function requestEnv(env: string): string {
  const value = process.env[env];
  if (!value) {
    throw new Error(`${env} is not set`);
  }
  return value;
}

// Exchanges the authorization code for the tokens, server-to-server.
// App credentials travel in a Basic auth header; the body must be form-encoded, not JSON.
async function getToken(code: string): Promise<TokenResponse> {
  const response = await fetch(`https://accounts.spotify.com/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get token: ${response.status} ${await response.text()}`);
  }

  const tokenResponse: TokenResponse = await response.json();
  return tokenResponse;
}
