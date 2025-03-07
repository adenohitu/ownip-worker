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

		// 非常に単純な実装（実際の完全なCIDRマッチングはもっと複雑）
		// ここでは単純にプレフィックス文字列を比較
		if (isIpv6) {
			const [rangePrefix, bits] = range.split('/');
			const prefixLength = parseInt(bits, 10);

			// 単純化のために最初のセグメントだけで比較（完全実装ではありません）
			const ipParts = ip.split(':')[0];
			const rangeParts = rangePrefix.split(':')[0];

			return ipParts === rangeParts;
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
