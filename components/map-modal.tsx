import { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Portal, Modal, Text, TextInput, Button, useTheme } from "react-native-paper";

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

  const theme = useTheme();
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
      <Modal visible={visible} dismissable={false} contentContainerStyle={
        [styles.modalContent, { backgroundColor: theme.colors.background }]
      }>
        <Text variant="headlineMedium" style={
          [styles.heading, { color: theme.colors.onBackground }]
        }>{heading}</Text>
        <View style={styles.formContainer}>
          <TextInput
            label="Titulo"
            value={title}
            onChangeText={text => setTitle(text)}
            style={styles.input}
          />
          <TextInput
            label="Descripcion"
            value={description}
            onChangeText={text => setDescription(text)}
            style={styles.input}
          />
        </View>
        <View style={styles.buttons}>
          <Button onPress={accept} mode="contained" style={styles.button}>Aceptar</Button>
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
  }
})
