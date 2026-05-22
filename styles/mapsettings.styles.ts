import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 8,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
  },
  saveBtn: {
    marginTop: 4,
    borderRadius: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  rowLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowLabel: {
    fontSize: 15,
  },
  divider: {
    marginVertical: 4,
  },
  actionBtn: {
    marginVertical: 6,
    borderRadius: 8,
  },
});
