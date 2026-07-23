// da lanciare con node --env-file=.env.local scripts/get-refresh-token.ts nella root del progetto
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

const server = createServer((req, res) => {
  const requestUrl = new URL(req.url ?? "", "http://127.0.0.1:8888");
  const code = requestUrl.searchParams.get("code");
  if (requestUrl.pathname === "/") {
    res.writeHead(302, { Location: url.toString() });
    res.end();
  } else if (requestUrl.pathname === "/callback" && code) {
    (async () => {
      try {
        const tokenResponse = await getToken(code);
        console.log("Refresh token:", tokenResponse.refresh_token);
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Token ricevuto. torna sul terminale per proseguire.");
      } catch (error) {
        console.error(error);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Errore nel ricevere il token. torna sul terminale per proseguire.");
      }
      server.close();
    })();
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});

server.listen(8888, () => {
  console.log("Server is running on port 8888");
});

// helper function to request an environment variable
function requestEnv(env: string): string {
  const value = process.env[env];
  if (!value) {
    throw new Error(`${env} is not set`);
  }
  return value;
}

// function to get token
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
