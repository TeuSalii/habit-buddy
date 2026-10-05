import { Stack } from "expo-router";

// A Stack is the navigator: each screen is pushed on top of the previous one,
// and Android's back gesture pops it off again.
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "My food day" }} />
      <Stack.Screen name="describe" options={{ title: "New habit" }} />
      <Stack.Screen name="suggestions" options={{ title: "Tiny habits" }} />
      <Stack.Screen name="lab" options={{ title: "Developer lab" }} />
    </Stack>
  );
}
