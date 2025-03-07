/**
 * 指定されたIPアドレスが特定のCIDR範囲内に含まれるかどうかを判定します
 * @param ip チェックするIPアドレス（IPv4またはIPv6形式）
 * @param range CIDR表記の範囲（例: "192.168.1.0/24" または "2001:db8::/32"）
 * @returns IPアドレスが範囲内にある場合はtrue、それ以外はfalse
 */
export function isIpInRange(ip: string, range: string): boolean {
	try {
		// IPv4とIPv6で処理を分ける
		const isIpv6 = ip.includes(':');
		const isRangeIpv6 = range.includes(':');

		// IPバージョンが異なる場合はfalse
		if (isIpv6 !== isRangeIpv6) return false;

		if (isIpv6) {
			// IPv6の場合
			const [rangePrefix, bits] = range.split('/');
			const prefixLength = parseInt(bits, 10);

			// IPv6アドレスの標準化（圧縮形式を展開）
			const normalizedIp = expandIPv6(ip);
			const normalizedRange = expandIPv6(rangePrefix);

			// ビット単位で比較
			return compareIPv6Prefix(normalizedIp, normalizedRange, prefixLength);
		} else {
			const [rangePrefix, bits] = range.split('/');
			const prefixLength = parseInt(bits, 10);

			const ipParts = ip.split('.').map((p) => parseInt(p, 10));
			const rangeParts = rangePrefix.split('.').map((p) => parseInt(p, 10));

			// 比較するビット数を計算
			const fullOctets = Math.floor(prefixLength / 8);

			// 完全一致が必要なオクテットを比較
			for (let i = 0; i < fullOctets; i++) {
				if (ipParts[i] !== rangeParts[i]) return false;
			}

			// 部分的に比較が必要な最後のオクテットを処理
			const remainingBits = prefixLength % 8;
			if (remainingBits > 0) {
				const mask = 256 - (1 << (8 - remainingBits));
				if ((ipParts[fullOctets] & mask) !== (rangeParts[fullOctets] & mask)) {
					return false;
				}
			}

			return true;
		}
	} catch (e) {
		console.error('IP範囲チェックエラー:', e);
		return false;
	}
}

/**
 * 圧縮形式のIPv6アドレスを完全な形式に展開します
 * @param ipv6 IPv6アドレス
 * @returns 完全形式のIPv6アドレス
 */
function expandIPv6(ipv6: string): string {
	// ::を展開
	if (ipv6.includes('::')) {
		const parts = ipv6.split('::');
		const left = parts[0] ? parts[0].split(':') : [];
		const right = parts[1] ? parts[1].split(':') : [];
		const missing = 8 - left.length - right.length;
		const zeros = Array(missing).fill('0000');

		const expanded = [...left, ...zeros, ...right];
		return expanded.map((part) => part.padStart(4, '0')).join(':');
	}

	// 既に展開済みの場合でも、各パートを4桁にする
	return ipv6
		.split(':')
		.map((part) => part.padStart(4, '0'))
		.join(':');
}

/**
 * 2つのIPv6アドレスを指定されたプレフィックス長に基づいて比較します
 * @param ip1 比較対象のIPv6アドレス（完全展開形式）
 * @param ip2 比較するIPv6アドレス（完全展開形式）
 * @param prefixLength 比較するビット数
 * @returns プレフィックスが一致する場合はtrue
 */
function compareIPv6Prefix(ip1: string, ip2: string, prefixLength: number): boolean {
	const ip1Parts = ip1.split(':').map((part) => parseInt(part, 16));
	const ip2Parts = ip2.split(':').map((part) => parseInt(part, 16));

	// 完全な16ビットブロックを比較
	const fullBlocks = Math.floor(prefixLength / 16);
	for (let i = 0; i < fullBlocks; i++) {
		if (ip1Parts[i] !== ip2Parts[i]) return false;
	}

	// 残りのビットを比較
	const remainingBits = prefixLength % 16;
	if (remainingBits > 0) {
		// 残りのビットに対するマスクを作成
		const mask = 0xffff - ((1 << (16 - remainingBits)) - 1);
		if ((ip1Parts[fullBlocks] & mask) !== (ip2Parts[fullBlocks] & mask)) {
			return false;
		}
	}

	return true;
}

/**
 * IPアドレスがプライベートIPかどうかを判定する
 * @param ip IPアドレス文字列
 * @returns プライベートIPの場合true、そうでない場合false
 */
export function isPrivateIP(ip: string): boolean {
	// IPv4アドレスの処理
	if (!ip.includes(':')) {
		const parts = ip.split('.').map((part) => parseInt(part, 10));

		// 不正なIPアドレス形式の場合
		if (parts.length !== 4 || parts.some((part) => isNaN(part) || part < 0 || part > 255)) {
			return false;
		}

		// プライベートIP範囲のチェック
		// 10.0.0.0 - 10.255.255.255 (10.0.0.0/8)
		if (parts[0] === 10) return true;

		// 172.16.0.0 - 172.31.255.255 (172.16.0.0/12)
		if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

		// 192.168.0.0 - 192.168.255.255 (192.168.0.0/16)
		if (parts[0] === 192 && parts[1] === 168) return true;

		// ループバックアドレス 127.0.0.0 - 127.255.255.255
		if (parts[0] === 127) return true;

		return false;
	}
	// IPv6アドレスの処理
	else {
		// 簡易的なIPv6判定（完全な実装ではありません）
		// ループバック ::1
		if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true;

		// リンクローカル fe80::/10
		if (ip.toLowerCase().startsWith('fe80:')) return true;

		// ユニークローカル fc00::/7
		if (ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd')) return true;

		return false;
	}
}
