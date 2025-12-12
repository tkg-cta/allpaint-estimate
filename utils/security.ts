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
 * 携帯電話: 080/090で始まる11桁
 * 固定電話: 主要市外局番(03, 06, 052など)で始まる10桁
 */
export const validatePhoneNumber = (phone: string): boolean => {
 // ハイフンを除去
 const cleaned = phone.replace(/-/g, '');

 // 携帯電話: 080または090で始まる11桁
 const mobileRegex = /^(080|090)\d{8}$/;
 if (mobileRegex.test(cleaned)) {
  return true;
 }

 // 固定電話: 主要市外局番で始まる10桁
 // 03(東京), 06(大阪), 052(名古屋), 011(札幌), 092(福岡), 075(京都), 045(横浜)など
 const landlineRegex = /^(0[1-9]\d{0,3})\d{6,7}$/;
 if (landlineRegex.test(cleaned) && cleaned.length === 10) {
  // 主要市外局番のチェック
  const validAreaCodes = ['03', '06', '052', '011', '092', '075', '045', '022', '048', '043', '078', '082', '096', '099'];
  const areaCode = cleaned.match(/^(0\d{1,3})/)?.[1];

  if (areaCode && validAreaCodes.some(code => cleaned.startsWith(code))) {
   return true;
  }
 }

 return false;
};

/**
 * 電話番号を自動フォーマット (携帯電話のみ)
 * 080/090の場合: XXX-XXXX-XXXX形式に変換
 */
export const formatPhoneNumber = (phone: string): string => {
 // ハイフンを除去
 const cleaned = phone.replace(/-/g, '');

 // 携帯電話の場合のみフォーマット
 if (/^(080|090)\d{0,8}$/.test(cleaned)) {
  if (cleaned.length <= 3) {
   return cleaned;
  } else if (cleaned.length <= 7) {
   return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  } else {
   return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
  }
 }

 // 固定電話や不完全な入力はそのまま返す
 return phone;
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
 phone: '電話番号の形式が正しくありません(携帯: 080/090、固定: 03/06/052など)',
 furigana: 'ふりがなはひらがなで入力してください',
 name: 'お名前を入力してください(100文字以内)',
 inquiry: 'お問い合わせ内容は2000文字以内で入力してください',
 rateLimit: '送信間隔が短すぎます。しばらく待ってから再度お試しください',
} as const;
