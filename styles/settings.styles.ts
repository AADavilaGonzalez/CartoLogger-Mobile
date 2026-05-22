import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  container: {
    padding: 16,
    gap: 16,
    flex: 1,
  },
  settingGroup: {
    marginBottom: 16,
  },
  buttons: {
    marginTop: 8,
  },
  clearGroup: {
    marginTop: 24,
    alignItems: "center",
  },
  clearButton: {
    width: "100%",
    borderRadius: 8,
    paddingVertical: 4,
  },
});
