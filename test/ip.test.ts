import { isIpInRange } from '../src/utils/ip';
import { describe, it, expect } from 'vitest';

describe('isIpInRange', () => {
	// IPv4のテスト
	describe('IPv4', () => {
		it('IPアドレスが範囲内にある場合はtrueを返す', () => {
			expect(isIpInRange('192.168.1.5', '192.168.1.0/24')).toBe(true);
			expect(isIpInRange('10.0.0.5', '10.0.0.0/8')).toBe(true);
			expect(isIpInRange('172.16.5.10', '172.16.0.0/16')).toBe(true);
		});

		it('IPアドレスが範囲外にある場合はfalseを返す', () => {
			expect(isIpInRange('192.168.2.5', '192.168.1.0/24')).toBe(false);
			expect(isIpInRange('11.0.0.5', '10.0.0.0/8')).toBe(false);
			expect(isIpInRange('172.17.5.10', '172.16.0.0/16')).toBe(false);
		});

		it('厳密なCIDR範囲でも正しく動作する', () => {
			expect(isIpInRange('192.168.1.127', '192.168.1.0/25')).toBe(true);
			expect(isIpInRange('192.168.1.128', '192.168.1.0/25')).toBe(false);
		});
	});

	// IPv6のテスト
	describe('IPv6', () => {
		it('IPv6アドレスが範囲内にある場合はtrueを返す', () => {
			expect(isIpInRange('2001:db8::1', '2001:db8::/32')).toBe(true);
			expect(isIpInRange('2001:db8:1:2:3:4:5:6', '2001:db8::/32')).toBe(true);
		});

		it('IPv6アドレスが範囲外にある場合はfalseを返す', () => {
			expect(isIpInRange('2001:db9::1', '2001:db8::/32')).toBe(false);
			expect(isIpInRange('2002:db8:1:2:3:4:5:6', '2001:db8::/32')).toBe(false);
		});

		it('短縮形式のIPv6アドレスも正しく処理する', () => {
			expect(isIpInRange('2001:db8::', '2001:db8::/64')).toBe(true);
			expect(isIpInRange('2001:db8::1234', '2001:db8::/64')).toBe(true);
		});
	});

	// エッジケースのテスト
	describe('エッジケース', () => {
		it('正確なプレフィックス境界を正しく処理する', () => {
			// 192.168.1.0/31 は 192.168.1.0 と 192.168.1.1 のみを含む
			expect(isIpInRange('192.168.1.0', '192.168.1.0/31')).toBe(true);
			expect(isIpInRange('192.168.1.1', '192.168.1.0/31')).toBe(true);
			expect(isIpInRange('192.168.1.2', '192.168.1.0/31')).toBe(false);
		});

		it('単一IPのプレフィックス（/32）を正しく処理する', () => {
			expect(isIpInRange('192.168.1.5', '192.168.1.5/32')).toBe(true);
			expect(isIpInRange('192.168.1.6', '192.168.1.5/32')).toBe(false);
		});
	});
});
