import { Stack } from 'expo-router';
import LogsScreen from '../src/screens/LogsScreen';

export default function LogsRoute() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <LogsScreen />
        </>
    );
}