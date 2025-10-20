import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface VideosScreenProps {
  navigation: any;
}

interface Video {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  category: string;
  isCompleted: boolean;
  isFavorite: boolean;
}

export default function VideosScreen({ navigation }: VideosScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const videos: Video[] = [
    {
      id: "1",
      title: "Proper Squat Form",
      description: "Learn the fundamentals of squatting with correct form",
      duration: "8:32",
      thumbnail:
        "https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Squat+Form",
      category: "Form",
      isCompleted: true,
      isFavorite: true,
    },
    {
      id: "2",
      title: "Upper Body Warm-up",
      description: "Essential warm-up routine for upper body workouts",
      duration: "12:15",
      thumbnail:
        "https://via.placeholder.com/300x200/10B981/FFFFFF?text=Warm-up",
      category: "Warm-up",
      isCompleted: false,
      isFavorite: false,
    },
    {
      id: "3",
      title: "Core Strengthening",
      description: "Build a strong core with these effective exercises",
      duration: "15:42",
      thumbnail: "https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Core",
      category: "Strength",
      isCompleted: true,
      isFavorite: true,
    },
    {
      id: "4",
      title: "HIIT Cardio Blast",
      description: "High-intensity cardio workout for maximum results",
      duration: "20:30",
      thumbnail: "https://via.placeholder.com/300x200/EF4444/FFFFFF?text=HIIT",
      category: "Cardio",
      isCompleted: false,
      isFavorite: false,
    },
    {
      id: "5",
      title: "Flexibility Stretches",
      description: "Improve flexibility and prevent injuries",
      duration: "18:20",
      thumbnail:
        "https://via.placeholder.com/300x200/8B5CF6/FFFFFF?text=Stretch",
      category: "Flexibility",
      isCompleted: false,
      isFavorite: true,
    },
  ];

  const categories = [
    "All",
    "Form",
    "Warm-up",
    "Strength",
    "Cardio",
    "Flexibility",
  ];

  const filteredVideos = videos.filter(video => {
    const matchesSearch =
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Video Library</Text>
        <TouchableOpacity style={styles.favoritesButton}>
          <Ionicons name="heart" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#6B7280"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search videos..."
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTab,
              selectedCategory === category && styles.categoryTabActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryTabText,
                selectedCategory === category && styles.categoryTabTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Videos Grid */}
      <ScrollView
        style={styles.videosContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.videosGrid}>
          {filteredVideos.map(video => (
            <TouchableOpacity
              key={video.id}
              style={styles.videoCard}
              onPress={() => {
                // TODO: Navigate to video player
                console.log("Play video:", video.id);
              }}
            >
              <View style={styles.videoThumbnail}>
                <Image
                  source={{ uri: video.thumbnail }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
                <View style={styles.playButton}>
                  <Ionicons name="play" size={24} color="#fff" />
                </View>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{video.duration}</Text>
                </View>
                {video.isCompleted && (
                  <View style={styles.completedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#10B981"
                    />
                  </View>
                )}
              </View>

              <View style={styles.videoInfo}>
                <View style={styles.videoHeader}>
                  <Text style={styles.videoTitle} numberOfLines={2}>
                    {video.title}
                  </Text>
                  <TouchableOpacity style={styles.favoriteButton}>
                    <Ionicons
                      name={video.isFavorite ? "heart" : "heart-outline"}
                      size={16}
                      color={video.isFavorite ? "#EF4444" : "#6B7280"}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.videoDescription} numberOfLines={2}>
                  {video.description}
                </Text>

                <View style={styles.videoMeta}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{video.category}</Text>
                  </View>
                  <View style={styles.videoStats}>
                    <Ionicons name="time" size={12} color="#6B7280" />
                    <Text style={styles.statsText}>{video.duration}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  favoritesButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    marginHorizontal: 24,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: "#fff",
    fontSize: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryContent: {
    paddingHorizontal: 24,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
  },
  categoryTabActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  categoryTabText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },
  categoryTabTextActive: {
    color: "#fff",
  },
  videosContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  videosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  videoCard: {
    width: "48%",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#374151",
    overflow: "hidden",
  },
  videoThumbnail: {
    position: "relative",
    height: 120,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
  },
  completedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  videoInfo: {
    padding: 12,
  },
  videoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  videoTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginRight: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  videoDescription: {
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 16,
    marginBottom: 8,
  },
  videoMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
  },
  videoStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsText: {
    color: "#6B7280",
    fontSize: 10,
    marginLeft: 4,
  },
});
