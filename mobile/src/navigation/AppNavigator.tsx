import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, AuthProvider } from "../contexts/AuthContext";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

// Import screens
import LoginScreen from "../screens/auth/LoginScreen";
import DashboardScreen from "../screens/dashboard/DashboardScreen";
import ProgramsScreen from "../screens/programs/ProgramsScreen";
import VideosScreen from "../screens/videos/VideosScreen";
import MessagesScreen from "../screens/messages/MessagesScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator for authenticated users
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Programs") {
            iconName = focused ? "fitness" : "fitness-outline";
          } else if (route.name === "Videos") {
            iconName = focused ? "play-circle" : "play-circle-outline";
          } else if (route.name === "Messages") {
            iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else {
            iconName = "help-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#3B82F6", // Blue color matching your web app
        tabBarInactiveTintColor: "gray",
        headerStyle: {
          backgroundColor: "#1F2937", // Dark header
        },
        headerTintColor: "#fff",
        tabBarStyle: {
          backgroundColor: "#1F2937", // Dark tab bar
          borderTopColor: "#374151",
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: "Dashboard" }}
      />
      <Tab.Screen
        name="Programs"
        component={ProgramsScreen}
        options={{ title: "Programs" }}
      />
      <Tab.Screen
        name="Videos"
        component={VideosScreen}
        options={{ title: "Video Library" }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ title: "Messages" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

// Loading screen component
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

// Root Stack Navigator
function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: "#1F2937",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Root component with AuthProvider
export default function RootNavigator() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
});
