import { fetchRdap } from './rdap';
import { isPrivateIP } from './utils/ip';

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const clientIP = request.headers.get('cf-connecting-ip');

		if (clientIP === null) {
			return Response.json({
				status: 'error',
				message: 'No IP address found',
			});
		}

		// /rdap/all エンドポイントの処理
		if (url.pathname === '/rdap/all') {
			try {
				// キャッシュキーを作成
				const cacheKey = new Request(`https://rdap-cache/${clientIP}`, request);
				const cache = caches.default;

				// キャッシュからデータを取得を試みる
				let rdapResponse = await cache.match(cacheKey);
				let rdapData;

				if (!rdapResponse) {
					// キャッシュにない場合は取得してキャッシュに保存
					rdapData = await fetchRdap(clientIP);
					if (rdapData) {
						rdapResponse = Response.json(rdapData);
						// キャッシュに1時間保存
						rdapResponse.headers.append('Cache-Control', 's-maxage=86400');
						ctx.waitUntil(cache.put(cacheKey, rdapResponse.clone()));
					}
				} else {
					// キャッシュから取得できた場合
					rdapData = await rdapResponse.json();
				}

				if (rdapData) {
					return Response.json(rdapData);
				} else {
					return Response.json({
						status: 'rdapError',
						message: 'Failed to fetch RDAP data',
					});
				}
			} catch (error) {
				return Response.json({
					status: 'error',
					message: (error as Error).message,
				});
			}
		}

		// メインエンドポイントの処理
		if (isPrivateIP(clientIP)) {
			return Response.json({
				status: 'ok',
				ClientIP: clientIP,
				Name: 'internal',
				Organization: '',
			});
		} else {
			try {
				// キャッシュキーを作成
				const cacheKey = new Request(`https://rdap-cache/${clientIP}`, request);
				const cache = caches.default;

				// キャッシュからデータを取得を試みる
				let rdapResponse = await cache.match(cacheKey);
				let rdapData;

				if (!rdapResponse) {
					// キャッシュにない場合は取得してキャッシュに保存
					rdapData = await fetchRdap(clientIP);
					if (rdapData) {
						rdapResponse = Response.json(rdapData);
						// キャッシュに1時間保存
						rdapResponse.headers.append('Cache-Control', 's-maxage=86400');
						ctx.waitUntil(cache.put(cacheKey, rdapResponse.clone()));
					}
				} else {
					// キャッシュから取得できた場合
					rdapData = await rdapResponse.json();
				}

				if (!rdapData) {
					throw new Error('RDAP data not available');
				}

				// 組織名を取得
				let organization = '';
				if (rdapData.remarks && Array.isArray(rdapData.remarks)) {
					for (const remark of rdapData.remarks) {
						if (remark.title === 'description' && remark.description && remark.description.length > 0) {
							organization = remark.description[0];
							break;
						}
					}
				}

				return Response.json({
					status: 'ok',
					ClientIP: clientIP,
					Name: rdapData.name || '',
					Organization: organization,
				});
			} catch (error) {
				console.error('Error processing RDAP data:', error);
				return Response.json({
					status: 'rdapError',
					ClientIP: clientIP,
					Name: '',
					Organization: '',
				});
			}
		}
	},
} satisfies ExportedHandler<Env>;
