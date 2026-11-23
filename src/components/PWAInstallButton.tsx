import React, { useState } from 'react';
import { CheckCircle2, Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'card' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'card' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGenericGuide, setShowGenericGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'compact') return null;
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-[#E6F4EC] border border-[#C3E5D2] px-4 py-3 text-sm text-[#1F6E4A]">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <span className="font-medium">
          Career Radar est déjà installé sur ton appareil.
        </span>
      </div>
    );
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    setShowGenericGuide(true);
  };

  if (variant === 'compact') {
    if (!isInstallable && !isIOS) return null;
    return (
      <>
        <button
          type="button"
          onClick={() => void handleClick()}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#FDE8D3] px-3 py-1.5 text-xs font-semibold text-[#2B4233] hover:bg-[#F7D7B7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          Installer
        </button>
        {showIOSGuide && <IOSInstallModal onClose={() => setShowIOSGuide(false)} />}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        className="flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-2xl bg-[#2B4233] px-5 py-3 text-sm font-semibold text-white hover:bg-[#203327] active:scale-[0.99] transition-all cursor-pointer"
      >
        <Smartphone className="h-4 w-4 text-[#F2A86F]" />
        <span>Installer l&apos;application sur l&apos;écran d&apos;accueil</span>
      </button>

      {showIOSGuide && <IOSInstallModal onClose={() => setShowIOSGuide(false)} />}
      {showGenericGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Installer Career Radar"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[#F7F3EB] border border-[#E8E0D2] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-lg font-bold text-[#1D2A22]">
                Installer sur ton appareil
              </h3>
              <button
                type="button"
                onClick={() => setShowGenericGuide(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#E8E0D2] text-[#5E6B62] hover:text-[#1D2A22] cursor-pointer"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm text-[#5E6B62] leading-relaxed">
              Ouvre le menu de ton navigateur (Chrome, Edge ou Safari) puis sélectionne{' '}
              <strong className="text-[#1D2A22]">« Installer l&apos;application »</strong> ou{' '}
              <strong className="text-[#1D2A22]">« Ajouter à l&apos;écran d&apos;accueil »</strong>{' '}
              pour profiter du mode 100% hors-ligne.
            </p>
            <button
              type="button"
              onClick={() => setShowGenericGuide(false)}
              className="mt-5 min-h-[44px] w-full rounded-2xl bg-[#2B4233] py-2.5 text-sm font-semibold text-white hover:bg-[#203327] transition-colors cursor-pointer"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const IOSInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    role="dialog"
    aria-modal="true"
    aria-label="Installer sur iPhone ou iPad"
  >
    <div className="w-full max-w-sm rounded-3xl bg-[#F7F3EB] border border-[#E8E0D2] p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-bold text-[#1D2A22]">
          Installer sur iPhone / iPad
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#E8E0D2] text-[#5E6B62] hover:text-[#1D2A22] cursor-pointer"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ol className="mt-4 space-y-3 text-sm text-[#1D2A22]">
        <li className="flex items-start gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FDE8D3] text-xs font-bold text-[#2B4233]">
            1
          </span>
          <span>
            Appuie sur le bouton <strong className="inline-flex items-center gap-1">Partager <Share className="h-3.5 w-3.5 inline" /></strong> dans la barre Safari.
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FDE8D3] text-xs font-bold text-[#2B4233]">
            2
          </span>
          <span>
            Fais défiler puis appuie sur <strong>Sur l&apos;écran d&apos;accueil</strong>.
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FDE8D3] text-xs font-bold text-[#2B4233]">
            3
          </span>
          <span>
            Confirme avec <strong>Ajouter</strong> pour lancer Career Radar hors-ligne.
          </span>
        </li>
      </ol>
      <button
        type="button"
        onClick={onClose}
        className="mt-5 min-h-[44px] w-full rounded-2xl bg-[#2B4233] py-2.5 text-sm font-semibold text-white hover:bg-[#203327] transition-colors cursor-pointer"
      >
        Fermer
      </button>
    </div>
  </div>
);
