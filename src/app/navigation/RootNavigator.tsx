import React, { useEffect } from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { NavigationContainer } from '@react-navigation/native';

import { setUnauthorizedHandler } from '../../services/api/client';

import { useAuthStore } from '../../store/authStore';

import { LoadingView } from '../../components/ui/LoadingView';

import { LoginModal } from '../../components/auth/LoginModal';
import { Toaster } from '../../components/ui/Toaster';

import { Routes, type RootStackParamList } from './routes';

import { MainTabs } from './MainTabs';

import { ProductDetailScreen } from '../../screens/product/ProductDetailScreen';

import { CheckoutScreen } from '../../screens/checkout/CheckoutScreen';

import { OrderSuccessScreen } from '../../screens/orders/OrderSuccessScreen';

import { OrderDetailScreen } from '../../screens/orders/OrderDetailScreen';

import { OrderTrackingScreen } from '../../screens/orders/OrderTrackingScreen';

import { AddressesScreen } from '../../screens/profile/AddressesScreen';

import { ProfileSetupScreen } from '../../screens/profile/ProfileSetupScreen';

import { ConsultationScreen } from '../../screens/consultation/ConsultationScreen';

import { DoctorDetailScreen } from '../../screens/consultation/DoctorDetailScreen';

import { ContactScreen } from '../../screens/contact/ContactScreen';

import { AboutScreen } from '../../screens/static/AboutScreen';

import { colors } from '../../theme/colors';



const Stack = createNativeStackNavigator<RootStackParamList>();



export function RootNavigator() {

  const { isBootstrapping, bootstrap, signOut, openLoginModal } = useAuthStore();



  useEffect(() => {

    bootstrap();

    setUnauthorizedHandler(() => {

      signOut();

      openLoginModal({ message: 'Your session expired. Please sign in again to continue.' });

    });

  }, [bootstrap, openLoginModal, signOut]);



  if (isBootstrapping) {

    return <LoadingView />;

  }



  return (

    <>

      <NavigationContainer>

        <Stack.Navigator

          screenOptions={{

            headerShown: false,

            contentStyle: { backgroundColor: colors.pageBg },

          }}>

          <Stack.Screen name={Routes.MainTabs} component={MainTabs} />

          <Stack.Screen name={Routes.ProductDetail} component={ProductDetailScreen} />

          <Stack.Screen name={Routes.Checkout} component={CheckoutScreen} />

          <Stack.Screen name={Routes.OrderSuccess} component={OrderSuccessScreen} />

          <Stack.Screen name={Routes.OrderDetail} component={OrderDetailScreen} />

          <Stack.Screen name={Routes.OrderTracking} component={OrderTrackingScreen} />

          <Stack.Screen name={Routes.Addresses} component={AddressesScreen} />

          <Stack.Screen name={Routes.ProfileSetup} component={ProfileSetupScreen} />

          <Stack.Screen name={Routes.Consultation} component={ConsultationScreen} />

          <Stack.Screen name={Routes.DoctorDetail} component={DoctorDetailScreen} />

          <Stack.Screen name={Routes.Contact} component={ContactScreen} />

          <Stack.Screen name={Routes.About} component={AboutScreen} />

        </Stack.Navigator>

      </NavigationContainer>

      <LoginModal />
      <Toaster />

    </>

  );

}

