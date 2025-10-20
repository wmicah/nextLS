import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ProgramsScreenProps {
  navigation: any;
}

interface Program {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  progress: number;
  isActive: boolean;
  exercises: number;
}

export default function ProgramsScreen({ navigation }: ProgramsScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const programs: Program[] = [
    {
      id: "1",
      title: "Upper Body Strength",
      description: "Build muscle and strength in your upper body",
      duration: "6 weeks",
      difficulty: "Intermediate",
      progress: 75,
      isActive: true,
      exercises: 12,
    },
    {
      id: "2",
      title: "Core Conditioning",
      description: "Strengthen your core with targeted exercises",
      duration: "4 weeks",
      difficulty: "Beginner",
      progress: 100,
      isActive: false,
      exercises: 8,
    },
    {
      id: "3",
      title: "HIIT Cardio",
      description: "High-intensity interval training for maximum results",
      duration: "8 weeks",
      difficulty: "Advanced",
      progress: 45,
      isActive: true,
      exercises: 15,
    },
    {
      id: "4",
      title: "Flexibility & Mobility",
      description: "Improve flexibility and prevent injuries",
      duration: "3 weeks",
      difficulty: "Beginner",
      progress: 0,
      isActive: false,
      exercises: 10,
    },
  ];

  const filters = [
    "All",
    "Active",
    "Completed",
    "Beginner",
    "Intermediate",
    "Advanced",
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "#10B981";
      case "Intermediate":
        return "#F59E0B";
      case "Advanced":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const filteredPrograms = programs.filter(program => {
    const matchesSearch =
      program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedFilter === "All") return matchesSearch;
    if (selectedFilter === "Active") return matchesSearch && program.isActive;
    if (selectedFilter === "Completed")
      return matchesSearch && program.progress === 100;
    return matchesSearch && program.difficulty === selectedFilter;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Programs</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#3B82F6" />
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
          placeholder="Search programs..."
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedFilter === filter && styles.filterTabTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Programs List */}
      <ScrollView
        style={styles.programsList}
        showsVerticalScrollIndicator={false}
      >
        {filteredPrograms.map(program => (
          <TouchableOpacity
            key={program.id}
            style={styles.programCard}
            onPress={() => {
              // TODO: Navigate to program details
              console.log("Navigate to program:", program.id);
            }}
          >
            <View style={styles.programHeader}>
              <View style={styles.programInfo}>
                <Text style={styles.programTitle}>{program.title}</Text>
                <Text style={styles.programDescription}>
                  {program.description}
                </Text>
              </View>
              <View style={styles.programStatus}>
                {program.isActive && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                )}
                {program.progress === 100 && (
                  <View style={styles.completedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#10B981"
                    />
                  </View>
                )}
              </View>
            </View>

            <View style={styles.programDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="time" size={16} color="#6B7280" />
                <Text style={styles.detailText}>{program.duration}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="fitness" size={16} color="#6B7280" />
                <Text style={styles.detailText}>
                  {program.exercises} exercises
                </Text>
              </View>
              <View style={styles.detailItem}>
                <View
                  style={[
                    styles.difficultyBadge,
                    {
                      backgroundColor:
                        getDifficultyColor(program.difficulty) + "20",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.difficultyText,
                      { color: getDifficultyColor(program.difficulty) },
                    ]}
                  >
                    {program.difficulty}
                  </Text>
                </View>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressPercentage}>
                  {program.progress}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${program.progress}%` },
                  ]}
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
  filterButton: {
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
  filterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 24,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
  },
  filterTabActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  filterTabText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },
  filterTabTextActive: {
    color: "#fff",
  },
  programsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  programCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  programHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  programInfo: {
    flex: 1,
  },
  programTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  programDescription: {
    fontSize: 14,
    color: "#9CA3AF",
    lineHeight: 20,
  },
  programStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  activeBadge: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  activeBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  completedBadge: {
    // Icon only, no background needed
  },
  programDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  detailText: {
    color: "#9CA3AF",
    fontSize: 12,
    marginLeft: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "500",
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  progressPercentage: {
    color: "#3B82F6",
    fontSize: 12,
    fontWeight: "600",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#374151",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 2,
  },
});
