import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle, Clock } from 'lucide-react';
import { SupportMessage } from '../../types';

const LOCAL_SUPPORT_KEY = 'ynab_support_messages_v1';

export function AdminSupportPage() {
  const [messages, setMessages] = useState<SupportMessage[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_SUPPORT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [selectedUserId, setSelectedUserId] = useState<string>(() => {
    return messages[0]?.userId || 'user-client-001';
  });
  const [replyText, setReplyText] = useState('');

  // Agrupar mensajes por cliente
  const clientConversations = Array.from(
    new Set(messages.map((m) => m.userId))
  ).map((userId) => {
    const userMsgs = messages.filter((m) => m.userId === userId);
    const lastMsg = userMsgs[userMsgs.length - 1];
    return {
      userId,
      userName: lastMsg?.userName || 'Cliente',
      userEmail: lastMsg?.userEmail || '',
      lastMessage: lastMsg?.content || '',
      lastDate: lastMsg?.createdAt || '',
      hasOpen: userMsgs.some((m) => m.status === 'open' && m.sender === 'client'),
      messages: userMsgs,
    };
  });

  const activeConversation = clientConversations.find((c) => c.userId === selectedUserId) || clientConversations[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConversation) return;

    const newReply: SupportMessage = {
      id: `msg-${Date.now()}-admin`,
      userId: activeConversation.userId,
      userEmail: 'admin@ynab.test',
      userName: 'Soporte Administrativo',
      sender: 'admin',
      content: replyText.trim(),
      status: 'answered',
      createdAt: new Date().toISOString(),
    };

    // Actualizar estados a contestado
    const updated = messages.map((m) =>
      m.userId === activeConversation.userId ? { ...m, status: 'answered' as const } : m
    );
    updated.push(newReply);

    setMessages(updated);
    localStorage.setItem(LOCAL_SUPPORT_KEY, JSON.stringify(updated));
    setReplyText('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[680px] flex flex-col md:flex-row">
      {/* Columna Izquierda: Lista de Conversaciones */}
      <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="font-black text-slate-900 text-base flex items-center">
            <MessageSquare className="w-4 h-4 mr-2 text-indigo-600" />
            Tickets de Soporte
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Bandeja de entrada de usuarios</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {clientConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No hay mensajes de soporte aún.
            </div>
          ) : (
            clientConversations.map((conv) => {
              const isSelected = conv.userId === selectedUserId;
              return (
                <button
                  key={conv.userId}
                  onClick={() => setSelectedUserId(conv.userId)}
                  className={`w-full p-4 text-left transition-colors flex flex-col gap-1 ${
                    isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{conv.userName}</span>
                    {conv.hasOpen ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        <Clock className="w-3 h-3 mr-0.5 text-amber-600" />
                        Pendiente
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle className="w-3 h-3 mr-0.5 text-emerald-600" />
                        Atendido
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{conv.userEmail}</p>
                  <p className="text-xs text-slate-700 truncate mt-0.5">{conv.lastMessage}</p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Columna Derecha: Hilo de Mensajes Activo */}
      <div className="flex-1 flex flex-col bg-white">
        {activeConversation ? (
          <>
            {/* Cabecera del Hilo */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{activeConversation.userName}</h3>
                <p className="text-xs text-slate-500 font-mono">{activeConversation.userEmail}</p>
              </div>
              <span className="text-xs text-slate-400">
                ID: {activeConversation.userId}
              </span>
            </div>

            {/* Mensajes */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30">
              {activeConversation.messages.map((msg) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3.5 rounded-2xl text-xs ${
                        isAdmin
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
                      }`}
                    >
                      <p className="font-semibold text-[10px] opacity-75 mb-1">
                        {isAdmin ? 'Tú (Administrador)' : msg.userName}
                      </p>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <span className="text-[9px] opacity-60 block mt-1.5 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Formulario de Respuesta */}
            <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200 flex items-center space-x-3 bg-white">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribe una respuesta como administrador..."
                className="flex-1 text-xs border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center space-x-1.5"
              >
                <span>Responder</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
            Selecciona una conversación para responder.
          </div>
        )}
      </div>
    </div>
  );
}
