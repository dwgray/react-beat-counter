import { useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SegmentedButtons,
  PaperProvider,
  Appbar,
  useTheme,
} from "react-native-paper";
import { deepPurple100 } from "react-native-paper/lib/typescript/styles/themes/v2/colors";

enum Meter {
  Beat = 1,
  Double,
  Waltz,
  Common,
}

enum CountMethod {
  Beat,
  Measure,
}

/// The states for the core state machine
///  - Initial = no data (initial state or timer reset without getting past firstClick state)
///  - FirstClick = the user has clicked once after inital/done state
///  - Counting = second - infinite continuous clicking without ever pausing for _maxTime
///  - Done = user has paused for _maxtime after clicking at least twice
enum ClickState {
  Initial,
  FirstClick,
  Counting,
  Done,
}

const CounterButton = ({
  onPress,
  title,
}: {
  onPress: (e: GestureResponderEvent) => void;
  title: string;
}) => (
  <TouchableOpacity onPress={onPress} style={styles.button}>
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

/// I'm managing state and handling "business logic" such as is deirectly in my App component - this won't scale beyond
/// a fairly simple application, but seems like a reasonably clean solution for this very small application

export default function App() {
  // beat (no meter), 2/4 (double), 3/4 (waltz) or 4/4 (common).  Note that the only place that
  //  setMeter should be called is in updateMeter, so that the internal state is kept consistent.
  //  I did not see a way in React to wrap a private setMeter functionwith my additional logic
  //  useReducer looked promising, but doesn't appears to be designed for a different purpose (dispatch model)
  const [meter, setMeter] = useState(Meter.Common);
  // Does the user want to count by beats of by measures.  As with setMeter, setMehod should only
  //  be called within updateMethod.
  const [method, setMethod] = useState(CountMethod.Measure);
  // A simple state machine to track whether the user has started counting, etc. this is used to manage
  //   the rest of the internal state and helps when compute the title of the click button
  const [clickState, setClickState] = useState(ClickState.Initial);
  // The epoch timestamp of the most recent click (or 0 if in initial/done state)
  const [lastClick, setLastClick] = useState(0);
  // The last 10 intervals between click s in ticks (which may be rescaled based on meter/method)
  const [intervals, setIntervals] = useState([] as number[]);
  // The id used to clear the timeout handler
  const [timeoutId, setTimeoutId] = useState(null as number | null);
  // I'm using a ref so that I can access current state in the timeout callback
  //  It appears the alternative would be to create a count reference object
  //  and change all calls to setClickState to an update function that changes the internal
  //  state of my count object - this might be cleaner in some sense, but requires more
  //  code.  https://stackoverflow.com/a/62453660/2197085
  const stateRef = useRef(ClickState.Initial);

  const maxWait = 5000;

  const avg = intervals.reduce((p, a) => p + a, 0) / intervals.length;
  // Clicks per minute - computed from the last ten intevals between clicks
  const cpm = intervals.length === 0 ? 0 : (60 * 1000) / avg;
  // Beats per minute calculated from clicks per minute and meter
  const bpm = method === CountMethod.Beat ? cpm : cpm * meter;
  //  Measures per minute calculated from clicks per minute and meter
  const mpm = method === CountMethod.Measure ? cpm : cpm / meter;
  const initialLabel =
    method === CountMethod.Beat
      ? "Click on each beat"
      : `Click on downbeat of ${meter}/4 measure`;
  const clickLabel =
    clickState === ClickState.FirstClick || clickState === ClickState.Counting
      ? "Again"
      : initialLabel;

  // Keep our "outside of react" reference current so the timer callback has access to it
  stateRef.current = clickState;

  /// Handle the click event on the counting button - this updates the click state to manage
  /// the core internal state machine an resets the timeout
  function onClick(): void {
    const now = Date.now();
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }

    switch (clickState) {
      case ClickState.Initial:
      case ClickState.Done:
        setIntervals([]);
        setLastClick(now);
        setClickState(ClickState.Counting);
        break;
      case ClickState.FirstClick:
      case ClickState.Counting:
        setClickState(ClickState.Counting);
        const delta = now - lastClick;
        setLastClick(now);
        setIntervals(
          intervals.length >= 10
            ? [...intervals.slice(1), delta]
            : [...intervals, delta]
        );
        break;
    }
    setTimeoutId(window.setTimeout(onTimeout, maxWait));

    // Timeout handler that sets the state to done or initial once the user has stopped clicking
    // for _maxWait milliseconds.  Note that I have to use stateRef, which is a wrapper around
    // clickState rather than using clickState directly since the closure in this function preserves
    // the initial valud of clickState
    function onTimeout(): void {
      switch (stateRef.current) {
        case ClickState.Initial:
        case ClickState.FirstClick:
          setClickState(ClickState.Initial);
          setIntervals([]);
          setLastClick(0);
          break;
        case ClickState.Counting:
        case ClickState.Done:
          setClickState(ClickState.Done);
          break;
      }
    }
  }

  // Update the meter and recalculate the intervals if necessary to keep BPMs consistent
  function updateMeter(value: Meter): void {
    if (method === CountMethod.Measure) {
      convertIntervals(meter, value);
    }
    setMeter(value);
  }

  // Update the count method and recalculate the intervals if necessary to keep BPMs consistent
  function updateMethod(value: CountMethod): void {
    switch (value) {
      case CountMethod.Beat:
        convertIntervals(meter, Meter.Beat);
        break;
      case CountMethod.Measure:
        convertIntervals(Meter.Beat, meter);
        break;
    }
    setMethod(value);
  }

  // Convert intervals to the new meter, keeping bmp constant
  function convertIntervals(oldMeter: Meter, newMeter: Meter): void {
    setIntervals(intervals.map((x) => Math.round(x / oldMeter) * newMeter));
  }

  // The main (and currently only) View is wrapped in a PaperProvider to allow the use of the
  //  React Native Paper Library: https://reactnativepaper.com/ - I'm using this for a more
  //  versitile button and SegmentedButtons.  The button is still not quite what I want, but
  //  I'm not going to do another round at finding exactly control I want for this pass.
  return (
    <PaperProvider>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content
            title="React Native Beat Counter"
            style={{ backgroundColor: "#e8def8", padding: 5 }}
            titleStyle={{ alignSelf: "center" }}
          />
        </Appbar.Header>
        <CounterButton onPress={onClick} title={clickLabel} />
        {meter !== Meter.Beat && (
          <View style={styles.card}>
            <Text style={styles.cardText}>{mpm.toFixed(1)} MPM</Text>
          </View>
        )}
        <View style={styles.card}>
          <Text style={styles.cardText}>{bpm.toFixed(1)} BPM</Text>
        </View>
        <View style={{ flex: 1 }}></View>
        <View style={{ flex: 1 }}>
          <SegmentedButtons
            value={meter.toString()}
            onValueChange={(s: string) => updateMeter(parseInt(s))}
            style={styles.option}
            buttons={[
              { value: Meter.Beat.toString(), label: "Beat" },
              { value: Meter.Double.toString(), label: "2/4" },
              { value: Meter.Waltz.toString(), label: "3/4" },
              { value: Meter.Common.toString(), label: "4/4" },
            ]}
          />
        </View>
        {meter !== Meter.Beat && (
          <View style={{ flex: 1 }}>
            <SegmentedButtons
              value={method.toString()}
              onValueChange={(s: string) => updateMethod(parseInt(s))}
              style={styles.option}
              buttons={[
                { value: CountMethod.Beat.toString(), label: "Beat" },
                { value: CountMethod.Measure.toString(), label: "Measure" },
              ]}
            />
          </View>
        )}
        <StatusBar style="auto" />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#fff",
    alignItems: "stretch",
    justifyContent: "center",
  },
  button: {
    flex: 2,
    margin: 25,
    paddingVertical: 10,
    paddingHorizontal: 12,
    elevation: 8,
    borderRadius: 20,
    backgroundColor: "#6750A4",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 35,
    color: "white",
    textAlign: "center",
  },
  card: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e8def8",
    margin: 25,
  },
  cardText: {
    fontSize: 40,
    fontWeight: "bold",
  },
  optionContainer: {
    flex: 1,
  },
  option: {
    marginHorizontal: 25,
  },
});
