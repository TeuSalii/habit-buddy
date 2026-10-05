import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

// A few horizontal bars to compare amounts. Every bar carries its own label
// and number, so nothing has to be looked up on an axis, and the meaning
// never depends on telling two colors apart.

export type Bar = {
  label: string;
  value: number; // decides the length
  text: string; // the number as the person reads it, e.g. "about 80 kg"
  strong?: boolean; // the one bar that is the point; the others are context
};

export function Bars({ bars }: { bars: Bar[] }) {
  // The longest bar fills the width; the others are measured against it.
  const longest = Math.max(...bars.map((bar) => bar.value));
  return (
    <View style={styles.bars}>
      {bars.map((bar) => (
        <BarRow key={bar.label} bar={bar} share={bar.value / longest} />
      ))}
    </View>
  );
}

function BarRow({ bar, share }: { bar: Bar; share: number }) {
  // The bar grows from nothing to its length once, when it appears.
  const grown = useSharedValue(0);
  useEffect(() => {
    grown.value = withTiming(1, { duration: 700 });
  }, [grown]);
  const length = useAnimatedStyle(() => ({ width: `${grown.value * share * 100}%` }));

  return (
    // For a screen reader the row is one sentence: "In reality: about 80 kg".
    <View accessible accessibilityLabel={`${bar.label}: ${bar.text}`} style={styles.row}>
      <View style={styles.caption}>
        <Text style={styles.label}>{bar.label}</Text>
        <Text style={[styles.value, bar.strong && styles.valueStrong]}>{bar.text}</Text>
      </View>
      <Animated.View style={[styles.bar, bar.strong && styles.barStrong, length]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bars: { gap: 16 },
  row: { gap: 6 },
  caption: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  // The words stay in text colors; only the bar itself is colored.
  label: { fontSize: 14, opacity: 0.7 },
  value: { fontSize: 16 },
  valueStrong: { fontWeight: "600" },
  // Grey for context, green for the bar that matters.
  bar: { height: 12, borderRadius: 4, backgroundColor: "#7F8986" },
  barStrong: { backgroundColor: "#1F6F5C" },
});
