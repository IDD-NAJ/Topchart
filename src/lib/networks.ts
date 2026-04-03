export interface Network {
  id: string
  name: string
  code: string
  color: string
  prefixes: string[]
}

export interface DataPlan {
  id: string
  networkId: string
  name: string
  size: string
  price: number
  validity: string
  type: "daily" | "weekly" | "monthly" | "mega"
}

export const networks: Network[] = [
  {
    id: "mtn",
    name: "MTN",
    code: "MTN",
    color: "#FFCC00",
    prefixes: ["024", "054", "055", "059"],
  },
  {
    id: "vodafone",
    name: "Vodafone",
    code: "VODAFONE",
    color: "#E60000",
    prefixes: ["020", "050"],
  },
  {
    id: "airteltigo",
    name: "AirtelTigo",
    code: "AIRTELTIGO",
    color: "#E40046",
    prefixes: ["026", "056", "027", "057"],
  },
]

export const dataPlans: DataPlan[] = [
  // MTN Plans (prices in GHS pesewas converted to cedis)
  { id: "mtn-daily-50", networkId: "mtn", name: "MTN Daily", size: "50MB", price: 1, validity: "1 Day", type: "daily" },
  { id: "mtn-daily-150", networkId: "mtn", name: "MTN Daily", size: "150MB", price: 2, validity: "1 Day", type: "daily" },
  { id: "mtn-weekly-350", networkId: "mtn", name: "MTN Weekly", size: "350MB", price: 5, validity: "7 Days", type: "weekly" },
  { id: "mtn-weekly-1gb", networkId: "mtn", name: "MTN Weekly", size: "1GB", price: 10, validity: "7 Days", type: "weekly" },
  { id: "mtn-monthly-2gb", networkId: "mtn", name: "MTN Monthly", size: "2GB", price: 20, validity: "30 Days", type: "monthly" },
  { id: "mtn-monthly-4gb", networkId: "mtn", name: "MTN Monthly", size: "4GB", price: 35, validity: "30 Days", type: "monthly" },
  { id: "mtn-monthly-6gb", networkId: "mtn", name: "MTN Monthly", size: "6GB", price: 50, validity: "30 Days", type: "monthly" },
  { id: "mtn-monthly-10gb", networkId: "mtn", name: "MTN Monthly", size: "10GB", price: 75, validity: "30 Days", type: "monthly" },
  { id: "mtn-mega-15gb", networkId: "mtn", name: "MTN Mega", size: "15GB", price: 100, validity: "30 Days", type: "mega" },
  { id: "mtn-mega-25gb", networkId: "mtn", name: "MTN Mega", size: "25GB", price: 150, validity: "30 Days", type: "mega" },
  
  // Vodafone Plans
  { id: "vodafone-daily-50", networkId: "vodafone", name: "Vodafone Daily", size: "50MB", price: 1, validity: "1 Day", type: "daily" },
  { id: "vodafone-daily-150", networkId: "vodafone", name: "Vodafone Daily", size: "150MB", price: 2, validity: "1 Day", type: "daily" },
  { id: "vodafone-weekly-500", networkId: "vodafone", name: "Vodafone Weekly", size: "500MB", price: 5, validity: "7 Days", type: "weekly" },
  { id: "vodafone-weekly-1gb", networkId: "vodafone", name: "Vodafone Weekly", size: "1GB", price: 9, validity: "7 Days", type: "weekly" },
  { id: "vodafone-monthly-2gb", networkId: "vodafone", name: "Vodafone Monthly", size: "2GB", price: 18, validity: "30 Days", type: "monthly" },
  { id: "vodafone-monthly-5gb", networkId: "vodafone", name: "Vodafone Monthly", size: "5GB", price: 40, validity: "30 Days", type: "monthly" },
  { id: "vodafone-mega-10gb", networkId: "vodafone", name: "Vodafone Mega", size: "10GB", price: 70, validity: "30 Days", type: "mega" },
  { id: "vodafone-mega-20gb", networkId: "vodafone", name: "Vodafone Mega", size: "20GB", price: 120, validity: "30 Days", type: "mega" },
  
  // AirtelTigo Plans
  { id: "airteltigo-daily-50", networkId: "airteltigo", name: "AirtelTigo Daily", size: "50MB", price: 1, validity: "1 Day", type: "daily" },
  { id: "airteltigo-daily-200", networkId: "airteltigo", name: "AirtelTigo Daily", size: "200MB", price: 2, validity: "1 Day", type: "daily" },
  { id: "airteltigo-weekly-500", networkId: "airteltigo", name: "AirtelTigo Weekly", size: "500MB", price: 5, validity: "7 Days", type: "weekly" },
  { id: "airteltigo-weekly-1.5gb", networkId: "airteltigo", name: "AirtelTigo Weekly", size: "1.5GB", price: 10, validity: "7 Days", type: "weekly" },
  { id: "airteltigo-monthly-3gb", networkId: "airteltigo", name: "AirtelTigo Monthly", size: "3GB", price: 25, validity: "30 Days", type: "monthly" },
  { id: "airteltigo-monthly-5gb", networkId: "airteltigo", name: "AirtelTigo Monthly", size: "5GB", price: 40, validity: "30 Days", type: "monthly" },
  { id: "airteltigo-mega-10gb", networkId: "airteltigo", name: "AirtelTigo Mega", size: "10GB", price: 65, validity: "30 Days", type: "mega" },
  { id: "airteltigo-mega-20gb", networkId: "airteltigo", name: "AirtelTigo Mega", size: "20GB", price: 110, validity: "30 Days", type: "mega" },
]

export function detectNetwork(phone: string): Network | null {
  const cleaned = phone.replace(/\D/g, "")
  const prefix = cleaned.length >= 3 ? cleaned.substring(0, 3) : null
  
  if (!prefix) return null
  
  for (const network of networks) {
    if (network.prefixes.includes(prefix)) {
      return network
    }
  }
  
  return null
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
