import { StyleSheet, View } from "react-native";
import { Surface, Text, IconButton, TouchableRipple, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { MapDTO } from "@/storage/types";

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
    return str.substring(0, length).trim() + "...";
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
          rippleColor={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"}
        >
          <View style={styles.contentRow}>
            {/* Map Icon Avatar */}
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: isDark ? "#1E2B3E" : "#E7F3FF",
                },
              ]}
            >
              <Ionicons
                name="map"
                size={24}
                color={isDark ? "#2D88FF" : "#1877F2"}
              />
            </View>

            {/* Text Info */}
            <View style={styles.textContainer}>
              <Text
                variant="titleMedium"
                style={[styles.title, { color: theme.colors.onSurface }]}
              >
                {map.title}
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.description,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                numberOfLines={2}
              >
                {map.description ? trim(map.description, 70) : "Sin descripción"}
              </Text>
            </View>

            {/* Dot menu for Actions */}
            {onEdit && (
              <IconButton
                icon="dots-horizontal"
                size={22}
                onPress={onEdit}
                iconColor={theme.colors.onSurfaceVariant}
                style={styles.actionButton}
              />
            )}
          </View>
        </TouchableRipple>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  innerContainer: {
    borderRadius: 11,
    overflow: "hidden",
  },
  ripple: {
    padding: 12,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  actionButton: {
    margin: 0,
    marginRight: -4,
  },
});
