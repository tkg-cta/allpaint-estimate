/**
 * セキュリティ関連のユーティリティ関数
 * 入力バリデーション、サニタイゼーション、レート制限など
 */

import DOMPurify from 'dompurify';

// ========================================
// 入力バリデーション
// ========================================

/**
 * メールアドレスの形式を検証
 */
export const validateEmail = (email: string): boolean => {
 // RFC 5322準拠の簡易版正規表現
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 return emailRegex.test(email) && email.length <= 200;
};

/**
 * 日本の電話番号形式を検証
 * 許可形式: 090-1234-5678, 09012345678, 0120-123-456など
 */
export const validatePhoneNumber = (phone: string): boolean => {
 // ハイフンあり/なし両対応
 const phoneRegex = /^0\d{1,4}-?\d{1,4}-?\d{3,4}$/;
 return phoneRegex.test(phone) && phone.length <= 20;
};

/**
 * ふりがな(ひらがな)を検証
 */
export const validateFurigana = (furigana: string): boolean => {
 // ひらがな、スペース、長音のみ許可
 const furiganaRegex = /^[ぁ-んー\s]+$/;
 return furiganaRegex.test(furigana) && furigana.length <= 100;
};

/**
 * 文字列長を検証
 */
export const validateLength = (
 value: string,
 min: number = 0,
 max: number = Infinity
): boolean => {
 return value.length >= min && value.length <= max;
};

/**
 * お名前の検証
 */
export const validateName = (name: string): boolean => {
 // 1文字以上100文字以下
 return validateLength(name, 1, 100);
};

/**
 * お問い合わせ内容の検証
 */
export const validateInquiry = (inquiry: string): boolean => {
 // 2000文字以下(空欄OK)
 return validateLength(inquiry, 0, 2000);
};

// ========================================
// サニタイゼーション(XSS対策)
// ========================================

/**
 * ユーザー入力をサニタイズ(XSS対策)
 * HTMLタグやスクリプトを無害化
 */
export const sanitizeInput = (input: string): string => {
 return DOMPurify.sanitize(input, {
  ALLOWED_TAGS: [], // HTMLタグを一切許可しない
  ALLOWED_ATTR: [], // 属性も許可しない
  KEEP_CONTENT: true, // テキストコンテンツは保持
 });
};

/**
 * フォームデータ全体をサニタイズ
 */
export const sanitizeFormData = <T extends Record<string, string | number | boolean | any>>(data: T): T => {
 const sanitized = { ...data };

 Object.keys(sanitized).forEach((key) => {
  const value = sanitized[key as keyof T];
  if (typeof value === 'string') {
   (sanitized as any)[key] = sanitizeInput(value);
  }
 });

 return sanitized;
};

// ========================================
// レート制限
// ========================================

const RATE_LIMIT_KEY = 'lastSubmissionTime';
const RATE_LIMIT_DURATION = 60 * 1000; // 60秒

/**
 * レート制限をチェック
 * @returns {boolean} 送信可能ならtrue、制限中ならfalse
 */
export const checkRateLimit = (): boolean => {
 const lastSubmissionTime = localStorage.getItem(RATE_LIMIT_KEY);

 if (!lastSubmissionTime) {
  return true; // 初回送信
 }

 const timeSinceLastSubmission = Date.now() - parseInt(lastSubmissionTime, 10);
 return timeSinceLastSubmission >= RATE_LIMIT_DURATION;
};

/**
 * 最終送信時刻を記録
 */
export const recordSubmission = (): void => {
 localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
};

/**
 * 次回送信可能になるまでの残り時間(秒)を取得
 * @returns {number} 残り秒数、送信可能なら0
 */
export const getRemainingCooldown = (): number => {
 const lastSubmissionTime = localStorage.getItem(RATE_LIMIT_KEY);

 if (!lastSubmissionTime) {
  return 0;
 }

 const timeSinceLastSubmission = Date.now() - parseInt(lastSubmissionTime, 10);
 const remaining = RATE_LIMIT_DURATION - timeSinceLastSubmission;

 return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

// ========================================
// バリデーションエラーメッセージ
// ========================================

export const ValidationMessages = {
 email: 'メールアドレスの形式が正しくありません',
 phone: '電話番号の形式が正しくありません(例: 090-1234-5678)',
 furigana: 'ふりがなはひらがなで入力してください',
 name: 'お名前を入力してください(100文字以内)',
 inquiry: 'お問い合わせ内容は2000文字以内で入力してください',
 rateLimit: '送信間隔が短すぎます。しばらく待ってから再度お試しください',
} as const;
