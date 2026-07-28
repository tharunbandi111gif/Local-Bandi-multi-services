import { Category, LanguageCode } from '../types';

// Category translations dictionary
export const CATEGORY_TRANSLATIONS: Record<string, Partial<Record<LanguageCode, string>>> = {
  meat: {
    'hi-IN': 'मांस और अंडे',
    'te-IN': 'మాంసం & గుడ్లు',
    'ta-IN': 'இறைச்சி & முட்டைகள்',
    'kn-IN': 'ಮಾಂಸ ಮತ್ತು ಮೊಟ್ಟೆಗಳು',
    'ml-IN': 'മാംസവും മുട്ടയും',
    'bn-IN': 'মাংস ও ডিম',
    'gu-IN': 'માસ અને ઈંડા',
    'mr-IN': 'मटण आणि अंडी',
    'pa-IN': 'ਮੀਟ ਅਤੇ ਆਂਡੇ',
    'ur-IN': 'گوشت اور انڈے',
    'or-IN': 'ମାଂସ ଓ ଅଣ୍ଡା',
    'as-IN': 'মাংস আৰু কণী',
    'sa-IN': 'मांसं च अण्डानि',
  },
  dairy: {
    'hi-IN': 'डेयरी और दूध',
    'te-IN': 'డైరీ & పాలు',
    'ta-IN': 'பால் & பால் பொருட்கள்',
    'kn-IN': 'ಹಾಲು ಮತ್ತು ಹಾಲಿನ ಉತ್ಪನ್ನಗಳು',
    'ml-IN': 'പാലും പാൽപ്പൽപ്പന്നങ്ങളും',
    'bn-IN': 'দুগ্ধজাত ও দুধ',
    'gu-IN': 'ડેરી અને દૂધ',
    'mr-IN': 'दुग्धजन्य आणि दूध',
    'pa-IN': 'ਡੇਅਰੀ ਅਤੇ ਦੁੱਧ',
    'ur-IN': 'ڈیری اور دودھ',
    'or-IN': 'କ୍ଷୀର ଓ ଦୁଗ୍ଧଜାତ',
    'as-IN': 'গাখীৰ আৰু ডেইৰী',
    'sa-IN': 'क्षीरं च दुग्धजातम्',
  },
  water: {
    'hi-IN': 'शुद्ध पानी कैंन्स',
    'te-IN': 'శుద్ధమైన నీరు',
    'ta-IN': 'தூய குடிநீர்',
    'kn-IN': 'ಶುದ್ಧ ಕುಡಿಯುವ ನೀರು',
    'ml-IN': 'വിശുദ്ധ കുടിവെള്ളം',
    'bn-IN': 'বিশুদ্ধ জল',
    'gu-IN': 'શુદ્ધ પાણી',
    'mr-IN': 'शुद्ध पाणी',
    'pa-IN': 'ਸ਼ੁੱਧ ਪਾਣੀ',
    'ur-IN': 'خالص پانی',
    'or-IN': 'ବିଶୁଦ୍ଧ ଜଳ',
    'as-IN': 'বিশুদ্ধ পানী',
    'sa-IN': 'शुद्धं जलम्',
  },
  fancy: {
    'hi-IN': 'फैंसी और कपड़े',
    'te-IN': 'ఫ్యాన్సీ & దుస్తులు',
    'ta-IN': 'ஆடைகள் & பேன்சி',
    'kn-IN': 'ಫ್ಯಾನ್ಸಿ ಮತ್ತು ಬಟ್ಟೆಗಳು',
    'ml-IN': 'ഫാൻസിയും വസ്ത്രങ്ങളും',
    'bn-IN': 'ফ্যাশন ও জামাকাপড়',
    'gu-IN': 'ફેન્સી અને કપડાં',
    'mr-IN': 'फॅन्सी आणि कपडे',
    'pa-IN': 'ਫੈਨਸੀ ਅਤੇ ਕੱਪੜੇ',
    'ur-IN': 'فینسی اور کپڑے',
    'or-IN': 'ଫ୍ୟାନ୍ସି ଓ ପୋଷାକ',
    'as-IN': 'পোছাক আৰু ফেঞ্চী',
    'sa-IN': 'वस्त्राणि च अलङ्काराः',
  },
  veg: {
    'hi-IN': 'ताज़ी सब्ज़ियाँ',
    'te-IN': 'తాజా కూరగాయలు',
    'ta-IN': 'காய்கறிகள்',
    'kn-IN': 'ತರಕಾರಿಗಳು',
    'ml-IN': 'പച്ചക്കറികൾ',
    'bn-IN': 'সবজি',
    'gu-IN': 'શાકભાજી',
    'mr-IN': 'भाजीपाला',
    'pa-IN': 'ਸਬਜ਼ੀਆਂ',
    'ur-IN': 'سبزیاں',
    'or-IN': 'ପନିପରିବା',
    'as-IN': 'শাক-পাচলি',
    'sa-IN': 'शाकानि',
  },
  food: {
    'hi-IN': 'पारिवारिक भोजन',
    'te-IN': 'కుటుంబ భోజనం',
    'ta-IN': 'குடும்ப உணவு',
    'kn-IN': 'ಕುಟುಂಬದ ಊಟ',
    'ml-IN': 'കുടുംബ ഭക്ഷണം',
    'bn-IN': 'পারিবারিক খাবার',
    'gu-IN': 'કૌટુંબિક ખોરાક',
    'mr-IN': 'कौटुंबिक जेवण',
    'pa-IN': 'ਪਰਿਵਾਰਕ ਭੋਜਨ',
    'ur-IN': 'خاندانی کھانا',
    'or-IN': 'ପାରିବାରିକ ଖାଦ୍ୟ',
    'as-IN': 'পৰিয়ালৰ আহাৰ',
    'sa-IN': 'पारिवारिकं भोजनम्',
  },
  groceries: {
    'hi-IN': 'किराना सामान',
    'te-IN': 'కిరాణా సరుకులు',
    'ta-IN': 'மளிகைப் பொருட்கள்',
    'kn-IN': 'ದಿನಸಿ ಪದಾರ್ಥಗಳು',
    'ml-IN': 'ഗ്രോസറി സാമഗ്രികൾ',
    'bn-IN': 'মুদি সামগ্রী',
    'gu-IN': 'કરિયાણું',
    'mr-IN': 'किराणा सामान',
    'pa-IN': 'ਕਰਿਆਨਾ ਸਮਾਨ',
    'ur-IN': 'کریانہ کا سامان',
    'or-IN': 'କିରାନା ସାମଗ୍ରୀ',
    'as-IN': 'মুদী দোকান',
    'sa-IN': 'क्रयण-सामग्री',
  },
  maids: {
    'hi-IN': 'बाई और रसोइया',
    'te-IN': 'ఇంటి పనివారు & వంటవారు',
    'ta-IN': 'வேலைக்காரர்கள் & சமையல்காரர்கள்',
    'kn-IN': 'ಕೆಲಸದವರು ಮತ್ತು ಅಡುಗೆಯವರು',
    'ml-IN': 'ഹൗസ് ഹെൽപ്പർമാർ',
    'bn-IN': 'গৃহপরিচারিকা ও রাঁধুনী',
    'gu-IN': 'કામવાળા અને રસોઈયા',
    'mr-IN': 'कामवाली आणि आचारी',
    'pa-IN': 'ਮੈਡ ਅਤੇ ਰਸੋਈਏ',
    'ur-IN': 'کام والی اور باورچی',
    'or-IN': 'ଘରୋଇ ସହାୟକ ଓ ରୋଷେଇଆ',
    'as-IN': 'ঘৰুৱা সহায়ক',
    'sa-IN': 'गृहसेवकाः पचकाश्च',
  },
  mechanics: {
    'hi-IN': 'मैकेनिक (एसी/फ्रिज)',
    'te-IN': 'మెకానిక్స్ (AC/ఫ్రిజ్)',
    'ta-IN': 'மெக்கானிக்സ് (AC/ஃபிரிட்ஜ்)',
    'kn-IN': 'ಮೆಕ್ಯಾನಿಕ್ಸ್ (AC/ಫ್ರಿಡ್ಜ್)',
    'ml-IN': 'മെക്കാനിക് സർവീസ്',
    'bn-IN': 'মেকানিক (এসি/ফ্রিজ)',
    'gu-IN': 'મિકેનિક્સ (AC/ફ્રિજ)',
    'mr-IN': 'मेकॅनिक (AC/फ्रिज)',
    'pa-IN': 'ਮਕੈਨਿਕ (AC/ਫਰਿੱਜ)',
    'ur-IN': 'مکینک (AC/فریج)',
    'or-IN': 'ମେକାନିକ୍ସ (AC/ଫ୍ରିଜ୍)',
    'as-IN': 'মেকানিক (AC/ফ্ৰিজ)',
    'sa-IN': 'यन्त्रशिल्पिनः',
  },
  construction: {
    'hi-IN': 'निर्माण और मजदूर',
    'te-IN': 'నిర్మాణం & కూలీలు',
    'ta-IN': 'கட்டுமானம் & வேலைகள்',
    'kn-IN': 'ಕಟ್ಟಡ ನಿರ್ಮಾಣ ಮತ್ತು ಕಾರ್ಮಿಕರು',
    'ml-IN': 'കൺസ്ട്രക്ഷൻ & ലേബർ',
    'bn-IN': 'নির্মাণ ও শ্রমিক',
    'gu-IN': 'બાંધકામ અને મજૂર',
    'mr-IN': 'बांधकाम आणि कामगार',
    'pa-IN': 'ਉਸਾਰੀ ਅਤੇ ਮਜ਼ਦੂਰ',
    'ur-IN': 'تعمیرات اور مزدور',
    'or-IN': 'ନିର୍ମାଣ ଓ ଶ୍ରମିକ',
    'as-IN': 'নিৰ্মাণ আৰু শ্ৰমিক',
    'sa-IN': 'निर्माणकला च कर्मकराः',
  },
  care: {
    'hi-IN': 'देखभाल और बेबीसिटर्स',
    'te-IN': 'సంరక్షణ & కేర్ టేకర్లు',
    'ta-IN': 'பராமரிப்பு & குழந்தைப் பராமரிப்பு',
    'kn-IN': 'ಆರೈಕೆ ಮತ್ತು ಮಕ್ಕಳ ಆರೈಕೆದಾರರು',
    'ml-IN': 'കെയർ & ചൈൽഡ് കെയർ',
    'bn-IN': 'যত্ন ও বেবিসিটার',
    'gu-IN': 'સંભાળ અને બેબીસિટર',
    'mr-IN': 'काळजी आणि काळजीवाहू',
    'pa-IN': 'ਦੇਖਭਾਲ ਅਤੇ ਬੱਚਿਆਂ ਦੀ ਦੇਖਭਾਲ',
    'ur-IN': 'دیکھ بھال اور بے بی سیٹر',
    'or-IN': 'ଯତ୍ନ ଓ ଶିଶୁ ସହାୟକ',
    'as-IN': 'যত্ন আৰু সহায়ক',
    'sa-IN': 'सेवा च शिशुपालकाः',
  },
  marriage: {
    'hi-IN': 'मैरिज ब्यूरो',
    'te-IN': 'మ్యారేజ్ బ్యూరో (పెళ్లి సంబంధాలు)',
    'ta-IN': 'திருமண மையம்',
    'kn-IN': 'ಮದುವೆ ಬ್ಯೂರೋ',
    'ml-IN': 'മാട്രിമോണി സർവീസ്',
    'bn-IN': 'ম্যারেজ ব্যুরো',
    'gu-IN': 'મેરેજ બ્યુરો',
    'mr-IN': 'मॅरेज ब्युरो',
    'pa-IN': 'ਮੈਰਿਜ ਬਿਊਰੋ',
    'ur-IN': 'میرج بیورو',
    'or-IN': 'ମ୍ୟାରେଜ୍ ବ୍ୟୁରୋ',
    'as-IN': 'বিবাহ কেন্দ্র',
    'sa-IN': 'विवाहसंस्था',
  },
  bakery: {
    'hi-IN': 'बेकरी और आइसक्रीम',
    'te-IN': 'బేకరీ & ఐస్‌క్రీమ్',
    'ta-IN': 'பேக்கரி & ஐஸ்கிரீம்',
    'kn-IN': 'ಬೇಕರಿ ಮತ್ತು ಐಸ್ ಕ್ರೀಮ್',
    'ml-IN': 'ബേക്കറിയും ഐസ്ക്രീമും',
    'bn-IN': 'বেকারি ও আইসক্রিম',
    'gu-IN': 'બેકરી અને આઇસક્રીમ',
    'mr-IN': 'बेकरी आणि आईस्क्रीम',
    'pa-IN': 'ਬੇਕਰੀ ਅਤੇ ਆਈਸਕ੍ਰੀਮ',
    'ur-IN': 'بیکری اور آئس کریم',
    'or-IN': 'ବେକରୀ ଓ ଆଇସକ୍ରିମ୍',
    'as-IN': 'ಬೇಕৰী আৰু আইচক্ৰীম',
    'sa-IN': 'अपूपशाला च हिमपिण्डम्',
  },
  pharmacy: {
    'hi-IN': 'फार्मेसी और स्वास्थ्य',
    'te-IN': 'ఫార్మసీ & ఆరోగ్యం',
    'ta-IN': 'மருந்தகம் & சுகாதாரம்',
    'kn-IN': 'ಫಾರ್ಮಸಿ ಮತ್ತು ಆರೋಗ್ಯ',
    'ml-IN': 'ഫാർമസിയും ആരോഗ്യവും',
    'bn-IN': 'ফার্মেসি ও স্বাস্থ্য',
    'gu-IN': 'ફાર્મસી અને આરોગ્ય',
    'mr-IN': 'फार्मसी आणि आरोग्य',
    'pa-IN': 'ਫਾਰਮੇਸੀ ਅਤੇ ਸਿਹਤ',
    'ur-IN': 'فارمیسی اور صحت',
    'or-IN': 'ଫାର୍ମାସୀ ଓ ସ୍ୱାସ୍ଥ୍ୟ',
    'as-IN': 'ফাৰ্মাচী আৰু স্বাস্থ্য',
    'sa-IN': 'औषधालयः स्वास्थ्यं च',
  },
  hospital_op: {
    'hi-IN': 'अस्पताल ओपीडी टोकन',
    'te-IN': 'హాస్పిటల్ OP టోకెన్లు',
    'ta-IN': 'மருத்துவமனை OP டோக்கன்',
    'kn-IN': 'ಆಸ್ಪತ್ರೆ ಒಪಿ ಟೋಕನ್',
    'ml-IN': 'ഹോസ്പിറ്റൽ OP ടോക്കൺ',
    'bn-IN': 'হাসপাতাল ওপি টিকিট',
    'gu-IN': 'હોસ્પિટલ ઓપીડી ટોકન',
    'mr-IN': 'हॉस्पिटल ओपीडी टोकन',
    'pa-IN': 'ਹਸਪਤਾਲ ਓਪੀਡੀ ਟੋਕਨ',
    'ur-IN': 'ہسپتال او پی ڈی ٹوکن',
    'or-IN': 'ଡାକ୍ତରଖାନା OP ଟୋକନ୍',
    'as-IN': 'চিকিৎসালয় OP টিকিট',
    'sa-IN': 'चिकित्सालय-प्रवेशपत्रम्',
  },
  household: {
    'hi-IN': 'घरेलू सामान',
    'te-IN': 'ఇంటి నిత్యవసరాలు',
    'ta-IN': 'வீட்டு உபயோகப் பொருட்கள்',
    'kn-IN': 'ಗೃಹಬಳಕೆಯ ವಸ್ತುಗಳು',
    'ml-IN': 'ഗാർഹിക സാമഗ്രികൾ',
    'bn-IN': 'গৃহস্থালি সামগ্রী',
    'gu-IN': 'ઘરગથ્થુ વસ્તુઓ',
    'mr-IN': 'घरगुती वस्तू',
    'pa-IN': 'ਘਰੇਲੂ ਵਸਤੂਆਂ',
    'ur-IN': 'گھریلو اشیاء',
    'or-IN': 'ଘରୋଇ ସାମଗ୍ରୀ',
    'as-IN': 'ঘৰুৱা সামগ্ৰী',
    'sa-IN': 'गृहपोषक-वस्तूनि',
  },
  electronics: {
    'hi-IN': 'इलेक्ट्रॉनिक्स और मोबाइल',
    'te-IN': 'ఎలక్ట్రానిక్స్ & మొబైల్స్',
    'ta-IN': 'எலக்ட்ரானிக்ஸ் & மொபைல்கள்',
    'kn-IN': 'ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್ ಮತ್ತು ಮೊಬೈಲ್',
    'ml-IN': 'ഇലക്ട്രോണിക്സും മൊബൈലും',
    'bn-IN': 'ইলেকট্রনিক্স ও মোবাইল',
    'gu-IN': 'ઇલેક્ટ્રોનિક્સ અને મોબાઇલ્સ',
    'mr-IN': 'इलेक्ट्रॉनिक्स आणि मोबाईल',
    'pa-IN': 'ਇਲੈਕਟ੍ਰਾਨਿਕਸ ਅਤੇ ਮੋਬਾਈਲ',
    'ur-IN': 'الیکٹرانکس اور موبائل',
    'or-IN': 'ଇଲେକ୍ଟ୍ରୋନିକ୍ସ ଓ ମୋବାଇଲ୍',
    'as-IN': 'ইলেক্ট্ৰনিক্স আৰু ম\'বাইল',
    'sa-IN': 'विद्युद्यन्त्राणि',
  },
  services: {
    'hi-IN': 'होम सर्विसेज',
    'te-IN': 'హోమ్ సర్వీసెస్ (ఇంటి సేవలు)',
    'ta-IN': 'வீட்டுச் சேவைகள்',
    'kn-IN': 'ಮನೆ ಸೇವೆಗಳು',
    'ml-IN': 'ഹോം സർവീസുകൾ',
    'bn-IN': 'হোম সার্ভিসেস',
    'gu-IN': 'હોમ સર્વિસીસ',
    'mr-IN': 'होम सर्व्हिसेस',
    'pa-IN': 'ਹੋਮ ਸਰਵਿਸਿਜ਼',
    'ur-IN': 'ہوم سروسز',
    'or-IN': 'ହୋମ୍ ସର୍ଭିସେସ୍',
    'as-IN': 'ঘৰুৱা সেৱা',
    'sa-IN': 'गृहसेवाः',
  },
  emergency: {
    'hi-IN': 'आपातकालीन सहायता',
    'te-IN': 'అత్యవసర సహాయం',
    'ta-IN': 'அவசர உதவி',
    'kn-IN': 'ತುರ್ತು ನೆರವು',
    'ml-IN': 'അടിയന്തര സഹായം',
    'bn-IN': 'জরুরি সহায়তা',
    'gu-IN': 'ઇમરજન્સી મદદ',
    'mr-IN': 'तातडीची मदत',
    'pa-IN': 'ਐਮਰਜੈਂਸੀ ਮਦਦ',
    'ur-IN': 'ہنگامی امداد',
    'or-IN': 'জরୁରୀକାଳୀନ ସହାୟତା',
    'as-IN': 'জৰুৰীকালীন সহায়',
    'sa-IN': 'ఆపత్కాలిక-సహాయః',
  },
  events: {
    'hi-IN': 'इवेंट्स और डेकोरेशन',
    'te-IN': 'ఈవెంట్స్ & అలంకరణ',
    'ta-IN': 'நிகழ்ச்சிகள் & அலங்காரம்',
    'kn-IN': 'ಇವೆಂಟ್ಸ್ ಮತ್ತು ಡೆಕೋರೇಶನ್',
    'ml-IN': 'ഇവന്റ്സ് & ഡെക്കറേഷൻ',
    'bn-IN': 'ইভেন্ট ও ডেকোরেশন',
    'gu-IN': 'ઇવેન્ટ્સ અને ડેકોરેશન',
    'mr-IN': 'इव्हेंट्स आणि सजावट',
    'pa-IN': 'ਈਵੈਂਟਸ ਅਤੇ ਸਜਾਵਟ',
    'ur-IN': 'تقریبات اور ڈیکوریشن',
    'or-IN': 'ଇଭେଣ୍ଟସ୍ ଓ ସଜાવଟ',
    'as-IN': 'অনুষ্ঠান আৰু সজ্জা',
    'sa-IN': 'ఉత్సవాః సజ్జీకరణం చ',
  },
  religious: {
    'hi-IN': 'पंडित और पुजारी',
    'te-IN': 'పండితులు & పూజారులు',
    'ta-IN': 'புரோகிதர் & பூஜாரிகள்',
    'kn-IN': 'ಪಂಡಿತರು ಮತ್ತು ಪುರೋಹಿತರು',
    'ml-IN': 'പൂജാരികളും ശാന്തിക്കാരും',
    'bn-IN': 'পণ্ডিত ও পুরোহিত',
    'gu-IN': 'પંડિત અને પૂજારી',
    'mr-IN': 'पंडित आणि पुजारी',
    'pa-IN': 'ਪੰਡਤ ਅਤੇ ਪੁਜਾਰੀ',
    'ur-IN': 'پنڈت اور پجاری',
    'or-IN': 'ପଣ୍ଡିତ ଓ ପୂଜକ',
    'as-IN': 'পুৰোহিত আৰু পণ্ডিত',
    'sa-IN': 'పండితాః పూజకాశ్చ',
  },
  temple: {
    'hi-IN': 'हिंदू मंदिर दर्शन',
    'te-IN': 'హిందూ దేవాలయాలు',
    'ta-IN': 'இந்து திருக்கோயில்கள்',
    'kn-IN': 'ಹಿಂದೂ ದೇವಾಲಯಗಳು',
    'ml-IN': 'ക്ഷേത്ര ദർശനങ്ങൾ',
    'bn-IN': 'হিন্দু মন্দির దర్శન',
    'gu-IN': 'હિન્દુ મંતિરો',
    'mr-IN': 'हिंदू मंदिरे',
    'pa-IN': 'ਹਿੰਦੂ ਮੋਹਲੇ',
    'ur-IN': 'ہندو مندر',
    'or-IN': 'ହିନ୍ଦୁ ମନ୍ଦିର',
    'as-IN': 'হিন্দু মন্দিৰ',
    'sa-IN': 'హిందూ దేవలయాః',
  },
  catering: {
    'hi-IN': 'केटरिंग सेवाएं',
    'te-IN': 'ఈవెంట్ కేటరింగ్ (వంటలు)',
    'ta-IN': 'கேட்டரிங் சேவைகள்',
    'kn-IN': 'ಕೇಟರಿಂಗ್ ಸೇವೆಗಳು',
    'ml-IN': 'കാറ്ററിംഗ് സർവീസ്',
    'bn-IN': 'ক্যাটারিং সার্ভিস',
    'gu-IN': 'કેટરિંગ સેવાઓ',
    'mr-IN': 'कॅटरिंग सर्व्हिसेस',
    'pa-IN': 'ਕੈਟਰਿੰਗ ਸੇਵਾਵਾਂ',
    'ur-IN': 'کیٹرنگ سروسز',
    'or-IN': 'କ୍ୟାଟରିଂ ସେବା',
    'as-IN': 'কেটাৰিং সেৱা',
    'sa-IN': 'పాక-వ్యంజన-సేవాః',
  },
  jobs: {
    'hi-IN': 'जॉब पोर्टल',
    'te-IN': 'జాబ్ పోర్టల్ (ఉద్యోగాలు)',
    'ta-IN': 'வேலைவாய்ப்பு',
    'kn-IN': 'ಉದ್ಯೋಗಾವಕಾಶಗಳು',
    'ml-IN': 'ജോബ് പോർട്ടൽ',
    'bn-IN': 'জব পোর্টাল',
    'gu-IN': 'જોબ પોર્ટલ',
    'mr-IN': 'जॉब पोर्टल',
    'pa-IN': 'ਜੌਬ ਪੋਰਟਲ',
    'ur-IN': 'جاب پورٹل',
    'or-IN': 'ଜବ୍ ପୋର୍ଟାଲ୍',
    'as-IN': 'চাকৰি প\'ৰ্টেল',
    'sa-IN': 'ఉద్యోగ-కార్యాలయః',
  },
  handicrafts: {
    'hi-IN': 'हस्तशिल्प और कला',
    'te-IN': 'చేతివృత్తులు & హస్తకళలు',
    'ta-IN': 'கைவினைப் பொருட்கள்',
    'kn-IN': 'ಹಸ್ತ ಕರಕುಶಲ ವಸ್ತುಗಳು',
    'ml-IN': 'കൈவினை ഉൽപ്പന്നങ്ങൾ',
    'bn-IN': 'হস্তশিল্প ও হস্তকলা',
    'gu-IN': 'હસ્તકળા',
    'mr-IN': 'हस्तकला वस्तू',
    'pa-IN': 'ਹੱਥੀਂ ਬਣਿਆ ਸਮਾਨ',
    'ur-IN': 'دستکاری',
    'or-IN': 'ହସ୍ତଶିଳ୍ପ',
    'as-IN': 'হস্তশিল্প',
    'sa-IN': 'హస్తకళా-వస్తోః',
  },
  travel: {
    'hi-IN': 'यात्रा और ट्रिप्स',
    'te-IN': 'ప్రయాణం & ట్రావెల్స్',
    'ta-IN': 'பயணம் & பயணங்கள்',
    'kn-IN': 'ಪ್ರಯಾಣ ಮತ್ತು ಪ್ರವಾಸ',
    'ml-IN': 'യാത്രകളും ടൂറുകളും',
    'bn-IN': 'ভ্রমণ ও ট্রিপ',
    'gu-IN': 'મુસાફરી અને પ્રવાસ',
    'mr-IN': 'प्रवास आणि ट्रिप्स',
    'pa-IN': 'ਯਾਤਰਾ ਅਤੇ ਟ੍ਰਿਪਸ',
    'ur-IN': 'سفر اور ٹرپ',
    'or-IN': 'ଯାତ୍ରା ଓ ଭ୍ରମଣ',
    'as-IN': 'ভ্ৰমণ আৰু যাত্ৰা',
    'sa-IN': 'యాత్రా చ ప్రవాసః',
  },
  realestate: {
    'hi-IN': 'रियल एस्टेट व ज़मीन',
    'te-IN': 'రియల్ ఎస్టేట్ & ఆస్తులు',
    'ta-IN': 'ரியல் எஸ்டேட் & சொத்துக்கள்',
    'kn-IN': 'ರಿಯಲ್ ಎಸ್ಟೇಟ್ ಮತ್ತು ಆಸ್ತಿಗಳು',
    'ml-IN': 'റിയൽ എസ്റ്റേറ്റ് & റൻ\'റ്',
    'bn-IN': 'রিয়েল এস্টেট ও জমি',
    'gu-IN': 'રિયલ એસ્ટેટ',
    'mr-IN': 'रिअल इस्टेट आणि जागा',
    'pa-IN': 'ਰਿਅਲ ਅਸਟੇਟ',
    'ur-IN': 'ریل اسٹیٹ',
    'or-IN': 'ରିଅଲ୍ ଏଷ୍ଟେଟ୍',
    'as-IN': 'ৰিয়েল এষ্টেট',
    'sa-IN': 'భూమి-గృహ-విక్రయః',
  },
  driving_school: {
    'hi-IN': 'ड्राइविंग स्कूल',
    'te-IN': 'డ్రైవింగ్ స్కూల్',
    'ta-IN': 'டிரைவிங் ஸ்கூல்',
    'kn-IN': 'ಡ್ರೈವಿಂಗ್ ಸ್ಕೂಲ್',
    'ml-IN': 'ഡ്രൈവിംഗ് സ്കൂൾ',
    'bn-IN': 'ড্রাইভিং স্কুল',
    'gu-IN': 'ડ્રાઇવિંગ સ્કૂલ',
    'mr-IN': 'ड्रायव्हिंग स्कूल',
    'pa-IN': 'ਡ੍ਰਾਈਵਿੰਗ ਸਕੂਲ',
    'ur-IN': 'ڈرائیونگ اسکول',
    'or-IN': 'ଡ୍ରାଇଭିଂ ସ୍କୁଲ୍',
    'as-IN': 'ড্ৰাইভিং স্কুল',
    'sa-IN': 'చాలన-శిక్షణాలయః',
  },
  beauty_parlour: {
    'hi-IN': 'ब्यूटी पार्लर और सैलून',
    'te-IN': 'బ్యూటీ పార్లర్ & సెలూన్',
    'ta-IN': 'பியூட்டி பார்லர் & சலூன்',
    'kn-IN': 'ಬ್ಯೂಟಿ ಪಾರ್ಲರ್ ಮತ್ತು ಸಲೂನ್',
    'ml-IN': 'ബ്യൂട്ടി പാർലർ',
    'bn-IN': 'বিউটি পার্লার ও সেলুন',
    'gu-IN': 'બ્યુટી પાર્લર',
    'mr-IN': 'ब्युटी पार्लर',
    'pa-IN': 'ਬਿਊਟੀ ਪਾਰਲਰ',
    'ur-IN': 'بیوٹی پارلر',
    'or-IN': 'ବ୍ୟୁଟି ପାର୍ଲର',
    'as-IN': 'বিউটি পার্লাৰ',
    'sa-IN': 'సౌందర్య-వర్ధకాలయః',
  }
};

// Helper function to get localized category name
export function getLocalizedCategoryName(category: Category | string | null | undefined, language: LanguageCode): string {
  if (!category) return '';
  const catId = typeof category === 'string' ? category : category.id;
  const fallbackName = typeof category === 'string' ? category : category.name;

  if (language === 'en-IN' || !language) {
    return fallbackName;
  }

  const translated = CATEGORY_TRANSLATIONS[catId]?.[language];
  return translated || fallbackName;
}

// Subcategory Translations
export const SUBCATEGORY_TRANSLATIONS: Record<string, Partial<Record<LanguageCode, string>>> = {
  'Staples': {
    'hi-IN': 'मूल राशन व अनाज',
    'te-IN': 'ముఖ్యమైన దినుసులు',
    'ta-IN': 'அத்தியாவசியப் பொருட்கள்',
    'kn-IN': 'ಅಗತ್ಯ ಧಾನ್ಯಗಳು',
    'ml-IN': 'പ്രധാന ഭക്ഷണസാധനങ്ങൾ',
    'bn-IN': 'প্রধান খাদ্যসামগ্রী',
  },
  'Cooking Essentials': {
    'hi-IN': 'कुकिंग सामग्री व तेल',
    'te-IN': 'వంటనూనెలు & మసాలాలు',
    'ta-IN': 'சமையல் பொருட்கள்',
    'kn-IN': 'ಅಡುಗೆ ಸಾಮಗ್ರಿಗಳು',
    'ml-IN': 'പാചക സാമഗ്രികൾ',
  },
  'Kitchen Needs': {
    'hi-IN': 'रसोई का सामान',
    'te-IN': 'వంటగది అవసరాలు',
    'ta-IN': 'சமையலறை தேவைகள்',
    'kn-IN': 'ಅಡುಗೆಮನೆ ಅಗತ್ಯಗಳು',
  },
  'Bathroom Needs': {
    'hi-IN': 'बाथरूम और साबुन',
    'te-IN': 'స్నానాల గది అవసరాలు',
    'ta-IN': 'குளியலறை தேவைகள்',
  },
  'Snacks': {
    'hi-IN': 'स्नैक्स और नमकीन',
    'te-IN': 'స్నాక్స్ & స్వీట్లు',
    'ta-IN': 'சிற்றுண்டிகள்',
    'kn-IN': 'ತಿಂಡಿಗಳು',
  },
  'Beverages': {
    'hi-IN': 'पेय पदार्थ और चाय',
    'te-IN': 'పానీయాలు & టీ/కాఫీ',
    'ta-IN': 'பானங்கள்',
    'kn-IN': 'ಪಾನೀಯಗಳು',
  }
};

export function getLocalizedSubcategoryName(subCategory: string | undefined | null, language: LanguageCode): string {
  if (!subCategory) return '';
  if (language === 'en-IN' || !language) return subCategory;
  return SUBCATEGORY_TRANSLATIONS[subCategory]?.[language] || subCategory;
}

// Terms of Service Translations
export function getLocalizedTermsOfService(language: LanguageCode) {
  if (language === 'hi-IN') {
    return {
      title: "सेवा की शर्तें",
      officialAgreement: "आधिकारिक कानूनी समझौता",
      appName: "लोकल बांडी नियम व शर्तें",
      lastUpdated: "अंतिम अपडेट: जुलाई 2026",
      warningHeader: "⚠️ महत्वपूर्ण - कृपया ध्यान से पढ़ें:",
      warningBody: "यह नियम आपके लोकल बांडी सुपर-ऐप प्लेटफॉर्म के उपयोग को नियंत्रित करते हैं। ऐप एक्सेस करने, रजिस्ट्रेशन करने या वेंडर/राइडर/फ्रेंचाइजी के रूप में जुड़ने पर आप इन कानूनी शर्तों से सहमत होते हैं।",
      s1Title: "1. मल्टी-सर्विसेज सुपर-ऐप का दायरा",
      s1Body: "लोकल बांडी एक हाइपर-लोकल मल्टी-सर्विस एग्रीगेटर के रूप में काम करता है जो ग्राहकों, स्वतंत्र व्यापारियों, डिलीवरी पार्टनर्स, सेवा प्रदाताओं और फ्रेंचाइजी ऑपरेटरों को जोड़ता है:",
      s1Points: [
        "डिलीवरी सेवाएं: भोजन, ताजी सब्जियां, किराना सामान, दवाइयां और कूरियर पार्सल।",
        "होम सर्विसेज: प्लंबिंग, इलेक्ट्रिशियन, कारपेंटर, सफाई और घरेलू मरम्मत।",
        "अस्पताल ओपीडी डेस्क: लाइव ओपीडी टिकट, टोकन रजिस्ट्रेशन और प्राथमिकता कतार बुकिंग।",
        "लोकल मैरिज ब्यूरो: बायो-डाटा शेयरिंग, वैवाहिक संबंध और मैचमेकिंग सहायता।",
        "रियल एस्टेट व किराए: स्थानीय संपत्ति सूची, वाणिज्यिक किराए और कृषि भूमि।"
      ],
      s2Title: "2. उपयोगकर्ता दायित्व एवं खाता सुरक्षा",
      s2Body: "उपयोगकर्ताओं को सटीक और अद्यतन विवरण (नाम, फोन नंबर और पता) प्रदान करना होगा। आपके मोबाइल नंबर से की गई सभी गतिविधियों के लिए आप स्वयं जिम्मेदार हैं।",
      s2Note: "💡 संस्थापक नियंत्रण सीमा: सुरक्षा ऑडिट के लिए, एक उपयोगकर्ता या व्यवस्थापक खाता केवल अधिकृत उपकरणों पर लॉग इन हो सकता है (अधिकतम 6 सक्रिय उपकरण)।",
      s3Title: "3. सेवा पूर्ति एवं विवाद निवारण",
      s3Body: "लोकल बांडी पंजीकृत विक्रेताओं की मानक जांच करता है, लेकिन सेवाओं का अंतिम निष्पादन स्वतंत्र तीसरे पक्षों द्वारा किया जाता है:",
      s3Points: [
        "आपूर्ति: मर्चेंट लिस्टिंग, मेनू आइटम और कीमतें विक्रेताओं द्वारा सीधे तय की जाती हैं।",
        "अस्पताल अपॉइंटमेंट: आपातकालीन स्थितियों या डॉक्टर की उपलब्धता के कारण ओपीडी समय में बदलाव हो सकता है।",
        "मैरिज ब्यूरो: हम गोपनीयता बनाए रखते हैं, लेकिन उपयोगकर्ताओं को स्वतंत्र पृष्ठभूमि जांच करने की सलाह दी जाती है।"
      ],
      s4Title: "4. भुगतान और धनवापसी (रिफंड) नीति",
      s4Body: "हमारी भुगतान और रद्दीकरण नीतियां पारदर्शी और विश्वसनीय संचालन सुनिश्चित करती हैं:",
      s4Points: [
        "सुरक्षित गेटवे: यूपीआई (GPay, PhonePe, Paytm), नेटबैंकिंग और कार्ड द्वारा 256-बिट एन्क्रिप्टेड भुगतान।",
        "रद्दीकरण विंडो: विक्रेता द्वारा ऑर्डर स्वीकार करने से पहले रद्द करने पर 100% रिफंड।",
        "तत्काल यूपीआई रिफंड (0 - 24 घंटे): यूपीआई लेनदेन का रिफंड कुछ ही घंटों से लेकर 1 कार्य दिवस में स्रोत खाते में जमा हो जाता है।",
        "कार्ड व नेटबैंकिंग रिफंड (3 - 10 दिन): कार्ड स्टेटमेंट में रिफंड दिखाई देने में 3 से 10 कार्य दिवस लग सकते हैं।"
      ],
      s5Title: "5. क्षेत्रीय फ्रेंचाइजी शाखाएं और डिलीवरी राइडर्स",
      s5Body: "अधिकृत क्षेत्रीय फ्रेंचाइजी अपने निर्दिष्ट पिन-कोड में प्रशासनिक देखरेख के साथ काम करती हैं।",
      s6Title: "🚨 दायित्व की सीमा",
      s6Body: "किसी भी स्थिति में लोकल बांडी, इसके संस्थापक या निदेशक तृतीय-पक्ष उत्पादों, देरी या संपत्तियों के उपयोग से होने वाले किसी भी नुकसान के लिए उत्तरदायी नहीं होंगे।",
      copyright: "© 2026 लोकल बांडी मल्टी सर्विसेज। सर्वाधिकार सुरक्षित।",
      support: "सहायता: +91 7416574197 | contact@localbandi.app"
    };
  }

  if (language === 'te-IN') {
    return {
      title: "నిబంధనలు & షరతులు",
      officialAgreement: "అధికారిక చట్టపరమైన ఒప్పందం",
      appName: "లోకల్ బండి నిబంధనలు & షరతులు",
      lastUpdated: "చివరిగా నవీకరించబడింది: జూలై 2026",
      warningHeader: "⚠️ ముఖ్యం దయచేసి చదవండి:",
      warningBody: "ఈ నిబంధనలు మీ లోకల్ బండి సూపర్-యాప్ వేదిక వినియోగాన్ని పర్యవేక్షిస్తాయి. యాప్‌ని ఉపయోగించడం, ఖాతా నమోదు చేయడం లేదా భాగస్వామిగా చేరడం ద్వారా మీరు ఈ నిబంధనలకు అంగీకరిస్తున్నారు.",
      s1Title: "1. మల్టీ-సర్వీసెస్ సూపర్-యాప్ పరిధి",
      s1Body: "లోకల్ బండి వినియోగదారులు, స్వతంత్ర వ్యాపారులు, డెలివరీ భాగస్వాములు మరియు ఫ్రాంచైజీ ఆపరేటర్లను అనుసంధానించే లోకల్ వేదికగా పనిచేస్తుంది:",
      s1Points: [
        "డెలివరీ సేవలు: ఆహారం, తాజా కూరగాయలు, కిరాణా సరుకులు, మందులు మరియు పార్శిళ్ళు.",
        "హోమ్ సర్వీసెస్: ప్లంబింగ్, ఎలక్ట్రీషియన్, కార్పెంటర్, క్లీనింగ్ మరియు మరమ్మత్తులు.",
        "హాస్పిటల్ OP డెస్క్: ప్రత్యక్ష OP టోకెన్లు, నమోదు మరియు ప్రాధాన్యత క్యూ బుకింగ్.",
        "లోకల్ మ్యారేజ్ బ్యూరో: వివాహ సంబంధాలు, బయో-డేటా పంచుకోవడం మరియు సంబంధాల సమన్వయం.",
        "రియల్ ఎస్టేట్ & అద్దెలు: స్థానిక ఆస్తుల జాబితా, వాణిజ్య అద్దెలు మరియు వ్యవసాయ భూములు."
      ],
      s2Title: "2. వినియోగదారు బాధ్యతలు & ఖాతా భద్రత",
      s2Body: "వినియోగదారులు కచ్చితమైన వివరాలను (పేరు, ఫోన్ నంబర్, చిరునామా) అందించాలి. మీ ఫోన్ నంబర్ ద్వారా జరిగే చర్యలకు మీరే బాధ్యులు.",
      s2Note: "💡 భద్రతా పరిమితి: ఒక వినియోగదారు ఖాతా ఒకే సమయంలో గరిష్టంగా 6 పరికరాలలో మాత్రమే లాగిన్ అవ్వగలరు.",
      s3Title: "3. సేవా నెరవేర్పు & ఫిర్యాదుల పరిష్కారం",
      s3Body: "లోకల్ బండి ప్రామాణిక తనిఖీలను చేస్తుంది, అయితే సేవల తుది నిర్వహణ స్వతంత్ర మూడవ పక్షాల ద్వారా జరుగుతుంది.",
      s3Points: [
        "ఆర్డర్లు: వ్యాపారుల వస్తువుల ధరలు వారిచే నిర్ణయించబడతాయి.",
        "హాస్పిటల్ అపాయింట్‌మెంట్లు: అత్యవసర పరిస్థితులు లేదా డాక్టర్ లభ్యతను బట్టి సమయాల్లో మార్పులు ఉండవచ్చు.",
        "మ్యారేజ్ బ్యూరో: మేము ప్రొఫైల్స్ భద్రతను కాపాడతాము, వినియోగదారులు స్వతంత్రంగా తనిఖీ చేసుకోవాలని సూచిస్తున్నాము."
      ],
      s4Title: "4. చెల్లింపులు & రీఫండ్ నిబంధనలు",
      s4Body: "మా చెల్లింపు మరియు రద్దు విధానాలు పారదర్శకంగా ఉంటాయి:",
      s4Points: [
        "సురక్షిత గేట్‌వేలు: UPI (GPay, PhonePe, Paytm), నెట్ బ్యాంకింగ్ మరియు కార్డ్స్ ద్వారా 256-బిట్ ఎన్‌క్రిప్టెడ్ చెల్లింపులు.",
        "రద్దు విండో: వ్యాపారి ఆర్డర్ స్వీకరించడానికి ముందు రద్దు చేస్తే 100% రీఫండ్ లభిస్తుంది.",
        "తక్షణ UPI రీఫండ్‌లు (0 - 24 గంటలు): UPI రీఫండ్‌లు కొన్ని గంటల నుండి 1 పని దినంలో మీ ఖాతాలో జమ చేయబడతాయి.",
        "కార్డ్ రీఫండ్‌లు (3 - 10 రోజులు): బ్యాంకింగ్ విధానాల ప్రకారం కార్డ్ రీఫండ్‌లకు 3 నుండి 10 రోజులు సమయం పడుతుంది."
      ],
      s5Title: "5. ప్రాంతీయ ఫ్రాంచైజీ కార్యాలయాలు & రైడర్లు",
      s5Body: "అధికారిక ప్రాంతీయ ఫ్రాంచైజీలు తమ పిన్-కోడ్ పరిధిలో పరిపాలనా పర్యవేక్షణతో పనిచేస్తాయి.",
      s6Title: "🚨 బాధ్యత పరిమితి",
      s6Body: "మూడవ పక్ష ఉత్పత్తులు లేదా ఆలస్యాల వల్ల కలిగే ఏ రకమైన నష్టానికి లోకల్ బండి లేదా దాని వ్యవస్థాపకులు బాధ్యత వహించరు.",
      copyright: "© 2026 లోకల్ బండి మల్టీ సర్వీసెస్. సర్వ హక్కులు ప్రత్యేకించబడ్డాయి.",
      support: "సహాయం: +91 7416574197 | contact@localbandi.app"
    };
  }

  // Fallback to English
  return {
    title: "Terms of Service",
    officialAgreement: "Official Legal Agreement",
    appName: "Local Bandi Terms & Conditions",
    lastUpdated: "Last updated: July 2026",
    warningHeader: "⚠️ IMPORTANT PLEASE READ:",
    warningBody: "These Terms govern your usage of the Local Bandi Super-App platform. By accessing or downloading any part of the Local Bandi app, registering a user account, onboarding as a service partner/delivery rider, or listing as an authorized vendor/franchise owner, you explicitly agree to these legally binding terms.",
    s1Title: "1. Scope of Multi-Services Super-App",
    s1Body: "Local Bandi operates as a hyper-local multi-service aggregator connecting customers, independent merchants, freelance delivery partners, specialized service providers, and regional franchise operators. Our service suite includes:",
    s1Points: [
      "Delivery Services: Food, vegetables, groceries, pharmaceutical products, and parcel deliveries.",
      "Home Services & Maintenance: Plumbing, electrical, carpentry, cleaning, painters, and household repairs.",
      "Healthcare OP Desk: Live out-patient desk tickets, token registrations, and priority hospital OP queue booking intermediation.",
      "Lokal Marriage Bureau: Custom matrimonial profile publishing, regional bio-data sharing, and matchmaking coordination.",
      "Real Estate & Rentals: Hyper-local property listings, commercial rentals, and verified agricultural land intermediation."
    ],
    s2Title: "2. User Obligations & High-Security Devices",
    s2Body: "Users must provide accurate, current, and complete details (name, phone number, and delivery location). You are solely responsible for all actions taken through your mobile phone number.",
    s2Note: "💡 Founder Control Limit: For security audits and to prevent commercial misuse, a single user or administrative account may only log in on authorized devices (with a strict platform ceiling of six (6) concurrently active physical devices). Any excess login attempts will be automatically flagged and held for manual review.",
    s3Title: "3. Service Fulfillment & Dispute Redressal",
    s3Body: "While Local Bandi does standard verification checks on all registered vendors, freelancers, and healthcare partners, the final execution of services is performed by these independent third parties:",
    s3Points: [
      "Fulfillment: Merchant listings, menu items, and pricing are set directly by the vendors.",
      "Hospital Appointments: Hospital OP bookings intermediated by the platform are subject to unexpected delays, sudden emergency prioritization, and doctor availability shifts.",
      "Matrimony Rules: Local Bandi Marriage Bureau handles profiles with utmost confidentiality, but users are strictly advised to run independent background checks."
    ],
    s4Title: "4. Payment & Refund Rules",
    s4Body: "Our payment and cancellation policies ensure transparent, reliable operations for both consumers and service partners:",
    s4Points: [
      "Secured Gateways: We integrate authorized 256-bit encrypted transactions via instant UPI (GPay, PhonePe, Paytm), Netbanking, and Credit/Debit cards.",
      "Grace Cancellation Window: A customer can cancel their order with 100% refund eligibility prior to the vendor accepting the order. Once preparation begins, a reasonable fee may apply.",
      "Instant UPI Refunds (0 - 24 Hours): Successful refunds for UPI transactions are processed instantly and credited back to the source account within a few hours up to 1 business day.",
      "Card & Netbanking Refunds (3 - 10 Days): Credit/Debit card transactions undergo settlement rounds. Card statements reflect the refund within 3 to 10 banking days."
    ],
    s5Title: "5. Regional Franchise Branch Offices & Riders",
    s5Body: "Authorized Regional Franchises operate with local administrative oversight inside their designated PIN-codes and local regions.",
    s6Title: "🚨 Limitation of Liability",
    s6Body: "In no event shall Local Bandi, its founders, or directors be liable for any indirect, incidental, special, or consequential damages resulting from the use of third-party products, food ingredients, partner delays, matchmaker profiles, or property listings.",
    copyright: "© 2026 Local Bandi Multi Services. All rights reserved.",
    support: "Support: +91 7416574197 | contact@localbandi.app"
  };
}

// Privacy Policy Translations
export function getLocalizedPrivacyPolicy(language: LanguageCode) {
  if (language === 'hi-IN') {
    return {
      title: "गोपनीयता नीति",
      subtitle: "गोपनीयता और डेटा सुरक्षा",
      appName: "आपकी गोपनीयता और सहमति",
      lastUpdated: "अंतिम अपडेट: जुलाई 2026",
      bannerHeader: "🛡️ हम आपके डेटा की रक्षा करते हैं:",
      bannerBody: "लोकल बांडी सख्त सुरक्षा उपाय अपनाता है। हम आपका व्यक्तिगत डेटा विज्ञापनों के लिए नहीं बेचते हैं। एकत्र किया गया डेटा केवल संचालन (जैसे डिलीवरी, मेडिकल टोकन, वैवाहिक संबंध) के लिए उपयोग किया जाता है।",
      s1Title: "1. हमारे द्वारा एकत्र की जाने वाली जानकारी",
      s1Points: [
        "उपयोगकर्ता प्रोफ़ाइल: सत्यापित मोबाइल नंबर (ओटीपी के माध्यम से), नाम और सहेजे गए पते।",
        "रियल-टाइम लोकेशन: सटीक डिलीवरी के लिए राइडर्स और सक्रिय ऑर्डरों का लाइव स्थान ट्रैक करना।",
        "मैरिज ब्यूरो बायो-डाटा: आयु, व्यवसाय, परिवार की पृष्ठभूमि और तस्वीरें।",
        "स्वास्थ्य संबंधी विवरण: ओपीडी पर्ची प्राप्त करने के लिए अस्पताल के टैग।"
      ],
      s2Title: "2. हम आपकी जानकारी का उपयोग कैसे करते हैं",
      s2Body: "एकत्रित डेटा का उपयोग केवल वास्तविक समय के रसद और प्लेटफ़ॉर्म सुरक्षा के लिए किया जाता है।",
      s3Title: "3. सख्त शून्य-लीक शेयरिंग दिशानिर्देश",
      s3Body: "हम कभी भी आपके व्यक्तिगत डेटा का व्यापार या नीलामी नहीं करते हैं। डेटा केवल आवश्यक संचालन के लिए साझा किया जाता है।",
      s4Title: "4. अवसंरचना सुरक्षा और एन्क्रिप्शन",
      s4Body: "सभी व्यक्तिगत विवरण, लेनदेन और प्रमाणपत्र फाइलों को 256-बिट एन्क्रिप्शन (HTTPS/TLS) से सुरक्षित रखा जाता है।",
      s5Title: "5. प्रोफ़ाइल हटाने के अधिकार",
      s5Body: "उपयोगकर्ता किसी भी समय अपने मैरिज ब्यूरो प्रोफ़ाइल या साथी खाते को हटाने या फ्रीज करने का अनुरोध कर सकते हैं।",
      copyright: "© 2026 लोकल बांडी मल्टी सर्विसेज। सर्वाधिकार सुरक्षित।",
      support: "गोपनीयता डेस्क: privacy@localbandi.app | +91 7416574197"
    };
  }

  if (language === 'te-IN') {
    return {
      title: "ప్రైవసీ పాలసీ",
      subtitle: "గోప్యత & డేటా పాలన",
      appName: "మీ గోప్యత & సమ్మతి",
      lastUpdated: "చివరిగా నవీకరించబడింది: జూలై 2026",
      bannerHeader: "🛡️ మేము మీ డేటాను రక్షిస్తాము:",
      bannerBody: "లోకల్ బండి కఠినమైన భద్రతా చర్యలను ఉపయోగిస్తుంది. మేము మీ వ్యక్తిగత డేటాను విక్రయించము. సేకరించిన డేటా సేవల నిర్వహణకు మాత్రమే ఉపయోగించబడుతుంది.",
      s1Title: "1. మేము సేకరించే సమాచారం",
      s1Points: [
        "యూజర్ ప్రొఫైల్స్: ధృవీకరించబడిన మొబైల్ నంబర్లు, పేర్లు మరియు సేవ్ చేసిన చిరునామాలు.",
        "లైవ్ లొకేషన్: కచ్చితమైన డెలివరీ కోసం రైడర్ల లైవ్ లొకేషన్ ట్రాకింగ్.",
        "మ్యారేజ్ బ్యూరో బయో-డేటా: వయస్సు, వృత్తి, కుటుంబ నేపథ్యం మరియు ఛాయాచిత్రాలు.",
        "ఆరోగ్య వివరాలు: హాస్పిటల్ OP స్లిప్‌లు పొందడానికి అవసరమైన వివరాలు."
      ],
      s2Title: "2. మీ సమాచారాన్ని మేము ఎలా ఉపయోగిస్తాము",
      s2Body: "సేకరించిన సమాచారం సేవల నిర్వహణ మరియు భద్రతకు మాత్రమే పరిమితం చేయబడింది.",
      s3Title: "3. డేటా పంచుకోవడం పై నిబంధనలు",
      s3Body: "మీ వ్యక్తిగత డేటా ఎట్టి పరిస్థితుల్లోనూ ప్రకటనకర్తలకు అందించబడదు.",
      s4Title: "4. నెట్‌వర్క్ భద్రత & ఎన్‌క్రిప్షన్",
      s4Body: "అన్ని వ్యక్తిగత వివరాలు మరియు రికార్డులు ఎన్‌క్రిప్షన్ (HTTPS/TLS) ద్వారా సురక్షితంగా రక్షించబడతాయి.",
      s5Title: "5. ప్రొఫైల్ తొలగింపు హక్కులు",
      s5Body: "వినియోగదారులు ఎప్పుడైనా తమ ప్రొఫైల్‌ను తొలగించడానికి అభ్యర్థించవచ్చు.",
      copyright: "© 2026 లోకల్ బండి మల్టీ సర్వీసెస్. సర్వ హక్కులు ప్రత్యేకించబడ్డాయి.",
      support: "గోప్యతా విభాగం: privacy@localbandi.app | +91 7416574197"
    };
  }

  return {
    title: "Privacy Policy",
    subtitle: "Privacy & Data Governance",
    appName: "Your Privacy & Consent",
    lastUpdated: "Last updated: July 2026",
    bannerHeader: "🛡️ WE DEFEND YOUR DATA:",
    bannerBody: "Local Bandi Multi Services utilizes strict security measures. We do not sell your personal data to advertisers. Any data collected is strictly for operations (e.g. matching deliveries, booking medical queues, and connecting marital bios).",
    s1Title: "1. Information We Collect",
    s1Points: [
      "User Profiles: Verified mobile phone numbers (validated via OTP), names, profile tags, and saved delivery locations.",
      "Real-Time Location Data: Continuous geographical location tracking of delivery riders to estimate precise drop-offs and dispatch nearest logistics resources.",
      "Marriage Bureau Bio-Data: Marital profile documentation including age, profession, family background, and photographs uploaded with user consent.",
      "Healthcare Details: Direct out-patient details and specific hospital tags to obtain official OP medical slips."
    ],
    s2Title: "2. How We Utilize Your Information",
    s2Body: "The data we collect is strictly applied to perform real-world operational logistics and keep the platform secured.",
    s3Title: "3. Strict Zero-Leak Sharing Guidelines",
    s3Body: "We never trade, auction, or leverage your private data for third-party monetization. Information is shared strictly under operational scopes.",
    s4Title: "4. Infrastructure Security & Encryption",
    s4Body: "All personal details, transaction ledgers, partner certificates, and marital records are secured using robust encryption (HTTPS/TLS) during transmission and stored safely.",
    s5Title: "5. Profile Deletion & Opt-Out Rights",
    s5Body: "Users can take down or permanently freeze their matchmaking profiles or partner accounts through settings or support.",
    copyright: "© 2026 Local Bandi Multi Services. All rights reserved.",
    support: "Privacy Officer Desk: privacy@localbandi.app | +91 7416574197"
  };
}

// Joining Letter Translations
export function getLocalizedJoiningLetter(partner: any, language: LanguageCode) {
  const isVendor = partner.type === 'vendor';

  if (language === 'hi-IN') {
    return {
      toolbarTitle: "आधिकारिक नियुक्ति पत्र",
      brandSub: "कनेक्ट • सेवा • सशक्त",
      refNo: "संदर्भ संख्या",
      issueDate: "जारी तिथि",
      toLabel: "सेवा में,",
      subject: "विषय: नियुक्ति पत्र एवं सेवा प्रोटोकॉल",
      dearText: `प्रिय ${partner.name},`,
      welcomeText: `हम लोकल बांडी मल्टी सर्विसेज इकोसिस्टम में प्रमाणित ${isVendor ? 'सेवा विक्रेता भागीदार' : 'डिलीवरी लॉजिस्टिक्स पार्टनर'} के रूप में आपका हार्दिक स्वागत करते हैं।`,
      bodyText: "आपका पेशेवर अनुभव और स्थानीय सेवा में समर्पण हमारे तेजी से बढ़ते हाइपरलोकल नेटवर्क को मजबूत करेगा।",
      particularsTitle: "नियुक्ति विवरण",
      designationLabel: "पद / पदनाम",
      designationValue: partner.service || (isVendor ? 'पंजीकृत विक्रेता' : 'फुल-स्टैक डिलीवरी पार्टनर'),
      effectiveDateLabel: "प्रभावी तिथि",
      statusLabel: "सत्यापन स्थिति",
      statusValue: "पूर्ण रूप से सत्यापित और केवाईसी स्वीकृत",
      tierLabel: "पार्टनर श्रेणी",
      tierValue: "एलीट बिजनेस पार्टनर",
      termsText: "यह नियुक्ति पार्टनर समझौते की शर्तों के अधीन है। मंच पर उत्कृष्ट गुणवत्ता और न्यूनतम 4.0 स्टार रेटिंग बनाए रखना आवश्यक है।",
      bankText: "वित्तीय भुगतान आपके प्रदान किए गए बैंक खाते में जमा किए जाएंगे:",
      bankNameLabel: "बैंक का नाम",
      accountNoLabel: "खाता संख्या",
      closingText: "हम एक परस्पर लाभदायक संबंध की आशा करते हैं और आपके व्यवसाय को बढ़ते देखना चाहते हैं।",
      verifiedBy: "सत्यापित सिस्टम: लोकल बांडी डिजिटल हस्ताक्षर",
      ceoName: "तरुण बांडी",
      ceoTitle: "संस्थापक एवं सीईओ",
      companyFull: "लोकल बांडी मल्टी सर्विसेज सॉल्यूशंस"
    };
  }

  if (language === 'te-IN') {
    return {
      toolbarTitle: "అధికారిక నియామక పత్రం",
      brandSub: "కనెక్ట్ • సేవ • సాధికారత",
      refNo: "రెఫరెన్స్ సంఖ్య",
      issueDate: "జారీ తేదీ",
      toLabel: "స్వీకర్త,",
      subject: "విషయం: నియామక పత్రం మరియు నియమావళి",
      dearText: `ప్రియమైన ${partner.name} గారికి,`,
      welcomeText: `లోకల్ బండి మల్టీ సర్వీసెస్ వ్యవస్థలోకి ప్రామాణీకరించబడిన ${isVendor ? 'సేవా విక్రేత భాగస్వామి' : 'డెలివరీ లాజిస్టిక్స్ భాగస్వామి'}గా మిమ్మల్ని సాదరంగా ఆహ్వానిస్తున్నాము.`,
      bodyText: "మీ వృత్తిపరమైన అనుభవం మరియు స్థానిక సేవా పట్ల మీ అంకితభావం మా నెట్‌వర్క్‌ను మరింత బలోపేతం చేస్తుంది.",
      particularsTitle: "నియామక వివరాలు",
      designationLabel: "ఉద్యోగ హోదా",
      designationValue: partner.service || (isVendor ? 'నమోదిత విక్రేత' : 'డెలివరీ భాగస్వామి'),
      effectiveDateLabel: "చేరిక తేదీ",
      statusLabel: "ధృవీకరణ స్థితులు",
      statusValue: "పూర్తిగా ధృవీకరించబడింది & KYC ఆమోదించబడింది",
      tierLabel: "భాగస్వామ్య హోదా",
      tierValue: "ఎలైట్ బిజినెస్ పార్టనర్",
      termsText: "ఈ నియామకం భాగస్వామ్య ఒప్పంద నిబంధనలకు లోబడి ఉంటుంది. కనీసం 4.0 స్టార్ల రేటింగ్‌ను కొనసాగించడం అవసరం.",
      bankText: "ఆర్థిక చెల్లింపులు మీ క్రింది బ్యాంక్ ఖాతాకు జమ చేయబడతాయి:",
      bankNameLabel: "బ్యాంక్ పేరు",
      accountNoLabel: "ఖాతా సంఖ్య",
      closingText: "మీ బిజినెస్ మా వేదిక ద్వారా మరింత అభివృద్ధి చెందాలని కోరుకుంటున్నాము.",
      verifiedBy: "డిజిటల్ సిస్టమ్ ద్వారా ధృవీకరించబడింది",
      ceoName: "తరుణ్ బండి",
      ceoTitle: "వ్యవస్థాపకుడు & CEO",
      companyFull: "లోకల్ బండి మల్టీ సర్వీసెస్ సొల్యూషన్స్"
    };
  }

  return {
    toolbarTitle: "Official Appointment Letter",
    brandSub: "Connect • Service • Empower",
    refNo: "Reference Number",
    issueDate: "Issue Date",
    toLabel: "To,",
    subject: "Subject: Letter of Appointment & Joining Protocol",
    dearText: `Dear ${partner.name},`,
    welcomeText: `We are pleased to formally welcome you to the Local Bandi Multi Services Ecosystem as a certified ${isVendor ? 'Service Vendor Partner' : 'Delivery Logistics Partner'}.`,
    bodyText: "Your professional background and commitment to local service excellence align perfectly with our mission to build a smarter, faster, and more reliable hyperlocal network.",
    particularsTitle: "Joining Particulars",
    designationLabel: "Job Designation",
    designationValue: partner.service || (isVendor ? 'Registered Vendor' : 'Full-stack Delivery Partner'),
    effectiveDateLabel: "Effective Date",
    statusLabel: "Verification Status",
    statusValue: "Fully Verified & KYC Approved",
    tierLabel: "Partner Tier",
    tierValue: "Elite Business Partner",
    termsText: "This appointment is subject to the terms and conditions outlined in the Partner Agreement. Continued association depends on maintaining a minimum rating of 4.0 stars.",
    bankText: "Financial settlements will be processed to the following linked bank account provided during onboarding:",
    bankNameLabel: "Bank Name",
    accountNoLabel: "Account Number",
    closingText: "We look forward to a mutually beneficial association and are excited to see your business grow with us.",
    verifiedBy: "Authenticity Verified By Local Bandi System",
    ceoName: "Tharun Bandi",
    ceoTitle: "Founder & CEO",
    companyFull: "Local Bandi Multi Services Solutions"
  };
}

// Vendor Dashboard Localized Content
export function getLocalizedVendorContent(language: LanguageCode) {
  if (language === 'hi-IN') {
    return {
      storeConsole: "विक्रेता कंसोल",
      overview: "अवलोकन",
      products: "उत्पाद एवं कैटलॉग",
      orders: "लाइव ऑर्डर",
      earnings: "कमाई और भुगतान",
      profile: "दुकान प्रोफ़ाइल",
      settings: "स्टोर सेटिंग्स",
      support: "सहायता और सपोर्ट",
      joiningLetter: "नियुक्ति पत्र",
      soundAlerts: "ध्वनि चेतावनी",
      language: "भाषा चुनें",
      totalSales: "कुल बिक्री",
      totalOrders: "कुल ऑर्डर",
      storeRating: "दुकान रेटिंग",
      activeProducts: "सक्रिय उत्पाद",
      storeStatus: "दुकान की स्थिति",
      online: "ऑनलाइन (ऑर्डर स्वीकार कर रहे हैं)",
      offline: "ऑफ़लाइन (बंद है)",
      addNewProduct: "नया उत्पाद जोड़ें",
      editProduct: "उत्पाद संपादित करें",
      deleteProduct: "उत्पाद हटाएं",
      inStock: "स्टॉक में है",
      outOfStock: "स्टॉक समाप्त",
      acceptOrder: "ऑर्डर स्वीकार करें",
      rejectOrder: "अस्वीकार करें",
      markReady: "तैयार चिह्नित करें",
      dispatched: "भेज दिया गया",
      delivered: "डिलीवर हो गया",
      cancelled: "रद्द किया गया",
      pending: "लंबित",
      preparing: "तैयारी में",
      shopName: "दुकान का नाम",
      ownerName: "मालिक का नाम",
      phone: "संपर्क फोन",
      category: "श्रेणी",
      saveChanges: "सहेजें",
      bankDetails: "लिंक किया गया बैंक खाता",
      payoutRequest: "भुगतान का अनुरोध करें",
      withdrawBalance: "वॉलेट शेष"
    };
  }

  if (language === 'te-IN') {
    return {
      storeConsole: "విక్రేత కన్సోల్",
      overview: "అవలోకనం",
      products: "ఉత్పత్తులు & క్యాటలాగ్",
      orders: "లైవ్ ఆర్డర్‌లు",
      earnings: "ఆదాయం & చెల్లింపులు",
      profile: "షాప్ ప్రొఫైల్",
      settings: "స్టోర్ సెట్టింగ్‌లు",
      support: "సహాయం & సపోర్ట్",
      joiningLetter: "నియామక పత్రం",
      soundAlerts: "సౌండ్ అలర్ట్‌లు",
      language: "భాషను ఎంచుకోండి",
      totalSales: "మొత్తం విక్రయాలు",
      totalOrders: "మొత్తం ఆర్డర్‌లు",
      storeRating: "షాప్ రేటింగ్",
      activeProducts: "యాక్టివ్ ఉత్పత్తులు",
      storeStatus: "షాప్ స్థితి",
      online: "ఆన్‌లైన్ (ఆర్డర్‌లు స్వీకరిస్తోంది)",
      offline: "ఆఫ్‌లైన్ (మూసివేయబడింది)",
      addNewProduct: "కొత్త ఉత్పత్తిని జోడించండి",
      editProduct: "ఉత్పత్తిని సవరించండి",
      deleteProduct: "తొలగించు",
      inStock: "స్టాక్‌లో ఉంది",
      outOfStock: "స్టాక్ లేదు",
      acceptOrder: "ఆర్డర్ స్వీకరించు",
      rejectOrder: "తిరస్కరించు",
      markReady: "సిద్ధంగా ఉందని గుర్తుంచు",
      dispatched: "పంపిణీ చేయబడింది",
      delivered: "డెలివరీ అయింది",
      cancelled: "రద్దు చేయబడింది",
      pending: "పెండింగ్‌లో ఉంది",
      preparing: "సిద్ధం చేస్తున్నారు",
      shopName: "షాప్ పేరు",
      ownerName: "యజమాని పేరు",
      phone: "ఫోన్ సంఖ్య",
      category: "కేటగిరీ",
      saveChanges: "సేవ్ చేయి",
      bankDetails: "అనుసంధానించబడిన బ్యాంక్ ఖాతా",
      payoutRequest: "చెల్లింపు అభ్యర్థించండి",
      withdrawBalance: "వాలెట్ నిల్వ"
    };
  }

  if (language === 'ta-IN') {
    return {
      storeConsole: "விற்பனையாளர் கன்சோல்",
      overview: "மேலோட்டம்",
      products: "பொருட்கள் & கேடலாக்",
      orders: "நேரலை ஆர்டர்கள்",
      earnings: "வருமானம் & கொடுப்பனவுகள்",
      profile: "கடை சுயவிவரம்",
      settings: "கடை அமைப்புகள்",
      support: "உதவி & ஆதரவு",
      joiningLetter: "நியமனக் கடிதம்",
      soundAlerts: "ஒலி விழிப்பூட்டல்கள்",
      language: "மொழியைத் தேர்ந்தெடுக்கவும்",
      totalSales: "மொத்த விற்பனை",
      totalOrders: "மொத்த ஆர்டர்கள்",
      storeRating: "கடை மதிப்பீடு",
      activeProducts: "செயலில் உள்ள பொருட்கள்",
      storeStatus: "கடை நிலை",
      online: "ஆன்லைன் (ஆர்டர்களை ஏற்கிறது)",
      offline: "ஆஃப்லைன் (மூடப்பட்டுள்ளது)",
      addNewProduct: "புதிய பொருளைச் சேர்க்கவும்",
      editProduct: "பொருளைத் திருத்து",
      deleteProduct: "நீக்கு",
      inStock: "இருப்பில் உள்ளது",
      outOfStock: "இருப்பு இல்லை",
      acceptOrder: "ஆர்டரை ஏற்றுக்கொள்",
      rejectOrder: "நிராகரி",
      markReady: "தயார் என குறிக்கவும்",
      dispatched: "அனுப்பப்பட்டது",
      delivered: "டெலிவரி செய்யப்பட்டது",
      cancelled: "ரத்து செய்யப்பட்டது",
      pending: "நிலுவையில் உள்ளது",
      preparing: "தயாராகிறது",
      shopName: "கடை பெயர்",
      ownerName: "உரிமையாளர் பெயர்",
      phone: "தொலைபேசி எண்",
      category: "வகை",
      saveChanges: "சேமிக்கவும்",
      bankDetails: "இணைக்கப்பட்ட வங்கி கணக்கு",
      payoutRequest: "பணம் பெற கோரவும்",
      withdrawBalance: "வாலட் இருப்பு"
    };
  }

  return {
    storeConsole: "Vendor Console",
    overview: "Overview",
    products: "Products & Catalog",
    orders: "Live Orders",
    earnings: "Earnings & Payouts",
    profile: "Store Profile",
    settings: "Store Settings",
    support: "Help & Support",
    joiningLetter: "Appointment Letter",
    soundAlerts: "Sound Alerts",
    language: "Select Language",
    totalSales: "Total Sales",
    totalOrders: "Total Orders",
    storeRating: "Store Rating",
    activeProducts: "Active Products",
    storeStatus: "Store Status",
    online: "Online (Accepting Orders)",
    offline: "Offline (Closed)",
    addNewProduct: "Add New Product",
    editProduct: "Edit Product",
    deleteProduct: "Delete Item",
    inStock: "In Stock",
    outOfStock: "Out of Stock",
    acceptOrder: "Accept Order",
    rejectOrder: "Reject Order",
    markReady: "Mark Ready",
    dispatched: "Dispatched",
    delivered: "Delivered",
    cancelled: "Cancelled",
    pending: "Pending",
    preparing: "Preparing",
    shopName: "Shop Name",
    ownerName: "Owner Name",
    phone: "Contact Phone",
    category: "Category",
    saveChanges: "Save Changes",
    bankDetails: "Linked Bank Account",
    payoutRequest: "Request Payout",
    withdrawBalance: "Wallet Balance"
  };
}

// Delivery Partner App Localized Content
export function getLocalizedDeliveryContent(language: LanguageCode) {
  if (language === 'hi-IN') {
    return {
      riderTerminal: "राइडर टर्मिनल",
      dutyStatus: "ड्यूटी स्थिति",
      onDuty: "ऑन ड्यूटी (ऑर्डर प्राप्त कर रहे हैं)",
      offDuty: "ऑफ ड्यूटी (ऑफ़लाइन)",
      availableTrips: "उपलब्ध ट्रिप्स",
      activeTrip: "सक्रिय डिलीवरी",
      earningsToday: "आज की कमाई",
      totalDelivered: "कुल डिलीवर किए गए",
      riderRating: "राइडर रेटिंग",
      walletBalance: "वॉलेट शेष",
      pickFrom: "यहाँ से पिकअप करें",
      deliverTo: "यहाँ डिलीवर करें",
      callCustomer: "ग्राहक को कॉल करें",
      callVendor: "दुकानदार को कॉल करें",
      navigateGps: "नेविगेट करें (जीपीएस)",
      acceptTrip: "ट्रिप स्वीकार करें",
      pickupOrder: "पिकअप की पुष्टि करें",
      verifyOtp: "डिलीवरी ओटीपी दर्ज करें",
      completeDelivery: "डिलीवरी पूर्ण करें",
      tripLogs: "ट्रिप इतिहास",
      riderProfile: "राइडर प्रोफ़ाइल",
      payoutLedger: "पेआउट बहीखाता",
      joiningLetter: "नियुक्ति पत्र",
      settings: "ऐप सेटिंग्स",
      support: "राइडर सहायता"
    };
  }

  if (language === 'te-IN') {
    return {
      riderTerminal: "రైడర్ టెర్మినల్",
      dutyStatus: "డ్యూటీ స్థతులు",
      onDuty: "ఆన్ డ్యూటీ (ఆర్డర్‌లు స్వీకరిస్తున్నారు)",
      offDuty: "ఆఫ్ డ్యూటీ (ఆఫ్‌లైన్)",
      availableTrips: "లభ్యమయ్యే ట్రిప్‌లు",
      activeTrip: "యాక్టివ్ డెలివరీ",
      earningsToday: "నేటి సంపాదన",
      totalDelivered: "మొత్తం డెలివరీలు",
      riderRating: "రైడర్ రేటింగ్",
      walletBalance: "వాలెట్ నిల్వ",
      pickFrom: "పికప్ చేసుకోండి",
      deliverTo: "డెలివరీ చేయండి",
      callCustomer: "కస్టమర్‌కు కాల్ చేయండి",
      callVendor: "విక్రేతకు కాల్ చేయండి",
      navigateGps: "నావిగేట్ చేయండి (GPS)",
      acceptTrip: "ట్రిప్ స్వీకరించు",
      pickupOrder: "పికప్ ధృవీకరించు",
      verifyOtp: "డెలివరీ OTP నమోదు చేయండి",
      completeDelivery: "డెలివరీ పూర్తి చేయండి",
      tripLogs: "ట్రిప్ చరిత్ర",
      riderProfile: "రైడర్ ప్రొఫైల్",
      payoutLedger: "పేఅవుట్ లెడ్జర్",
      joiningLetter: "నియామక పత్రం",
      settings: "యాప్ సెట్టింగ్‌లు",
      support: "రైడర్ సపోర్ట్"
    };
  }

  return {
    riderTerminal: "Rider Terminal",
    dutyStatus: "Duty Status",
    onDuty: "On Duty (Accepting Orders)",
    offDuty: "Off Duty (Offline)",
    availableTrips: "Available Trips",
    activeTrip: "Active Trip",
    earningsToday: "Earnings Today",
    totalDelivered: "Orders Delivered",
    riderRating: "Rider Rating",
    walletBalance: "Wallet Balance",
    pickFrom: "Pick Up From",
    deliverTo: "Deliver To",
    callCustomer: "Call Customer",
    callVendor: "Call Vendor",
    navigateGps: "Navigate GPS",
    acceptTrip: "Accept Trip",
    pickupOrder: "Confirm Pickup",
    verifyOtp: "Enter Delivery OTP",
    completeDelivery: "Complete Delivery",
    tripLogs: "Trip History",
    riderProfile: "Rider Profile",
    payoutLedger: "Payout Ledger",
    joiningLetter: "Official Appointment Letter",
    settings: "App Settings",
    support: "Rider Help Desk"
  };
}

// Local Franchise Admin App Localized Content
export function getLocalizedFranchiseContent(language: LanguageCode) {
  if (language === 'hi-IN') {
    return {
      franchiseHub: "लोकल फ़्रैंचाइज़ एडमिन हब",
      branchName: "शाखा का नाम",
      overview: "शाखा अवलोकन",
      categories: "स्थानीय श्रेणियां",
      vendors: "विक्रेता नेटवर्क",
      riders: "डिलीवरी टीम",
      orders: "डिस्पैच मॉनिटर",
      marriage: "मैरिज ब्यूरो",
      realEstate: "रियल एस्टेट लिस्टिंग",
      hospital: "अस्पताल ओपी टोकन",
      payouts: "शाखा पेआउट",
      settings: "शाखा सेटिंग्स",
      gatePasscode: "सुरक्षा पासकोड",
      approve: "स्वीकृत करें",
      reject: "अस्वीकार करें",
      block: "ब्लॉक करें",
      unblock: "पुनः सक्रिय करें",
      totalRevenue: "शाखा कुल राजस्व",
      branchCommission: "शाखा कमीशन",
      activeVendors: "सक्रिय विक्रेता",
      activeRiders: "सक्रिय राइडर्स",
      addCategory: "नई श्रेणी जोड़ें",
      assignRider: "राइडर असाइन करें"
    };
  }

  if (language === 'te-IN') {
    return {
      franchiseHub: "లోకల్ ఫ్రాంచైజ్ అడ్మిన్ హబ్",
      branchName: "బ్రాంచ్ పేరు",
      overview: "బ్రాంచ్ అవలోకనం",
      categories: "స్థానిక కేటగిరీలు",
      vendors: "విక్రేతల నెట్‌వర్క్",
      riders: "డెలివరీ టీమ్",
      orders: "డిస్పాచ్ మానిటర్",
      marriage: "మ్యారేజ్ బ్యూరో",
      realEstate: "రియల్ ఎస్టేట్",
      hospital: "హాస్పిటల్ OP టోకెన్లు",
      payouts: "బ్రాంచ్ పేఅవుట్‌లు",
      settings: "బ్రాంచ్ సెట్టింగ్‌లు",
      gatePasscode: "సెక్యూరిటీ పాస్‌కోడ్",
      approve: "ఆమోదించు",
      reject: "తిరస్కరించు",
      block: "బ్లాక్ చేయి",
      unblock: "తిరిగి పునరుద్ధరించు",
      totalRevenue: "బ్రాంచ్ మొత్తం ఆదాయం",
      branchCommission: "బ్రాంచ్ కమిషన్",
      activeVendors: "యాక్టివ్ విక్రేతలు",
      activeRiders: "యాక్టివ్ రైడర్లు",
      addCategory: "కేటగిరీని జోడించు",
      assignRider: "రైడర్‌ను కేటాయించు"
    };
  }

  return {
    franchiseHub: "Local Franchise Admin Hub",
    branchName: "Branch Name",
    overview: "Branch Overview",
    categories: "Local Categories",
    vendors: "Merchant Network",
    riders: "Delivery Fleet",
    orders: "Dispatch Monitor",
    marriage: "Marriage Bureau",
    realEstate: "Real Estate Listings",
    hospital: "Hospital OP Tokens",
    payouts: "Branch Payouts",
    settings: "Branch Settings",
    gatePasscode: "Security Passcode",
    approve: "Approve Application",
    reject: "Reject Application",
    block: "Suspend Account",
    unblock: "Re-activate Account",
    totalRevenue: "Branch Gross Volume",
    branchCommission: "Branch Earnings",
    activeVendors: "Active Vendors",
    activeRiders: "Active Fleet",
    addCategory: "Add Custom Category",
    assignRider: "Dispatch Delivery Partner"
  };
}

// Customer Care Localized Content
export function getLocalizedCustomerCareContent(language: LanguageCode) {
  if (language === 'hi-IN') {
    return {
      helpDeskTitle: "ग्राहक सेवा एवं सहायता केंद्र",
      founderLine: "संस्थापक डायरेक्ट सपोर्ट लाइन",
      callbackHours: "दैनिक कॉल बैक समय (सुबह 09:20 से शाम 05:00 तक)",
      selectCategory: "सहायता श्रेणी चुनें",
      userCategory: "ग्राहक ऑर्डर एवं रिफंड सहायता",
      vendorCategory: "विक्रेता एवं स्टोर भुगतान सहायता",
      deliveryCategory: "डिलीवरी पार्टनर एवं ट्रिप सहायता",
      marriageCategory: "मैरिज ब्यूरो एवं मैचमेकिंग",
      faqTitle: "अक्सर पूछे जाने वाले प्रश्न",
      askQuestion: "प्रश्न पूछें",
      attachScreenshot: "स्क्रीनशॉट / रसीद अपलोड करें",
      callSupport: "अभी कॉल करें",
      liveAgentChat: "लाइव चैट सहायता",
      ticketStatus: "टिकट स्थिति",
      enterMessage: "अपना संदेश या समस्या लिखें..."
    };
  }

  if (language === 'te-IN') {
    return {
      helpDeskTitle: "కస్టమర్ కేర్ & సపోర్ట్ సెంటర్",
      founderLine: "వ్యవస్థాపక డైరెక్ట్ సపోర్ట్ లైన్",
      callbackHours: "రోజువారీ కాల్ బ్యాక్ సమయాలు (ఉదయం 09:20 నుండి సాయంత్రం 05:00 వరకు)",
      selectCategory: "సపోర్ట్ కేటగిరీని ఎంచుకోండి",
      userCategory: "కస్టమర్ ఆర్డర్‌లు & రీఫండ్ సపోర్ట్",
      vendorCategory: "విక్రేత & స్టోర్ పేఅవుట్ సపోర్ట్",
      deliveryCategory: "డెలివరీ భాగస్వామి & ట్రిప్ సపోర్ట్",
      marriageCategory: "మ్యారేజ్ బ్యూరో & మ్యాచ్ మేకింగ్",
      faqTitle: "తరచుగా అడిగే ప్రశ్నలు",
      askQuestion: "ప్రశ్న అడగండి",
      attachScreenshot: "స్క్రీన్‌షాట్ / రశీదు అప్‌లోడ్ చేయండి",
      callSupport: "ఇప్పుడే కాల్ చేయండి",
      liveAgentChat: "లైవ్ సపోర్ట్ చాట్",
      ticketStatus: "టికెట్ స్థితులు",
      enterMessage: "మీ సందేశాన్ని లేదా సమస్యను టైప్ చేయండి..."
    };
  }

  return {
    helpDeskTitle: "Customer Care & Support Center",
    founderLine: "Founder Direct Support Line",
    callbackHours: "Daily Callback & Support Hours (09:20 AM - 05:00 PM)",
    selectCategory: "Select Support Category",
    userCategory: "Customer Orders & Refund Support",
    vendorCategory: "Vendor & Store Payout Support",
    deliveryCategory: "Delivery Partner & Trip Support",
    marriageCategory: "Marriage Bureau & Matchmaking",
    faqTitle: "Frequently Asked Questions",
    askQuestion: "Ask Customer Care",
    attachScreenshot: "Upload Screenshot / Receipt",
    callSupport: "Call Support Now",
    liveAgentChat: "Live Support Chat",
    ticketStatus: "Support Ticket Status",
    enterMessage: "Type your message or issue..."
  };
}

export function getLocalizedBannerTitle(title: string, language: LanguageCode): string {
  if (!title || language === 'en-IN') return title;

  const BANNER_TITLE_MAP: Record<string, Partial<Record<LanguageCode, string>>> = {
    'Careful Travel Drivers': {
      'hi-IN': 'सुरक्षित ट्रैवल ड्राइवर्स',
      'te-IN': 'సురక్షిత డ్రైవర్లు & ప్రయాణం',
      'ta-IN': 'பாதுகாப்பான டிரைவர்கள்',
      'kn-IN': 'ಸುರಕ್ಷಿತ ಪ್ರಯಾಣ ಚಾಲಕರು',
      'ml-IN': 'സുരക്ഷിത ഡ്രൈവർമാർ',
      'bn-IN': 'নিরাপদ ভ্রমণ ড্রাইভার',
      'gu-IN': 'સુરક્ષિત ટ્રાવેલ ડ્રાઇવર્સ',
      'mr-IN': 'सुरक्षित ड्रायव्हर्स'
    },
    'Fresh Farm Milk': {
      'hi-IN': 'ताज़ा फ़ार्म दूध',
      'te-IN': 'తాజా ఫామ్ పాలు',
      'ta-IN': 'பண்ணை பால்',
      'kn-IN': 'ತಾಜಾ ಹಾಲು',
      'ml-IN': 'ഫ്രഷ് ഫാം പാൽ',
      'bn-IN': 'খামারের তাজা দুধ',
      'gu-IN': 'તાજું દૂધ',
      'mr-IN': 'ताजे दूध'
    },
    'Lokal Specialty Hub': {
      'hi-IN': 'लोकल स्पेशलिटी हब',
      'te-IN': 'లోకల్ స్పెషల్ హబ్',
      'ta-IN': 'லோக்கல் ஸ்பெஷாலிட்டி ஹப்',
      'kn-IN': 'ಲೋಕಲ್ ಸ್ಪೆಷಾಲಿಟಿ ಹಬ್',
      'ml-IN': 'ലോക്കൽ സ്പെഷ്യാലിറ്റി ഹബ്',
      'bn-IN': 'লোকাল স্পেশালিটি হাব',
      'gu-IN': 'લોકલ સ્પેશિયાલિટી હબ',
      'mr-IN': 'लोकल स्पेशालिटी हब'
    },
    'Deals of the Day': {
      'hi-IN': 'आज के सर्वश्रेष्ठ सौदे',
      'te-IN': 'ఈనాటి బెస్ట్ ఆఫర్లు',
      'ta-IN': 'இன்றைய சிறந்த ஆஃபர்கள்',
      'kn-IN': 'ಇಂದಿನ ಅತ್ಯುತ್ತಮ ಆಫರ್‌ಗಳು',
      'ml-IN': 'ഇന്നത്തെ ഓഫറുകൾ',
      'bn-IN': 'দিনের সেরা অফার',
      'gu-IN': 'આજના શ્રેષ્ઠ સોદા',
      'mr-IN': 'आजचे खास ऑफर्स'
    },
    'Real Estate Listings': {
      'hi-IN': 'रियल एस्टेट सूचियाँ',
      'te-IN': 'రియల్ ఎస్టేట్ ప్రాపర్టీలు',
      'ta-IN': 'ரியல் எஸ்டேட் பட்டியல்கள்',
      'kn-IN': 'ರಿಯಲ್ ಎಸ್ಟೇಟ್ ಪಟ್ಟಿಗಳು',
      'ml-IN': 'റിയൽ എസ്റ്റേറ്റ് ലിസ്റ്റിംഗുകൾ',
      'bn-IN': 'রিয়েল এস্টেট তালিকা',
      'gu-IN': 'રિયલ એસ્ટેટ લિસ્ટિંગ્સ',
      'mr-IN': 'रियल इस्टेट यादी'
    }
  };

  const match = BANNER_TITLE_MAP[title];
  if (match && match[language]) return match[language]!;
  return title;
}

export function getLocalizedBannerSub(sub: string, language: LanguageCode): string {
  if (!sub || language === 'en-IN') return sub;

  const BANNER_SUB_MAP: Record<string, Partial<Record<LanguageCode, string>>> = {
    'Safe Car & Bus Rentals for All Vehicles': {
      'hi-IN': 'सभी वाहनों के लिए सुरक्षित कार और बस रेंटल',
      'te-IN': 'అన్ని వాహనాలకు సురక్షిత కార్ & బస్సు అద్దెలు',
      'ta-IN': 'அனைத்து வாகனங்களுக்கும் பாதுகாப்பான கார் மற்றும் பஸ் வாடகை',
      'kn-IN': 'ಎಲ್ಲಾ ವಾಹನಗಳಿಗೆ ಸುರಕ್ಷಿತ ಕಾರ್ ಮತ್ತು ಬಸ್ ಬಾಡಿಗೆ',
      'ml-IN': 'എല്ലാ വാഹനങ്ങൾക്കും സുരക്ഷിതമായ കാർ, ബസ് വാടക',
      'bn-IN': 'সমস্ত গাড়ির জন্য নিরাপদ কার এবং বাস রেন্টাল',
      'gu-IN': 'તમામ વાહનો માટે સુરક્ષિત કાર અને બસ ભાડા',
      'mr-IN': 'सर्व वाहनांसाठी सुरक्षित कार व बस भाड्याने'
    },
    'Direct from local farms to your home': {
      'hi-IN': 'स्थानीय खेतों से सीधे आपके घर तक',
      'te-IN': 'స్థానిక ఫారమ్‌ల నుండి నేరుగా మీ ఇంటికి',
      'ta-IN': 'உள்ளூர் பண்ணைகளிலிருந்து நேரடியாக உங்கள் வீட்டிற்கு',
      'kn-IN': 'ಸ್ಥಾನಿಕ ಫಾರ್ಮ್‌ಗಳಿಂದ ನೇರವಾಗಿ ನಿಮ್ಮ ಮನೆಗೆ',
      'ml-IN': 'പ്രാദേശിക ഫാമുകളിൽ നിന്ന് നേരിട്ട് നിങ്ങളുടെ വീട്ടിലേക്ക്',
      'bn-IN': 'স্থানীয় খামার থেকে সরাসরি আপনার বাড়িতে',
      'gu-IN': 'સ્થાનિક ફાર્મથી સીધા તમારા ઘર સુધી',
      'mr-IN': 'स्थानिक फार्मवरून थेट तुमच्या घरी'
    },
    'Authentic local goods & fresh items': {
      'hi-IN': 'प्रामाणिक स्थानीय सामान और ताज़ा वस्तुएँ',
      'te-IN': 'అసలైన స్థానిక వస్తువులు & తాజా పదార్థాలు',
      'ta-IN': 'உண்மையான உள்ளூர் பொருட்கள் மற்றும் புதிய பொருட்கள்',
      'kn-IN': 'ಅಸಲಿ ಪ್ರಾದೇಶಿಕ ವಸ್ತುಗಳು ಮತ್ತು ತಾಜಾ ಸಾಮಗ್ರಿಗಳು',
      'ml-IN': 'യഥാർത്ഥ പ്രാദേശിക ഉൽപ്പന്നങ്ങളും പുതിയ സാധനങ്ങളും',
      'bn-IN': 'খাঁটি স্থানীয় জিনিসপত্র ও তাজা সামগ্রী',
      'gu-IN': 'અસલી સ્થાનિક વસ્તુઓ અને તાજી ચીજો',
      'mr-IN': 'अस्सल स्थानिक वस्तू आणि ताजे साहित्य'
    }
  };

  const match = BANNER_SUB_MAP[sub];
  if (match && match[language]) return match[language]!;
  return sub;
}

