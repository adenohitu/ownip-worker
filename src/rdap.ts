import { isIpInRange } from './utils/ip';

// IANAのRDAPブートストラップJSONファイルのURL
const IANA_IPV4_BOOTSTRAP_URL = 'https://data.iana.org/rdap/ipv4.json';
const IANA_IPV6_BOOTSTRAP_URL = 'https://data.iana.org/rdap/ipv6.json';

// ブートストラップJSONのインターフェース
interface RdapBootstrap {
	description: string;
	publication: string;
	services: Array<[string[], string[]]>;
	version: string;
}

// キャッシュ用変数
let ipv4BootstrapCache: RdapBootstrap | null = null;
let ipv6BootstrapCache: RdapBootstrap | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 86400000; // 24時間（ミリ秒）

/**
 * IANAのRDAPブートストラップJSONを取得します
 * @param isIpv6 IPv6の場合はtrue
 * @returns ブートストラップJSONオブジェクト
 */
async function fetchRdapBootstrap(isIpv6: boolean): Promise<RdapBootstrap> {
	const now = Date.now();

	// キャッシュが有効かチェック
	if (isIpv6 && ipv6BootstrapCache && now - cacheTimestamp < CACHE_TTL) {
		return ipv6BootstrapCache;
	} else if (!isIpv6 && ipv4BootstrapCache && now - cacheTimestamp < CACHE_TTL) {
		return ipv4BootstrapCache;
	}

	try {
		const url = isIpv6 ? IANA_IPV6_BOOTSTRAP_URL : IANA_IPV4_BOOTSTRAP_URL;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`ブートストラップJSONの取得に失敗: ${response.status}`);
		}

		const bootstrap = (await response.json()) as RdapBootstrap;

		// キャッシュを更新
		if (isIpv6) {
			ipv6BootstrapCache = bootstrap;
		} else {
			ipv4BootstrapCache = bootstrap;
		}
		cacheTimestamp = now;

		return bootstrap;
	} catch (error) {
		console.error('RDAPブートストラップの取得エラー:', error);
		throw error;
	}
}

/**
 * IPアドレスに対応するRDAPサーバーのURLを取得します
 * @param ip IPアドレス
 * @returns RDAPサーバーのURL（見つからない場合はデフォルト値）
 */
export async function getRdapServerUrl(ip: string): Promise<string> {
	try {
		const isIpv6 = ip.includes(':');
		const bootstrap = await fetchRdapBootstrap(isIpv6);

		for (const service of bootstrap.services) {
			const ipRanges = service[0];
			const serverUrls = service[1];

			for (const range of ipRanges) {
				if (isIpInRange(ip, range)) {
					// HTTPSのURLを優先
					const httpsUrl = serverUrls.find((url) => url.startsWith('https'));
					return httpsUrl || serverUrls[0];
				}
			}
		}

		// 対応するサーバーが見つからない場合のデフォルト
		return isIpv6 ? 'https://rdap.db.ripe.net/ip/' : 'https://rdap.db.ripe.net/ip/';
	} catch (error) {
		console.error('RDAPサーバー取得エラー:', error);
		return 'https://rdap.db.ripe.net/ip/';
	}
}

export async function fetchRdap(ip: string): Promise<any> {
	try {
		const baseUrl = await getRdapServerUrl(ip);

		// サーバーURLが既にパスを含む場合とそうでない場合で処理を分ける
		const rdapUrl = baseUrl.endsWith('/') ? `${baseUrl}ip/${ip}` : `${baseUrl}/${ip}`;

		console.log(`Using RDAP endpoint: ${rdapUrl}`);

		const response = await fetch(rdapUrl);
		if (!response.ok) {
			throw new Error(`RDAPリクエストエラー: ${response.statusText}`);
		}
		return await response.json();
	} catch (error) {
		console.error('RDAP情報取得に失敗', error);
		return null;
	}
}
