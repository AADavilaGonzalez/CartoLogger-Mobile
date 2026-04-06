import { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Portal, Modal, Text, TextInput, Button } from "react-native-paper";

import { CreateMapDTO } from "@/storage/types"

type MapModalProps = {
  heading: string,
  onOpen?: () => CreateMapDTO,
  onAccept: (map: CreateMapDTO) => void,
  onCancel: () => void,
  visible: boolean,
}

function defaultInit(): CreateMapDTO { return {title: "", description: ""} }

export function MapModal({
  heading, onOpen, onAccept, onCancel, visible
}: MapModalProps) {

  const onInit = onOpen ?? defaultInit;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if(visible) {
      const init = onInit() ?? defaultInit();  
      setTitle(init.title);
      setDescription(init.description);
    }
  }, [visible]);

  const accept = () => {
    const map = {
      title,
      description,
    }
    onAccept(map)
  };

  return (
    <Portal>
      <Modal visible={visible} dismissable={false}>
        <Text variant="headlineMedium">{heading}</Text>
        <TextInput
          label="Titulo"
          value={title}
          onChangeText={text => setTitle(text)}
        />
        <TextInput
          label="Descripcion"
          value={description}
          onChangeText={text => setDescription(text)}
        />
        <View style={styles.buttons}>
          <Button onPress={accept}>Aceptar</Button>
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
