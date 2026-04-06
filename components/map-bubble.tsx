import { StyleSheet } from "react-native";
import { Surface, List, IconButton } from "react-native-paper";

import { MapDTO } from "@/storage/types";

type MapBubbleProps = {
  map: MapDTO
  onPress?: () => void,
  onEdit?: () => void,
  onLongEdit?: () => void,
}

export function MapBubble({
  map, onPress, onEdit, onLongEdit
}:MapBubbleProps) {

  const trim = (str: string, lenght: number) => {
    if(str.length <= lenght) {
      return str;
    }
    else {
      return str.substring(0, lenght).trim() + "...";
    }
  }

  return (
    <Surface style={styles.container}>
      <List.Item
        title={map.title}
        description={trim(map.description, 50)}
        onPress={onPress}
        right={()=>
          <IconButton
            onPress={onEdit}
            onLongPress={onLongEdit}
            icon="dots-vertical"/>}
      />
    </Surface>
  );

}

const styles = StyleSheet.create({
  container: {
    margin: 4,
    borderRadius: 10,
  }
});

