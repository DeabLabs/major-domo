import type { Client, Events, Message } from "discord.js";
import invariant from "tiny-invariant";
import { z } from "zod";
import { ENV } from "../env";

const websiteUrl = //"https://cannoli.website/canvas/open";
	process.env.NODE_ENV !== "production"
		? "http://localhost:5173/canvas/open"
		: "https://cannoli.website/canvas/open";

const websitePayloadSchema = z.object({
	redirect: z.string(),
	expiration: z.number(),
});

export const messageCreate = async (client: Client, message: Message) => {
	if (message.author.bot) return;

	// check if the message has an attachment with the extension .canvas
	if (
		message.attachments.size > 0 &&
		message.attachments.first()?.name.endsWith(".canvas")
	) {
		try {
			// download the attachment
			const attachment = message.attachments.first()?.url;
			invariant(attachment, "Attachment is undefined");
			const blob = await fetch(attachment).then((res) => res.blob());
			// parse the blob as json
			const json = await blob.text();
			// send json to cannoli server
			const response = await fetch(websiteUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${ENV.WEBSITE_SECRET}`,
				},
				body: json,
			});

			invariant(response.ok, "Response is not ok");
			const data = await response.json();
			const payload = websitePayloadSchema.parse(data);
			const { redirect, expiration } = payload;

			// Reply to the message with the redirect url
			// using discord's timestamp format to display the expiration time in the user's timezone
			await message.reply(
				`Please visit ${redirect} to see your canvas.\nThis link will expire on <t:${Math.floor(expiration)}:f>.`,
			);
		} catch (error) {
			console.error(error);
		}
	}
};
