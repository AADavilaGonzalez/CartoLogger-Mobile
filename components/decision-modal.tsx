
import { View, StyleSheet } from "react-native";
import { Portal, Modal, Text, Button } from "react-native-paper";

type MapModalProps = {
  heading: string,
  onAccept: () => void,
  onCancel: () => void,
  visible: boolean,
}

export function DecisionModal({ heading, onAccept, onCancel, visible}: MapModalProps) {

  return (
    <Portal>
      <Modal visible={visible} dismissable={false}>
        <Text variant="headlineMedium">{heading}</Text>
        <View style={styles.buttons}>
          <Button onPress={onAccept}>Aceptar</Button>
          <Button onPress={onCancel}>Cancelar</Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  buttons: {
    justifyContent: "center",
  }
})
