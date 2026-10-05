import type { ReactNode } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";

// A Pressable that gives way under the finger: it shrinks a little while
// pressed and springs back on release. This is the feedback that tells the
// person "the app felt that" before anything else on the screen changes.

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESSED_SCALE = 0.96;

type Props = Omit<PressableProps, "style" | "children" | "onPressIn" | "onPressOut"> & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function PressScale({ style, children, ...rest }: Props) {
  const scale = useSharedValue(1);
  const pressed = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      style={[style, pressed]}
      // Down: fast, so it feels immediate. Up: a spring, so it feels alive.
      onPressIn={() => {
        scale.value = withTiming(PRESSED_SCALE, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
