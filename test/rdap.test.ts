import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRdapServerUrl } from '../src/rdap';

// fetchのモック化
global.fetch = vi.fn();

describe('RDAP関数のテスト', () => {
	beforeEach(() => {
		// 各テストの前にモックをリセット
		vi.resetAllMocks();

		// キャッシュをリセット - 内部キャッシュ変数にアクセスするためにモジュールをリセット
		vi.resetModules();
	});

	describe('getRdapServerUrl', () => {
		it('IPv4アドレスに対して正しいRDAPサーバーURLを返す', async () => {
			// fetchのモック応答を設定
			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue({
					description: 'IPv4テスト用ブートストラップ',
					services: [
						[
							['192.0.2.0/24'], // テスト用IPレンジ
							['https://rdap.example.com/', 'http://rdap.example.com/'],
						],
						[
							['198.51.100.0/24'], // 別のテスト用IPレンジ
							['https://rdap.test.com/', 'http://rdap.test.com/'],
						],
					],
					version: '1.0',
				}),
			};

			(global.fetch as any).mockResolvedValue(mockResponse);

			// テスト対象IPアドレス
			const ipAddress = '192.0.2.10';

			// 関数実行
			const result = await getRdapServerUrl(ipAddress);

			// 期待される結果を検証
			expect(result).toBe('https://rdap.example.com/');
			expect(global.fetch).toHaveBeenCalledWith('https://data.iana.org/rdap/ipv4.json');
		});

		it('IPv6アドレスに対して正しいRDAPサーバーURLを返す', async () => {
			// fetchのモック応答を設定
			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue({
					description: 'IPv6テスト用ブートストラップ',
					services: [
						[
							['2001:db8::/32'], // テスト用IPv6レンジ
							['https://rdap.ipv6.example.com/', 'http://rdap.ipv6.example.com/'],
						],
					],
					version: '1.0',
				}),
			};

			(global.fetch as any).mockResolvedValue(mockResponse);

			// テスト対象IPv6アドレス
			const ipAddress = '2001:db8::1';

			// 関数実行
			const result = await getRdapServerUrl(ipAddress);

			// 期待される結果を検証
			expect(result).toBe('https://rdap.ipv6.example.com/');
			expect(global.fetch).toHaveBeenCalledWith('https://data.iana.org/rdap/ipv6.json');
		});

		it('対応するレンジがない場合はデフォルトURLを返す', async () => {
			// fetchのモック応答を設定
			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue({
					description: 'IPv4テスト用ブートストラップ',
					services: [
						[
							['192.0.2.0/24'], // テスト対象IPと一致しないレンジ
							['https://rdap.example.com/', 'http://rdap.example.com/'],
						],
					],
					version: '1.0',
				}),
			};

			(global.fetch as any).mockResolvedValue(mockResponse);

			// テスト対象IP（ブートストラップに含まれないIPアドレス）
			const ipAddress = '203.0.113.1';

			// 関数実行
			const result = await getRdapServerUrl(ipAddress);

			// 期待される結果を検証（デフォルトのRIPE NCCのURLが返されるはず）
			expect(result).toBe('https://rdap.db.ripe.net/ip/');
		});

		it('ブートストラップ取得に失敗した場合はデフォルトURLを返す', async () => {
			// 他のテストの影響を受けないようにモジュールを再インポート
			const { getRdapServerUrl } = await import('../src/rdap');

			// fetchのエラーをシミュレート
			(global.fetch as any).mockRejectedValue(new Error('ネットワークエラー'));

			// テスト対象IP
			const ipAddress = '192.0.2.1';

			// 関数実行
			const result = await getRdapServerUrl(ipAddress);

			// 期待される結果を検証
			expect(result).toBe('https://rdap.db.ripe.net/ip/');
		});
	});
});
