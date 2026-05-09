
import { View, StyleSheet } from "react-native";
import { Portal, Modal, Text, Button, useTheme } from "react-native-paper";

type MapModalProps = {
  heading: string,
  onAccept: () => void,
  onCancel: () => void,
  visible: boolean,
}

export function DecisionModal({ heading, onAccept, onCancel, visible}: MapModalProps) {
  const theme = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible} dismissable={false} contentContainerStyle={
          [styles.modalContent, { backgroundColor: theme.colors.background }]
      }>
        <Text variant="headlineMedium" style={
          [styles.heading, { color: theme.colors.onBackground }]
        }>{heading}</Text>
        <View style={styles.buttons}>
          <Button onPress={onAccept} mode="contained" style={styles.button}>Aceptar</Button>
          <Button onPress={onCancel} mode="outlined" style={styles.button}>Cancelar</Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
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
  }
})
