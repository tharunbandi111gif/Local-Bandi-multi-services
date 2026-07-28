import React from 'react';
import { LanguageCode } from '../../types';
import LanguageSettings from './LanguageSettings';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage?: LanguageCode;
  onSelectLanguage?: (code: LanguageCode) => void;
  title?: string;
}

export default function LanguageSelectorModal({
  isOpen,
  onClose,
  selectedLanguage,
  onSelectLanguage,
  title = 'Select Preferred Language'
}: LanguageSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <LanguageSettings
      variant="modal"
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      onSelect={(code) => {
        if (onSelectLanguage) onSelectLanguage(code);
      }}
    />
  );
}
