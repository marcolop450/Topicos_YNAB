import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SupportMessage } from '../types';

const LOCAL_SUPPORT_KEY = 'ynab_support_messages_v1';

const DEFAULT_MESSAGES: SupportMessage[] = [
  {
    id: 'msg-seed-1',
    userId: 'user-client-001',
    userEmail: 'marco@ynab.test',
    userName: 'Marco López',
    sender: 'admin',
    content: '¡Hola! Bienvenido al sistema de soporte de YNAB. ¿En qué podemos orientarte hoy?',
    status: 'answered',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export function SupportWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_SUPPORT_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_MESSAGES;
    } catch {
      return DEFAULT_MESSAGES;
    }
  });
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const saveMessages = (msgs: SupportMessage[]) => {
    setMessages(msgs);
    localStorage.setItem(LOCAL_SUPPORT_KEY, JSON.stringify(msgs));
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !user) return;

    const userMsg: SupportMessage = {
      id: `msg-${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      userName: user.fullName,
      sender: 'client',
      content: inputMessage.trim(),
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    const newMsgs = [...messages, userMsg];
    saveMessages(newMsgs);
    setInputMessage('');

    // Respuesta inteligente automática si coincide con temas frecuentes
    setTimeout(() => {
      const lower = userMsg.content.toLowerCase();
      let replyContent = 'Tu mensaje ha sido recibido por el equipo de administración. Te responderemos a la brevedad.';

      if (lower.includes('listo para asignar') || lower.includes('ready to assign')) {
        replyContent = '"Listo para Asignar" representa el dinero total disponible en tus cuentas que aún no ha recibido un trabajo. Asígnalo a tus categorías hasta que llegue a $0.00 (Regla #1).';
      } else if (lower.includes('sobregasto') || lower.includes('rojo') || lower.includes('overspent')) {
        replyContent = 'Cuando una categoría está en rojo, gastaste más de lo previsto. Sigue la Regla #3 ("Ajusta tus velas"): mueve dinero desde otra categoría con saldo positivo para equilibrarla.';
      } else if (lower.includes('simulador') || lower.includes('sueldo') || lower.includes('banco')) {
        replyContent = 'Puedes usar el Simulador Bancario en /app/bank-simulator para inyectar sueldos y simular gastos comerciales sin necesidad de tarjetas reales.';
      }

      const botReply: SupportMessage = {
        id: `msg-${Date.now()}-reply`,
        userId: user.id,
        userEmail: 'admin@ynab.test',
        userName: 'Soporte YNAB',
        sender: 'admin',
        content: replyContent,
        status: 'answered',
        createdAt: new Date().toISOString(),
      };
      saveMessages([...newMsgs, botReply]);
    }, 600);
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Botón Flotante Disparador */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 transition-all duration-200 focus:outline-none ring-4 ring-blue-500/20"
          title="Abrir soporte y chat de ayuda"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <span className="text-xs font-extrabold tracking-wide hidden sm:inline">
            Soporte & Ayuda
          </span>
        </button>
      )}

      {/* Ventana Emergente de Chat */}
      {isOpen && (
        <div className="w-96 max-w-[calc(100vw-2rem)] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Cabecera */}
          <div className="bg-gradient-to-r from-ynab-blue to-blue-900 text-white px-5 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 font-black">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Mesa de Soporte YNAB</h3>
                <p className="text-[11px] text-blue-200 flex items-center mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  Administrador en línea
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preguntas Rápidas */}
          <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-2.5">
            <p className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
              Preguntas Frecuentes:
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickQuestion('¿Cómo funciona Listo para Asignar?')}
                className="text-[10px] font-medium bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-2 py-1 rounded-md border border-slate-200 transition-colors"
              >
                ¿Listo para Asignar?
              </button>
              <button
                type="button"
                onClick={() => handleQuickQuestion('¿Cómo soluciono un sobregasto en rojo?')}
                className="text-[10px] font-medium bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-2 py-1 rounded-md border border-slate-200 transition-colors"
              >
                ¿Sobregasto en rojo?
              </button>
              <button
                type="button"
                onClick={() => handleQuickQuestion('¿Cómo usar el Simulador Bancario?')}
                className="text-[10px] font-medium bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-2 py-1 rounded-md border border-slate-200 transition-colors"
              >
                ¿Simulador Bancario?
              </button>
            </div>
          </div>

          {/* Lista de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 text-xs">
            {messages.map((msg) => {
              const isMe = msg.sender === 'client';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-2 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold ${
                      isMe ? 'bg-blue-600' : 'bg-emerald-600'
                    }`}
                  >
                    {isMe ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <div
                    className={`max-w-[75%] p-3 rounded-2xl ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <p className="font-semibold text-[10px] opacity-75 mb-0.5">
                      {isMe ? 'Tú' : msg.userName}
                    </p>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <span className="text-[9px] opacity-60 block mt-1 text-right">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de Envío */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escribe tu consulta..."
              className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow-md transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
