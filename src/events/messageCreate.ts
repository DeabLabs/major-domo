import { hyperlink, type Client, type Events, type Message } from "discord.js";
import invariant from "tiny-invariant";
import { z } from "zod";
import { ENV } from "../env";

const websiteUrl = //"https://cannoli.website/canvas/open";
	process.env.NODE_ENV !== "production"
		? "http://localhost:5173/canvas/open"
		: "https://cannoli.website/canvas/open";

const websitePayloadSchema = z.object({
	redirect: z.string(),
	expirationDateMs: z.number(),
	downloadUrlObsidian: z.string(),
	downloadUrlRaw: z.string(),
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
			const { redirect, expirationDateMs, downloadUrlObsidian } = payload;
			const filename = message.attachments.first()?.name;
			invariant(filename, "Filename is undefined");
			const openInObsidian = `${downloadUrlObsidian}?filename=${encodeURIComponent(`Cannoli Downloads/${filename}`)}`;

			// Reply to the message with the redirect url and expiration time
			await message.reply(
				// `If you would like to preview this cannoli on the web, click the link below:\n\n${hyperlink("Open on Cannoli Website Editor", redirect)}\n\nIf you'd like to download and open this in Obsidian, click the link below:\n\n${hyperlink("Open in Obsidian", openInObsidian)}\n\nThese links will expire on <t:${Math.floor(expirationDateMs / 1000)}:f>.`,
				`If you'd like to download and open this cannoli in Obsidian, click the link below:\n\n${hyperlink("Open in Obsidian", openInObsidian)}\n\nThese links will expire on <t:${Math.floor(expirationDateMs / 1000)}:f>.`,
			);
		} catch (error) {
			console.error(error);
		}
	}
};
