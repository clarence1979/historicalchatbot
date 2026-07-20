import React, { useState } from 'react';
import { AlertTriangle, X, Info } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(() => {
    return !sessionStorage.getItem('disclaimer-acknowledged');
  });

  const acknowledgeDisclaimer = () => {
    sessionStorage.setItem('disclaimer-acknowledged', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-3 sm:px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-start justify-between">
        <div className="flex items-start">
          <AlertTriangle className="h-4 sm:h-5 w-4 sm:w-5 text-amber-600 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1 text-xs sm:text-sm">Educational Use - Adult Supervision Required</p>
            <p className="text-xs sm:text-sm leading-relaxed">
              This AI application is for educational purposes only. AI responses may contain inaccuracies. 
              Students under 18 must use under adult supervision. All conversations should be reviewed by educators.
            </p>
          </div>
        </div>
        <button
          onClick={acknowledgeDisclaimer}
          className="ml-2 sm:ml-4 p-1 text-amber-600 hover:text-amber-800 transition-colors flex-shrink-0"
          title="Acknowledge and dismiss"
        >
          <X className="h-3 sm:h-4 w-3 sm:w-4" />
        </button>
      </div>
    </div>
  );
};