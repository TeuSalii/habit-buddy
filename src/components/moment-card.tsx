import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from "react-native-reanimated";

import { DAY_LABEL, KIND_ICON, KIND_LABEL, PLACE_LABEL, describeDays } from "@/components/food-moment-labels";
import { PressScale } from "@/components/press-scale";
import { DAYS, type Day, type FoodMoment } from "@/shared/food-moment";
import { MAX_DECLINED } from "@/shared/offer";
import type { TinyHabit } from "@/shared/tiny-habit";
import type { BuddyState } from "@/storage/saved-state";

// One moment on the day map, and below it where Buddy stands with it.

type Props = {
  moment: FoodMoment;
  // undefined: Buddy is holding back, because two changes are already open.
  buddy: BuddyState | undefined;
  // For the check-offs under a plan:
  week: Record<Day, string>; // the date of each weekday in the current week
  today: string;
  doneDates: string[]; // the dates on which this plan was done
  onToggleDay: (date: string) => void;

  onAccept: () => void;
  onDecline: () => void;
  onAsk: () => void; // another idea, or try again
  onRemove: () => void;
};

export function MomentCard(props: Props) {
  const { moment, buddy, onRemove } = props;
  return (
    <Animated.View
      style={styles.card}
      entering={FadeInDown.duration(300)}
      exiting={FadeOut.duration(150)}
      layout={LinearTransition}
    >
      <View style={styles.moment}>
        <Text style={styles.icon}>{KIND_ICON[moment.kind]}</Text>
        <View style={styles.momentText}>
          <Text style={styles.title}>{KIND_LABEL[moment.kind]}</Text>
          <Text style={styles.detail}>
            {PLACE_LABEL[moment.place]} · {describeDays(moment.days)}
          </Text>
        </View>
        <PressScale
          style={styles.remove}
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${KIND_LABEL[moment.kind]}`}
        >
          <Text style={styles.link}>Remove</Text>
        </PressScale>
      </View>

      {/* key: a new state is a new element, so it fades in.
          Live region: a screen reader announces Buddy's offer when it arrives. */}
      <Animated.View
        key={buddy?.status ?? "waiting"}
        entering={FadeIn.duration(300)}
        style={styles.buddy}
        accessibilityLiveRegion="polite"
      >
        <Buddy {...props} />
      </Animated.View>
    </Animated.View>
  );
}

function Buddy({ moment, buddy, week, today, doneDates, onToggleDay, onAccept, onDecline, onAsk }: Props) {
  if (buddy === undefined) {
    return (
      <Text style={styles.note}>Two changes at a time are enough. Buddy will come back to this moment.</Text>
    );
  }

  switch (buddy.status) {
    case "thinking":
      return (
        <View style={styles.thinking}>
          <ActivityIndicator color={GREEN} />
          <Text style={styles.note}>Buddy is looking at this moment</Text>
        </View>
      );

    case "offered":
      return (
        <>
          <Text style={styles.label}>Buddy's idea</Text>
          <Habit habit={buddy.habit} />
          <Text style={styles.note}>{buddy.habit.why}</Text>
          <View style={styles.actions}>
            <PressScale style={[styles.action, styles.accept]} onPress={onAccept} accessibilityRole="button">
              <Text style={styles.acceptLabel}>I'll try it</Text>
            </PressScale>
            <PressScale style={styles.action} onPress={onDecline} accessibilityRole="button">
              <Text style={styles.link}>Not for me</Text>
            </PressScale>
          </View>
        </>
      );

    case "accepted":
      return (
        <>
          <Text style={styles.label}>Your plan</Text>
          <Habit habit={buddy.habit} />
          {/* A plain record of the days it happened. No streaks and no praise:
              the point is to notice, and later to see whether the moment fits. */}
          <Text style={styles.note}>This week: tap the days you did it.</Text>
          <View style={styles.checks}>
            {DAYS.filter((day) => moment.days.includes(day)).map((day) => {
              const date = week[day];
              const done = doneDates.includes(date);
              const notYet = date > today; // a day that has not come cannot be ticked
              return (
                <PressScale
                  key={day}
                  style={[styles.check, done && styles.checkDone, notYet && styles.checkNotYet]}
                  onPress={() => onToggleDay(date)}
                  disabled={notYet}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: done, disabled: notYet }}
                  accessibilityLabel={DAY_LABEL[day]}
                >
                  <Text style={[styles.checkLabel, done && styles.checkLabelDone]}>
                    {done ? "✓ " : ""}
                    {DAY_LABEL[day]}
                  </Text>
                </PressScale>
              );
            })}
          </View>
        </>
      );

    case "declined":
      // After MAX_DECLINED ideas the server won't offer more for this moment.
      if (buddy.declined.length >= MAX_DECLINED) {
        return <Text style={styles.note}>That is all Buddy has for this moment for now.</Text>;
      }
      return (
        <>
          <Text style={styles.note}>No problem. It has to fit your day.</Text>
          <PressScale style={styles.action} onPress={onAsk} accessibilityRole="button">
            <Text style={styles.link}>Another idea</Text>
          </PressScale>
        </>
      );

    case "outOfScope":
      return <Text style={styles.message}>{buddy.message}</Text>;

    case "failed":
      return (
        <>
          <Text style={styles.note}>Buddy could not be reached.</Text>
          <PressScale style={styles.action} onPress={onAsk} accessibilityRole="button">
            <Text style={styles.link}>Try again</Text>
          </PressScale>
        </>
      );
  }
}

// The tiny habit itself: when it happens, then what the person does.
function Habit({ habit }: { habit: TinyHabit }) {
  return (
    <View>
      <Text style={styles.anchor}>{habit.anchor}</Text>
      <Text style={styles.behavior}>{habit.behavior}</Text>
    </View>
  );
}

const GREEN = "#1F6F5C";
const LINE = "#C9CFCC";

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: LINE, borderRadius: 12, backgroundColor: "#FFFFFF" },
  moment: { flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 16 },
  icon: { fontSize: 24 },
  momentText: { flex: 1, paddingVertical: 12, gap: 2 },
  title: { fontSize: 16, fontWeight: "600" },
  detail: { fontSize: 14, opacity: 0.6 },
  remove: { minHeight: 48, justifyContent: "center", paddingHorizontal: 16 },
  link: { color: GREEN, fontSize: 14, fontWeight: "600" },

  buddy: { borderTopWidth: 1, borderTopColor: LINE, padding: 16, gap: 8 },
  label: { fontSize: 12, fontWeight: "600", color: GREEN, textTransform: "uppercase", letterSpacing: 0.5 },
  anchor: { fontSize: 16, lineHeight: 22 },
  behavior: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
  note: { fontSize: 14, lineHeight: 20, opacity: 0.7, flexShrink: 1 },
  message: { fontSize: 16, lineHeight: 22 },
  thinking: { flexDirection: "row", alignItems: "center", gap: 12 },
  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
  // 48 is the smallest height Android recommends for something you tap.
  action: { minHeight: 48, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, borderRadius: 12, alignSelf: "flex-start" },
  accept: { backgroundColor: GREEN },
  acceptLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },

  checks: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  check: { minHeight: 48, minWidth: 56, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: LINE },
  checkDone: { backgroundColor: GREEN, borderColor: GREEN },
  checkNotYet: { opacity: 0.4 },
  checkLabel: { fontSize: 14, fontWeight: "600" },
  checkLabelDone: { color: "#FFFFFF" },
});
