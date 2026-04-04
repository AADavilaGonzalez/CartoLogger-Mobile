import { Surface, Text } from "react-native-paper";

import { MapDTO } from "@/storage/types";

type MapBubbleProps = {
  map: MapDTO
}

export function MapBubble({map}:MapBubbleProps) {

  return (
    <Surface>
      <Text>{map.title}</Text>
    </Surface>
  );

}

