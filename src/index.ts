// import discord.js
import { Client, Events, GatewayIntentBits } from "discord.js";
import { ENV } from "./env.js";
import { messageCreate } from "./events/messageCreate.js";

// create a new Client instance
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

// listen for the client to be ready
client.once(Events.ClientReady, (c) => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on("messageCreate", (e) => messageCreate(client, e));

// login with the token from .env.local
client.login(ENV.DISCORD_TOKEN);
