import { useEffect, useState } from "react";
import { Modal, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DayMap } from "@/components/day-map";
import { Onboarding } from "@/components/onboarding";
import { type SavedState, loadState, mergeProfile, saveState } from "@/storage/saved-state";

// Home screen. It owns everything the app remembers: it loads it from the
// phone when the app opens, hands it to the screen that is showing, and
// stores it again after every change.
export default function FoodDay() {
  // null: still reading from the phone.
  const [state, setState] = useState<SavedState | null>(null);
  // The quiz, opened again from the day map.
  const [quizOpen, setQuizOpen] = useState(false);
  // Finishing the introduction leads straight into adding the first moment.
  const [startAdding, setStartAdding] = useState(false);

  // Runs once, when the screen appears. Reading from the phone takes a
  // moment, so the result arrives later and is put into the state then.
  useEffect(() => {
    loadState().then(setState);
  }, []);

  // Runs after every change of the state: write it to the phone.
  useEffect(() => {
    if (state !== null) saveState(state);
  }, [state]);

  if (state === null) return null;

  function change(update: (current: SavedState) => SavedState) {
    setState((current) => (current === null ? current : update(current)));
  }

  function markQuizSeen(id: string) {
    change((current) =>
      current.seenQuizIds.includes(id) ? current : { ...current, seenQuizIds: [...current.seenQuizIds, id] },
    );
  }

  if (!state.introDone) {
    return (
      <Onboarding
        mode="first"
        seenQuizIds={state.seenQuizIds}
        onQuizSeen={markQuizSeen}
        onFinish={(about) => {
          setStartAdding(true);
          change((current) => ({ ...current, introDone: true, about }));
        }}
        onClose={() => change((current) => ({ ...current, introDone: true }))}
      />
    );
  }

  return (
    <>
      <DayMap state={state} change={change} startAdding={startAdding} onTakeQuiz={() => setQuizOpen(true)} />

      {/* The quiz opens over the map, like the "add a food moment" form:
          Android's back gesture closes it, and each opening starts fresh. */}
      <Modal visible={quizOpen} animationType="slide" onRequestClose={() => setQuizOpen(false)}>
        <SafeAreaView style={styles.modal}>
          <Onboarding
            mode="again"
            seenQuizIds={state.seenQuizIds}
            onQuizSeen={markQuizSeen}
            onFinish={(about) => {
              // The new answers add to what Buddy already knows.
              change((current) => ({ ...current, about: mergeProfile(current.about, about) }));
              setQuizOpen(false);
            }}
            onClose={() => setQuizOpen(false)}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, backgroundColor: "#FFFFFF" },
});
