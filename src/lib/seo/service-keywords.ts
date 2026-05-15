export const SERVICE_KEYWORDS = {
  data: {
    primary: [
      'cheap data bundles Ghana',
      'buy data online Ghana',
      'MTN data bundles',
      'Telecel bundles Ghana',
      'AirtelTigo internet bundles',
    ],
    secondary: [
      'affordable internet Ghana',
      'instant data delivery Ghana',
      'non expiry data bundles',
      'weekly data bundles',
      'monthly data bundles',
    ],
    networks: {
      mtn: ['MTN data Ghana', 'buy MTN data online', 'MTN cheap data', 'MTN bundles'],
      telecel: ['Telecel data Ghana', 'buy Telecel data online', 'Telecel bundles', 'Vodafone data'],
      airteltigo: ['AirtelTigo data Ghana', 'buy AirtelTigo data online', 'AirtelTigo bundles'],
    },
  },
  verification: {
    primary: [
      'buy verification numbers',
      'cheap SMS verification numbers',
      'virtual numbers for OTP',
      'WhatsApp verification number',
      'Telegram verification number',
    ],
    secondary: [
      'temporary phone number',
      'online SMS verification',
      'cheap OTP numbers',
      'receive SMS online',
      'virtual phone number Ghana',
    ],
    platforms: {
      whatsapp: ['WhatsApp verification number', 'WhatsApp virtual number', 'verify WhatsApp account'],
      telegram: ['Telegram verification number', 'Telegram virtual number', 'verify Telegram account'],
      facebook: ['Facebook verification number', 'Facebook OTP number', 'verify Facebook account'],
      google: ['Google verification number', 'Google OTP number', 'verify Google account'],
    },
  },
  airtime: {
    primary: [
      'buy airtime online Ghana',
      'instant airtime topup',
      'MTN airtime Ghana',
      'Telecel airtime online',
      'AirtelTigo recharge Ghana',
    ],
    secondary: [
      'cheap airtime Ghana',
      'mobile recharge online Ghana',
      'airtime with MoMo',
      'instant topup Ghana',
      'buy credit online',
    ],
  },
  resultCheckers: {
    primary: [
      'WAEC result checker Ghana',
      'BECE result checker',
      'NOVDEC checker Ghana',
      'buy result checker online',
    ],
    secondary: [
      'exam result voucher',
      'WAEC PIN Ghana',
      'WASSCE checker online',
      'result checker prices',
    ],
  },
  esim: {
    primary: [
      'eSIM Ghana',
      'travel eSIM',
      'digital SIM card Ghana',
      'US virtual number',
      'international data eSIM',
    ],
    secondary: [
      'buy eSIM online Ghana',
      'virtual phone number Ghana',
      'travel data SIM',
      'eSIM activation',
      'global data eSIM',
    ],
  },
  proxies: {
    primary: [
      'residential proxies Ghana',
      'mobile proxies',
      'datacenter proxies',
      'buy proxies online',
      'Ghana proxy service',
    ],
    secondary: [
      'cheap proxies Ghana',
      'rotating proxies',
      'sticky proxies',
      'private proxies',
      'proxy for scraping',
    ],
  },
  giftcards: {
    primary: [
      'buy gift cards Ghana',
      'Netflix gift card',
      'Spotify gift card',
      'Amazon gift card',
      'digital gift cards',
    ],
    secondary: [
      'gift card deals Ghana',
      'buy Netflix voucher',
      'Spotify premium Ghana',
      'Steam gift card Ghana',
      'iTunes gift card Ghana',
    ],
  },
  bills: {
    primary: ['pay electricity bill Ghana', 'ECG payment Ghana', 'DSTV subscription Ghana', 'pay GOTV online Ghana', 'pay water bill Ghana', 'MTN Fibre payment'],
    secondary: ['postpaid electricity Ghana', 'cheap DSTV renewal Ghana', 'GOTV payment Ghana', 'GWCL payment Ghana', 'Telecel Broadband payment'],
    electricity: {
      primary: ['pay electricity bill Ghana', 'ECG payment Ghana', 'prepaid electricity Ghana'],
      secondary: ['postpaid electricity Ghana', 'ECG bill payment', 'electricity bill online'],
    },
    tv: {
      primary: ['DSTV subscription Ghana', 'pay GOTV online Ghana', 'cheap DSTV renewal Ghana'],
      secondary: ['instant TV subscription Ghana', 'renew DSTV online', 'GOTV payment Ghana'],
    },
    water: {
      primary: ['pay water bill Ghana', 'GWCL payment Ghana', 'Ghana Water Company'],
      secondary: ['water bill online Ghana', 'GWCL bill payment', 'utility bill payment'],
    },
    internet: {
      primary: ['MTN Fibre payment', 'Telecel Broadband payment', 'internet bill payment Ghana'],
      secondary: ['broadband bill Ghana', 'fiber internet payment', 'internet subscription Ghana'],
    },
  },
}

export function getServiceKeywords(service: keyof typeof SERVICE_KEYWORDS, subService?: string): string[] {
  const serviceData = SERVICE_KEYWORDS[service]
  
  if (!serviceData) return []
  
  if (subService && typeof serviceData === 'object' && subService in serviceData) {
    const subData = (serviceData as any)[subService]
    if (typeof subData === 'object' && 'primary' in subData) {
      return [...subData.primary, ...subData.secondary]
    }
    return []
  }
  
  if (typeof serviceData === 'object' && 'primary' in serviceData && 'secondary' in serviceData) {
    return [...serviceData.primary, ...serviceData.secondary]
  }
  
  return []
}
