import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  listItem: {
    borderBottomWidth: 1,
    paddingVertical: 4,
  },
  listThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
    alignSelf: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },
});
