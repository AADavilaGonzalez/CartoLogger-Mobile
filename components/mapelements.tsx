import React from "react";
import { ScrollView, View } from "react-native";
import { List, Text, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { FeatureDTO } from "@/storage/types";
import { styles } from "@/styles/mapelements.styles";

interface MapElementsProps {
  features: FeatureDTO[];
  selectedFeatureId: string | null;
  onSelectItem: (feature: FeatureDTO) => void;
}

export default function MapElements({
  features,
  selectedFeatureId,
  onSelectItem,
}: MapElementsProps) {
  const theme = useTheme();

  return (
    <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
      {features.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={48} color={theme.colors.outline} />
          <Text style={[styles.emptyText, { color: theme.colors.outline }]}>
            No hay elementos guardados en este mapa.
          </Text>
        </View>
      ) : (
        features.map((feature) => {
          let iconName = "map-marker";
          let titleText = feature.desc || "Marcador sin descripción";
          if (feature.type === "polyline") {
            iconName = "vector-line";
            titleText = feature.desc || "Línea sin descripción";
          } else if (feature.type === "polygon") {
            iconName = "vector-polygon";
            titleText = feature.desc || "Polígono sin descripción";
          }

          const isSelected = feature.id === selectedFeatureId;

          return (
            <List.Item
              key={feature.id}
              title={titleText}
              description={
                feature.type === "marker"
                  ? `Lat: ${feature.coords.latitude.toFixed(5)}, Lng: ${feature.coords.longitude.toFixed(5)}`
                  : `${feature.coords.length} vértices`
              }
              titleStyle={{ fontWeight: isSelected ? "bold" : "normal" }}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={iconName}
                  color={isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
              )}
              right={(props) =>
                feature.imageUri ? (
                  <Image
                    source={{ uri: feature.imageUri }}
                    style={styles.listThumbnail}
                  />
                ) : (
                  <List.Icon {...props} icon="chevron-right" />
                )
              }
              onPress={() => onSelectItem(feature)}
              style={[
                styles.listItem,
                { borderBottomColor: theme.colors.outlineVariant },
                isSelected && { backgroundColor: theme.colors.primaryContainer }
              ]}
            />
          );
        })
      )}
    </ScrollView>
  );
}
