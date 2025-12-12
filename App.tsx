import React, { useState, useMemo, useEffect } from 'react';
import liff from '@line/liff';
import { VEHICLES, PAINTS, OPTIONS } from './constants';
import { VehicleType, PaintType, SelectedOptions, PricingType } from './types';
import { StepWizard } from './components/StepWizard';
import { OptionCard } from './components/OptionCard';
import { VehicleCard } from './components/VehicleCard';
import { PaintCard } from './components/PaintCard';
import { ChevronRight, ChevronLeft, Car, ArrowRight, RotateCcw, Calendar, Mail, Phone, User, Send, Clock, CheckCircle, Edit2, Loader2, MessageCircle, AlertCircle } from 'lucide-react';
import {
 validateEmail,
 validatePhoneNumber,
 validateFurigana,
 validateName,
 validateInquiry,
 sanitizeFormData,
 checkRateLimit,
 recordSubmission,
 getRemainingCooldown,
 ValidationMessages,
} from './utils/security';

interface FormData {
 name: string;
 furigana: string;
 phone: string;
 email: string;
 preferredDate1: string;
 preferredTime1: string;
 preferredDate2: string;
 preferredTime2: string;
 preferredDate3: string;
 preferredTime3: string;
 inquiry: string;
 inquiryType: 'visit' | 'inquiry_only';
}

const App: React.FC = () => {
 const [currentStep, setCurrentStep] = useState(0);
 const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
 const [selectedPaint, setSelectedPaint] = useState<PaintType | null>(null);
 const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
 const [isSubmitting, setIsSubmitting] = useState(false);

 // ↓ ★追加: LINEから取得したユーザーIDを保存しておくための「箱」
 const [lineUserId, setLineUserId] = useState<string>('');

 // ★LINE セキュリティ: IDトークンを保存
 const [liffIdToken, setLiffIdToken] = useState<string>('');

 // ★セキュリティ: バリデーションエラー状態
 const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

 // ★セキュリティ: レート制限のクールダウン
 const [cooldownSeconds, setCooldownSeconds] = useState(0);

 // ↓ ★追加: アプリ起動時に1回だけ実行される処理（LIFFの初期化）
 // ▼ LIFF初期化処理
 useEffect(() => {
  // ローカル開発環境かどうかを判定
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isLocal) {
   console.log("Local environment detected. Skipping LIFF init.");
   // ローカル開発用モックID
   setLineUserId('MOCK_USER_ID_FOR_LOCAL_DEV');
   setLiffIdToken('MOCK_ID_TOKEN_FOR_LOCAL_DEV');
   return;
  }

  const LIFF_ID = "2008641975-j10wPK6n";

  liff
   .init({ liffId: LIFF_ID })
   .then(() => {
    console.log("LIFF init succeeded");

    // LINEアプリ内でない、かつ未ログインの場合はログイン画面へ遷移
    if (!liff.isLoggedIn()) {
     liff.login();
     return;
    }

    // ★LINE セキュリティ: IDトークンを取得
    const idToken = liff.getIDToken();
    if (idToken) {
     setLiffIdToken(idToken);
     console.log("ID Token retrieved successfully");
    } else {
     console.error("Failed to retrieve ID Token");
    }

    // ログイン済みならプロフィール取得
    liff.getProfile()
     .then((profile) => {
      console.log("User ID:", profile.userId);
      setLineUserId(profile.userId);
     })
     .catch((err) => {
      console.error("Profile Error:", err);
     });
   })
   .catch((error: Error) => {
    console.error("LIFF init failed", error);
    alert('LINEアプリの初期化に失敗しました。LINEアプリ内からアクセスしてください。');
   });
 }, []);

 // Step 5 Form State
 const [formData, setFormData] = useState<FormData>({
  name: '',
  furigana: '',
  phone: '',
  email: '',
  preferredDate1: '',
  preferredTime1: '',
  preferredDate2: '',
  preferredTime2: '',
  preferredDate3: '',
  preferredTime3: '',
  inquiry: '',
  inquiryType: 'visit',
 });

 // Business hours: 08:00 - 19:00
 const timeSlots = useMemo(() => {
  const slots = [];
  for (let i = 8; i <= 19; i++) {
   slots.push(`${i.toString().padStart(2, '0')}:00`);
  }
  return slots;
 }, []);

 // Reset options if vehicle size changes (optional safeguard)
 useEffect(() => {
 }, [selectedVehicle]);

 const calculateTotal = useMemo(() => {
  let total = 0;

  // Base Painting Price (Vehicle + Paint)
  if (selectedVehicle) {
   if (selectedPaint) {
    // Specific price for the selected paint
    total += selectedVehicle.prices[selectedPaint.id];
   } else {
    // Default to solid price for initial display
    total += selectedVehicle.prices.solid;
   }
  }

  Object.entries(selectedOptions).forEach(([optionId, value]) => {
   const option = OPTIONS.find(o => o.id === optionId);
   if (!option || !selectedVehicle) return;

   let price = 0;
   if (typeof option.price === 'number') {
    price = option.price;
   } else {
    price = option.price[selectedVehicle.category];
   }

   // Calculate total based on quantity if number, or 1 if boolean true
   if (typeof value === 'number') {
    total += price * value;
   } else if (value) {
    total += price;
   }
  });

  return total;
 }, [selectedVehicle, selectedPaint, selectedOptions]);

 const handleOptionChange = (optionId: string, value: number | boolean) => {
  setSelectedOptions(prev => ({
   ...prev,
   [optionId]: value
  }));
 };

 const handleNext = () => {
  if (currentStep === 0 && !selectedVehicle) return;
  if (currentStep === 1 && !selectedPaint) return;

  // Move to next step (max 5, which is the confirmation step, 0-indexed)
  setCurrentStep(prev => Math.min(prev + 1, 5));
  window.scrollTo({ top: 0, behavior: 'smooth' });
 };

 const handleBack = () => {
  setCurrentStep(prev => Math.max(prev - 1, 0));
  window.scrollTo({ top: 0, behavior: 'smooth' });
 };

 const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));

  // ★セキュリティ: 入力時にエラーをクリア
  if (validationErrors[name]) {
   setValidationErrors(prev => {
    const newErrors = { ...prev };
    delete newErrors[name];
    return newErrors;
   });
  }
 };

 const handleFormSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  // ★セキュリティ: フォームバリデーション
  const errors: Record<string, string> = {};

  if (!validateName(formData.name)) {
   errors.name = ValidationMessages.name;
  }

  if (!validateFurigana(formData.furigana)) {
   errors.furigana = ValidationMessages.furigana;
  }

  if (!validatePhoneNumber(formData.phone)) {
   errors.phone = ValidationMessages.phone;
  }

  if (!validateEmail(formData.email)) {
   errors.email = ValidationMessages.email;
  }

  if (!validateInquiry(formData.inquiry)) {
   errors.inquiry = ValidationMessages.inquiry;
  }

  // エラーがある場合は送信しない
  if (Object.keys(errors).length > 0) {
   setValidationErrors(errors);
   // 最初のエラーフィールドまでスクロール
   window.scrollTo({ top: 0, behavior: 'smooth' });
   return;
  }

  // バリデーション成功 - 確認画面へ
  setValidationErrors({});
  setCurrentStep(5);
  window.scrollTo({ top: 0, behavior: 'smooth' });
 };

 const handleFinalSubmit = async () => {
  if (isSubmitting) return;

  // ★セキュリティ: レート制限チェック
  if (!checkRateLimit()) {
   const remaining = getRemainingCooldown();
   setCooldownSeconds(remaining);
   alert(`${ValidationMessages.rateLimit}\n残り時間: ${remaining}秒`);
   return;
  }

  setIsSubmitting(true);

  // --- 送信データ (JSON) の作成 ---
  // オプションの詳細情報を構築
  const detailedOptions = Object.entries(selectedOptions)
   .map(([id, value]) => {
    if (!value) return null;
    const option = OPTIONS.find(o => o.id === id);
    if (!option || !selectedVehicle) return null;

    let price = 0;
    if (typeof option.price === 'number') {
     price = option.price;
    } else {
     price = option.price[selectedVehicle.category];
    }
    const quantity = typeof value === 'number' ? value : 1;
    return { name: option.name, price: price * quantity, quantity };
   })
   .filter(Boolean);

  // ★セキュリティ: フォームデータをサニタイズ
  const sanitizedFormData = sanitizeFormData(formData);

  const payload = {
   customer: sanitizedFormData,
   quote: {
    vehicle: selectedVehicle,
    paint: selectedPaint,
    options: detailedOptions,
    totalPrice: calculateTotal
   },
   // ↓ ★追加: GAS側で「誰からのアクセスか」を知るためにIDを一緒に送る
   lineUserId: lineUserId,
   liffIdToken: liffIdToken // Add liffIdToken here
  };

  try {
   // Google Apps Script WebアプリURLを取得
   // 環境変数から取得、なければ空文字
   const GAS_URL = import.meta.env.VITE_GAS_WEBHOOK_URL || '';

   if (!GAS_URL) {
    console.warn('GAS_URL is not set. Skipping email send.');
    // URLが設定されていない場合はスキップして完了画面へ
    setCurrentStep(6);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
   }

   // Google Apps ScriptへPOSTリクエスト
   const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    mode: 'no-cors', // GASはno-corsモードで動作
   });

   // no-corsモードではレスポンスを読めないため、成功とみなす
   console.log("送信されたデータ:", payload);

   // ★セキュリティ: 送信成功時にレート制限を記録
   recordSubmission();
   setCooldownSeconds(60);

   // 完了画面 (Step 6) へ遷移
   setCurrentStep(6);
   window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {
   alert("送信に失敗しました。時間をおいて再度お試しください。");
   console.error(error);
  } finally {
   setIsSubmitting(false);
  }
 };

 // --- Render Steps ---

 const renderVehicleStep = () => (
  <div className="animate-fade-in">
   <h2 className="text-2xl font-bold text-primary-900 mb-2">Step 1. お車をお選びください</h2>
   <p className="text-gray-500 mb-6">塗装を行う車両のタイプを選択してください。</p>
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {VEHICLES.map((vehicle) => (
     <VehicleCard
      key={vehicle.id}
      vehicle={vehicle}
      isSelected={selectedVehicle?.id === vehicle.id}
      onClick={() => setSelectedVehicle(vehicle)}
     />
    ))}
   </div>
  </div>
 );

 const renderPaintStep = () => (
  <div className="animate-fade-in">
   <h2 className="text-2xl font-bold text-primary-900 mb-2">Step 2. 塗装タイプをお選びください</h2>
   <p className="text-gray-500 mb-6">ご希望の仕上がりイメージを選択してください。</p>
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {PAINTS.map((paint) => (
     <PaintCard
      key={paint.id}
      paint={paint}
      isSelected={selectedPaint?.id === paint.id}
      onClick={() => setSelectedPaint(paint)}
      // Pass the specific price for this paint on the selected vehicle
      price={selectedVehicle ? selectedVehicle.prices[paint.id] : 0}
     />
    ))}
   </div>
  </div>
 );

 const renderOptionsStep = () => (
  <div className="animate-fade-in pb-24">
   <h2 className="text-2xl font-bold text-primary-900 mb-2">Step 3. オプション選択</h2>
   <p className="text-gray-500 mb-8">お車の状態やご希望に合わせてオプションをお選びください。</p>

   {['prep', 'parts', 'special', 'coating'].map((category) => {
    const categoryOptions = OPTIONS.filter(o => o.category === category);
    if (categoryOptions.length === 0) return null;

    const titles = {
     prep: '下地処理・補修',
     parts: '部品脱着',
     special: '塗装・仕上げオプション',
     coating: 'コーティング・その他',
    };

    return (
     <div key={category} className="mb-10">
      <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
       <span className="w-1 h-6 bg-accent rounded mr-3"></span>
       {titles[category as keyof typeof titles]}
      </h3>
      {category === 'prep' && (
       <p className="text-sm text-gray-500 mb-4 ml-4 -mt-2">
        1パネル20cm×20cmとなります。施工面積に合わせて数量を増やしてください
       </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
       {categoryOptions.map(option => (
        <OptionCard
         key={option.id}
         option={option}
         vehicleSize={selectedVehicle!.category}
         value={selectedOptions[option.id] || 0}
         onChange={(val) => handleOptionChange(option.id, val)}
        />
       ))}
      </div>
     </div>
    );
   })}
  </div>
 );

 const renderSummaryContent = (compact = false) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${compact ? 'mb-0' : 'mb-8'}`}>
   <div className={`border-b border-gray-100 flex flex-col md:flex-row gap-6 ${compact ? 'p-4' : 'p-6'}`}>
    {!compact && (
     <div className="w-full md:w-1/3">
      <img src={selectedVehicle?.image} alt="Selected Vehicle" className="w-full h-40 object-cover rounded-lg" />
     </div>
    )}
    <div className="flex-1">
     <div className="flex justify-between items-baseline mb-2">
      <span className="text-sm text-gray-400 font-bold uppercase tracking-wider">車両の種類</span>
      <span className="font-semibold text-gray-600">{selectedVehicle?.name}</span>
     </div>

     <div className="flex justify-between items-baseline mb-2">
      <span className="text-sm text-gray-400 font-bold uppercase tracking-wider">塗装タイプ</span>
      <span className="font-semibold text-gray-600">{selectedPaint?.name}</span>
     </div>

     <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-baseline">
      <span className="text-base font-bold text-gray-800">基本塗装料金</span>
      <span className="text-xl font-bold text-primary-700">
       ¥{selectedVehicle && selectedPaint ? selectedVehicle.prices[selectedPaint.id].toLocaleString() : 0}
      </span>
     </div>
    </div>
   </div>

   <div className={`${compact ? 'p-4' : 'p-6'} bg-gray-50`}>
    <h3 className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-4">追加したオプション内容</h3>
    <ul className="space-y-3">
     {Object.keys(selectedOptions).length === 0 && (
      <li className="text-gray-500 italic text-sm">オプションは選択されていません</li>
     )}
     {Object.entries(selectedOptions).map(([id, value]) => {
      if (!value) return null;
      const option = OPTIONS.find(o => o.id === id);
      if (!option) return null;

      const price = typeof option.price === 'number'
       ? option.price
       : option.price[selectedVehicle!.category];

      return (
       <li key={id} className="flex justify-between text-sm md:text-base border-b border-gray-200 pb-2 last:border-0 last:pb-0">
        <div className="flex items-center gap-3">
         {compact && <img src={option.image} className="w-8 h-8 rounded object-cover" alt="" />}
         <span className="text-gray-700">{option.name}</span>
        </div>
        <span className="font-medium text-gray-900 whitespace-nowrap">¥{price.toLocaleString()}</span>
       </li>
      );
     })}
    </ul>

    <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
     <span className="font-bold text-gray-500">お見積もり合計 (税込)</span>
     <span className="text-3xl font-bold text-primary-700">¥{calculateTotal.toLocaleString()}</span>
    </div>
   </div>
  </div>
 );

 const renderSummaryStep = () => (
  <div className="animate-fade-in">
   <h2 className="text-2xl font-bold text-primary-900 mb-2">お見積もり内容の確認</h2>
   <p className="text-gray-500 mb-6 leading-relaxed">
    概算のお見積り結果をご確認ください。<br />
    内容に問題がなければ、下のボタンからお問い合わせページへ進めます。<br />
    <br />
    <span className="text-red-500 text-sm">
     ※次のページでは再計算ができませんので、内容をご確認のうえお進みください。
    </span>
   </p>

   {renderSummaryContent()}
  </div>
 );

 const renderInquiryForm = () => (
  <div className="animate-fade-in">
   <h2 className="text-2xl font-bold text-primary-900 mb-2">店舗へのご予約・お問い合わせ</h2>
   <p className="text-gray-500 mb-6">お見積もり内容を引き継いでいます。必要事項をご入力ください。</p>

   {/* Inherited Summary */}
   <div className="mb-8">
    <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 mb-4">
     <h3 className="font-bold text-primary-800 mb-2 flex items-center gap-2">
      <Car size={18} /> 選択されたプラン内容
     </h3>
     {renderSummaryContent(true)}
    </div>
   </div>

   <form onSubmit={handleFormSubmit} className="space-y-8">
    {/* Customer Info Section */}
    <section>
     <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
      <User className="text-primary-600" size={20} />
      お客様の情報
     </h3>
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
       <label className="block text-sm font-bold text-gray-700 mb-2">
        お名前 <span className="text-red-500">*</span>
       </label>
       <div className="relative">
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
         type="text"
         name="name"
         required
         value={formData.name}
         onChange={handleFormChange}
         className={`w-full pl-10 pr-4 py-3 rounded-xl border ${validationErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-200'
          } focus:ring-2 outline-none transition-all`}
         placeholder="山田 太郎"
        />
       </div>
       {validationErrors.name && (
        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
         <AlertCircle size={14} />
         {validationErrors.name}
        </p>
       )}
      </div>
      <div>
       <label className="block text-sm font-bold text-gray-700 mb-2">
        ふりがな <span className="text-red-500">*</span>
       </label>
       <input
        type="text"
        name="furigana"
        required
        value={formData.furigana}
        onChange={handleFormChange}
        className={`w-full px-4 py-3 rounded-xl border ${validationErrors.furigana ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-200'
         } focus:ring-2 outline-none transition-all`}
        placeholder="やまだ たろう"
       />
       {validationErrors.furigana && (
        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
         <AlertCircle size={14} />
         {validationErrors.furigana}
        </p>
       )}
      </div>
      <div>
       <label className="block text-sm font-bold text-gray-700 mb-2">
        電話番号 <span className="text-red-500">*</span>
       </label>
       <div className="relative">
        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
         type="tel"
         name="phone"
         required
         value={formData.phone}
         onChange={handleFormChange}
         className={`w-full pl-10 pr-4 py-3 rounded-xl border ${validationErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-200'
          } focus:ring-2 outline-none transition-all`}
         placeholder="090-1234-5678"
        />
       </div>
       {validationErrors.phone && (
        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
         <AlertCircle size={14} />
         {validationErrors.phone}
        </p>
       )}
      </div>
      <div>
       <label className="block text-sm font-bold text-gray-700 mb-2">
        メールアドレス <span className="text-red-500">*</span>
       </label>
       <div className="relative">
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
         type="email"
         name="email"
         required
         value={formData.email}
         onChange={handleFormChange}
         className={`w-full pl-10 pr-4 py-3 rounded-xl border ${validationErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-200'
          } focus:ring-2 outline-none transition-all`}
         placeholder="example@email.com"
        />
       </div>
       {validationErrors.email && (
        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
         <AlertCircle size={14} />
         {validationErrors.email}
        </p>
       )}
      </div>
     </div>
    </section>

    {/* Inquiry Type Section */}
    <section>
     <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
      <CheckCircle className="text-primary-600" size={20} />
      お問い合わせ区分
     </h3>
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
      <label className={`
       cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-3
       ${formData.inquiryType === 'visit'
        ? 'border-primary-500 bg-primary-50'
        : 'border-gray-200 hover:border-gray-300'
       }
      `}>
       <input
        type="radio"
        name="inquiryType"
        value="visit"
        checked={formData.inquiryType === 'visit'}
        onChange={handleFormChange}
        className="w-5 h-5 text-primary-600 focus:ring-primary-500"
       />
       <span className="font-bold text-gray-700">実際に店舗へご来店してお見積り依頼する</span>
      </label>
      <label className={`
       cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-3
       ${formData.inquiryType === 'inquiry_only'
        ? 'border-primary-500 bg-primary-50'
        : 'border-gray-200 hover:border-gray-300'
       }
      `}>
       <input
        type="radio"
        name="inquiryType"
        value="inquiry_only"
        checked={formData.inquiryType === 'inquiry_only'}
        onChange={handleFormChange}
        className="w-5 h-5 text-primary-600 focus:ring-primary-500"
       />
       <span className="font-bold text-gray-700">お問い合わせのみを希望</span>
      </label>
     </div>
     <p className="text-sm text-gray-500 ml-1">
      ご来店お見積りをご希望の方は、この下の来店日時をご入力ください
     </p>
    </section>

    {/* Date Selection */}
    <section>
     <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
      <Calendar className="text-primary-600" size={20} />
      ご来店の日時の候補日
     </h3>
     <p className="text-sm text-gray-500 mb-4 ml-1">
      実店舗にご来店のお客様は、以下から日時の候補をご登録の上お問い合わせください。
     </p>
     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map(num => (
       <div key={num} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
         <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">{num}</span>
         <span className="text-sm font-bold text-gray-700">第{num}希望</span>
        </div>

        <div className="space-y-3">
         <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 z-10">
           <Calendar size={18} />
          </div>
          <input
           type="date"
           name={`preferredDate${num}`}
           // @ts-ignore
           value={formData[`preferredDate${num}`]}
           onChange={handleFormChange}
           min={new Date().toISOString().split('T')[0]}
           className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-primary-500 outline-none text-sm cursor-pointer relative z-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0"
           onClick={(e) => {
            try {
             if ('showPicker' in e.currentTarget) {
              // @ts-ignore
              e.currentTarget.showPicker();
             }
            } catch (err) {
             // Ignore error
            }
           }}
          />
         </div>
         <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
           <Clock size={14} />
          </div>
          <select
           name={`preferredTime${num}`}
           // @ts-ignore
           value={formData[`preferredTime${num}`]}
           onChange={handleFormChange}
           className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-primary-500 outline-none text-sm appearance-none cursor-pointer"
          >
           <option value="">時間を選択</option>
           {timeSlots.map(time => (
            <option key={time} value={time}>{time}</option>
           ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
         </div>
        </div>
       </div>
      ))}
     </div>
    </section>

    <section>
     <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
      <MessageCircle className="text-primary-600" size={20} />
      お問い合わせ内容・ご質問
     </h3>
     <textarea
      name="inquiry"
      value={formData.inquiry}
      onChange={handleFormChange}
      rows={4}
      className={`w-full px-4 py-3 rounded-xl border ${validationErrors.inquiry ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-200'
       } focus:ring-2 outline-none transition-all`}
      placeholder="ご質問やご要望がございましたらご記入ください。"
     />
     {validationErrors.inquiry && (
      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
       <AlertCircle size={14} />
       {validationErrors.inquiry}
      </p>
     )}
    </section>

    <div className="pt-4 flex justify-center">
     <button
      type="submit"
      className="w-full md:w-auto px-12 py-4 bg-primary-600 text-white font-bold text-lg rounded-xl shadow-xl shadow-primary-200 hover:bg-primary-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
     >
      確認画面へ進む
      <ChevronRight size={20} />
     </button>
    </div>
   </form>
  </div>
 );

 const renderFinalConfirmation = () => (
  <div className="animate-fade-in pb-20">
   <h2 className="text-2xl font-bold text-primary-900 mb-2">最終確認</h2>
   <p className="text-gray-500 mb-6">入力内容をご確認ください。間違いがなければ送信ボタンを押してください。</p>

   <div className="grid grid-cols-1 gap-8">
    {/* Quote Summary */}
    <section>
     <div className="flex items-center gap-2 mb-4">
      <Car className="text-primary-600" />
      <h3 className="text-lg font-bold text-gray-800">お見積もり内容</h3>
     </div>
     {renderSummaryContent(true)}
    </section>

    {/* Customer Info Summary */}
    <section>
     <div className="flex items-center gap-2 mb-4">
      <User className="text-primary-600" />
      <h3 className="text-lg font-bold text-gray-800">お客様情報</h3>
     </div>
     <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="divide-y divide-gray-100">
       <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <span className="text-gray-500 font-medium text-sm">お名前</span>
        <span className="sm:col-span-2 font-bold text-gray-800">{formData.name} 様</span>
       </div>
       <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <span className="text-gray-500 font-medium text-sm">ふりがな</span>
        <span className="sm:col-span-2 text-gray-800">{formData.furigana}</span>
       </div>
       <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <span className="text-gray-500 font-medium text-sm">電話番号</span>
        <span className="sm:col-span-2 text-gray-800 font-mono">{formData.phone}</span>
       </div>
       <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <span className="text-gray-500 font-medium text-sm">メールアドレス</span>
        <span className="sm:col-span-2 text-gray-800 font-mono">{formData.email}</span>
       </div>
       <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <span className="text-gray-500 font-medium text-sm">希望来店日時</span>
        <div className="sm:col-span-2 space-y-1">
         {[1, 2, 3].map(n => {
          // @ts-ignore
          const d = formData[`preferredDate${n}`];
          // @ts-ignore
          const t = formData[`preferredTime${n}`];
          if (!d && !t) return null;
          return (
           <div key={n} className="flex gap-2 text-sm text-gray-800">
            <span className="font-bold text-primary-600 w-16">第{n}希望:</span>
            <span>{d || '---'} {t ? `${t}` : ''}</span>
           </div>
          )
         })}
         {!formData.preferredDate1 && !formData.preferredDate2 && !formData.preferredDate3 && (
          <span className="text-gray-400">指定なし</span>
         )}
        </div>
       </div>
       <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <span className="text-gray-500 font-medium text-sm">お問い合わせ内容</span>
        <span className="sm:col-span-2 text-gray-800 whitespace-pre-wrap leading-relaxed">
         {formData.inquiry || <span className="text-gray-400">なし</span>}
        </span>
       </div>
      </div>
     </div>
    </section>
   </div>

   {/* Action Buttons */}
   <div className="mt-12 flex flex-col-reverse sm:flex-row justify-center items-center gap-4">
    <button
     onClick={() => {
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
     }}
     disabled={isSubmitting}
     className="w-full sm:w-auto px-8 py-4 rounded-xl border-2 border-gray-300 text-gray-600 font-bold hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
    >
     <Edit2 size={18} />
     内容を修正する
    </button>
    <button
     onClick={handleFinalSubmit}
     disabled={isSubmitting || cooldownSeconds > 0}
     className="w-full sm:w-auto px-12 py-4 bg-primary-600 text-white font-bold text-lg rounded-xl shadow-xl shadow-primary-200 hover:bg-primary-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
    >
     {isSubmitting ? (
      <>
       <Loader2 className="animate-spin" size={20} />
       送信中...
      </>
     ) : cooldownSeconds > 0 ? (
      <>
       <Clock size={20} />
       再送信まで {cooldownSeconds}秒
      </>
     ) : (
      <>
       <Send size={20} />
       この内容で送信
      </>
     )}
    </button>
   </div>
  </div>
 );

 const renderCompletionStep = () => (
  <div className="animate-fade-in text-center py-10">
   <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
    <CheckCircle className="w-10 h-10 text-green-600" />
   </div>
   <h2 className="text-3xl font-bold text-gray-800 mb-4">お問い合わせ完了</h2>
   <p className="text-gray-600 mb-12 leading-relaxed">
    お問い合わせありがとうございます。<br />
    担当者より確認次第、ご連絡させていただきます。
   </p>

   <div className="bg-white border-2 border-[#06C755] rounded-3xl p-8 max-w-md mx-auto shadow-xl relative overflow-hidden">
    {/* LINE Banner/Decor */}
    <div className="absolute top-0 left-0 w-full h-2 bg-[#06C755]" />

    <h3 className="text-xl font-bold text-[#06C755] mb-4 flex items-center justify-center gap-2">
     <MessageCircle size={28} /> LINEでのやりとりがスムーズです
    </h3>
    <p className="text-sm text-gray-600 mb-6 leading-relaxed text-left">
     もしLINEをお持ちのお客様は、こちらのQRコードから<br />
     <span className="font-bold">「モドーリー奈良運転免許センター東店」</span>と<br />
     お友達になっていただき、<br />
     <span className="text-[#06C755] font-bold">「お名前」</span>と<span className="text-[#06C755] font-bold">「お電話番号」</span>をメッセージでお送りください。
    </p>

    <div className="bg-gray-50 p-4 rounded-xl inline-block mb-6">
     {/* Placeholder QR Code - Replace with your actual QR code image URL */}
     <img
      src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://line.me/ti/p/@placeholder"
      alt="LINE QR Code"
      className="w-40 h-40 mix-blend-multiply"
     />
    </div>

    <div className="text-xs text-gray-400">
     ※QRコードをタップ、またはスキャンしてください
    </div>

    <a href="#" className="mt-6 block w-full py-3 bg-[#06C755] text-white font-bold rounded-full hover:bg-[#05b64d] transition-colors shadow-lg shadow-green-100 flex items-center justify-center gap-2">
     <MessageCircle size={20} />
     LINEアプリを開く
    </a>
   </div>

   <div className="mt-12">
    <a
     href="https://modolly-sakurai01.com/allpaint/"
     className="text-gray-400 hover:text-gray-600 text-sm font-medium underline underline-offset-4"
    >
     トップページへ戻る
    </a>
   </div>
  </div>
 );

 return (
  <div className="min-h-screen flex flex-col font-sans text-gray-800">
   {/* Header */}
   <header className="bg-white shadow-sm sticky top-0 z-30">
    <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
     <a href="https://modolly-sakurai01.com/allpaint/" className="flex items-center gap-2 text-primary-700 hover:opacity-80 transition-opacity">
      <Car className="w-6 h-6" />
      <h1 className="font-bold text-lg tracking-tight">Modory Paint Simulator</h1>
     </a>
     <div className="text-xs text-gray-500 hidden sm:block">
      カンタン全塗装シミュレーション
     </div>
    </div>
   </header>

   {/* Main Content */}
   <main className="flex-grow">
    <div className="max-w-4xl mx-auto px-4 py-6">
     {/* Only show wizard if not completed (step < 6) */}
     {currentStep < 6 && (
      <StepWizard
       currentStep={currentStep}
       totalSteps={6}
       labels={['車両選択', '塗装タイプ', 'オプション', '見積確認', 'お客様情報', '最終確認']}
      />
     )}

     <div className="mt-8">
      {currentStep === 0 && renderVehicleStep()}
      {currentStep === 1 && renderPaintStep()}
      {currentStep === 2 && renderOptionsStep()}
      {currentStep === 3 && renderSummaryStep()}
      {currentStep === 4 && renderInquiryForm()}
      {currentStep === 5 && renderFinalConfirmation()}
      {currentStep === 6 && renderCompletionStep()}
     </div>
    </div>
   </main>

   {/* Sticky Bottom Bar (Hide on Form, Confirmation Step, and Completion Step) */}
   {currentStep < 4 && currentStep !== 6 && (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] py-2 md:py-4 px-4 z-20 animate-slide-up">
     <div className="flex items-center justify-between gap-2 md:gap-4">
      {/* Price Display */}
      <div className="flex flex-col min-w-0 flex-shrink">
       <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wide whitespace-nowrap">概算お見積もり</span>
       <div className="flex items-baseline gap-1">
        <span className="text-lg md:text-2xl font-bold text-primary-700 whitespace-nowrap">¥{calculateTotal.toLocaleString()}</span>
        <span className="text-[10px] md:text-sm text-gray-400 whitespace-nowrap">(税込)</span>
       </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-2 flex-shrink-0">
       {currentStep > 0 && (
        <button
         onClick={handleBack}
         className="px-2 py-2 md:px-6 md:py-3 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1 text-sm md:text-base whitespace-nowrap"
        >
         <ChevronLeft size={16} className="md:w-5 md:h-5" />
         <span className="hidden sm:inline">戻る</span>
        </button>
       )}

       {currentStep < 3 ? (
        <button
         onClick={handleNext}
         disabled={(currentStep === 0 && !selectedVehicle) || (currentStep === 1 && !selectedPaint)}
         className={`
                     flex items-center gap-1 px-3 py-2 md:px-6 md:py-3 rounded-full font-bold text-white shadow-lg transition-all text-sm md:text-base whitespace-nowrap
                     ${((currentStep === 0 && !selectedVehicle) || (currentStep === 1 && !selectedPaint))
           ? 'bg-gray-300 cursor-not-allowed shadow-none'
           : 'bg-primary-600 hover:bg-primary-700 hover:shadow-primary-200 hover:-translate-y-0.5'
          }
                   `}
        >
         次へ
         <ChevronRight size={16} className="md:w-5 md:h-5" />
        </button>
       ) : (
        <button
         onClick={handleNext}
         className="px-3 py-2 md:px-6 md:py-3 rounded-full bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-lg flex items-center gap-1 text-sm md:text-base whitespace-nowrap"
        >
         この内容で確定
         <ChevronRight size={16} className="md:w-5 md:h-5" />
        </button>
       )}
      </div>
     </div>
    </div>
   )}
  </div>
 );
}; export default App;
