import { useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import {
  Button,
  SegmentedButtons,
  PaperProvider,
  Appbar,
} from "react-native-paper";

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

export default function App() {
  const [meter, setMeter] = useState(Meter.Common);
  const [method, setMethod] = useState(CountMethod.Measure);
  const [clickState, setClickState] = useState(ClickState.Initial);
  const [lastClick, setLastClick] = useState(0);
  const [intervals, setIntervals] = useState([] as number[]);
  const [timeoutId, setTimeoutId] = useState(null as number | null);
  // I'm using a ref so that I can access current state in the timeout callback
  //  It appears the alternative would be to create a count reference object
  //  and change all calls to setClickState to an update function that changes the internal
  //  state of my count object - this might be cleaner in some sense, but requires more
  //  code.  https://stackoverflow.com/a/62453660/2197085
  const stateRef = useRef(ClickState.Initial);

  const maxWait = 5000;

  const avg = intervals.reduce((p, a) => p + a, 0) / intervals.length;
  const cpm = intervals.length === 0 ? 0 : (60 * 1000) / avg;
  const bpm = method === CountMethod.Beat ? cpm : cpm * meter;
  const mpm = method === CountMethod.Measure ? cpm : cpm / meter;
  const initialLabel =
    method === CountMethod.Beat
      ? "Click on each beat"
      : `Click each ${meter}/4 measure`;
  const clickLabel =
    clickState === ClickState.FirstClick || clickState === ClickState.Counting
      ? "Again"
      : initialLabel;
  stateRef.current = clickState;
  console.log(`Enter- state = ${clickState}`);

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

    function onTimeout(): void {
      switch (stateRef.current) {
        case ClickState.Initial:
        case ClickState.FirstClick:
          console.log("Timeout: Current");
          setClickState(ClickState.Initial);
          setIntervals([]);
          setLastClick(0);
          break;
        case ClickState.Counting:
        case ClickState.Done:
          setClickState(ClickState.Done);
          console.log("Timeout: Counting");
          break;
      }
    }
  }

  function updateMeter(value: Meter): void {
    if (method === CountMethod.Measure) {
      convertIntervals(meter, value);
    }
    setMeter(value);
  }

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

  function convertIntervals(oldMeter: Meter, newMeter: Meter): void {
    setIntervals(intervals.map((x) => Math.round(x / oldMeter) * newMeter));
  }

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
        <Button mode="contained" onPress={onClick} style={styles.button}>
          <Text style={{ fontSize: 20, alignSelf: "baseline" }}>
            {clickLabel}
          </Text>
        </Button>
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
    justifyContent: "center",
    fontSize: 25,
    compact: true,
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
