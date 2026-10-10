import { useEffect, useState } from "react";
import { Modal, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { askBuddy, declinedAt, openChangesIn } from "@/client/ask-buddy";
import { BuddyKnows } from "@/components/buddy-knows";
import { type Adding, DayMap } from "@/components/day-map";
import { Onboarding } from "@/components/onboarding";
import type { FoodMoment } from "@/shared/food-moment";
import type { FoodProfile } from "@/shared/offer";
import { Users } from "@/components/users";
import {
  type SavedState,
  type Store,
  activeUser,
  forgetAnswer,
  loadStore,
  mergeProfile,
  newUser,
  saveStore,
} from "@/storage/saved-state";

// Home screen. It owns everything the app remembers: it loads it from the
// phone when the app opens, hands the person using the app to the screen
// that is showing, and stores everything again after every change.
export default function FoodDay() {
  // null: still reading from the phone.
  const [store, setStore] = useState<Store | null>(null);
  // The quiz, opened again from the day map.
  const [quizOpen, setQuizOpen] = useState(false);
  // "What Buddy knows", opened from the card on the day map.
  const [knownOpen, setKnownOpen] = useState(false);
  // The people on this phone, opened from the top of the day map.
  const [usersOpen, setUsersOpen] = useState(false);
  // The "add a food moment" form. It lives here, because two places open
  // it: the button on the map and the last step of the quiz.
  const [adding, setAdding] = useState<Adding | null>(null);

  // Runs once, when the screen appears. Reading from the phone takes a
  // moment, so the result arrives later and is put into the state then.
  useEffect(() => {
    loadStore().then(setStore);
  }, []);

  // Runs after every change: write everything to the phone.
  useEffect(() => {
    if (store !== null) saveStore(store);
  }, [store]);

  if (store === null) return null;
  // `state` is the person using the app right now.
  const state = activeUser(store);
  const { userId, about, buddy, moments } = state;
  const userCount = store.users.length;

  // Changes this person's data. It is tied to their id, not to "whoever is
  // active": an answer from Buddy can arrive after a switch to someone
  // else, and it still has to land with the person who asked.
  function change(update: (current: SavedState) => SavedState) {
    setStore((current) =>
      current === null
        ? current
        : { ...current, users: current.users.map((each) => (each.userId === userId ? update(each) : each)) },
    );
  }

  function markQuizSeen(id: string) {
    change((current) =>
      current.seenQuizIds.includes(id) ? current : { ...current, seenQuizIds: [...current.seenQuizIds, id] },
    );
  }

  // The person told Buddy something: it adds to what Buddy already knows.
  function tell(told: FoodProfile) {
    change((current) => ({ ...current, about: mergeProfile(current.about, told) }));
  }

  // The person took one answer back.
  function forget(question: string) {
    change((current) =>
      current.about === null ? current : { ...current, about: forgetAnswer(current.about, question) },
    );
  }

  // Becoming someone else on this phone. Only who is active changes; the
  // person who was active keeps everything and can be picked again.
  function switchTo(id: string) {
    setUsersOpen(false);
    setAdding(null);
    setStore((current) => (current === null ? current : { ...current, activeId: id }));
  }

  // A new person: added next to the others and made active. They have not
  // seen the introduction, so that is what shows next.
  function addUser() {
    const added = newUser(`User ${userCount + 1}`);
    setUsersOpen(false);
    setAdding(null);
    setStore((current) =>
      current === null ? current : { activeId: added.userId, users: [...current.users, added] },
    );
  }

  if (!state.introDone) {
    return (
      // key: for a new person every screen starts from its beginning.
      <Onboarding
        key={userId}
        mode="first"
        seenQuizIds={state.seenQuizIds}
        onQuizSeen={markQuizSeen}
        about={about}
        freeMoments={[]}
        openChanges={0}
        onTell={tell}
        // The introduction ends in adding the first moment.
        onIdea={() => {
          setAdding({ reason: "idea", focus: null });
          change((current) => ({ ...current, introDone: true }));
        }}
        onClose={() => change((current) => ({ ...current, introDone: true }))}
      />
    );
  }

  // After the quiz, the person asked for an idea: at a new moment (the form
  // opens) or at one that is already on the map (Buddy starts thinking there).
  function ideaAt(where: FoodMoment | "new", focus: string | null) {
    setQuizOpen(false);
    if (where === "new") {
      setAdding({ reason: "idea", focus });
      return;
    }
    askBuddy(change, { userId, about, moment: where, declined: declinedAt(buddy[where.id]), focus });
  }

  // Moments where Buddy could suggest something now: no plan there yet, and
  // Buddy is not already thinking about one.
  const freeMoments = moments.filter((moment) => {
    const status = buddy[moment.id]?.status;
    return status !== "accepted" && status !== "thinking";
  });

  return (
    <>
      <DayMap
        key={userId}
        state={state}
        change={change}
        adding={adding}
        setAdding={setAdding}
        onTakeQuiz={() => setQuizOpen(true)}
        onShowKnown={() => setKnownOpen(true)}
        onChangeUser={() => setUsersOpen(true)}
      />

      {/* The quiz opens over the map, like the "add a food moment" form:
          Android's back gesture closes it, and each opening starts fresh. */}
      <Modal visible={quizOpen} animationType="slide" onRequestClose={() => setQuizOpen(false)}>
        <SafeAreaView style={styles.modal}>
          <Onboarding
            mode="again"
            seenQuizIds={state.seenQuizIds}
            onQuizSeen={markQuizSeen}
            about={about}
            freeMoments={freeMoments}
            openChanges={openChangesIn(buddy)}
            onTell={tell}
            onIdea={ideaAt}
            onClose={() => setQuizOpen(false)}
          />
        </SafeAreaView>
      </Modal>

      <Modal visible={knownOpen} animationType="slide" onRequestClose={() => setKnownOpen(false)}>
        <SafeAreaView style={styles.modal}>
          {/* The card opens this only once Buddy knows something. */}
          {about !== null && (
            <BuddyKnows about={about} onTell={tell} onForget={forget} onClose={() => setKnownOpen(false)} />
          )}
        </SafeAreaView>
      </Modal>

      <Modal visible={usersOpen} animationType="slide" onRequestClose={() => setUsersOpen(false)}>
        <SafeAreaView style={styles.modal}>
          <Users
            users={store.users}
            activeId={store.activeId}
            onRename={(name) => change((current) => ({ ...current, name }))}
            onSwitch={switchTo}
            onAdd={addUser}
            onClose={() => setUsersOpen(false)}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, backgroundColor: "#FFFFFF" },
});
