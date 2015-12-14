// Youtube will handle the youtube API requests
var Youtube = require("youtube-api"),
	// We will use 'fs' to read the video file
	Fs = require("fs"),
	// 'r-json' will read the JSON file (credentials)
	ReadJson = require("r-json"), 
	// 'lien' handles the server requests (okito.dev:5000)
	Lien = require("lien"), 
	// Logging things
	Logger = require("bug-killer"), 
	// Open in the default browser
	Opn = require("opn"),
	ReadLine = require("readline")
	;

const CREDENTIALS = ReadJson("./credentials.json"), 
	// Set the video path (it can be any video file)
	VIDEO_PATH = "video.mp4"
	;

// Init the lien Server
var server = new Lien({
	host: "okito.dev",
	port: 5000
});

// Create the stdin interface (prompts)
var stdIn = ReadLine.createInterface({
	input: process.stdin,
	output: process.stdout
});

// Authenticate using the credentials
var oauth = Youtube.authenticate({
	type: "oauth",
	client_id: CREDENTIALS.web.client_id,
	client_secret: CREDENTIALS.web.client_secret,
	redirect_url: CREDENTIALS.web.redirect_uris[0]
});

// Open the authentication url in the default browser
Opn(oauth.generateAuthUrl({
	access_type: "offline",
	scope: ["https://www.googleapis.com/auth/youtube.upload"]
}));

// Here we're waiting for the OAuth2 redirect containing the auth code
server.page.add("/oauth2callback", function(lien){
	Logger.log("Trying to get the token using the following code : " + lien.search.code);

	// Get the access token
	oauth.getToken(lien.search.code, function(err, tokens) {
		if (err) { lien.end(err, 400); return Logger.log(err); }

		// Set the credentials
		oauth.setCredentials(tokens);

		// And finally upload the video!!
		Youtube.videos.insert({
			resource: {
				// Video title and description
				snippet: {
					title: "Testing Youtube API NodeJS module",
					description: "Test video upload via Youtube API"
				}, 
				// I don't want to show it to any body
				status : {
					privacyStatus: "private"
				}
			},
			// This is for callback function
			part: "snippet,status",
			// Create the readable stream to upload the video
			media: {
				body: Fs.createReadStream(VIDEO_PATH)
			}
		}, function(err, data) {
			if (err) { return lien.end(err, 400); }
			lien.end(data);
		});
	});
});