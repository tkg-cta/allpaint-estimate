/**
 * Google Apps Script - お問い合わせフォーム メール送信
 * 
 * 【セットアップ手順】
 * 1. https://script.google.com/ にアクセス
 * 2. 「新しいプロジェクト」をクリック
 * 3. このコードを貼り付け
 * 4. プロジェクト名を「お問い合わせフォーム送信」などに変更
 * 5. 「デプロイ」→「新しいデプロイ」をクリック
 * 6. 種類: 「ウェブアプリ」を選択
 * 7. 説明: 「お問い合わせフォーム」
 * 8. 次のユーザーとして実行: 「自分」
 * 9. アクセスできるユーザー: 「全員」
 * 10. 「デプロイ」をクリック
 * 11. 表示されるウェブアプリのURLをコピー
 * 12. .env.localファイルに設定
 * 
 * 【LINE通知の設定】
 * 1. プロジェクト設定 → スクリプトプロパティ
 * 2. 以下のプロパティを追加:
 *    - LINE_ACCESS_TOKEN: LINEチャネルアクセストークン
 *    - LINE_USER_ID: 通知先のLINEユーザーID
 */

// **********************************************
// ⚠️ スプレッドシート情報
// **********************************************
const SPREADSHEET_ID = '1CjWPooxAf13bE0kD8HobvOXRseISoNBoINnyMdA_DdE'; // あなたのスプレッドシートID
const SHEET_NAME = '問い合わせ一覧'; // あなたのシート名

// 設定
const CONFIG = {
 // 送信元メールアドレス (このGoogleアカウントのGmail)
 FROM_EMAIL: 'takagi.chita@gmail.com',

 // 送信先メールアドレス (To)
 TO_EMAIL: 'c-takagi@chita.co.jp',

 // CCメールアドレス (複数可、カンマ区切り)
 // CC_EMAIL: 'webmarke@chita.co.jp, kawai@chita.co.jp',
 CC_EMAIL: '',

 // メール件名
 SUBJECT: '【お問い合わせ】全塗装シミュレーターからのお問い合わせ',
};
// **********************************************


/**
 * POSTリクエストを処理
 */
function doPost(e) {
 try {
  // リクエストボディをパース
  const data = JSON.parse(e.postData.contents);

  // --- 【追加機能】スプレッドシートにデータを記録 ---
  recordToSpreadsheet(data);

  // --- 【既存機能】メール送信 ---
  const emailBody = createEmailBody(data);
  GmailApp.sendEmail(
   CONFIG.TO_EMAIL,
   CONFIG.SUBJECT,
   emailBody,
   {
    from: CONFIG.FROM_EMAIL,
    name: 'Modory Paint Simulator',
    cc: CONFIG.CC_EMAIL
   }
  );

  // 🔔 --- 【新規追加】LINE通知の呼び出し ---
  const lineMessage = createNotificationBody(data); // ステップ1の関数で本文を生成
  sendLineNotification(lineMessage); // 通知関数を呼び出す
  // ----------------------------------------

  // 成功レスポンス
  return createResponse({
   success: true,
   message: 'メールとデータを送信しました'
  });

 } catch (error) {
  // エラーレスポンス
  console.error('Error:', error);
  return createResponse({
   success: false,
   message: '処理に失敗しました: ' + error.message
  }, 500);
 }
}

/**
 * スプレッドシートにデータを追記する関数
 */
function recordToSpreadsheet(data) {
 const { customer, quote } = data;

 const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
 const sheet = ss.getSheetByName(SHEET_NAME);

 if (!sheet) {
  throw new Error(`シート名 "${SHEET_NAME}" が見つかりません。名前を確認してください。`);
 }

 // お問い合わせ番号の採番: 次に書き込まれる行番号 (1行目がヘッダーなので、連番は lastRow となる)
 const lastRow = sheet.getLastRow();
 const inquiryNumber = lastRow;

 // 選択されたオプションをカンマ区切りで結合
 const optionsList = quote.options
  ? quote.options.map(opt => opt.name).join(', ')
  : '';

 // 日時を整形するヘルパー関数
 const formatDateTime = (date, time) => {
  if (!date && !time) return '';
  return `${date || '日付未指定'} ${time || '時間未指定'}`;
 };

 // スプレッドシートのヘッダー順に合わせたデータ配列を作成
 // (A:お問い合わせ番号, B:記録日時, C:お名前, D:ふりがな, E:お電話番号, F:メールアドレス, G:合計金額, H:車両, I:塗装タイプ, J:選択オプション一覧, K:お問い合わせ区分, L:希望来店日時(1), M:希望来店日時(2), N:希望来店日時(3), O:お問い合わせ内容)
 const rowData = [
  inquiryNumber, // 1. お問い合わせ番号 (A)
  new Date(), // 2. 記録日時 (B)
  customer.name, // 3. お名前 (C)
  customer.furigana, // 4. ふりがな (D) <-- NEW
  customer.phone, // 5. お電話番号 (E)
  customer.email, // 6. メールアドレス (F)
  quote.totalPrice, // 7. 合計金額 (G)
  quote.vehicle.name, // 8. 車両 (H)
  quote.paint.name, // 9. 塗装タイプ (I)
  optionsList, // 10. 選択オプション一覧 (J)
  customer.inquiryType === 'visit' ? '店舗への来店見積もり' : 'お問い合わせのみ', // 11. お問い合わせ区分 (K)
  // 12-14. 来店予定の日時 (L, M, N)
  formatDateTime(customer.preferredDate1, customer.preferredTime1),
  formatDateTime(customer.preferredDate2, customer.preferredTime2),
  formatDateTime(customer.preferredDate3, customer.preferredTime3),
  customer.inquiry, // 15. お問い合わせ内容 (O)
 ];

 // シートの最終行にデータを追記
 sheet.appendRow(rowData);
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
 body += `基本料金: ¥${quote.vehicle.basePrice.toLocaleString()}\n\n`;

 body += `塗装タイプ: ${quote.paint.name}\n`;
 body += `追加料金: +¥${quote.paint.surcharge.toLocaleString()}\n\n`;

 // オプション
 if (quote.options && quote.options.length > 0) {
  body += '【選択オプション】\n';
  body += '─────────────────────────────────\n';
  quote.options.forEach(opt => {
   body += `・${opt.name}: ¥${opt.price.toLocaleString()}\n`;
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

 // CORS対応
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
 * LINE通知用の本文を整形する関数 (新規追加)
 * @param {object} data - フォームから取得したキーと値のペア
 * @return {string} 通知メッセージ本文
 */
function createNotificationBody(data) {
 const { customer, quote } = data;

 let body = '【🔔お問い合わせ通知】\n';
 body += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
 body += `👤 お名前: ${customer.name} 様\n`;
 body += `🚗 車両: ${quote.vehicle.name}\n`;
 body += `🎨 塗装タイプ: ${quote.paint.name}\n`;
 body += `💰 合計金額: ¥${quote.totalPrice.toLocaleString()}\n`;

 // 来店希望日時を追記
 if (customer.inquiryType === 'visit' && customer.preferredDate1) {
  body += `🗓️ 第1希望来店: ${customer.preferredDate1} ${customer.preferredTime1 || ''}\n`;
 }

 body += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
 body += '詳細はメールをご確認ください。';

 return body;
}

/**
 * LINEにプッシュ通知を送信する関数 (新規追加)
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