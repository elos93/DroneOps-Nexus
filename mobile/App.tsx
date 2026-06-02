import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView, StyleSheet } from 'react-native'
import { DroneOpsMobile } from './src/DroneOpsMobile'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={styles.shell}>
        <StatusBar style="light" />
        <DroneOpsMobile />
      </SafeAreaView>
    </QueryClientProvider>
  )
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#061122',
  },
})
