import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { Routes, type HomeStackParamList } from './routes';
import { HomeScreen } from '../../screens/home/HomeScreen';
import { CategoriesScreen } from '../../screens/categories/CategoriesScreen';
import { CategoryProductsScreen } from '../../screens/categories/CategoryProductsScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.pageBg },
      }}>
      <Stack.Screen name={Routes.Home} component={HomeScreen} />
      <Stack.Screen name={Routes.CategoriesList} component={CategoriesScreen} />
      <Stack.Screen name={Routes.CategoryProducts} component={CategoryProductsScreen} />
    </Stack.Navigator>
  );
}
