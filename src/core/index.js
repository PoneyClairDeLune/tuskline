"use strict";

let targets = eG("BACKENDS", "").split(",");

let packEmojis = (emojiArr) => {
	let resArr = [];
	emojiArr.forEach((e) => {
		resArr.push({
			"c": e.shortcode,
			"u": e.url
		});
	});
	return resArr;
};

export const handleRequest = async function (req, client) {
	let reqUrl = new URL(req.url);
	// Timeline merger
	let reply = {
		"lastIDs": {}
	};
	let bigObject = [];
	for (let i = 0; i < targets.length; i ++) {
		// Had to use a for loop to ensure the function finishes
		let e = targets[i];
		let target = `https://${e}/api/v1/timelines/public?local=true&only_media=false`;
		try {
			let events = await(await fetch(target)).json();
			events.forEach((e0) => {
				reply.lastIDs[e] = e0.id;
				let evObj = {
					"type": "post",
					"server": e,
					"app": {
						"name": e0?.application?.name || "Unknown",
						"link": e0?.application?.website || "about:blank"
					},
					"user": {
						"at": e0.account.username,
						"name": e0.account.display_name,
						"id": e0.account.id,
						"emoji": packEmojis(e0.account.emojis),
						"bot": e0.account.bot,
						"locked": e0.account.locked,
						"url": e0.account.url
					},
					"create": (new Date(e0.created_at)).getTime(),
					"post": e0.content,
					"emoji": packEmojis(e0.emojis),
					"favs": e0.favourites_ount,
					"boosts": e0.reblogs_count,
					"replies": e0.replies_count,
					"lang": e0.language,
					"cw": e0.sensitive,
					"cwt": e0.spoiler_text,
					"reach": e0.visibility,
					"url": e0.url,
					"media": e0.media_attachments,
					"refer": e0.mentions,
					"poll": e0.poll
				};
				if (e0.edited_at) {
					evObj.edit = (new Date(e0.edited_at)).getTime();
				};
				if (e0.in_reply_to_id) {
					evObj.reply = e0.in_reply_to_id;
					evObj.replyTo = e0.in_reply_to_account_id;
				};
				bigObject.push(evObj);
			});
		} catch (err) {
			bigObject.push({
				"type": "error",
				"create": Date.now(),
				"server": e,
				"stack": err.stack
			});
		};
	};
	bigObject.sort((a, b) => {
		return Math.sign(b.create - a.create);
	});
	reply.timeline = bigObject;
	return new Response(JSON.stringify(reply), {
		headers: {
			"Content-Type": "application/json"
		}
	});
};