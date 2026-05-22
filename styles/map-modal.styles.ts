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
  formContainer: {
    width: "100%",
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
    width: "100%",
  },
  button: {
    minWidth: 100,
  },
});
