import { View } from "react-native";
import { Surface, Text, IconButton, TouchableRipple, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { MapDTO } from "@/storage/types";
import { styles } from "@/styles/map-bubble.styles";

type MapBubbleProps = {
  map: MapDTO
  onPress?: () => void,
  onLongPress?: () => void,
  onEdit?: () => void,
}

export function MapBubble({
  map, onPress, onLongPress, onEdit
}: MapBubbleProps) {
  const theme = useTheme();
  const isDark = theme.dark;

  const trim = (str: string, length: number) => {
    if (str.length <= length) {
      return str;
    }
    return str.substring(0, length) + "...";
  };

  return (
    <Surface
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
      elevation={1}
    >
      <View style={styles.innerContainer}>
        <TouchableRipple
          onPress={onPress}
          onLongPress={onLongPress}
          style={styles.ripple}
        >
          <View style={styles.contentRow}>
            {/* Map Icon Avatar */}
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: isDark ? "#2A2A2A" : "#E8F0FE",
                },
              ]}
            >
              <Ionicons
                name="map"
                size={24}
                color={theme.colors.primary}
              />
            </View>

            {/* Content Text */}
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.colors.onSurface,
                  },
                ]}
              >
                {trim(map.title, 24)}
              </Text>
              <Text
                style={[
                  styles.description,
                  {
                    color: theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {trim(map.description, 40)}
              </Text>
            </View>

            {/* Edit Button */}
            <IconButton
              icon="pencil-outline"
              size={20}
              iconColor={theme.colors.primary}
              style={styles.actionButton}
              onPress={onEdit}
            />
          </View>
        </TouchableRipple>
      </View>
    </Surface>
  );
}
