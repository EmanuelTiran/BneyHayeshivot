//client\src\constants\routes.js
export const ROUTES = {
  HOME: '/',
  // PRAYERS:      '/prayers',
  // ANNOUNCEMENTS:'/announcements',
  CONTACT: '/contact',
  ADMIN: '/admin',
  LOGIN: '/login',
  REGISTER: '/register',
  HEBCAL: '/hebcal',
  PAYMENTS: '/payments',
  COMMEMORATIONS: '/commemorations',
  GALLERY: '/gallery',
  PORTAL: '/portal',
  PORTAL_CATEGORY: '/portal/:categoryId',
  PORTAL_ITEM: '/portal/item/:itemId',
};

export const NAVIGATION_ITEMS = [
  { path: ROUTES.HOME, label: 'דף הבית' },
  { path: ROUTES.GALLERY, label: 'הודעות' },
  { path: ROUTES.PORTAL, label: 'הקדשות' },
  { path: ROUTES.COMMEMORATIONS, label: 'הנצחות' },
  { path: ROUTES.PAYMENTS, label: 'תשלומים' },
  { path: ROUTES.CONTACT, label: 'צור קשר' },
];