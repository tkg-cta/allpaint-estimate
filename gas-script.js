/**
 * Google Apps Script - お問い合わせフォーム メール送信 (セキュリティ強化版)
 * 
 * 【セットアップ手順】
 * 1. https://script.google.com/ にアクセス
 * 2. プロジェクト設定 → スクリプトプロパティ に以下を追加:
 *    - LINE_ACCESS_TOKEN: LINEチャネルアクセストークン
 *    - LINE_USER_ID: 通知先のLINEユーザーID
 *    - LIFF_CHANNEL_ID: LIFFチャネルID
 *    - SPREADSHEET_ID: 記録用スプレッドシートID (★新規追加)
 */

// **********************************************
// ⚠️ 設定
// **********************************************
const SHEET_NAME = '問い合わせ一覧'; // あなたのシート名
// RATE_LIMIT_SHEET_NAME は CacheService 利用のため廃止しました

// 設定
const CONFIG = {
 FROM_EMAIL: 'chita.develop@gmail.com',
 TO_EMAIL: 'c-takagi@chita.co.jp',
 CC_EMAIL: '',
 SUBJECT: '【お問い合わせ】全塗装シミュレーターからのお問い合わせ',
};
// **********************************************


/**
 * POSTリクエストを処理
 */
function doPost(e) {
 const results = {
  spreadsheet: false,
  email: false,
  line_admin: false,
  line_user: false,
  errors: []
 };

 try {
  // リクエストボディをパース
  const data = JSON.parse(e.postData.contents);
  Logger.log('受信データ: ' + JSON.stringify(data));

  // ========================================
  // 🛡️ LINEセキュリティ: LIFF IDトークン検証
  // ========================================

  // ローカル開発用モックトークンを許可
  const isLocalDev = data.liffIdToken === 'MOCK_ID_TOKEN_FOR_LOCAL_DEV' &&
   data.lineUserId === 'MOCK_USER_ID_FOR_LOCAL_DEV';

  if (!isLocalDev) {
   // 本番環境: IDトークン検証を実施
   if (!data.liffIdToken || !data.lineUserId) {
    Logger.log('⚠️ LINEセキュリティ: IDトークンまたはUserIDが不足');
    return createResponse({
     success: false,
     message: 'Unauthorized: Missing authentication token'
    }, 401);
   }

   // LIFF IDトークンを検証
   const verificationResult = verifyLiffIdToken(data.liffIdToken, data.lineUserId);
   if (!verificationResult.valid) {
    Logger.log('⚠️ LINEセキュリティ: IDトークン検証失敗 - ' + verificationResult.error);
    return createResponse({
     success: false,
     message: 'Unauthorized: ' + verificationResult.error
    }, 401);
   }

   Logger.log('✅ LINEセキュリティ: IDトークン検証成功');
  } else {
   Logger.log('🛠️ ローカル開発モード: IDトークン検証をスキップ');
  }

  // ========================================
  // 🛡️ サーバー側レート制限 (CacheService版)
  // ========================================

  if (!isLocalDev) {
   const rateLimitCheck = checkServerRateLimit(data.lineUserId);
   if (!rateLimitCheck.allowed) {
    Logger.log('⚠️ レート制限: 送信間隔が短すぎます - UserID: ' + data.lineUserId);
    return createResponse({
     success: false,
     message: 'Rate limit exceeded. Please wait ' + rateLimitCheck.remainingSeconds + ' seconds.',
     remainingSeconds: rateLimitCheck.remainingSeconds
    }, 429);
   }

   Logger.log('✅ レート制限: チェック通過');
  }

  // ========================================
  // 🛡️ 緊急セキュリティ対策: 入力検証
  // ========================================

  // 1. 必須フィールドの存在チェック
  if (!data.customer || !data.quote) {
   Logger.log('⚠️ セキュリティ: 必須フィールド不足 - ' + JSON.stringify(e.parameter));
   return createResponse({
    success: false,
    message: 'Invalid request structure'
   }, 400);
  }

  // 2. 顧客情報の検証
  const { customer, quote } = data;

  if (!customer.name || !customer.email || !customer.phone) {
   Logger.log('⚠️ セキュリティ: 顧客情報不足');
   return createResponse({
    success: false,
    message: 'Required customer information missing'
   }, 400);
  }

  // 3. データ型チェック
  if (typeof customer.name !== 'string' ||
   typeof customer.email !== 'string' ||
   typeof customer.phone !== 'string') {
   Logger.log('⚠️ セキュリティ: 不正なデータ型');
   return createResponse({
    success: false,
    message: 'Invalid data type'
   }, 400);
  }

  // 4. 文字列長チェック(異常に長い入力を拒否)
  if (customer.name.length > 100 ||
   customer.email.length > 200 ||
   customer.phone.length > 20 ||
   (customer.inquiry && customer.inquiry.length > 2000)) {
   Logger.log('⚠️ セキュリティ: 入力値が長すぎる');
   return createResponse({
    success: false,
    message: 'Input too long'
   }, 400);
  }

  // 5. メールアドレス形式の基本チェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer.email)) {
   Logger.log('⚠️ セキュリティ: 無効なメールアドレス - ' + customer.email);
   return createResponse({
    success: false,
    message: 'Invalid email format'
   }, 400);
  }

  // 6. 見積もり金額の妥当性チェック
  if (!quote.totalPrice || typeof quote.totalPrice !== 'number') {
   Logger.log('⚠️ セキュリティ: 不正な金額データ');
   return createResponse({
    success: false,
    message: 'Invalid price data'
   }, 400);
  }

  // 異常に高額または負の値を拒否
  if (quote.totalPrice < 0 || quote.totalPrice > 10000000) {
   Logger.log('⚠️ セキュリティ: 異常な金額 - ' + quote.totalPrice);
   return createResponse({
    success: false,
    message: 'Invalid price range'
   }, 400);
  }

  // 7. 車両・塗装情報の検証
  if (!quote.vehicle || !quote.vehicle.name ||
   !quote.paint || !quote.paint.name) {
   Logger.log('⚠️ セキュリティ: 見積もり情報不足');
   return createResponse({
    success: false,
    message: 'Invalid quote data'
   }, 400);
  }

  Logger.log('✅ セキュリティ検証: 通過');
  // ========================================

  // お問い合わせ番号（初期値）
  let inquiryNumber = '不明';

  // --- 【1】スプレッドシートにデータを記録 (排他制御あり) ---
  try {
   // 戻り値としてお問い合わせ番号を受け取る
   inquiryNumber = recordToSpreadsheet(data);
   results.spreadsheet = true;
   Logger.log('✅ スプレッドシート記録: 成功 (No.' + inquiryNumber + ')');
  } catch (error) {
   results.errors.push('スプレッドシート記録エラー: ' + error.message);
   Logger.log('❌ スプレッドシート記録: 失敗 - ' + error.message);
  }

  // --- 【2】メール送信 ---
  try {
   const emailBody = createEmailBody(data);

   // メール送信オプション
   const mailOptions = {
    name: 'Modory Paint Simulator'
   };

   // CCが設定されている場合のみ追加
   if (CONFIG.CC_EMAIL && CONFIG.CC_EMAIL.trim() !== '') {
    mailOptions.cc = CONFIG.CC_EMAIL;
   }

   // 件名を動的に生成
   const subject = `【全塗装見積もり】${data.customer.name}様からお見積もりが到着しました`;

   GmailApp.sendEmail(
    CONFIG.TO_EMAIL,
    subject,
    emailBody,
    mailOptions
   );

   results.email = true;
   Logger.log('✅ メール送信: 成功 (To: ' + CONFIG.TO_EMAIL + ')');
  } catch (error) {
   results.errors.push('メール送信エラー: ' + error.message);
   Logger.log('❌ メール送信: 失敗 - ' + error.message);
  }

  // --- 【3】LINE通知 (管理者へ) ---
  try {
   // お問い合わせ番号を渡して通知本文を作成
   const lineMessage = createNotificationBody(data, inquiryNumber);
   sendLineNotification(lineMessage);
   results.line_admin = true;
   Logger.log('✅ LINE通知(管理者): 成功');
  } catch (error) {
   results.errors.push('LINE通知(管理者)エラー: ' + error.message);
   Logger.log('❌ LINE通知(管理者): 失敗 - ' + error.message);
  }

  // --- 【4】LINE自動応答 (ユーザーへ) ---
  if (data.lineUserId) {
   try {
    sendUserAutoReply(data.lineUserId, data, inquiryNumber);
    results.line_user = true;
    Logger.log('✅ LINE自動応答(ユーザー): 成功 (UserID: ' + data.lineUserId + ')');
   } catch (error) {
    results.errors.push('LINE自動応答(ユーザー)エラー: ' + error.message);
    Logger.log('❌ LINE自動応答(ユーザー): 失敗 - ' + error.message);
   }
  } else {
   Logger.log('ℹ️ LINE UserIDがないため、ユーザーへの自動応答はスキップしました');
  }

  // 結果をログに出力
  Logger.log('処理結果: ' + JSON.stringify(results));

  // 成功レスポンス(一部失敗していても200を返す)
  return createResponse({
   success: true,
   message: 'データを受信しました',
   results: results
  });

 } catch (error) {
  // 致命的なエラー(JSONパースエラーなど)
  Logger.log('❌ 致命的エラー: ' + error.message);
  return createResponse({
   success: false,
   message: '処理に失敗しました: ' + error.message
  }, 500);
 }
}

/**
 * スプレッドシートにデータを追記する関数
 * ★修正: 排他制御(LockService)とインジェクション対策を追加
 * @return {string} お問い合わせ番号
 */
function recordToSpreadsheet(data) {
 const { customer, quote } = data;
 const lock = LockService.getScriptLock(); // ロックオブジェクト取得

 try {
  // ★排他制御: ロックを取得 (最大30秒待機)
  // これにより、同時に複数の書き込みが発生しても順番待ちになり、データ破損を防ぎます
  lock.waitLock(30000);

  // ★ID隠蔽: SPREADSHEET_ID をプロパティから取得
  const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!SPREADSHEET_ID) throw new Error('SPREADSHEET_IDがスクリプトプロパティに設定されていません');

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
   throw new Error(`シート名 "${SHEET_NAME}" が見つかりません。名前を確認してください。`);
  }

  // お問い合わせ番号の採番: YY-MM-nnnn 形式
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const lastRow = sheet.getLastRow();
  const inquiryNumber = `${year}-${month}-${lastRow}`;

  // 選択されたオプションをカンマ区切りで結合
  const optionsList = quote.options
   ? quote.options.map(opt => opt.name).join(', ')
   : '';

  // 日時を整形するヘルパー関数
  const formatDateTime = (date, time) => {
   if (!date && !time) return '';
   return `${date || '日付未指定'} ${time || '時間未指定'}`;
  };

  // ★セキュリティ: スプレッドシートインジェクション対策
  // 先頭が =, +, -, @ で始まる場合、シングルクォートを付与して文字列化する
  const escapeInjection = (value) => {
   if (typeof value !== 'string') return value;
   if (/^[=+\-@]/.test(value)) {
    return "'" + value;
   }
   return value;
  };

  // スプレッドシートのヘッダー順に合わせたデータ配列を作成
  const rowData = [
   inquiryNumber, // 1. お問い合わせ番号 (A)
   new Date(), // 2. 記録日時 (B)
   escapeInjection(customer.name), // 3. お名前 (C)
   escapeInjection(customer.furigana), // 4. ふりがな (D)
   escapeInjection(customer.phone), // 5. お電話番号 (E)
   escapeInjection(customer.email), // 6. メールアドレス (F)
   quote.totalPrice, // 7. 合計金額 (G)
   escapeInjection(quote.vehicle.name), // 8. 車両 (H)
   escapeInjection(quote.paint.name), // 9. 塗装タイプ (I)
   escapeInjection(optionsList), // 10. 選択オプション一覧 (J)
   customer.inquiryType === 'visit' ? '店舗への来店見積もり' : 'お問い合わせのみ', // 11. お問い合わせ区分 (K)
   formatDateTime(customer.preferredDate1, customer.preferredTime1), // 12. 来店日時1 (L)
   formatDateTime(customer.preferredDate2, customer.preferredTime2), // 13. 来店日時2 (M)
   formatDateTime(customer.preferredDate3, customer.preferredTime3), // 14. 来店日時3 (N)
   escapeInjection(customer.inquiry), // 15. お問い合わせ内容 (O)
  ];

  // シートの最終行にデータを追記
  sheet.appendRow(rowData);

  return inquiryNumber;

 } catch (e) {
  throw e;
 } finally {
  // ★排他制御: 必ずロックを解除する
  lock.releaseLock();
 }
}


/**
 * メール本文を作成 (既存関数)
 */
function createEmailBody(data) {
 const { customer, quote } = data;

 let body = '';

 // ヘッダー
 body += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
 body += '  全塗装シミュレーターからのお問い合わせ\n';
 body += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

 // お客様情報
 body += '【お客様情報】\n';
 body += '─────────────────────────────────\n';
 body += `お名前: ${customer.name} 様\n`;
 body += `ふりがな: ${customer.furigana}\n`;
 body += `電話番号: ${customer.phone}\n`;
 body += `メールアドレス: ${customer.email}\n\n`;

 // お問い合わせ区分
 if (customer.inquiryType) {
  const typeLabel = customer.inquiryType === 'visit' ? '店舗への来店見積もり' : 'お問い合わせのみ';
  body += `お問い合わせ区分: ${typeLabel}\n\n`;
 }

 // 希望来店日時
 body += '【ご希望来店日時】\n';
 body += '─────────────────────────────────\n';
 if (customer.preferredDate1 || customer.preferredTime1) {
  body += `第1希望: ${customer.preferredDate1 || '---'} ${customer.preferredTime1 || ''}\n`;
 }
 if (customer.preferredDate2 || customer.preferredTime2) {
  body += `第2希望: ${customer.preferredDate2 || '---'} ${customer.preferredTime2 || ''}\n`;
 }
 if (customer.preferredDate3 || customer.preferredTime3) {
  body += `第3希望: ${customer.preferredDate3 || '---'} ${customer.preferredTime3 || ''}\n`;
 }
 if (!customer.preferredDate1 && !customer.preferredDate2 && !customer.preferredDate3) {
  body += '指定なし\n';
 }
 body += '\n';

 // お問い合わせ内容
 if (customer.inquiry) {
  body += '【お問い合わせ内容】\n';
  body += '─────────────────────────────────\n';
  body += customer.inquiry + '\n\n';
 }

 // 見積もり内容
 body += '【お見積もり内容】\n';
 body += '─────────────────────────────────\n';
 body += `車両: ${quote.vehicle.name}\n`;
 body += `塗装タイプ: ${quote.paint.name}\n\n`;

 // オプション
 if (quote.options && quote.options.length > 0) {
  body += '【選択オプション】\n';
  body += '─────────────────────────────────\n';
  quote.options.forEach(opt => {
   let priceStr = '';
   if (typeof opt.price === 'number') {
    priceStr = `¥${opt.price.toLocaleString()}`;
   } else if (typeof opt.price === 'object') {
    priceStr = '(サイズ別価格)';
   }
   body += `・${opt.name}: ${priceStr}\n`;
  });
  body += `\n選択オプション数: ${quote.options.length}件\n\n`;
 }

 // 合計金額
 body += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
 body += `お見積もり合計 (税込): ¥${quote.totalPrice.toLocaleString()}\n`;
 body += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

 // フッター
 body += '※ このメールは自動送信されています。\n';
 body += '※ お客様への返信をお願いいたします。\n';

 return body;
}

/**
 * JSONレスポンスを作成 (既存関数)
 */
function createResponse(data, statusCode = 200) {
 const output = ContentService.createTextOutput(JSON.stringify(data));
 output.setMimeType(ContentService.MimeType.JSON);
 return output;
}

/**
 * GETリクエストを処理(動作確認用) (既存関数)
 */
function doGet() {
 return createResponse({
  status: 'ok',
  message: 'Google Apps Script is running',
  timestamp: new Date().toISOString()
 });
}

/**
 * LINE通知用の本文を整形する関数 (管理者用・シンプル版)
 * @param {object} data - フォームから取得したキーと値のペア
 * @param {number|string} inquiryNumber - お問い合わせ番号
 * @return {string} 通知メッセージ本文
 */
function createNotificationBody(data, inquiryNumber) {
 const { customer, quote } = data;

 let body = '【お問い合わせ通知】\n';
 body += '--------------------------------\n';
 body += `No.${inquiryNumber}\n`;
 body += `お名前: ${customer.name} 様 (${customer.furigana})\n`;
 body += `電話番号: ${customer.phone}\n`;
 body += `メールアドレス: ${customer.email}\n`;
 body += '--------------------------------\n\n';

 body += `車両: ${quote.vehicle.name}\n`;
 body += `塗装: ${quote.paint.name}\n\n`;

 // オプション一覧
 if (quote.options && quote.options.length > 0) {
  body += 'オプション:\n';
  quote.options.forEach(opt => {
   const quantityStr = opt.quantity > 1 ? ` (x${opt.quantity})` : '';
   body += `・${opt.name}${quantityStr}: ¥${opt.price.toLocaleString()}\n`;
  });
  body += '\n';
 } else {
  body += 'オプション: なし\n\n';
 }

 // お問い合わせ内容
 if (customer.inquiry) {
  body += 'お問い合わせ内容:\n';
  body += customer.inquiry + '\n\n';
 }

 body += `見積もり金額: ¥${quote.totalPrice.toLocaleString()}\n`;

 // 来店希望日時
 if (customer.inquiryType === 'visit') {
  body += '\n来店希望日:\n';
  if (customer.preferredDate1) body += `1. ${customer.preferredDate1} ${customer.preferredTime1 || ''}\n`;
  if (customer.preferredDate2) body += `2. ${customer.preferredDate2} ${customer.preferredTime2 || ''}\n`;
  if (customer.preferredDate3) body += `3. ${customer.preferredDate3} ${customer.preferredTime3 || ''}\n`;
  if (!customer.preferredDate1 && !customer.preferredDate2 && !customer.preferredDate3) {
   body += '指定なし\n';
  }
 } else {
  body += '\nお問い合わせのみ\n';
 }

 body += '--------------------------------';

 return body;
}

/**
 * LINEにプッシュ通知を送信する関数 (管理者用)
 * スクリプトプロパティに登録された鍵を使用
 */
function sendLineNotification(message) {
 // スクリプトプロパティから鍵を取得
 const LINE_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_ACCESS_TOKEN');
 const LINE_USER_ID = PropertiesService.getScriptProperties().getProperty('LINE_USER_ID');

 // プッシュ通知用APIのエンドポイント
 const url = 'https://api.line.me/v2/bot/message/push';

 // 送信するペイロード(データ本体)
 const payload = {
  to: LINE_USER_ID, // 通知先のユーザーID
  messages: [
   {
    type: 'text',
    text: message // 送信したいメッセージ本文
   }
  ]
 };

 // API呼び出しオプション
 const options = {
  'method': 'post',
  'headers': {
   'Content-Type': 'application/json; charset=UTF-8',
   'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN
  },
  'payload': JSON.stringify(payload)
 };

 try {
  // APIを実行
  UrlFetchApp.fetch(url, options);
  Logger.log('LINE通知を送信しました');
 } catch (e) {
  Logger.log('LINE通知送信エラー: ' + e.message);
 }
}

/**
 * ユーザーへ自動応答メッセージを送信する関数 (詳細版)
 * @param {string} userId - 送信先のLINE User ID
 * @param {object} data - フォームデータ全体
 * @param {number|string} inquiryNumber - お問い合わせ番号
 */
function sendUserAutoReply(userId, data, inquiryNumber) {
 const { customer, quote } = data;
 const LINE_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_ACCESS_TOKEN');
 const url = 'https://api.line.me/v2/bot/message/push';

 // 来店希望日の整形
 let visitDatesStr = '来店希望日なし';
 if (customer.inquiryType === 'visit') {
  const dates = [];
  if (customer.preferredDate1) dates.push(`${customer.preferredDate1} ${customer.preferredTime1 || ''}`);
  if (customer.preferredDate2) dates.push(`${customer.preferredDate2} ${customer.preferredTime2 || ''}`);
  if (customer.preferredDate3) dates.push(`${customer.preferredDate3} ${customer.preferredTime3 || ''}`);

  if (dates.length > 0) {
   visitDatesStr = '\n' + dates.join('\n');
  }
 }

 // オプションの整形
 let optionsStr = '';
 if (quote.options && quote.options.length > 0) {
  quote.options.forEach(opt => {
   const quantityStr = opt.quantity > 1 ? ` (x${opt.quantity})` : '';
   optionsStr += `・${opt.name}${quantityStr}: ¥${opt.price.toLocaleString()}\n`;
  });
 } else {
  optionsStr = '・なし\n';
 }

 // メッセージ本文の作成
 const messageText = `${customer.name} 様\n` +
  `この度はモドーリー奈良運転免許センター東店へ塗装のご相談ありがとうございます。\n` +
  `こちらの概算お見積もり結果を元に、施工のご相談を承りました。\n` +
  `この後は担当者が確認次第改めてLINEを通じてご連絡いたします。もうしばらくお待ちくださいませ。\n\n\n` +
  `【👤お客様情報】\n` +
  `お問合せ番号：${inquiryNumber}\n` +
  `お名前: ${customer.name} 様\n` +
  `お電話番号: ${customer.phone}\n` +
  `メールアドレス: ${customer.email}\n\n` +
  `🚗 車両: ${quote.vehicle.name}\n` +
  `🎨 塗装の種類: ${quote.paint.name}\n\n` +
  `🛠️オプションの結果\n` +
  optionsStr + '\n' +
  `概算お見積り結果: ¥${quote.totalPrice.toLocaleString()}\n\n` +
  `🗓️来店希望日：${visitDatesStr}\n\n` +
  `📝お問い合わせ内容\n` +
  `${customer.inquiry || 'なし'}`;

 const payload = {
  to: userId,
  messages: [
   {
    type: 'text',
    text: messageText
   }
  ]
 };

 const options = {
  'method': 'post',
  'headers': {
   'Content-Type': 'application/json; charset=UTF-8',
   'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN
  },
  'payload': JSON.stringify(payload)
 };

 try {
  UrlFetchApp.fetch(url, options);
  Logger.log('ユーザーへの自動応答を送信しました');
 } catch (e) {
  Logger.log('ユーザー自動応答送信エラー: ' + e.message);
  throw e;
 }
}

// ========================================
// 🛡️ LINE セキュリティ機能
// ========================================

/**
 * LIFF IDトークンを検証する関数
 * @param {string} idToken - LIFF IDトークン
 * @param {string} expectedUserId - 期待されるUserID
 * @return {object} { valid: boolean, error: string }
 */
function verifyLiffIdToken(idToken, expectedUserId) {
 try {
  // LINE公式のIDトークン検証エンドポイント
  const verifyUrl = 'https://api.line.me/oauth2/v2.1/verify';

  // スクリプトプロパティからLIFF Channel IDを取得
  const LIFF_CHANNEL_ID = PropertiesService.getScriptProperties().getProperty('LIFF_CHANNEL_ID');

  if (!LIFF_CHANNEL_ID) {
   Logger.log('⚠️ LIFF_CHANNEL_IDがスクリプトプロパティに設定されていません');
   return { valid: false, error: 'LIFF_CHANNEL_ID not configured' };
  }

  // IDトークン検証リクエスト (POSTメソッドが必須)
  const payload = {
   id_token: idToken,
   client_id: LIFF_CHANNEL_ID
  };

  const response = UrlFetchApp.fetch(verifyUrl, {
   method: 'post',
   payload: payload,
   muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const result = JSON.parse(response.getContentText());

  if (statusCode !== 200) {
   // エラー詳細をログに出力
   const errorDetail = result.error_description || result.error || 'Unknown error';
   Logger.log('⚠️ IDトークン検証API エラー: ' + statusCode + ' - ' + errorDetail);
   return { valid: false, error: 'API Error: ' + statusCode + ' (' + errorDetail + ')' };
  }

  // トークンから取得したUserIDと送信されたUserIDを照合
  if (result.sub !== expectedUserId) {
   Logger.log('⚠️ UserID不一致: トークン=' + result.sub + ', 送信=' + expectedUserId);
   return { valid: false, error: 'UserID mismatch (Token: ' + result.sub + ', Request: ' + expectedUserId + ')' };
  }

  // トークンの有効期限チェック
  const now = Math.floor(Date.now() / 1000);
  if (result.exp < now) {
   Logger.log('⚠️ トークン有効期限切れ');
   return { valid: false, error: 'Token expired' };
  }

  Logger.log('✅ IDトークン検証成功: UserID=' + result.sub);
  return { valid: true, error: null };

 } catch (e) {
  Logger.log('❌ IDトークン検証エラー: ' + e.message);
  return { valid: false, error: 'Exception: ' + e.message };
 }
}

/**
 * サーバー側レート制限をチェックする関数 (CacheService版)
 * ★修正: スプレッドシートを使わず、CacheServiceで高速に処理
 * @param {string} userId - LINE UserID
 * @return {object} { allowed: boolean, remainingSeconds: number }
 */
function checkServerRateLimit(userId) {
 try {
  const cache = CacheService.getScriptCache();
  const cacheKey = `rate_limit_${userId}`;
  const cachedValue = cache.get(cacheKey);

  if (cachedValue) {
   // キャッシュが存在する = 制限期間内
   Logger.log('⚠️ レート制限(Cache): UserID ' + userId + ' は制限中です');
   return { allowed: false, remainingSeconds: 60 };
  }

  // キャッシュに書き込み (60秒有効)
  cache.put(cacheKey, '1', 60);
  Logger.log('✅ レート制限(Cache): 通過 UserID=' + userId);
  return { allowed: true, remainingSeconds: 0 };

 } catch (e) {
  Logger.log('❌ レート制限チェックエラー: ' + e.message);
  // エラー時はフェイルオープン（許可）
  return { allowed: true, remainingSeconds: 0 };
 }
}
