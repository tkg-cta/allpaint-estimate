import React, { useState, useMemo, useEffect } from 'react';
import liff from '@line/liff';
import { VEHICLES, PAINTS, OPTIONS } from './constants';
import { VehicleType, PaintType, SelectedOptions, PricingType, OptionItem } from './types';
import { StepWizard } from './components/StepWizard';
import { OptionCard } from './components/OptionCard';
import { VehicleCard } from './components/VehicleCard';
import { PaintCard } from './components/PaintCard';
import { Modal } from './components/Modal';
import { ChevronRight, ChevronLeft, Car, ArrowRight, RotateCcw, Calendar, Mail, Phone, User, Send, Clock, CheckCircle, Edit2, Loader2, MessageCircle, AlertCircle, Info, X } from 'lucide-react';
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
 formatPhoneNumber,
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
 const [selectedOptionForDetail, setSelectedOptionForDetail] = useState<OptionItem | null>(null);
 const [activeCategory, setActiveCategory] = useState('prep');

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

  const LIFF_ID = "2008641975-j1OwPK6n";

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
      console.error("LIFF getProfile failed", err);
     });
   })
   .catch((error: Error) => {
    console.error("LIFF init failed", error);
    alert('LINEアプリの初期化に失敗しました。\n\nエラー詳細:\n' + error.message + '\n\nLIFF ID: 2008641975-j10wPK6n');
   });
 }, []);

 // ★スプレッドシートCMS: オプションデータの取得
 const [optionsData, setOptionsData] = useState<OptionItem[]>(OPTIONS);
 const [isLoadingOptions, setIsLoadingOptions] = useState(true);

 useEffect(() => {
  const fetchOptions = async () => {
   try {
    // 環境変数からGASのURLを取得
    const GAS_URL = import.meta.env.VITE_GAS_WEBHOOK_URL;
    if (!GAS_URL) {
     console.warn("VITE_GAS_WEBHOOK_URL not set, using fallback options.");
     setIsLoadingOptions(false);
     return;
    }

    // action=getOptions パラメータを付与
    const response = await fetch(`${GAS_URL}?action=getOptions`);
    if (!response.ok) {
     throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.options && Array.isArray(data.options)) {
     console.log("Options fetched from GAS:", data.options);
     setOptionsData(data.options);
    } else {
     console.warn("Invalid data format from GAS, using fallback.");
    }
   } catch (error) {
    console.error("Failed to fetch options from GAS:", error);
    // エラー時はフォールバックデータ(OPTIONS)が初期値として使われるので何もしない
   } finally {
    setIsLoadingOptions(false);
   }
  };

  fetchOptions();
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
   const option = optionsData.find(o => o.id === optionId);
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

  // ★電話番号の自動フォーマット (携帯電話のみ)
  let formattedValue = value;
  if (name === 'phone') {
   formattedValue = formatPhoneNumber(value);
  }

  setFormData(prev => ({ ...prev, [name]: formattedValue }));

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
    // ★修正: 動的に取得した optionsData を使用
    const option = optionsData.find(o => o.id === id);
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

  // ★ローカル開発用のモックトークン設定
  let finalLineUserId = lineUserId;
  let finalLiffIdToken = liffIdToken;

  if (import.meta.env.DEV) {
   console.log('🔧 Running in DEV mode: Using mock LIFF tokens');
   finalLineUserId = 'MOCK_USER_ID_FOR_LOCAL_DEV';
   finalLiffIdToken = 'MOCK_ID_TOKEN_FOR_LOCAL_DEV';
  }

  const payload = {
   customer: sanitizedFormData,
   quote: {
    vehicle: selectedVehicle,
    paint: selectedPaint,
    options: detailedOptions,
    totalPrice: calculateTotal
   },
   // ↓ ★追加: GAS側で「誰からのアクセスか」を知るためにIDを一緒に送る
   lineUserId: finalLineUserId,
   liffIdToken: finalLiffIdToken
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
   // CORSプリフライトを防ぐために Content-Type を text/plain に設定
   const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: {
     'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
   });

   if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
   }

   const result = await response.json();
   console.log("GAS Response:", result);

   if (!result.success) {
    // GAS側でエラーが返された場合
    throw new Error(result.message || 'Unknown GAS error');
   }

   console.log("送信成功:", payload);

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

 // ローディング画面
 if (isLoadingOptions) {
  return (
   <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
     <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
     <p className="text-gray-600 font-medium">データを読み込んでいます...</p>
    </div>
   </div>
  );
 }

 const renderVehicleStep = () => (
  <div className="animate-fade-in">
   <h2 className="text-2xl font-bold text-primary-900 mb-2">Step 1. お車をお選びください</h2>
   <p className="text-gray-500 mb-6">塗装を行う車両のタイプを選択してください。</p>
   <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
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
   <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
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

 const renderOptionsStep = () => {
  const categories = [
   { id: 'prep', label: '下地処理・補修' },
   { id: 'parts', label: '部品脱着' },
   { id: 'special', label: '塗装・仕上げオプション' },
   { id: 'coating', label: 'コーティング・その他' },
  ];

  const currentCategoryOptions = optionsData.filter(o => o.category === activeCategory);

  return (
   <div className="animate-fade-in pb-24">
    <h2 className="text-2xl font-bold text-primary-900 mb-2">Step 3. オプション選択</h2>
    <p className="text-gray-500 mb-4">お車の状態やご希望に合わせてオプションをお選びください。</p>

    {/* Category Tabs */}
    <div className="flex justify-center mb-6">
     <div className="max-w-full overflow-x-auto scrollbar-hide">
      <div className="inline-flex bg-gray-100 p-1 rounded-lg whitespace-nowrap">
       {categories.map((cat) => (
        <button
         key={cat.id}
         onClick={() => setActiveCategory(cat.id)}
         className={`
         px-4 py-1.5 rounded-md text-sm font-bold transition-all
         ${activeCategory === cat.id
           ? 'bg-white text-primary-600 shadow-sm'
           : 'text-gray-500 hover:text-gray-700'
          }
        `}
        >
         {cat.label}
        </button>
       ))}
      </div>
     </div>
    </div>

    {/* Options List */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
     {activeCategory === 'prep' && (
      <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-t-xl flex items-start gap-2">
       <Info size={14} className="mt-0.5 flex-shrink-0" />
       <span>1パネル20cm×20cmとなります。施工面積に合わせて数量を増やしてください</span>
      </div>
     )}

     {currentCategoryOptions.map(option => (
      <OptionCard
       key={option.id}
       option={option}
       vehicleSize={selectedVehicle?.category || 'S'}
       value={selectedOptions[option.id] || 0}
       onChange={(val) => handleOptionChange(option.id, val)}
       onShowDetails={(opt) => setSelectedOptionForDetail(opt)}
      />
     ))}

     {currentCategoryOptions.length === 0 && (
      <div className="p-8 text-center text-gray-400">
       このカテゴリのオプションはありません
      </div>
     )}
    </div>

    {/* Option Details Modal */}
    <Modal
     isOpen={!!selectedOptionForDetail}
     onClose={() => setSelectedOptionForDetail(null)}
     title={selectedOptionForDetail?.name || ''}
    >
     <div className="space-y-6">
      <div className="rounded-xl overflow-hidden shadow-md">
       <img
        src={selectedOptionForDetail?.image}
        alt={selectedOptionForDetail?.name}
        className="w-full h-48 sm:h-64 object-cover"
       />
      </div>

      <div>
       <h4 className="font-bold text-lg text-gray-900 mb-2">オプション詳細</h4>
       <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
        {selectedOptionForDetail?.detailDescription || selectedOptionForDetail?.description}
       </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
       <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-2">価格について</h4>
       <p className="text-primary-700 font-bold text-xl">
        {selectedOptionForDetail && selectedVehicle && (
         <>
          ¥{(typeof selectedOptionForDetail.price === 'number'
           ? selectedOptionForDetail.price
           : selectedOptionForDetail.price[selectedVehicle.category]).toLocaleString()}
          {selectedOptionForDetail.pricingType === PricingType.PER_UNIT && (
           <span className="text-sm text-gray-500 font-normal ml-1">
            / {selectedOptionForDetail.unitLabel || '個'}
           </span>
          )}
         </>
        )}
       </p>
      </div>
     </div>
    </Modal>
   </div>
  );
 };

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
       : (selectedVehicle ? option.price[selectedVehicle.category] : 0);

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

   <div className="flex gap-4 mt-8">
    <button
     onClick={() => setCurrentStep(2)}
     className="flex-1 py-4 px-6 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
    >
     戻る
    </button>
    <button
     onClick={() => setCurrentStep(4)}
     className="flex-1 py-4 px-6 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
    >
     お問い合わせへ進む <ArrowRight size={20} />
    </button>
   </div>
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
         inputMode="tel"
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
         inputMode="email"
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

    {/* Inquiry Text */}
    <section>
     <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
      <MessageCircle className="text-primary-600" size={20} />
      お問い合わせ内容・ご要望
     </h3>
     <textarea
      name="inquiry"
      value={formData.inquiry}
      onChange={handleFormChange}
      rows={4}
      className={`w-full px-4 py-3 rounded-xl border ${validationErrors.inquiry ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-200'
       } focus:ring-2 outline-none transition-all`}
      placeholder="その他、ご質問やご要望がございましたらご記入ください。"
     />
     {validationErrors.inquiry && (
      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
       <AlertCircle size={14} />
       {validationErrors.inquiry}
      </p>
     )}
    </section>

    <div className="flex gap-4 pt-4">
     <button
      type="button"
      onClick={handleBack}
      className="flex-1 py-4 px-6 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
     >
      戻る
     </button>
     <button
      type="submit"
      className="flex-1 py-4 px-6 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
     >
      確認画面へ進む <ArrowRight size={20} />
     </button>
    </div>
   </form>
  </div>
 );

 const renderConfirmationStep = () => (
  <div className="animate-fade-in">
   <div className="text-center mb-8">
    <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
     <Send size={32} />
    </div>
    <h2 className="text-2xl font-bold text-gray-900">送信内容の確認</h2>
    <p className="text-gray-500 mt-2">以下の内容で送信してもよろしいですか？</p>
   </div>

   <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
    <div className="p-6 border-b border-gray-100">
     <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
      <User size={20} className="text-primary-600" /> お客様情報
     </h3>
     <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
       <dt className="text-sm text-gray-500">お名前</dt>
       <dd className="font-medium text-gray-900">{formData.name}</dd>
      </div>
      <div>
       <dt className="text-sm text-gray-500">ふりがな</dt>
       <dd className="font-medium text-gray-900">{formData.furigana}</dd>
      </div>
      <div>
       <dt className="text-sm text-gray-500">電話番号</dt>
       <dd className="font-medium text-gray-900">{formData.phone}</dd>
      </div>
      <div>
       <dt className="text-sm text-gray-500">メールアドレス</dt>
       <dd className="font-medium text-gray-900">{formData.email}</dd>
      </div>
     </dl>
    </div>

    <div className="p-6 border-b border-gray-100">
     <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
      <CheckCircle size={20} className="text-primary-600" /> お問い合わせ区分
     </h3>
     <p className="font-medium text-gray-900">
      {formData.inquiryType === 'visit' ? '店舗へ来店して見積もり' : 'お問い合わせのみ'}
     </p>
    </div>

    <div className="p-6 border-b border-gray-100">
     <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
      <Calendar size={20} className="text-primary-600" /> 来店希望日時
     </h3>
     <div className="space-y-2">
      {[1, 2, 3].map(num => {
       // @ts-ignore
       const date = formData[`preferredDate${num}`];
       // @ts-ignore
       const time = formData[`preferredTime${num}`];
       if (!date && !time) return null;
       return (
        <div key={num} className="flex gap-4">
         <span className="text-sm text-gray-500 w-16">第{num}希望:</span>
         <span className="font-medium text-gray-900">
          {date || '---'} {time || '---'}
         </span>
        </div>
       );
      })}
      {!formData.preferredDate1 && !formData.preferredTime1 && (
       <p className="text-gray-500 italic">指定なし</p>
      )}
     </div>
    </div>

    <div className="p-6">
     <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
      <MessageCircle size={20} className="text-primary-600" /> お問い合わせ内容
     </h3>
     <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
      {formData.inquiry || <span className="text-gray-400 italic">なし</span>}
     </p>
    </div>
   </div>

   <div className="flex gap-4">
    <button
     onClick={() => {
      setCurrentStep(5); // Back to form
      window.scrollTo({ top: 0, behavior: 'smooth' });
     }}
     className="flex-1 py-4 px-6 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
     disabled={isSubmitting}
    >
     修正する
    </button>
    <button
     onClick={handleFinalSubmit}
     disabled={isSubmitting}
     className="flex-1 py-4 px-6 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
    >
     {isSubmitting ? (
      <>
       <Loader2 className="animate-spin" size={20} /> 送信中...
      </>
     ) : (
      <>
       送信する <Send size={20} />
      </>
     )}
    </button>
   </div>
  </div>
 );

 const renderCompleteStep = () => (
  <div className="animate-scale-in text-center py-12">
   <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
    <CheckCircle size={48} />
   </div>
   <h2 className="text-3xl font-bold text-gray-900 mb-4">送信完了</h2>
   <p className="text-gray-600 mb-8 leading-relaxed">
    お問い合わせありがとうございます。<br />
    内容を確認の上、担当者よりご連絡させていただきます。<br />
    自動返信メールをお送りしましたのでご確認ください。
   </p>
   <button
    onClick={() => {
     if (liff.isInClient()) {
      liff.closeWindow();
     } else {
      window.close(); alert('LINEアプリに戻るか、ブラウザのタブを閉じてください。');
     }
    }}
    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200"
   >
    <X size={20} /> お見積もりページを閉じてLINEに戻る
   </button>
  </div>
 );

 return (
  <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
   {/* Header */}
   <header className="bg-white shadow-sm sticky top-0 z-40">
    <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
     <div className="flex items-center gap-2">
      <Car className="text-primary-600" size={24} />
      <h1 className="font-bold text-xl tracking-tight">Allpaint Simulator</h1>
     </div>
     <div className="text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
      Step {currentStep + 1}/7
     </div>
    </div>
    {/* Progress Bar */}
    <div className="h-1.5 bg-gray-100 w-full flex">
     {[...Array(7)].map((_, i) => (
      <div
       key={i}
       className={`h-full flex-1 transition-colors duration-500 ${i <= currentStep ? 'bg-primary-500' : 'bg-transparent'}`}
      />
     ))}
    </div>
   </header>

   <main className="max-w-3xl mx-auto px-4 py-8">
    <StepWizard currentStep={currentStep}>
     {renderVehicleStep()}
     {renderPaintStep()}
     {renderOptionsStep()}
     {renderSummaryStep()}
     {renderInquiryForm()}
     {renderConfirmationStep()}
     {renderCompleteStep()}
    </StepWizard>
   </main>

   {/* Footer Navigation (only for first 3 steps) */}
   {currentStep < 3 && (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
     <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">

      {/* Left: Total Amount */}
      <div className="flex flex-col">
       <span className="text-[10px] font-bold text-gray-500 leading-tight">概算見積</span>
       <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900 leading-none">
         {calculateTotal.toLocaleString()}
        </span>
        <span className="text-sm font-bold text-gray-900">円</span>
       </div>
      </div>

      {/* Right: Navigation Buttons */}
      <div className="flex gap-3 items-center">
       <button
        onClick={handleBack}
        disabled={currentStep === 0}
        className={`
         px-6 py-3 rounded-lg font-bold text-sm transition-colors
         ${currentStep === 0
          ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
         }
        `}
       >
        戻る
       </button>
       <button
        onClick={handleNext}
        disabled={
         (currentStep === 0 && !selectedVehicle) ||
         (currentStep === 1 && !selectedPaint)
        }
        className={`
         px-8 py-3 rounded-lg font-bold text-sm shadow-md flex items-center justify-center gap-1 transition-all
         ${((currentStep === 0 && !selectedVehicle) || (currentStep === 1 && !selectedPaint))
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          : 'bg-primary-600 text-white shadow-primary-200 hover:bg-primary-700 hover:shadow-xl hover:-translate-y-0.5'
         }
        `}
       >
        次へ <ChevronRight size={18} />
       </button>
      </div>

     </div>
    </div>
   )}
  </div>
 );
};

export default App;


