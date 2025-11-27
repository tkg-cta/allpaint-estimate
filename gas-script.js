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
 */

/**
 * Google Apps Script - お問い合わせフォーム メール送信 
 * * 変更点:
 * ・recordToSpreadsheet関数に、「お電話番号」と「希望来店日時(3つ)」を追加しました。
 */

// **********************************************
// ⚠️ スプレッドシート情報
// **********************************************
const SPREADSHEET_ID = '12LQ7kj1_RSucxOoRKe9rybmTqDMgbkwD3QXKnWNdUos'; // あなたのスプレッドシートID
const SHEET_NAME = '問い合わせ一覧'; // あなたのシート名

// 設定
const CONFIG = {
 // 送信元メールアドレス (このGoogleアカウントのGmail)
 FROM_EMAIL: 'takagi.chita@gmail.com',

 // 送信先メールアドレス (To)
 TO_EMAIL: 'c-takagi@chita.co.jp',

 // CCメールアドレス (複数可、カンマ区切り)
 CC_EMAIL: 'webmarke@chita.co.jp, kawai@chita.co.jp',

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

 // 選択されたオプションをカンマ区切りで結合
 const optionsList = quote.options
  ? quote.options.map(opt => opt.name).join(', ')
  : '';

 // Helper function to format date and time for the sheet
 const formatDateTime = (date, time) => {
  if (!date && !time) return '';
  // 例: "2025-12-01 10:00"
  return `${date || '日付未指定'} ${time || '時間未指定'}`;
 };

 // スプレッドシートのヘッダー順に合わせたデータ配列を作成
 // (A:記録日時, B:お名前, C:メールアドレス, D:お電話番号, E:合計金額, F:車両, G:塗装タイプ, H:選択オプション一覧, I:お問い合わせ区分, J:希望来店日時(1), K:希望来店日時(2), L:希望来店日時(3), M:お問い合わせ内容)
 const rowData = [
  new Date(), // 1. 記録日時
  customer.name, // 2. お名前
  customer.email, // 3. メールアドレス
  customer.phone, // 4. お電話番号 (追加)
  quote.totalPrice, // 5. 合計金額 (列移動)
  quote.vehicle.name, // 6. 車両 (列移動)
  quote.paint.name, // 7. 塗装タイプ (列移動)
  optionsList, // 8. 選択オプション一覧 (列移動)
  customer.inquiryType === 'visit' ? '店舗への来店見積もり' : 'お問い合わせのみ', // 9. お問い合わせ区分 (列移動)
  // 10-12. 来店予定の日時 (追加)
  formatDateTime(customer.preferredDate1, customer.preferredTime1),
  formatDateTime(customer.preferredDate2, customer.preferredTime2),
  formatDateTime(customer.preferredDate3, customer.preferredTime3),
  customer.inquiry, // 13. お問い合わせ内容 (列移動)
 ];

 const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
 const sheet = ss.getSheetByName(SHEET_NAME);

 if (!sheet) {
  throw new Error(`シート名 "${SHEET_NAME}" が見つかりません。名前を確認してください。`);
 }

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
 body += `電話番号: ${customer.phone}\n`; // ここは元々メール本文に記載済み
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
 * GETリクエストを処理（動作確認用） (既存関数)
 */
function doGet() {
 return createResponse({
  status: 'ok',
  message: 'Google Apps Script is running',
  timestamp: new Date().toISOString()
 });
}