import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface DashboardScreenProps {
  navigation: any;
}

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const stats = [
    { title: "Active Programs", value: "3", icon: "fitness", color: "#10B981" },
    {
      title: "Completed Videos",
      value: "12",
      icon: "play-circle",
      color: "#3B82F6",
    },
    { title: "Messages", value: "5", icon: "chatbubbles", color: "#F59E0B" },
    { title: "This Week", value: "4h 30m", icon: "time", color: "#8B5CF6" },
  ];

  const recentActivities = [
    {
      id: "1",
      title: "Completed: Upper Body Strength",
      time: "2 hours ago",
      type: "completed",
    },
    {
      id: "2",
      title: "New message from Coach",
      time: "4 hours ago",
      type: "message",
    },
    {
      id: "3",
      title: "Program: Core Conditioning",
      time: "Yesterday",
      type: "program",
    },
    {
      id: "4",
      title: "Video: Proper Form Tips",
      time: "2 days ago",
      type: "video",
    },
  ];

  const upcomingLessons = [
    {
      id: "1",
      title: "Personal Training Session",
      time: "Tomorrow 2:00 PM",
      coach: "Coach Mike",
    },
    {
      id: "2",
      title: "Group Fitness Class",
      time: "Friday 6:00 PM",
      coach: "Coach Sarah",
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning!</Text>
        <Text style={styles.name}>Ready for your workout?</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View
              style={[styles.statIcon, { backgroundColor: stat.color + "20" }]}
            >
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Programs")}
          >
            <Ionicons name="fitness" size={24} color="#3B82F6" />
            <Text style={styles.actionText}>Programs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Videos")}
          >
            <Ionicons name="play-circle" size={24} color="#3B82F6" />
            <Text style={styles.actionText}>Videos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Messages")}
          >
            <Ionicons name="chatbubbles" size={24} color="#3B82F6" />
            <Text style={styles.actionText}>Messages</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming Lessons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Lessons</Text>
        {upcomingLessons.map(lesson => (
          <View key={lesson.id} style={styles.lessonCard}>
            <View style={styles.lessonInfo}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonTime}>{lesson.time}</Text>
              <Text style={styles.lessonCoach}>{lesson.coach}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </View>
        ))}
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivities.map(activity => (
          <View key={activity.id} style={styles.activityCard}>
            <View style={styles.activityIcon}>
              <Ionicons
                name={
                  activity.type === "completed"
                    ? "checkmark-circle"
                    : activity.type === "message"
                    ? "chatbubble"
                    : activity.type === "program"
                    ? "fitness"
                    : "play-circle"
                }
                size={20}
                color={
                  activity.type === "completed"
                    ? "#10B981"
                    : activity.type === "message"
                    ? "#3B82F6"
                    : activity.type === "program"
                    ? "#8B5CF6"
                    : "#F59E0B"
                }
              />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  name: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 72) / 2,
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#374151",
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
  },
  lessonCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  lessonTime: {
    fontSize: 14,
    color: "#3B82F6",
    marginBottom: 2,
  },
  lessonCoach: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1F2937",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});
