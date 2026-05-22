
import { View } from "react-native";
import { Portal, Modal, Text, Button, useTheme } from "react-native-paper";
import { styles } from "@/styles/decision-modal.styles";

type MapModalProps = {
  heading: string,
  onAccept: () => void,
  onCancel: () => void,
  visible: boolean,
}

export function DecisionModal({ heading, onAccept, onCancel, visible }: MapModalProps) {
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
