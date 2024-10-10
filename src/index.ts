export default {
	async fetch(request, env, ctx): Promise<Response> {
		let requestHeaders = JSON.stringify([...request.headers], null, 2);
		// console.log(request.headers);
		// const clientIP = request.headers.get('CF-Connecting-IP');

		console.log(requestHeaders);
		return Response.json([...request.headers]);
	},
} satisfies ExportedHandler<Env>;
