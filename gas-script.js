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

/**
 * POSTリクエストを処理
 */
function doPost(e) {
 try {
  // リクエストボディをパース
  const data = JSON.parse(e.postData.contents);

  // メール本文を作成
  const emailBody = createEmailBody(data);

  // メール送信
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
   message: 'メールを送信しました'
  });

 } catch (error) {
  // エラーレスポンス
  console.error('Error:', error);
  return createResponse({
   success: false,
   message: 'メール送信に失敗しました: ' + error.message
  }, 500);
 }
}

/**
 * メール本文を作成
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
 if (Object.keys(quote.options).length > 0) {
  body += '【選択オプション】\n';
  body += '─────────────────────────────────\n';
  // オプションの詳細は省略（必要に応じて追加）
  body += `選択オプション数: ${Object.keys(quote.options).length}件\n\n`;
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
 * JSONレスポンスを作成
 */
function createResponse(data, statusCode = 200) {
 const output = ContentService.createTextOutput(JSON.stringify(data));
 output.setMimeType(ContentService.MimeType.JSON);

 // CORS対応
 return output;
}

/**
 * GETリクエストを処理（動作確認用）
 */
function doGet() {
 return createResponse({
  status: 'ok',
  message: 'Google Apps Script is running',
  timestamp: new Date().toISOString()
 });
}

