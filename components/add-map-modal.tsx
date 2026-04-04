import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Portal, Modal, Text, TextInput, Button } from "react-native-paper";

import { CreateMapDTO } from "@/storage/types"

type AddMapModalProps = {
  onAccept: (newMap: CreateMapDTO) => void,
  onCancel: () => void,
  visible: boolean,
}

export function AddMapModal({ onAccept, onCancel, visible}: AddMapModalProps) {

  const [title, setTitle] = useState("");

  const reset = () => {
    setTitle("");
  }

  const accept = () => {
    const map = {
      title,
    }
    onAccept(map)
    reset();
  };

  const cancel = () => {
    onCancel();
    reset();
  };

  return (
    <Portal>
      <Modal visible={visible} dismissable={false}>
        <Text variant="headlineMedium">Agregar Mapa</Text>
        <TextInput
          label="Titulo"
          value={title}
          onChangeText={text => setTitle(text)}
        />
        <View>
          <Button onPress={accept}>Agregar</Button>
          <Button onPress={cancel}>Cancelar</Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  buttons: {
    flex: 1,
    justifyContent: "space-around",
  }
})
