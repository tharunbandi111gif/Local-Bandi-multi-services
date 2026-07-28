import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LanguageCode, Language } from './types';
import { LANGUAGES } from './constants';
import { translations as customerTranslations } from './translations';
import {
  getLocalizedVendorContent,
  getLocalizedDeliveryContent,
  getLocalizedFranchiseContent,
  getLocalizedCustomerCareContent
} from './utils/localizedContent';
import { auth, db } from './lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Core static UI labels mapped to 24 Indian languages
export const UI_LABELS: Record<string, Record<LanguageCode, string>> = {
  placeOrder: {
    'en-IN': 'Place Order',
    'hi-IN': 'ऑर्डर दें',
    'te-IN': 'ఆర్డర్ చేయండి',
    'ta-IN': 'ஆர்டர் செய்க',
    'kn-IN': 'ಆರ್ಡರ್ ಮಾಡಿ',
    'ml-IN': 'ഓർഡർ നൽകുക',
    'as-IN': 'অৰ্ডাৰ কৰক',
    'bn-IN': 'অর্ডার করুন',
    'brx-IN': 'अर्डर खालाम',
    'doi-IN': 'ऑर्डर करो',
    'gu-IN': 'ઓર્ડર કરો',
    'ks-IN': 'آرڈر کریو',
    'gom-IN': 'ऑर्डर करा',
    'mai-IN': 'ऑर्डर करू',
    'mni-IN': 'ꯑꯣꯔꯗꯔ ꯇꯧꯕꯤꯌꯨ',
    'mr-IN': 'ऑर्डर द्या',
    'ne-IN': 'अर्डर गर्नुहोस्',
    'or-IN': 'ଅର୍ଡର କରନ୍ତୁ',
    'pa-IN': 'ਆਰਡਰ ਕਰੋ',
    'sa-IN': 'आदेशं ददातु',
    'sat-IN': 'ᱚᱨᱰᱚᱨ ᱢᱮ',
    'sd-IN': 'آرڊر ڪريو',
    'ur-IN': 'آرڈر کریں',
    'tcy-IN': 'ఆర్డర్ మాన్లే'
  },
  deliveryPartner: {
    'en-IN': 'Delivery Partner',
    'hi-IN': 'डिलीवरी पार्टनर',
    'te-IN': 'డెలివరీ భాగస్వామి',
    'ta-IN': 'டெலிவரி பார்ட்னர்',
    'kn-IN': 'ಡೆಲಿವರಿ ಪಾಲುದಾರ',
    'ml-IN': 'ഡെലിവറി പങ്കാളി',
    'as-IN': 'ডেলিভাৰী অংশীদাৰ',
    'bn-IN': 'ডেলিভারি পার্টনার',
    'brx-IN': 'डिलिभरी लोगो',
    'doi-IN': 'डिलीवरी साथी',
    'gu-IN': 'ડિલિવરી પાર્ટનર',
    'ks-IN': 'ڈلیوری پارٹنر',
    'gom-IN': 'डिलीवरी वांगडी',
    'mai-IN': 'डिलीवरी पार्टनर',
    'mni-IN': 'ꯗꯦꯂꯤꯕꯔꯤ ꯄꯥꯔꯇꯅꯔ',
    'mr-IN': 'डिलीव्हरी पार्टनर',
    'ne-IN': 'डेलिभरी पार्टनर',
    'or-IN': 'ଡେଲିଭରୀ ପାର୍ଟନର',
    'pa-IN': 'ਡਿਲੀਵਰੀ ਪਾਰਟਨਰ',
    'sa-IN': 'वितरण-सहयोगी',
    'sat-IN': 'ᱰᱮᱞᱤᱵᱷᱚᱨᱤ ᱯᱟᱨᱴᱱᱚᱨ',
    'sd-IN': 'ڊليوري پارٽنر',
    'ur-IN': 'ڈیلیوری پارٹنر',
    'tcy-IN': 'డెలివరీ పార్ట్నర్'
  },
  pendingPayout: {
    'en-IN': 'Pending Payout',
    'hi-IN': 'बकाया भुगतान',
    'te-IN': 'పెండింగ్ పేఅవుట్',
    'ta-IN': 'நிலுவையில் உள்ள பணம்',
    'kn-IN': 'ಬಾಕಿ ಪಾವತಿ',
    'ml-IN': 'പെൻഡിംഗ് പേഔട്ട്',
    'as-IN': 'বাকী থকা পৰিশোধ',
    'bn-IN': 'বকেয়া পেআউট',
    'brx-IN': 'थानाय पेआउट',
    'doi-IN': 'बाकी भुगतान',
    'gu-IN': 'પેન્ડિંગ પેઆઉટ',
    'ks-IN': 'باقی پی آؤٹ',
    'gom-IN': 'उरिल्लो भरणा',
    'mai-IN': 'बाकी भुगतान',
    'mni-IN': 'ꯄꯦꯟꯗꯤꯡ ꯄꯦꯑꯥꯎꯠ',
    'mr-IN': 'प्रलंबित पेआउट',
    'ne-IN': 'बाँकी भुक्तानी',
    'or-IN': 'ବକେୟା ପେଆଉଟ୍',
    'pa-IN': 'ਬਕਾਇਆ ਅਦਾਇਗੀ',
    'sa-IN': 'लम्बमानं भुक्तानम्',
    'sat-IN': 'ᱵᱟ scale ᱯᱮ ᱟᱣᱩᱴ',
    'sd-IN': 'بقايا پي آئوٽ',
    'ur-IN': 'بقايا ادائیگی',
    'tcy-IN': 'పెండింగ్ బాకీ'
  },
  merchantNetwork: {
    'en-IN': 'Merchant Network',
    'hi-IN': 'विक्रेता नेटवर्क',
    'te-IN': 'విక్రేతల నెట్‌వర్క్',
    'ta-IN': 'வணிகர் நெட்வொர்க்',
    'kn-IN': 'ವರ್ತಕರ ಜಾಲ',
    'ml-IN': 'മർച്ചന്റ് നെറ്റ്‌വർക്ക്',
    'as-IN': 'ব্যৱসায়ী নেটৱৰ্ক',
    'bn-IN': 'মার্চেন্ট নেটওয়ার্ক',
    'brx-IN': 'फालांगिगिरि जाल',
    'doi-IN': 'व्यापारी नेटवर्क',
    'gu-IN': 'મર્ચન્ટ નેટવર્ક',
    'ks-IN': 'تاجر نیٹ ورک',
    'gom-IN': 'व्यापारी जाळें',
    'mai-IN': 'व्यापारी नेटवर्क',
    'mni-IN': 'ꯃꯔꯆꯦꯟꯇ ꯅꯦꯠꯋꯥꯔꯛ',
    'mr-IN': 'व्यापारी नेटवर्क',
    'ne-IN': 'व्यापारी संजाल',
    'or-IN': 'ବ୍ୟବସାୟୀ ନେଟୱାର୍କ',
    'pa-IN': 'ਮਰਚੈਂਟ ਨੈੱਟਵਰਕ',
    'sa-IN': 'वणिक्-जालम्',
    'sat-IN': 'ᱢᱟᱨᱪᱮᱱᱴ ᱱᱮᱴᱣᱟᱨᱠ',
    'sd-IN': 'مرچنٽ نيٽورڪ',
    'ur-IN': 'مرچنٹ نیٹ ورک',
    'tcy-IN': 'మర్చంట్ నెట్‌వర్క్'
  },
  deliveryFleet: {
    'en-IN': 'Delivery Fleet',
    'hi-IN': 'डिलीवरी टीम',
    'te-IN': 'డెలివరీ దళం',
    'ta-IN': 'டெலிவரி படை',
    'kn-IN': 'ಡೆಲಿವರಿ ಪಡೆ',
    'ml-IN': 'ഡെലിവറി ടീം',
    'as-IN': 'ডেলিভাৰী গোট',
    'bn-IN': 'ডেলিভারি বহর',
    'brx-IN': 'डिलिभरी दुलारु',
    'doi-IN': 'डिलीवरी टोली',
    'gu-IN': 'ડિલિવરી ટુકડી',
    'ks-IN': 'ڈلیوری ٹیم',
    'gom-IN': 'डिलीवरी पंगड',
    'mai-IN': 'डिलीवरी टीम',
    'mni-IN': 'ꯗꯦꯂꯤꯕꯔꯤ ꯀꯥꯡꯕꯨ',
    'mr-IN': 'डिलीव्हरी पथक',
    'ne-IN': 'डेलिभरी टोली',
    'or-IN': 'ଡେଲିଭରୀ ବାହିନୀ',
    'pa-IN': 'ਡਿਲੀਵਰੀ ਟੀਮ',
    'sa-IN': 'वितरण-दलम्',
    'sat-IN': 'ᱰᱮᱞᱤᱵᱷᱚᱨᱤ ᱴᱤᱢ',
    'sd-IN': 'ڊليوري ٽيم',
    'ur-IN': 'ڈیلیوری ٹیم',
    'tcy-IN': 'డెలివరీ ఫ్లీట్'
  },
  dispatchMonitor: {
    'en-IN': 'Dispatch Monitor',
    'hi-IN': 'डिस्पैच मॉनिटर',
    'te-IN': 'డిస్పాచ్ మానిటర్',
    'ta-IN': 'டிஸ்பாட்ச் கண்காணிப்பு',
    'kn-IN': 'ರವಾನೆ ಮೇಲ್ವಿಚಾರಣೆ',
    'ml-IN': 'ഡിസ്പാച്ച് മോണിറ്റർ',
    'as-IN': 'প্ৰেৰণ নিৰীক্ষণ',
    'bn-IN': 'ডিসপ্যাচ মনিটর',
    'brx-IN': 'दैथैहरनाय नायगिरि',
    'doi-IN': 'डिस्पैच मॉनिटर',
    'gu-IN': 'ડિસ્પેચ મોનિટર',
    'ks-IN': 'ڈسپیچ مانیٹر',
    'gom-IN': 'धाडप तपासणी',
    'mai-IN': 'डिस्पैच मॉनिटर',
    'mni-IN': 'ꯗꯤꯁꯄꯦꯆ ꯃꯣꯅꯤꯇꯔ',
    'mr-IN': 'डिसपॅच मॉनिटर',
    'ne-IN': 'डिस्प्याच मोनिटर',
    'or-IN': 'ପ୍ରେରଣ ନିରୀକ୍ଷଣ',
    'pa-IN': 'ਡਿਸਪੈਚ ਮਾਨੀਟਰ',
    'sa-IN': 'प्रेषण-निरीक्षणम्',
    'sat-IN': 'ᱰᱤᱥᱯᱮᱪ ᱢᱚᱱᱤᱴᱚᱨ',
    'sd-IN': 'ڊسپيچ مانيٽر',
    'ur-IN': 'ڈسپیچ مانیٹر',
    'tcy-IN': 'డిస్పాచ్ మానిటర్'
  },
  branchGrossVolume: {
    'en-IN': 'Branch Gross Volume',
    'hi-IN': 'शाखा कुल राजस्व',
    'te-IN': 'బ్రాంచ్ మొత్తం వ్యాల్యూమ్',
    'ta-IN': 'கிளை மொத்த வர்த்தகம்',
    'kn-IN': 'ಶಾಖೆಯ ಒಟ್ಟು ವಹಿವಾಟು',
    'ml-IN': 'ബ്രാഞ്ച് ഗ്രാസ് വോളിയം',
    'as-IN': 'শাখাৰ মোট উপাৰ্জন',
    'bn-IN': 'শাখার মোট বাণিজ্য',
    'brx-IN': 'दालाइ गासै रां',
    'doi-IN': 'शाखा कुल व्यापार',
    'gu-IN': 'શાખા ગ્રોસ વોલ્યુમ',
    'ks-IN': 'برانچ سس آمدنی',
    'gom-IN': 'फांटो वट्ट येणावळ',
    'mai-IN': 'शाखा कुल आय',
    'mni-IN': 'ꯃꯁꯥꯡ ꯑꯄꯨꯟꯕ ꯁꯦꯟꯐꯝ',
    'mr-IN': 'शाखेचे एकूण उत्पन्न',
    'ne-IN': 'शाखा कुल आम्दानी',
    'or-IN': 'ଶାଖା ମୋଟ କାରବାର',
    'pa-IN': 'ਸ਼ਾਖਾ ਕੁੱਲ ਵਿਕਰੀ',
    'sa-IN': 'शाखा-सकल-मूल्यम्',
    'sat-IN': ' branch ᱡᱚᱛᱚ ᱴᱟᱠᱟ',
    'sd-IN': 'برانچ جملي آمدني',
    'ur-IN': 'برانچ کل حجم',
    'tcy-IN': 'శాఖ మల్లా గిరాకి'
  },
  selectLanguage: {
    'en-IN': 'Select Language',
    'hi-IN': 'भाषा चुनें',
    'te-IN': 'భాషను ఎంచుకోండి',
    'ta-IN': 'மொழியைத் தேர்ந்தெடுக்கவும்',
    'kn-IN': 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    'ml-IN': 'ഭാഷ തിരഞ്ഞെടുക്കുക',
    'as-IN': 'ভাষা বাছক',
    'bn-IN': 'ভাষা নির্বাচন করুন',
    'brx-IN': 'राव सायख',
    'doi-IN': 'भाषा चुनो',
    'gu-IN': 'ભાષા પસંદ કરો',
    'ks-IN': 'زبانہِ ژارِو',
    'gom-IN': 'भास वोेंचून काढा',
    'mai-IN': 'भाषा चुनू',
    'mni-IN': 'ꯂꯣꯟ ꯈꯅꯕꯤꯌꯨ',
    'mr-IN': 'भाषा निवडा',
    'ne-IN': 'भाषा छान्नुहोस्',
    'or-IN': 'ଭାଷା ବାଛନ୍ତୁ',
    'pa-IN': 'ਭਾਸ਼ਾ ਚੁਣੋ',
    'sa-IN': 'भाषां चिनोतु',
    'sat-IN': 'ᱯᱟᱹᱨᱥᱤ ᱵᱟᱪᱷᱟᱣ ᱢᱮ',
    'sd-IN': 'ٻولي چونڊيو',
    'ur-IN': 'زبان منتخب کریں',
    'tcy-IN': 'భాషేన్ నాడూ'
  }
};

// Master I18N Translation Lookup Helper
export function getTranslation(lang: LanguageCode, path: string, fallback?: string): string {
  if (!lang) lang = 'en-IN';

  // 1. Check direct UI_LABELS
  if (UI_LABELS[path] && UI_LABELS[path][lang]) {
    return UI_LABELS[path][lang];
  }
  if (UI_LABELS[path] && UI_LABELS[path]['en-IN']) {
    return UI_LABELS[path]['en-IN'];
  }

  // 2. Check Customer App translations path (e.g. 'common.search', 'vendor.pendingPayout')
  const parts = path.split('.');
  if (parts.length === 2) {
    const [section, key] = parts;
    const langObj = customerTranslations[lang] || customerTranslations['en-IN'];
    if (langObj && langObj[section] && langObj[section][key]) {
      return langObj[section][key];
    }
    const enObj = customerTranslations['en-IN'];
    if (enObj && enObj[section] && enObj[section][key]) {
      return enObj[section][key];
    }
  }

  // 3. Check App specific modules
  if (parts[0] === 'vendor') {
    const vendorObj = getLocalizedVendorContent(lang);
    if (parts[1] && (vendorObj as any)[parts[1]]) {
      return (vendorObj as any)[parts[1]];
    }
  }

  if (parts[0] === 'delivery' || parts[0] === 'rider') {
    const deliveryObj = getLocalizedDeliveryContent(lang);
    if (parts[1] && (deliveryObj as any)[parts[1]]) {
      return (deliveryObj as any)[parts[1]];
    }
  }

  if (parts[0] === 'franchise') {
    const franchiseObj = getLocalizedFranchiseContent(lang);
    if (parts[1] && (franchiseObj as any)[parts[1]]) {
      return (franchiseObj as any)[parts[1]];
    }
  }

  if (parts[0] === 'customerCare') {
    const careObj = getLocalizedCustomerCareContent(lang);
    if (parts[1] && (careObj as any)[parts[1]]) {
      return (careObj as any)[parts[1]];
    }
  }

  return fallback || path;
}

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  changeLanguage: (code: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
  languages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const stored = localStorage.getItem('lokal_app_language') ||
                     localStorage.getItem('vendor_app_language') ||
                     localStorage.getItem('rider_app_language') ||
                     localStorage.getItem('franchise_app_language');
      return (stored as LanguageCode) || 'en-IN';
    } catch {
      return 'en-IN';
    }
  });

  const setLanguage = (code: LanguageCode) => {
    setLanguageState(code);
    try {
      localStorage.setItem('lokal_app_language', code);
      localStorage.setItem('vendor_app_language', code);
      localStorage.setItem('rider_app_language', code);
      localStorage.setItem('franchise_app_language', code);
    } catch (err) {
      console.warn("Failed to write language to localStorage", err);
    }

    // Optionally sync to Firestore user document if logged in
    if (auth.currentUser) {
      updateDoc(doc(db, 'users', auth.currentUser.uid), {
        language: code
      }).catch((err) => {
        console.warn("Language update in user profile skipped:", err);
      });
    }
  };

  const t = (key: string, fallback?: string) => {
    return getTranslation(language, key, fallback);
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      changeLanguage: setLanguage,
      t,
      languages: LANGUAGES
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside LanguageProvider
    const defaultLang: LanguageCode = (localStorage.getItem('lokal_app_language') as LanguageCode) || 'en-IN';
    return {
      language: defaultLang,
      setLanguage: (code: LanguageCode) => {
        localStorage.setItem('lokal_app_language', code);
        localStorage.setItem('vendor_app_language', code);
        localStorage.setItem('rider_app_language', code);
        localStorage.setItem('franchise_app_language', code);
      },
      changeLanguage: (code: LanguageCode) => {
        localStorage.setItem('lokal_app_language', code);
        localStorage.setItem('vendor_app_language', code);
        localStorage.setItem('rider_app_language', code);
        localStorage.setItem('franchise_app_language', code);
      },
      t: (key: string, fallback?: string) => getTranslation(defaultLang, key, fallback),
      languages: LANGUAGES
    };
  }
  return context;
};
