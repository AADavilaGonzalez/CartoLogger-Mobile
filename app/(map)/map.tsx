
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, ScrollView, Alert, Keyboard, KeyboardAvoidingView, Platform, useWindowDimensions, Linking, TouchableWithoutFeedback, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Surface, Button, TextInput, useTheme, Modal, Portal, Text, Searchbar, List, SegmentedButtons } from "react-native-paper";
import { useLocalSearchParams, useFocusEffect, useNavigation } from "expo-router";
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
import MapElements from "@/components/mapelements";
import { styles } from "@/styles/map.styles";

type NominatimResult = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
};

type QueueItem = {
  id: string;
  coord: LatLng; // the true geographic coordinate (used for storage)
  renderCoord?: LatLng; // optional coordinate used only for rendering the marker so the visual tip aligns with the true coord
};

export default function Map() {
  const params = useLocalSearchParams();
  const id = parseInt(params.id as string);
  const { height: screenHeight } = useWindowDimensions();

  const storage = useStorage();
  const theme = useTheme();
  const navigation = useNavigation();

  const mapRef = useRef<MapView>(null);
  const justSelectedRef = useRef(false);
  const justLongPressedRef = useRef(false);

  const [title, setTitle] = useState("");
  const [features, setFeatures] = useState<FeatureDTO[]>([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const selectedFeature = features.find(f => f.id === selectedFeatureId) || null;
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [tracksMap, setTracksMap] = useState<Record<string, boolean>>({});
  const VISUAL_PIN_OFFSET_PX = 24; // pixels to shift the rendered marker up so its tip matches the real coordinate

  useEffect(() => {
    if (id && !isNaN(id)) {
      setActiveMapId(id);
    }
  }, [id]);

  useEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => parent.goBack()}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginLeft: 8,
              paddingVertical: 8,
              paddingRight: 8,
            }}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.primary, fontSize: 16, fontWeight: "500" }}>
              regresar
            </Text>
          </TouchableOpacity>
        ),
        headerTitleAlign: "left",
        title: title || "Mapa",
      });
    }
  }, [navigation, title, theme]);

  const [text, setText] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editText, setEditText] = useState("");
  const [editImageUri, setEditImageUri] = useState<string | null>(null);
  // Tracks whether the image inside each custom Marker has finished loading.
  // Keyed by feature.id so keys never collide across features.
  // While false, tracksViewChanges=true lets react-native-maps re-snapshot the
  // marker each render until expo-image finishes decoding. Once true, we freeze
  // snapshots to prevent the marker from flickering on unrelated re-renders.
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});

  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [useLocationEnabled, setUseLocationEnabled] = useState(false);
  const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid" | "terrain">("standard");
  const [showMarkers, setShowMarkers] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const [showPolygons, setShowPolygons] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [activeTab, setActiveTab] = useState<"map" | "list">("map");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    setImageLoaded({});  // reset image cache when switching maps
    const loadFeatures = async () => {
      try {
        const map = await storage.maps.get(id);
        if (map) {
          setTitle(map.title);
        }
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
        const featuresWithIds = data.features.map((f, idx) => f.id ? f : { ...f, id: `${f.type}-${Date.now()}-${Math.random()}-${idx}` });
        const hasMissingIds = data.features.some(f => !f.id);
        if (hasMissingIds) {
          await storage.maps.setFeatures(id, featuresWithIds);
        }
        setFeatures(featuresWithIds);
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
          const map = await storage.maps.get(id);
          if (map) {
            setTitle(map.title);
          }
          const data = await storage.maps.getData(id);
          const featuresWithIds = data.features.map((f, idx) => f.id ? f : { ...f, id: `${f.type}-${Date.now()}-${Math.random()}-${idx}` });
          const hasMissingIds = data.features.some(f => !f.id);
          if (hasMissingIds) {
            await storage.maps.setFeatures(id, featuresWithIds);
          }
          setFeatures(featuresWithIds);
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

  const pushToQueue = async (e: LongPressEvent) => {
    justLongPressedRef.current = true;
    setTimeout(() => { justLongPressedRef.current = false; }, 300);
    const coords = e.nativeEvent.coordinate;
    const id = `${Date.now()}-${Math.random()}`;

    // Compute a render offset so the visual tip of the marker (the small dot)
    // aligns with the real coordinate. We convert coord -> screen point, shift
    // the Y by VISUAL_PIN_OFFSET_PX, then convert back to a lat/lng for rendering.
    let renderCoord: LatLng | undefined = undefined;
    const map = mapRef.current as any;
    if (map?.pointForCoordinate && map?.coordinateForPoint) {
      try {
        const pt = await map.pointForCoordinate(coords);
        const renderPoint = { x: pt.x, y: pt.y - VISUAL_PIN_OFFSET_PX };
        renderCoord = await map.coordinateForPoint(renderPoint);
      } catch (err) {
        console.warn("Could not compute render coordinate", err);
      }
    }

    setQueue(prev => [...prev, { id, coord: coords, renderCoord }]);
    setTracksMap(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setTracksMap(prev => ({ ...prev, [id]: false }));
    }, 100);
  };

  const popFromQueue = () => { setQueue(prev => prev.slice(0, -1)); };

  const clearQueue = () => { setQueue([]); };



  const buildFeature = () => {
    if (queue.length === 0) { return; }

    // Flush any pending desc change for the currently selected feature into the
    // base array BEFORE appending the new feature — single setFeatures call.
    let baseFeatures = features;
    if (selectedFeature) {
      baseFeatures = features.map(f => f.id === selectedFeature.id ? { ...f, desc: text } : f);
    }

    let newFeature: FeatureDTO;
    if (queue.length === 1) {
      newFeature = {
        id: `marker-${Date.now()}-${Math.random()}`,
        type: "marker",
        desc: "",
        coords: queue[0].coord,
      };
    }
    else if (queue.length <= 3 || !isClosed(queue.map(q => q.coord))) {
      newFeature = {
        id: `polyline-${Date.now()}-${Math.random()}`,
        type: "polyline",
        desc: "",
        coords: queue.map(q => q.coord),
      };
    }
    else {
      newFeature = {
        id: `polygon-${Date.now()}-${Math.random()}`,
        type: "polygon",
        desc: "",
        coords: queue.slice(0, -1).map(q => q.coord),
      };
    }

    const newFeatures = [...baseFeatures, newFeature];
    storage.maps.setFeatures(id, newFeatures);
    setFeatures(newFeatures);
    setSelectedFeatureId(null);
    setText("");
    clearQueue();
  };

  const deleteFeature = () => {
    if (selectedFeature === null) { return; }
    const newFeatures = features.filter((elem) => elem.id !== selectedFeature.id);
    storage.maps.setFeatures(id, newFeatures);
    setFeatures(newFeatures);
    setText("");
    setSelectedFeatureId(null);
  };

  const selectFeature = useCallback((feature: FeatureDTO | null) => {
    if (feature !== null) {
      justSelectedRef.current = true;
      setTimeout(() => { justSelectedRef.current = false; }, 100);
    }
    setText(feature?.desc ?? "");
    setSelectedFeatureId(feature?.id ?? null);
  }, []);

  const handleSelectItem = useCallback((feature: FeatureDTO) => {
    selectFeature(feature);
    setActiveTab("map");
    const coords = feature.type === "marker" ? feature.coords : feature.coords[0];
    if (coords) {
      setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }, 1000);
      }, 300);
    }
  }, [selectFeature, setActiveTab]);

  const openEditModal = () => {
    setEditText(text);
    setEditImageUri(selectedFeature?.imageUri ?? null);
    setEditModalVisible(true);
  };

  const saveEditText = () => {
    setText(editText);
    if (selectedFeature) {
      const updatedFeatures = features.map(f => f.id === selectedFeature.id ? { ...f, desc: editText, imageUri: editImageUri ?? undefined } : f);
      storage.maps.setFeatures(id, updatedFeatures);
      setFeatures(updatedFeatures);
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
        mediaTypes: ["images"],
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

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      let viewboxParam = "";
      if (region) {
        const delta = 0.5; // Biasing searches within a ~50km box around the map viewport
        const left = region.longitude - delta;
        const right = region.longitude + delta;
        const top = region.latitude + delta;
        const bottom = region.latitude - delta;
        viewboxParam = `&viewbox=${left},${top},${right},${bottom}`;
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}${viewboxParam}&format=json&limit=5`,
        { headers: { "User-Agent": "CartoLogger-Mobile/1.0", "Accept": "application/json" } }
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.warn("Error in search:", err);
    } finally {
      setIsSearching(false);
    }
  }, [region]);

  // Debounce search text changes (500ms delay) to limit API requests
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    await performSearch(searchQuery);
  };

  const handleSelectResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    if (isNaN(lat) || isNaN(lon)) {
      Alert.alert("Error", "Coordenadas inválidas para este lugar.");
      return;
    }

    const newReg = {
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    };

    setRegion(newReg);
    mapRef.current?.animateToRegion(newReg, 1000);

    const newFeature: FeatureDTO = {
      id: `marker-${Date.now()}-${Math.random()}`,
      type: "marker",
      desc: result.display_name,
      coords: { latitude: lat, longitude: lon },
    };

    const newFeatures = [...features, newFeature];
    storage.maps.setFeatures(id, newFeatures);
    setFeatures(newFeatures);
    selectFeature(newFeature);

    setSearchResults([]);
    setSearchQuery("");
    Keyboard.dismiss();
    setIsSearchFocused(false);
  };

  const renderedFeatures = useMemo(() => {
    return features.map((feature, idx) => {
      const fKey = feature.id || `feature-${idx}`;
      const isSelected = feature.id === selectedFeatureId;
      switch (feature.type) {
        case "marker":
          if (!showMarkers) return null;
          if (feature.imageUri) {
            return (
              <Marker
                key={`${fKey}-img`}
                coordinate={feature.coords}
                stopPropagation={true}
                onPress={() => selectFeature(feature)}
                anchor={{ x: 0.5, y: 1 }}
                tracksViewChanges={!imageLoaded[fKey]}
              >
                <View style={{ alignItems: "center" }}>
                  <View style={[styles.thumbnailContainer, { opacity: isSelected ? 0 : 1 }]}>
                    <Image
                      source={{ uri: feature.imageUri }}
                      style={Platform.OS === "android" ? styles.androidThumbnail : styles.thumbnail}
                      onLoad={() => setImageLoaded(prev => ({ ...prev, [fKey]: true }))}
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
              key={`${fKey}-pin`}
              coordinate={feature.coords}
              stopPropagation={true}
              onPress={() => selectFeature(feature)}
            />
          );
        case "polyline":
          if (!showLines) return null;
          return (
            <React.Fragment key={fKey}>
              <Polyline
                key={`${fKey}-line`}
                coordinates={feature.coords}
                tappable={true}
                strokeWidth={isSelected ? 6 : 4}
                strokeColor={isSelected ? "#0055FF" : "#FF0000"}
                onPress={() => selectFeature(feature)}
              />
              {feature.coords.map((coord, coordIdx) => (
                <Marker
                  key={`${fKey}-v${coordIdx}`}
                  coordinate={coord}
                  anchor={{ x: 0.5, y: 0.5 }}
                  stopPropagation={true}
                  tracksViewChanges={false}
                  onPress={() => selectFeature(feature)}
                >
                  <View style={styles.vertexMarker} />
                </Marker>
              ))}
              {feature.imageUri && feature.coords[0] && (
                <Marker
                  key={`${fKey}-img`}
                  coordinate={feature.coords[0]}
                  stopPropagation={true}
                  onPress={() => selectFeature(feature)}
                  anchor={{ x: 0.5, y: 1 }}
                  tracksViewChanges={!imageLoaded[fKey]}
                >
                  <View style={[{ alignItems: "center" }, { opacity: isSelected ? 0 : 1 }]}>
                    <View style={styles.thumbnailContainer}>
                      <Image
                        source={{ uri: feature.imageUri }}
                        style={Platform.OS === "android" ? styles.androidThumbnail : styles.thumbnail}
                        onLoad={() => setImageLoaded(prev => ({ ...prev, [fKey]: true }))}
                      />
                      <View style={styles.thumbnailArrow} />
                    </View>
                    <Ionicons name="location" size={32} color={theme.colors.primary} />
                  </View>
                </Marker>
              )}
            </React.Fragment>
          );
        case "polygon":
          if (!showPolygons) return null;
          return (
            <React.Fragment key={fKey}>
              <Polygon
                key={`${fKey}-poly`}
                coordinates={feature.coords}
                tappable={true}
                onPress={() => selectFeature(feature)}
                strokeWidth={isSelected ? 5 : 3}
                strokeColor={isSelected ? "#0055FF" : "#AA0000"}
                fillColor={isSelected ? "rgba(0,85,255,0.3)" : "rgba(255,0,0,0.3)"}
              />
              {feature.coords.map((coord, coordIdx) => (
                <Marker
                  key={`${fKey}-v${coordIdx}`}
                  coordinate={coord}
                  anchor={{ x: 0.5, y: 0.5 }}
                  stopPropagation={true}
                  tracksViewChanges={false}
                  onPress={() => selectFeature(feature)}
                >
                  <View style={styles.vertexMarker} />
                </Marker>
              ))}
              {feature.imageUri && feature.coords[0] && (
                <Marker
                  key={`${fKey}-img`}
                  coordinate={feature.coords[0]}
                  stopPropagation={true}
                  onPress={() => selectFeature(feature)}
                  anchor={{ x: 0.5, y: 1 }}
                  tracksViewChanges={!imageLoaded[fKey]}
                >
                  <View style={[{ alignItems: "center" }, { opacity: isSelected ? 0 : 1 }]}>
                    <View style={styles.thumbnailContainer}>
                      <Image
                        source={{ uri: feature.imageUri }}
                        style={Platform.OS === "android" ? styles.androidThumbnail : styles.thumbnail}
                        onLoad={() => setImageLoaded(prev => ({ ...prev, [fKey]: true }))}
                      />
                      <View style={styles.thumbnailArrow} />
                    </View>
                    <Ionicons name="location" size={32} color={theme.colors.primary} />
                  </View>
                </Marker>
              )}
            </React.Fragment>
          );
      }
    });
  }, [features, selectedFeatureId, showMarkers, showLines, showPolygons, imageLoaded, selectFeature, theme]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {!isSearchFocused && (
          <>
            <View style={styles.tabContainer}>
              <SegmentedButtons
                value={activeTab}
                onValueChange={(val) => setActiveTab(val as "map" | "list")}
                buttons={[
                  {
                    value: "map",
                    label: "Mapa",
                    icon: "map",
                  },
                  {
                    value: "list",
                    label: `Elementos (${features.length})`,
                    icon: "format-list-bulleted",
                  },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            {/* Map lives OUTSIDE the ScrollView so Android's scroll gesture handler
                does not intercept long-press events before MapView receives them. */}
            <Surface style={[styles.mapSurface, { height: screenHeight * 0.44 }]}>
              <View style={styles.mapClip}>
                {activeTab === "list" ? (
                  <MapElements
                    features={features}
                    selectedFeatureId={selectedFeatureId}
                    onSelectItem={handleSelectItem}
                  />
                ) : region ? (
                  <>
                    <MapView
                      style={styles.map}
                      ref={mapRef}
                      initialRegion={region}
                      mapType={mapType}
                      onPress={() => { if (!justSelectedRef.current && !justLongPressedRef.current) selectFeature(null); }}
                      onLongPress={pushToQueue}
                      onRegionChangeComplete={(r) => storage.maps.setRegion(id, r)}
                      showsUserLocation={useLocationEnabled}
                    >
                      {queue.map((item, idx) => (
                        <Marker
                          key={`queue-marker-${item.id}`}
                          coordinate={Platform.OS === "android" ? item.coord : (item.renderCoord ?? item.coord)}
                          draggable
                          pinColor={Platform.OS === "android" ? "blue" : undefined}
                          opacity={Platform.OS === "android" ? 0.6 : undefined}
                          tracksViewChanges={Platform.OS === "android" ? false : (tracksMap[item.id] ?? true)}
                          onDragEnd={async (e) => {
                            const newRenderCoord = e.nativeEvent.coordinate;
                            let newRealCoord: LatLng = newRenderCoord;
                            if (Platform.OS !== "android") {
                              const map = mapRef.current as any;
                              if (map?.pointForCoordinate && map?.coordinateForPoint) {
                                try {
                                  const pt = await map.pointForCoordinate(newRenderCoord);
                                  const realPoint = { x: pt.x, y: pt.y + VISUAL_PIN_OFFSET_PX };
                                  newRealCoord = await map.coordinateForPoint(realPoint);
                                } catch (err) {
                                  console.warn("Could not convert dragged render coord to real coord", err);
                                }
                              }
                            }
                            setQueue(prev => prev.map(q => q.id === item.id ? { ...q, coord: newRealCoord, renderCoord: Platform.OS === "android" ? undefined : newRenderCoord } : q));
                          }}
                        >
                          {Platform.OS === "android" ? null : (
                            <View style={styles.silhouetteContainer}>
                              <View style={[styles.silhouetteRing, { borderColor: theme.colors.primary, opacity: 0.4 }]} />
                              <Ionicons name="location" size={60} color={theme.colors.primary} style={styles.silhouetteFill} />
                              <Ionicons name="location-outline" size={60} color={theme.colors.primary} style={styles.silhouetteOutline} />
                              <View style={[styles.silhouetteDot, { backgroundColor: theme.colors.primary }]} />
                            </View>
                          )}
                        </Marker>
                      ))}
                      {queue.length > 1 &&
                        <Polyline
                          key="queue-polyline"
                          strokeWidth={4}
                          lineCap="round"
                          lineJoin="round"
                          strokeColor="#FF0000"
                          coordinates={queue.map(q => q.coord)}
                        />
                      }
                      {renderedFeatures}
                      {Platform.OS !== "android" && selectedFeature && (
                        <Marker
                          key={`nav-bubble-${selectedFeatureId}`}
                          coordinate={
                            selectedFeature.type === "marker"
                              ? selectedFeature.coords
                              : selectedFeature.coords[0]
                          }
                          stopPropagation={true}
                          anchor={{ x: 0.5, y: 1 }}
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
                    {Platform.OS === "android" && selectedFeature && (
                      <View style={styles.androidCalloutCard}>
                        <TouchableOpacity style={styles.androidCalloutTextContainer} onPress={openEditModal}>
                          <Text numberOfLines={2} style={styles.androidCalloutText}>
                            {selectedFeature.desc || "Toca para agregar descripción..."}
                          </Text>
                        </TouchableOpacity>
                        <View style={styles.androidCalloutActions}>
                          <TouchableOpacity onPress={handleNavigationPress} style={styles.androidCalloutButton}>
                            <Ionicons name="navigate" size={20} color={theme.colors.primary} />
                          </TouchableOpacity>
                          <View style={styles.androidCalloutDivider} />
                          <TouchableOpacity onPress={() => selectFeature(null)} style={styles.androidCalloutButton}>
                            <Ionicons name="close" size={20} color="#777777" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.map} />
                )}
              </View>
            </Surface>
          </>
        )}

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
              onFocus={() => setIsSearchFocused(true)}
              icon={isSearchFocused ? "arrow-left" : "magnify"}
              onIconPress={() => {
                if (isSearchFocused) {
                  Keyboard.dismiss();
                  setIsSearchFocused(false);
                }
              }}
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
            {!isSearchFocused && (
              <Surface elevation={2} style={styles.controlsRow}>
                <Button style={styles.button} onPress={buildFeature}>Ok</Button>
                <Button style={styles.button} onPress={popFromQueue} onLongPress={clearQueue}>Atras</Button>
                <Button style={styles.button} onPress={deleteFeature}>Borrar</Button>
                <Button style={styles.button} onPress={centerLocation} disabled={!useLocationEnabled}>Centrar</Button>
              </Surface>
            )}

            {/* Description */}
            {!isSearchFocused && (
              <Surface
                style={styles.descriptionView}
                onTouchEnd={selectedFeature ? openEditModal : undefined}
              >
                <Text style={styles.descriptionText}>
                  {selectedFeature ? (text || "Toca para agregar descripción...") : "No hay feature seleccionado"}
                </Text>
              </Surface>
            )}
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
