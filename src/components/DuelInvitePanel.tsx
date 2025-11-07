import { useState } from 'react';
import { Copy, X } from 'lucide-react';

interface DuelInvitePanelProps {
  roomId: string;
  onClose: () => void;
}

export const DuelInvitePanel = ({ roomId, onClose }: DuelInvitePanelProps) => {
  const [copied, setCopied] = useState(false);

  const buildDuelUrl = () => {
    const base = `${window.location.origin}${window.location.pathname}`;
    const url = new URL(base);
    url.searchParams.set('mode', 'duel');
    url.searchParams.set('room', roomId);
    return url.toString();
  };

  const buildShareText = (url: string) => {
    return `🔥 ¡Te reto en Twin Clash!
🏟️ Sala: ${roomId}
🧠 ¿Puedes ganarme?
${url}`;
  };

  const duelUrl = buildDuelUrl();
  const shareText = buildShareText(duelUrl);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      const result = prompt('Copia el enlace y compártelo:', shareText);
      if (result !== null) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }
    }
  };

  const handleSystemShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Twin Clash',
          text: shareText,
          url: duelUrl,
        });
        return;
      } catch (err) {
        console.log('Share cancelled or failed', err);
      }
    }
    handleCopy();
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(duelUrl)}&text=${encodeURIComponent('🔥 Te reto en Twin Clash!')}`;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      style={{ fontFamily: 'system-ui' }}
    >
      <div className="bg-gray-900 text-white rounded-2xl p-6 w-full max-w-lg">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-2xl font-bold m-0">🧠 ¡Duelo creado!</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <p className="opacity-90 mb-4 text-sm">
          Sala: <span className="font-mono font-bold text-blue-400">{roomId}</span>
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl transition-colors font-semibold"
          >
            <Copy size={16} />
            {copied ? '✅ Copiado' : 'Copiar enlace'}
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl transition-colors font-semibold no-underline"
          >
            🟢 WhatsApp
          </a>

          <a
            href={telegramUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-colors font-semibold no-underline"
          >
            💬 Telegram
          </a>

          <button
            onClick={handleSystemShare}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl transition-colors font-semibold"
          >
            📲 Compartir
          </button>
        </div>

        <div className="mt-4 opacity-80 text-sm bg-gray-800 rounded-lg p-3">
          💡 Envía este enlace a tu rival. Al abrirlo, entrará directamente a tu sala.
        </div>
      </div>
    </div>
  );
};
