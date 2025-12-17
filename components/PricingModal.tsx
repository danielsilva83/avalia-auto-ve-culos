
import React, { useState, useEffect, useRef } from 'react';
import { Check, Star, Zap, ArrowLeft, QrCode, Copy, RefreshCw, XCircle, CheckCircle2, X } from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { authService } from '../services/authService';

interface PricingModalProps {
  onUpgrade: () => void;
  onClose?: () => void;
}

type PaymentStep = 'offer' | 'loading_pix' | 'pix' | 'processing_payment' | 'success' | 'error';

const PricingModal: React.FC<PricingModalProps> = ({ onUpgrade, onClose }) => {
  const [step, setStep] = useState<PaymentStep>('offer');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutos para pagar (padrão MP)
  const [isActivating, setIsActivating] = useState(false);
  
  // Dados do pagamento
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [copyPaste, setCopyPaste] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Timer Regressivo visual
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (step === 'pix') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setStep('error');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [step]);

  // Polling de Status
  useEffect(() => {
    if (step === 'pix' && paymentId) {
      pollingInterval.current = setInterval(async () => {
        try {
          const status = await paymentService.checkPaymentStatus(paymentId);
          console.log("Status Pagamento:", status);
          
          if (status === 'approved') {
             if (pollingInterval.current) clearInterval(pollingInterval.current);
             setStep('success');
          } else if (status === 'cancelled' || status === 'rejected') {
             if (pollingInterval.current) clearInterval(pollingInterval.current);
             setStep('error');
          }
        } catch (e) {
          console.error("Erro no polling", e);
        }
      }, 5000); // Checa a cada 5s
    }

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [step, paymentId]);

  // Iniciar fluxo de geração do PIX
  const handleStartPayment = async () => {
    setStep('loading_pix');
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error("Usuário não logado");

      const data = await paymentService.createPixPayment(user.email);
      
      // Se vier base64 do MP, usa. Se não (mock), usa imagem de placeholder.
      if (data.qrCodeBase64) {
        setQrCodeImage(`data:image/png;base64,${data.qrCodeBase64}`);
      } else {
        // Imagem genérica de QR Code para testes/mock
        setQrCodeImage("https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg");
      }

      setCopyPaste(data.copyPasteCode);
      setPaymentId(data.paymentId);
      setTimeLeft(600); // Reset timer
      setStep('pix');

    } catch (error) {
      console.error(error);
      alert("Erro ao gerar Pix. Tente novamente.");
      setStep('offer');
    }
  };

  const handleFinish = async () => {
    setIsActivating(true);
    await onUpgrade();
  };

  const handleRetry = () => {
    handleStartPayment();
  };

  const handleFree = () => {
    if (onClose) onClose();
  };

  const copyPixCode = () => {
    if (copyPaste) {
      navigator.clipboard.writeText(copyPaste);
      alert("Código Pix copiado!");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        
        {/* Header Dinâmico */}
        <div className={`p-6 text-center text-white relative transition-colors duration-300 ${
          step === 'error' ? 'bg-red-600' : 
          step === 'success' ? 'bg-green-600' : 
          'bg-slate-900'
        }`}>
          
          {onClose && (step === 'offer' || step === 'error' || step === 'pix' || step === 'loading_pix') && (
            <button 
              onClick={onClose}
              className="absolute top-4 left-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
              title="Voltar"
            >
              <X className="w-6 h-6" />
            </button>
          )}

          <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-full mb-3 shadow-inner backdrop-blur-md">
            {step === 'offer' && <Star className="w-6 h-6 text-yellow-400" fill="currentColor" />}
            {(step === 'pix' || step === 'loading_pix') && <QrCode className="w-6 h-6 text-blue-200" />}
            {step === 'success' && <CheckCircle2 className="w-6 h-6 text-white" />}
            {step === 'error' && <XCircle className="w-6 h-6 text-white" />}
          </div>

          <h2 className="text-2xl font-bold">
            {step === 'offer' && 'Limite Atingido'}
            {step === 'loading_pix' && 'Gerando Pix...'}
            {step === 'pix' && 'Pagamento via Pix'}
            {step === 'success' && 'Pagamento Confirmado!'}
            {step === 'error' && 'Pagamento Expirou'}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {step === 'offer' && 'Você usou seus créditos gratuitos.'}
            {step === 'loading_pix' && 'Conectando ao Mercado Pago...'}
            {step === 'pix' && `Expira em: ${formatTime(timeLeft)}`}
            {step === 'success' && 'Ativando sua conta PRO...'}
            {step === 'error' && 'Gere um novo código para tentar novamente.'}
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6">
          
          {/* STEP 1: OFFER */}
          {step === 'offer' && (
            <div className="space-y-6">
              <div className="border-2 border-slate-900 rounded-xl p-4 relative bg-slate-50">
                <div className="absolute top-0 right-0 bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-sm uppercase tracking-wide">
                  Vitalício
                </div>
                <h3 className="text-lg font-bold text-slate-900">Acesso PRO</h3>
                <div className="flex items-end gap-1 mt-1 mb-4">
                  <span className="text-3xl font-bold text-slate-900">R$ 47,90</span>
                  <span className="text-sm text-gray-500 mb-1 line-through">R$ 97,00</span>
                </div>
                
                <ul className="space-y-2 text-sm text-gray-700 mb-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" /> Consultas Ilimitadas
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" /> Scripts de Negociação
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" /> Assinatura via Pix, sem necessidade de cartão de credito
                  </li>
                </ul>

                <button
                  onClick={handleStartPayment}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <Zap className="w-5 h-5 fill-current" />
                  Liberar Acesso Agora
                </button>
              </div>
              <p className="text-center text-xs text-gray-400">
                Ambiente seguro. Pagamento único.
              </p>
            </div>
          )}

          {/* STEP 2: LOADING */}
          {step === 'loading_pix' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-6">
               <div className="animate-spin w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full"></div>
               <p className="text-sm text-gray-500">Solicitando QR Code seguro...</p>
               
               <button
                onClick={handleFree}
                className="w-full bg-white border border-gray-200 text-gray-500 font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:bg-gray-50"
              >
                Cancelar Compra
              </button>
            </div>
          )}

          {/* STEP 3: PIX QR CODE (REAL ou MOCK) */}
          {step === 'pix' && (
            <div className="flex flex-col items-center space-y-5 animate-fade-in">
              <div className="w-48 h-48 bg-white rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden">
                 {qrCodeImage ? (
                   <img 
                     src={qrCodeImage} 
                     alt="QR Code Pix" 
                     className="w-full h-full object-contain p-1"
                   />
                 ) : (
                   <div className="animate-pulse bg-gray-200 w-full h-full"></div>
                 )}
              </div>

              <div className="w-full">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Código Copia e Cola</label>
                <div className="flex gap-2">
                  <input 
                    readOnly 
                    value={copyPaste} 
                    className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-3 text-sm text-gray-600 outline-none truncate"
                  />
                  <button 
                    onClick={copyPixCode}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3 w-full">
                 <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mt-0.5 shrink-0"></div>
                 <p className="text-xs text-blue-800">
                   Aguardando pagamento... Assim que você pagar, essa tela atualizará.
                 </p>
              </div>

              <button
                onClick={handleFree}
                className="w-full text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors py-2"
              >
                Cancelar e voltar ao app
              </button>
            </div>
          )}

          {/* STEP 4: ERROR / TIMEOUT */}
          {step === 'error' && (
            <div className="flex flex-col items-center space-y-4 animate-fade-in">
              <div className="w-full bg-red-50 border border-red-100 rounded-lg p-4 text-center">
                <p className="text-red-800 text-sm">
                  O tempo limite expirou ou houve um problema.
                </p>
              </div>

              <button
                onClick={handleRetry}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Gerar Novo QR Code
              </button>

              <button
                onClick={handleFree}
                className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                Continuar com Conta Gratuita
              </button>
            </div>
          )}

          {/* STEP 5: SUCCESS */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-4 animate-fade-in">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Sucesso!</h3>
              <p className="text-gray-500 text-center text-sm mb-6">
                Seu plano PRO foi ativado. Você já pode fazer avaliações ilimitadas.
              </p>

              <button
                onClick={handleFinish}
                disabled={isActivating}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-wait"
              >
                {isActivating ? (
                  <>
                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Ativando...
                  </>
                ) : (
                  <>
                   <Zap className="w-5 h-5 fill-current" />
                   Usar App Modo PRO
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PricingModal;
