//client\src\constants\routes.js
export const ROUTES = {
  HOME:         '/',
  // PRAYERS:      '/prayers',
  // ANNOUNCEMENTS:'/announcements',
  CONTACT:      '/contact',
  ADMIN:        '/admin',
  LOGIN:        '/login',
  REGISTER:     '/register',
  HEBCAL:       '/hebcal',
  PAYMENTS:     '/payments',   
  COMMEMORATIONS: '/commemorations',
  GALLERY: '/gallery',
  PORTAL:          '/portal',
  PORTAL_CATEGORY: '/portal/:categoryId',
  PORTAL_ITEM:     '/portal/item/:itemId',
};

export const NAVIGATION_ITEMS = [
  { path: ROUTES.HOME,          label: 'דף הבית' },
  { path: ROUTES.GALLERY, label: 'הודעות' },

  // { path: ROUTES.PRAYERS,       label: 'תפילות' },
  // { path: ROUTES.ANNOUNCEMENTS, label: 'הודעות' },
  { path: ROUTES.CONTACT,       label: 'צור קשר' },
  { path: ROUTES.PAYMENTS,      label: 'תשלומים' },
  { path: ROUTES.PORTAL,        label: ' הקדשות' }, // ← זה הלינק למערכת החדשה
  { path: ROUTES.COMMEMORATIONS, label: 'הנצחות' }, // ← חדש
];