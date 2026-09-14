import React from 'react';
import { StatusBar } from 'react-native';
import { AppProviders } from './providers/AppProviders';
import { RootNavigator } from './navigation/RootNavigator';

export default function App() {
  return (
    <AppProviders>
      <StatusBar barStyle="light-content" />
      <RootNavigator />
    </AppProviders>
  );
}
