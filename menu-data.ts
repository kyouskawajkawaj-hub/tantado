export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  hasReminder?: boolean;
  reminderText?: string;
}

export interface ComboChoice {
  id: string;
  name: string;
}

export const STORE_INFO = {
  name: "Pares ni Balong",
  address: "59 Don Julio Gregorio, Novaliches, Philippines, 1116",
  phone: "+63 946 720 2936",
  gcashNumber: "+63 946 720 2936",
  openTime: "14:00", // 2 PM
  closeTime: "01:00", // 1 AM
  coordinates: {
    lat: 14.7011,
    lng: 121.0437
  },
  baseFare: 20,
  perKmRate: 5,
  autoCallDistance: 0.3 // km
};

export const COMBO_CHOICES: ComboChoice[] = [
  { id: "lechon", name: "Lechon" },
  { id: "liempo", name: "Liempo" },
  { id: "bangus", name: "Bangus" },
  { id: "chicken", name: "Chicken" },
  { id: "chichabu", name: "Chichabu" },
  { id: "sisig", name: "Sisig" },
  { id: "beef-tapa", name: "Beef Tapa" },
  { id: "tocino", name: "Tocino" },
  { id: "longganisa", name: "Longganisa" },
  { id: "lumpiang-isda", name: "Lumpiang Isda" }
];

export const MENU_ITEMS: MenuItem[] = [
  // PARES KANTO STYLE
  { id: "pares-no-rice", name: "Pares Without Rice", price: 75, category: "Pares Kanto Style" },
  { id: "pares-w-rice", name: "Pares W/Rice", price: 85, category: "Pares Kanto Style" },
  { id: "pares-w-tumbong", name: "Pares W/Tumbong", price: 130, category: "Pares Kanto Style" },
  { id: "pares-w-bagnet", name: "Pares W/Bagnet", price: 130, category: "Pares Kanto Style" },
  { id: "pares-w-chichabu", name: "Pares W/Chichabu", price: 130, category: "Pares Kanto Style" },
  { id: "regular-pares-overload", name: "Regular Pares Overload", price: 130, category: "Pares Kanto Style" },
  { id: "lechon-pares-overload", name: "Lechon Pares Overload", price: 189, category: "Pares Kanto Style" },
  { id: "beef-mami-w-rice", name: "Beef Mami With Rice", price: 60, category: "Pares Kanto Style" },
  { id: "beef-mami-no-rice", name: "Beef Mami Without Rice", price: 50, category: "Pares Kanto Style" },
  { id: "beef-mami-w-bagnet", name: "Beef Mami W/Bagnet", price: 130, category: "Pares Kanto Style" },
  { id: "beef-mami-w-chichabu", name: "Beef Mami W/Chichabu", price: 130, category: "Pares Kanto Style" },
  { id: "beef-mami-overload", name: "Beef Mami Overload", price: 199, category: "Pares Kanto Style" },

  // PARES RETIRO STYLE
  { id: "retiro-pares-w-rice", name: "Pares W/Rice (Retiro)", price: 95, category: "Pares Retiro Style" },
  { id: "retiro-pares-w-bagnet", name: "Pares W/Bagnet (Retiro)", price: 150, category: "Pares Retiro Style" },
  { id: "retiro-pares-w-chichabu", name: "Pares W/Chichabu (Retiro)", price: 150, category: "Pares Retiro Style" },
  { id: "retiro-pares-overload", name: "Pares Overload (Retiro)", price: 199, category: "Pares Retiro Style", description: "Beef, Chichabu & Bagnet" },

  // COMBO MEALS - Will be handled separately with A/B selection
  { id: "combo-meal", name: "Combo Meal (2 Ulam of Your Choice)", price: 199, category: "Combo Meals" },

  // HOMEMADE SILOG MEALS
  { id: "lechon-silog", name: "Lechon Silog", price: 129, category: "Homemade Silog Meals" },
  { id: "liempo-silog", name: "Liempo Silog", price: 129, category: "Homemade Silog Meals" },
  { id: "chichabu-silog", name: "Chichabu Silog", price: 129, category: "Homemade Silog Meals" },
  { id: "bangus-silog", name: "Bangus Silog", price: 129, category: "Homemade Silog Meals" },
  { id: "chicken-silog", name: "Chicken Silog", price: 129, category: "Homemade Silog Meals", hasReminder: true, reminderText: "Reminder: Chicken takes 12-15 minutes to cook. Please wait patiently for your order." },
  { id: "sisig-silog", name: "Sisig Silog", price: 129, category: "Homemade Silog Meals" },
  { id: "lumpiang-isda-silog", name: "Lumpiang Isda Silog", price: 129, category: "Homemade Silog Meals" },
  { id: "beef-tapa-silog", name: "Beef Tapa Silog", price: 129, category: "Homemade Silog Meals" },
  { id: "tocino-silog", name: "Tocino Silog", price: 129, category: "Homemade Silog Meals" },
  { id: "longganisa-silog", name: "Longganisa Silog", price: 129, category: "Homemade Silog Meals" },

  // BUDBOD MEALS
  { id: "budbod-regular", name: "Budbod Regular", price: 129, category: "Budbod Meals" },
  { id: "budbod-tapa", name: "Budbod Tapa", price: 199, category: "Budbod Meals" },
  { id: "budbod-tocino", name: "Budbod Tocino", price: 199, category: "Budbod Meals" },
  { id: "budbod-longganisa", name: "Budbod Longganisa", price: 199, category: "Budbod Meals" },
  { id: "budbod-lumpiang-isda", name: "Budbod Lumpiang Isda", price: 199, category: "Budbod Meals" },

  // ULAM/PULUTAN/ALA CARTÉ
  { id: "kare-kare-bagnet", name: "Kare-Kare Bagnet", price: 170, category: "Ulam/Pulutan/Ala Carté" },
  { id: "kare-kare-chichabu", name: "Kare-Kare Chichabu", price: 170, category: "Ulam/Pulutan/Ala Carté" },
  { id: "dinakdakan", name: "Dinakdakan", price: 170, category: "Ulam/Pulutan/Ala Carté" },
  { id: "sisig-ala-carte", name: "Sisig", price: 180, category: "Ulam/Pulutan/Ala Carté" },
  { id: "lumpiang-isda-ala-carte", name: "Lumpiang Isda", price: 160, category: "Ulam/Pulutan/Ala Carté" },
  { id: "chicharon-bulaklak", name: "Chicharon Bulaklak", price: 170, category: "Ulam/Pulutan/Ala Carté" },
  { id: "lechon-kawali", name: "Lechon Kawali", price: 170, category: "Ulam/Pulutan/Ala Carté" },

  // ADD-ONS
  { id: "garlic-rice", name: "Garlic Rice", price: 15, category: "Add-Ons" },
  { id: "half-rice", name: "Half Rice", price: 15, category: "Add-Ons" },
  { id: "extra-bagoong", name: "Extra Bagoong", price: 15, category: "Add-Ons" },
  { id: "softdrinks", name: "Softdrinks", price: 25, category: "Add-Ons" },
  { id: "bonemarrow", name: "Bonemarrow", price: 95, category: "Add-Ons" },
  { id: "kamatis-sibuyas-bagoong", name: "Kamatis Sibuyas Bagoong", price: 25, category: "Add-Ons" },
  { id: "lechon-sauce", name: "Lechon Sauce", price: 10, category: "Add-Ons" },
  { id: "extra-egg", name: "Extra Egg", price: 20, category: "Add-Ons" },

  // FREEBIES
  { id: "chili-oil", name: "Chili Oil", price: 0, category: "Freebies", description: "FREE" },
  { id: "calamansi", name: "Calamansi", price: 0, category: "Freebies", description: "FREE" },
  { id: "ketchup", name: "Ketchup", price: 0, category: "Freebies", description: "FREE" }
];

export const MENU_CATEGORIES = [
  "Pares Kanto Style",
  "Pares Retiro Style",
  "Combo Meals",
  "Homemade Silog Meals",
  "Budbod Meals",
  "Ulam/Pulutan/Ala Carté",
  "Add-Ons",
  "Freebies"
];

export const DELIVERY_OPTIONS = {
  balong: {
    id: "balong-rider",
    name: "Balong's Rider",
    description: "Our own delivery service",
    baseFare: STORE_INFO.baseFare,
    perKmRate: STORE_INFO.perKmRate
  },
  lalamove: {
    id: "lalamove",
    name: "Lalamove",
    description: "Book via Lalamove app",
    appLink: "lalamove://",
    playStoreLink: "https://play.google.com/store/apps/details?id=hk.easyvan.app.client"
  },
  moveIt: {
    id: "move-it",
    name: "Move It",
    description: "Book via Move It app",
    appLink: "moveit://",
    playStoreLink: "https://play.google.com/store/apps/details?id=com.moveit.app.customer"
  },
  pickup: {
    id: "pickup",
    name: "Self Pickup",
    description: "Pick up at our store"
  }
};

export const GCASH_APP = {
  appLink: "gcash://",
  playStoreLink: "https://play.google.com/store/apps/details?id=com.globe.gcash.android"
};
