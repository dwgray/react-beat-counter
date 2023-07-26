import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import {
  Button,
  Card,
  SegmentedButtons,
  PaperProvider,
  Appbar,
} from "react-native-paper";

export default function App() {
  const [meter, setMeter] = useState("4");
  const [method, setMethod] = useState("1");

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
        <Button
          mode="contained"
          onPress={() => console.log("Pressed")}
          style={styles.button}
        >
          <Text style={{ fontSize: 20, alignSelf: "baseline" }}>
            Click on each 4/4 measure
          </Text>
        </Button>
        <View style={styles.card}>
          <Text style={styles.cardText}>25 MPM</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardText}>100 BPM</Text>
        </View>
        <View style={{ flex: 1 }}></View>
        <View style={{ flex: 1 }}>
          <SegmentedButtons
            value={meter}
            onValueChange={setMeter}
            style={styles.option}
            buttons={[
              { value: "1", label: "Beat" },
              { value: "2", label: "2/4" },
              { value: "3", label: "3/4" },
              { value: "4", label: "4/4" },
            ]}
          />
        </View>
        <View style={{ flex: 1 }}>
          <SegmentedButtons
            value={method}
            onValueChange={setMethod}
            style={styles.option}
            buttons={[
              { value: "0", label: "Beat" },
              { value: "1", label: "Measure" },
            ]}
          />
        </View>
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
