import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// The AI's presence: a few soft, translucent orbs that drift around one
// shared center and breathe together. Its mood changes only three numbers
// (speed, drift, breath); the shapes stay the same, so it reads as one being.

export type Mood = "idle" | "listening" | "thinking" | "speaking";

type Motion = { speed: number; drift: number; breath: number };

const MOTION: Record<Mood, Motion> = {
  idle: { speed: 1.1, drift: 3, breath: 0.05 }, // slow breathing, ~6s per breath
  listening: { speed: 1.5, drift: 6, breath: 0.06 }, // a little more awake while you type
  thinking: { speed: 3.2, drift: 16, breath: 0.1 }, // swirling while it works
  speaking: { speed: 2.2, drift: 10, breath: 0.16 }, // one bloom when the answer arrives
};

// Reduced motion (Android accessibility setting): breathing only, no drifting.
const REDUCED: Motion = { speed: 1.1, drift: 0, breath: 0.04 };

const MOOD_LABEL: Record<Mood, string> = {
  idle: "Buddy is waiting",
  listening: "Buddy is listening",
  thinking: "Buddy is thinking",
  speaking: "Buddy has answered",
};

type Layer = { size: number; color: string; rate: number; offset: number };

const LAYERS: Layer[] = [
  { size: 132, color: "#1F6F5C33", rate: 0.7, offset: 0 },
  { size: 104, color: "#6BB39A55", rate: 1.0, offset: 2.1 },
  { size: 84, color: "#F2C57C55", rate: 1.3, offset: 4.2 },
  { size: 56, color: "#A7D8C988", rate: 1.7, offset: 1.0 },
];

const TRANSITION_MS = 800;

export function Essence({ mood }: { mood: Mood }) {
  const reducedMotion = useReducedMotion();
  const target = reducedMotion ? REDUCED : MOTION[mood];

  const speed = useSharedValue(target.speed);
  const drift = useSharedValue(target.drift);
  const breath = useSharedValue(target.breath);

  // phase = how far along the motion is. We add to it every frame instead of
  // using the clock directly, so a speed change never makes the orbs jump.
  const phase = useSharedValue(0);
  useFrameCallback((frame) => {
    const seconds = (frame.timeSincePreviousFrame ?? 16) / 1000;
    phase.value += seconds * speed.value;
  });

  // Mood change: ease the three numbers toward the new mood.
  useEffect(() => {
    speed.value = withTiming(target.speed, { duration: TRANSITION_MS });
    drift.value = withTiming(target.drift, { duration: TRANSITION_MS });
    breath.value = withTiming(target.breath, { duration: TRANSITION_MS });
  }, [target, speed, drift, breath]);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={MOOD_LABEL[mood]}
      accessibilityLiveRegion="polite"
    >
      {LAYERS.map((layer) => (
        <Orb key={layer.offset} layer={layer} phase={phase} drift={drift} breath={breath} />
      ))}
    </View>
  );
}

function Orb({
  layer,
  phase,
  drift,
  breath,
}: {
  layer: Layer;
  phase: SharedValue<number>;
  drift: SharedValue<number>;
  breath: SharedValue<number>;
}) {
  const motion = useAnimatedStyle(() => {
    // Each orb circles at its own rate and offset (drift)...
    const own = phase.value * layer.rate + layer.offset;
    // ...but all share one breath, so the whole essence inhales together.
    const shared = phase.value;
    return {
      transform: [
        { translateX: Math.sin(own) * drift.value },
        { translateY: Math.cos(own * 0.8) * drift.value },
        { scale: 1 + Math.sin(shared) * breath.value },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.orb,
        { width: layer.size, height: layer.size, borderRadius: layer.size / 2, backgroundColor: layer.color },
        motion,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: { height: 180, alignItems: "center", justifyContent: "center" },
  orb: { position: "absolute" },
});
