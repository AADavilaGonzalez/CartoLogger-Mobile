import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  modalContent: {
    margin: 20,
    borderRadius: 12,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    width: "100%",
  },
  button: {
    minWidth: 100,
  },
});
