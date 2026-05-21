
import React, { useState, useEffect, useRef, useCallback } from "react";
import { StyleSheet, View, ScrollView, Alert, Keyboard, KeyboardAvoidingView, Platform, useWindowDimensions, Linking, TouchableWithoutFeedback } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Surface, Button, TextInput, useTheme, Modal, Portal, Text, Searchbar, List } from "react-native-paper";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import MapView, {
  Marker, Polyline, Polygon, LatLng,
  LongPressEvent, Region
} from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

import { useStorage } from "@/hooks/use-storage";
import { FeatureDTO } from "@/storage/types";
import { setActiveMapId } from "@/storage/active-map";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

type NominatimResult = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
};

export default function Map() {
  const params = useLocalSearchParams();
  const id = parseInt(params.id as string);
  const { height: screenHeight } = useWindowDimensions();

  const storage = useStorage();
  const theme = useTheme();

  const mapRef = useRef<MapView>(null);
  const justSelectedRef = useRef(false);
  const justLongPressedRef = useRef(false);

  const [features, setFeatures] = useState<FeatureDTO[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<FeatureDTO | null>(null);
  const [queue, setQueue] = useState<LatLng[]>([]);
  const [marginOffset, setMarginOffset] = useState(0);

  useEffect(() => {
    if (id && !isNaN(id)) {
      setActiveMapId(id);
    }
  }, [id]);

  useEffect(() => {
    setMarginOffset(prev => (prev === 0 ? 1 : 0));
  }, [queue.length, features.length]);

  const [text, setText] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editText, setEditText] = useState("");
  const [editImageUri, setEditImageUri] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<{ [key: string]: boolean }>({});

  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [useLocationEnabled, setUseLocationEnabled] = useState(false);
  const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid" | "terrain">("standard");
  const [showMarkers, setShowMarkers] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const [showPolygons, setShowPolygons] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const data = await storage.maps.getData(id);
        if (data.region.latitude === 0 && data.region.longitude === 0) {
          try {
            const locSetting = await storage.settings.get("useLocation");
            if (locSetting === "true") {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status === "granted") {
                const loc = await Location.getCurrentPositionAsync({});
                const newRegion = {
                  latitude: loc.coords.latitude,
                  longitude: loc.coords.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                };
                setRegion(newRegion);
                await storage.maps.setRegion(id, newRegion);
              } else {
                setRegion(data.region);
              }
            } else {
              setRegion(data.region);
            }
          } catch {
            setRegion(data.region);
          }
        } else {
          setRegion(data.region);
        }
        setFeatures(data.features);
      } catch (err) {
        console.warn("Error loading map features", err);
      }
    };
    loadFeatures();
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      const reloadFeatures = async () => {
        try {
          const data = await storage.maps.getData(id);
          setFeatures(data.features);
        } catch (err) {
          console.warn("Error reloading map features", err);
        }
      };
      reloadFeatures();

      const reloadSettings = async () => {
        try {
          const locSetting = await storage.settings.get("useLocation");
          const isEnabled = locSetting === "true";
          setUseLocationEnabled(isEnabled);
          if (isEnabled) {
            await Location.requestForegroundPermissionsAsync();
          }
        } catch (err) {
          console.warn("Error reloading useLocation setting", err);
        }

        try {
          const type = await storage.settings.get("mapType");
          setMapType(type as any);
        } catch {
          setMapType("standard");
        }

        const getSettingSafe = async (key: string) => {
          try {
            const val = await storage.settings.get(key);
            return val !== "false";
          } catch {
            return true;
          }
        };

        setShowMarkers(await getSettingSafe(`showMarkers_${id}`));
        setShowLines(await getSettingSafe(`showLines_${id}`));
        setShowPolygons(await getSettingSafe(`showPolygons_${id}`));
      };
      reloadSettings();
    }, [id, storage])
  );

  const centerLocation = async () => {
    if (!useLocationEnabled) return;
    try {
      const loc = await Location.getCurrentPositionAsync({});
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (err) {
      console.warn("Could not get location", err);
    }
  };

  const pushToQueue = (e: LongPressEvent) => {
    justLongPressedRef.current = true;
    setTimeout(() => { justLongPressedRef.current = false; }, 300);
    const coords = e.nativeEvent.coordinate;
    setQueue(prev => [...prev, coords]);
  };

  const popFromQueue = () => { setQueue(queue.slice(0, -1)); };

  const clearQueue = () => { setQueue([]); };

  const buildFeature = () => {
    if (queue.length === 0) { return; }

    let newFeature: FeatureDTO;
    if (queue.length === 1) {
      newFeature = {
        type: "marker",
        desc: "",
        coords: queue[0],
      };
    }
    else if (queue.length <= 3 || !isClosed(queue)) {
      newFeature = {
        type: "polyline",
        desc: "",
        coords: [...queue],
      };
    }
    else {
      newFeature = {
        type: "polygon",
        desc: "",
        coords: queue.slice(0, -1),
      };
    }

    const newFeatures = [...features, newFeature];
    storage.maps.setFeatures(id, newFeatures);
    setFeatures(newFeatures);
    clearQueue();
  };

  const deleteFeature = () => {
    if (selectedFeature === null) { return; }
    const newFeatures = features.filter((elem) => elem !== selectedFeature);
    storage.maps.setFeatures(id, newFeatures);
    setFeatures(newFeatures);
    setText("");
    setSelectedFeature(null);
  };

  const selectFeature = (feature: FeatureDTO | null) => {
    if (feature !== null) {
      justSelectedRef.current = true;
      setTimeout(() => { justSelectedRef.current = false; }, 100);
    }
    if (selectedFeature) {
      selectedFeature.desc = text;
      storage.maps.setFeatures(id, features);
    }
    setText(feature?.desc ?? "");
    setSelectedFeature(feature);
  };

  const openEditModal = () => {
    setEditText(text);
    setEditImageUri(selectedFeature?.imageUri ?? null);
    setEditModalVisible(true);
  };

  const saveEditText = () => {
    setText(editText);
    if (selectedFeature) {
      selectedFeature.desc = editText;
      selectedFeature.imageUri = editImageUri ?? undefined;
      storage.maps.setFeatures(id, features);
    }
    setEditModalVisible(false);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Se necesita acceso a la galería de fotos para poder seleccionar una imagen."
      );
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setEditImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn("Error picking image:", err);
      Alert.alert("Error", "No se pudo seleccionar la imagen.");
    }
  };

  const handleRemoveImage = () => {
    setEditImageUri(null);
  };

  const handleNavigationPress = async () => {
    if (!selectedFeature) return;

    let url = "";
    if (selectedFeature.type === "marker") {
      const { latitude, longitude } = selectedFeature.coords;
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    } else if (selectedFeature.type === "polyline") {
      const coords = selectedFeature.coords;
      if (coords.length >= 2) {
        const origin = coords[0];
        const destination = coords[1];
        url = `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}`;
      } else if (coords.length === 1) {
        const { latitude, longitude } = coords[0];
        url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      }
    }

    if (url) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert("Error", "No se pudo abrir Google Maps.");
        }
      } catch (err) {
        console.warn("Error opening Google Maps", err);
        Alert.alert("Error", "Ocurrió un error al intentar abrir Google Maps.");
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`,
        { headers: { "User-Agent": "CartoLogger-Mobile/1.0", "Accept": "application/json" } }
      );
      const data: NominatimResult[] = await response.json();
      Keyboard.dismiss();
      if (data.length > 0) {
        setSearchResults(data);
      } else {
        setSearchResults([]);
        Alert.alert("Lugar no encontrado", "No se encontraron resultados para la búsqueda.");
      }
    } catch (err) {
      console.warn("Error in search:", err);
      Alert.alert("Error", "No se pudo realizar la búsqueda.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    mapRef.current?.animateToRegion({
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });

    const newFeature: FeatureDTO = {
      type: "marker",
      desc: result.display_name,
      coords: { latitude: lat, longitude: lon },
    };

    const newFeatures = [...features, newFeature];
    storage.maps.setFeatures(id, newFeatures);
    setFeatures(newFeatures);

    setSearchResults([]);
    setSearchQuery("");
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Map lives OUTSIDE the ScrollView so Android's scroll gesture handler
            does not intercept long-press events before MapView receives them. */}
        <Surface style={[styles.mapSurface, { height: screenHeight * 0.52 }]}>
          <View style={styles.mapClip}>
            {region ? (
              <MapView
                style={[styles.map, { marginBottom: marginOffset }]}
                ref={mapRef}
                initialRegion={region}
                mapType={mapType}
                onPress={() => { if (!justSelectedRef.current && !justLongPressedRef.current) selectFeature(null); }}
                onLongPress={pushToQueue}
                onRegionChangeComplete={(r) => storage.maps.setRegion(id, r)}
                showsUserLocation={useLocationEnabled}
              >
                {queue.map((coord, idx) => (
                  <Marker key={`queue-${queue.length}-${idx}-${coord.latitude}-${coord.longitude}`} coordinate={coord} pinColor="#2196F3" />
                ))}
                {queue.length > 1 &&
                  <Polyline
                    key={`queue-polyline-${queue.length}`}
                    strokeWidth={4}
                    lineCap="round"
                    lineJoin="round"
                    strokeColor="#FF0000"
                    coordinates={queue}
                  />
                }
                {features.map((feature, idx) => {
                  switch (feature.type) {
                    case "marker":
                      if (!showMarkers) return null;
                      const isSelected = selectedFeature === feature;
                      const coordKey = `${feature.coords.latitude}-${feature.coords.longitude}`;
                      const isLoaded = loadedImages[coordKey] || false;
                      if (feature.imageUri && !isSelected) {
                        return (
                          <Marker
                            key={`feature-${idx}-${feature.type}-${coordKey}-${feature.imageUri ? "has-img" : "no-img"}-${isLoaded ? "loaded" : "loading"}`}
                            coordinate={feature.coords}
                            stopPropagation={true}
                            onPress={() => selectFeature(feature)}
                          >
                            <View style={{ alignItems: "center" }}>
                              <View style={styles.thumbnailContainer}>
                                <Image
                                  source={{ uri: feature.imageUri }}
                                  style={styles.thumbnail}
                                  onLoad={() => {
                                    if (!loadedImages[coordKey]) {
                                      setLoadedImages(prev => ({ ...prev, [coordKey]: true }));
                                    }
                                  }}
                                />
                                <View style={styles.thumbnailArrow} />
                              </View>
                              <Ionicons name="location" size={32} color={theme.colors.primary} />
                            </View>
                          </Marker>
                        );
                      }
                      return (
                        <Marker
                          key={`feature-${idx}-${feature.type}-${coordKey}`}
                          coordinate={feature.coords}
                          stopPropagation={true}
                          onPress={() => selectFeature(feature)}
                        />
                      );
                    case "polyline":
                      if (!showLines) return null;
                      return (
                        <React.Fragment key={`polyline-group-${idx}`}>
                          <Polyline
                            key={`feature-${idx}-${feature.type}-${feature.coords.length}-${feature.coords[0]?.latitude}-${feature.coords[0]?.longitude}`}
                            coordinates={feature.coords}
                            tappable={true}
                            strokeWidth={selectedFeature === feature ? 6 : 4}
                            strokeColor={selectedFeature === feature ? "#0055FF" : "#FF0000"}
                            onPress={() => selectFeature(feature)}
                          />
                          {feature.coords.map((coord, coordIdx) => (
                            <Marker
                              key={`polyline-${idx}-vertex-${coordIdx}`}
                              coordinate={coord}
                              stopPropagation={true}
                            >
                              <View style={styles.vertexMarker} />
                            </Marker>
                          ))}
                        </React.Fragment>
                      );
                    case "polygon":
                      if (!showPolygons) return null;
                      return (
                        <React.Fragment key={`polygon-group-${idx}`}>
                          <Polygon
                            key={`feature-${idx}-${feature.type}-${feature.coords.length}-${feature.coords[0]?.latitude}-${feature.coords[0]?.longitude}`}
                            coordinates={feature.coords}
                            tappable={true}
                            onPress={() => selectFeature(feature)}
                            strokeWidth={selectedFeature === feature ? 5 : 3}
                            strokeColor={selectedFeature === feature ? "#0055FF" : "#AA0000"}
                            fillColor={selectedFeature === feature ? "rgba(0,85,255,0.3)" : "rgba(255,0,0,0.3)"}
                          />
                          {feature.coords.map((coord, coordIdx) => (
                            <Marker
                              key={`polygon-${idx}-vertex-${coordIdx}`}
                              coordinate={coord}
                              stopPropagation={true}
                            >
                              <View style={styles.vertexMarker} />
                            </Marker>
                          ))}
                        </React.Fragment>
                      );
                  }
                })}
                {selectedFeature && (
                  <Marker
                    key={`nav-bubble-${selectedFeature.type}-${selectedFeature.desc}-${
                      selectedFeature.type === "marker"
                        ? selectedFeature.coords.latitude
                        : selectedFeature.coords[0]?.latitude
                    }`}
                    coordinate={
                      selectedFeature.type === "marker"
                        ? selectedFeature.coords
                        : selectedFeature.coords[0]
                    }
                    stopPropagation={true}
                  >
                    <View style={{ alignItems: "center" }}>
                      <View style={styles.calloutBubble}>
                        <View style={styles.calloutRow}>
                          <Text style={styles.calloutText} onPress={openEditModal}>
                            {selectedFeature.desc || "Toca para agregar descripción..."}
                          </Text>
                          <View style={styles.calloutDivider} />
                          <Ionicons
                            name="navigate"
                            size={18}
                            color={theme.colors.primary}
                            onPress={handleNavigationPress}
                            style={styles.calloutNavIcon}
                          />
                        </View>
                      </View>
                      <View style={styles.calloutArrow} />
                      <View style={{ height: selectedFeature.type === "marker" ? 34 : 10 }} />
                    </View>
                  </Marker>
                )}
              </MapView>
            ) : (
              <View style={styles.map} />
            )}
          </View>
        </Surface>

        {/* Controls panel inside its own ScrollView */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.controls}>
            {/* Search bar */}
            <Searchbar
              placeholder="Buscar lugares..."
              onChangeText={(t) => {
                setSearchQuery(t);
                if (t === "") setSearchResults([]);
              }}
              value={searchQuery}
              onSubmitEditing={handleSearch}
              loading={isSearching}
              style={styles.searchbar}
            />

            {/* Search results — push buttons down when open */}
            {searchResults.length > 0 && (
              <Surface elevation={1} style={styles.searchResults}>
                {searchResults.map((res) => (
                  <List.Item
                    key={res.place_id}
                    title={res.display_name}
                    titleNumberOfLines={2}
                    onPress={() => handleSelectResult(res)}
                    left={props => <List.Icon {...props} icon="map-marker" />}
                  />
                ))}
              </Surface>
            )}

            {/* Action buttons */}
            <Surface elevation={2} style={styles.controlsRow}>
              <Button style={styles.button} onPress={buildFeature}>Ok</Button>
              <Button style={styles.button} onPress={popFromQueue} onLongPress={clearQueue}>Atras</Button>
              <Button style={styles.button} onPress={deleteFeature}>Borrar</Button>
              <Button style={styles.button} onPress={centerLocation} disabled={!useLocationEnabled}>Centrar</Button>
            </Surface>

            {/* Description */}
            <Surface
              style={styles.descriptionView}
              onTouchEnd={selectedFeature ? openEditModal : undefined}
            >
              <Text style={styles.descriptionText}>
                {selectedFeature ? (text || "Toca para agregar descripción...") : "No hay feature seleccionado"}
              </Text>
            </Surface>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Portal>
        <Modal
          visible={editModalVisible}
          dismissable={false}
          contentContainerStyle={
            [styles.modalContent, { backgroundColor: theme.colors.background }]
          }
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ width: "100%" }}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ width: "100%", alignItems: "center" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 16 }}>
                  <Text variant="headlineSmall" style={
                    { color: theme.colors.onBackground, fontWeight: "600" }
                  }>Descripción</Text>
                  <Button compact onPress={() => Keyboard.dismiss()} icon="keyboard-hide">Ocultar</Button>
                </View>

                <TextInput
                  style={styles.modalTextInput}
                  value={editText}
                  onChangeText={setEditText}
                  placeholder="Descripción..."
                  multiline={true}
                />
                {editImageUri ? (
                  <View style={styles.modalImageContainer}>
                    <Image source={{ uri: editImageUri }} style={styles.modalImagePreview} />
                    <Button
                      mode="outlined"
                      textColor="#D32F2F"
                      onPress={handleRemoveImage}
                      style={styles.modalImageRemoveBtn}
                      icon="delete"
                    >
                      Eliminar Foto
                    </Button>
                  </View>
                ) : (
                  <Button
                    mode="outlined"
                    onPress={handlePickImage}
                    style={styles.modalImagePickBtn}
                    icon="camera"
                  >
                    Seleccionar Foto
                  </Button>
                )}
                <View style={styles.modalButtons}>
                  <Button
                    onPress={saveEditText}
                    mode="contained" style={styles.modalButton}
                  >Guardar</Button>
                  <Button
                    onPress={() => setEditModalVisible(false)}
                    mode="outlined" style={styles.modalButton}
                  >Cancelar</Button>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

function distance(p1: LatLng, p2: LatLng): number {
  const dLat = p1.latitude - p2.latitude;
  let dLon = Math.abs(p1.longitude - p2.longitude);
  if (dLon > 180) { dLon = 360 - dLon; }
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

function isClosed(points: LatLng[]): boolean {
  const THRESHOLD = 0.1;
  if (points.length <= 2) { return false; }
  let min: LatLng = {
    latitude: points[0].latitude,
    longitude: points[0].longitude
  };
  let max: LatLng = {
    latitude: points[0].latitude,
    longitude: points[0].longitude
  };
  for (const p of points) {
    min.latitude = Math.min(min.latitude, p.latitude);
    min.longitude = Math.min(min.longitude, p.longitude);
    max.latitude = Math.max(max.latitude, p.latitude);
    max.longitude = Math.max(max.longitude, p.longitude);
  }
  const bboxDiagonal = distance(max, min);
  const gapDiagonal = distance(points[0], points[points.length - 1]);
  return gapDiagonal <= THRESHOLD * bboxDiagonal;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Body ──
  keyboardAvoidingView: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 24,
  },

  // ── Map ──
  mapSurface: {
    margin: 12,
    borderRadius: 12,
  },
  mapClip: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },

  // ── Controls ──
  controls: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  searchbar: {
    marginBottom: 8,
    borderRadius: 8,
  },
  searchResults: {
    borderRadius: 8,
    marginBottom: 8,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
  },
  button: {
    marginHorizontal: 6,
    minWidth: 80,
  },
  descriptionView: {
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    minHeight: 60,
  },
  descriptionText: {
    fontSize: 14,
  },

  // ── Modal ──
  modalContent: {
    margin: 20,
    borderRadius: 12,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeading: {
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },
  modalTextInput: {
    width: "100%",
    minHeight: 120,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    minWidth: 100,
  },
  navMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  modalImageContainer: {
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
  },
  modalImagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalImageRemoveBtn: {
    borderColor: "#D32F2F",
  },
  modalImagePickBtn: {
    marginBottom: 16,
    width: "100%",
  },
  vertexMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF9800",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },
  thumbnailContainer: {
    padding: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: -2,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 4,
  },
  thumbnailArrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 0,
    borderTopWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
    alignSelf: "center",
    marginBottom: -5,
  },
  calloutBubble: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: -4,
  },
  calloutRow: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 220,
  },
  calloutText: {
    fontSize: 14,
    color: "#333333",
    flexShrink: 1,
    fontWeight: "500",
  },
  calloutDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 8,
  },
  calloutNavIcon: {
    padding: 4,
  },
  calloutArrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 0,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
    alignSelf: "center",
    marginBottom: -6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
});
