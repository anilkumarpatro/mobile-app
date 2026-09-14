export const Routes = {
  Auth: 'Auth',
  MainTabs: 'MainTabs',
  Home: 'Home',
  Search: 'Search',
  Categories: 'Categories',
  CategoryProducts: 'CategoryProducts',
  ProductDetail: 'ProductDetail',
  Cart: 'Cart',
  Checkout: 'Checkout',
  OrderSuccess: 'OrderSuccess',
  Orders: 'Orders',
  OrderDetail: 'OrderDetail',
  OrderTracking: 'OrderTracking',
  Profile: 'Profile',
  Addresses: 'Addresses',
  ProfileSetup: 'ProfileSetup',
  Consultation: 'Consultation',
  DoctorDetail: 'DoctorDetail',
  Contact: 'Contact',
  About: 'About',
  CategoriesList: 'CategoriesList',
} as const;

export type HomeStackParamList = {
  Home: undefined;
  CategoriesList: undefined;
  CategoryProducts: { categoryId: string; categoryName: string };
};

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
  ProductDetail: { productId: string };
  CategoryProducts: { categoryId: string; categoryName: string };
  Checkout: undefined;
  OrderSuccess: { orderId: string };
  OrderDetail: { orderId: string };
  OrderTracking: { orderId: string };
  Addresses: undefined;
  ProfileSetup: undefined;
  Consultation: undefined;
  DoctorDetail: { doctorId: string };
  Contact: undefined;
  About: undefined;
  CategoriesList: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
};
