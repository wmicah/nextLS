"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Search, Play, Clock, Plus, Settings, X } from "lucide-react";

interface DrillSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDrill: (drill: {
    title: string;
    description?: string;
    duration?: string;
    videoUrl?: string;
    notes?: string;
    sets?: number;
    reps?: number;
    tempo?: string;
    supersetWithId?: string;
    isYoutube?: boolean;
    youtubeId?: string | null;
    videoId?: string | null;
    videoTitle?: string | null;
    videoThumbnail?: string | null;
  }) => void;
}

const categories = [
  "All",
  "Drive",
  "Whip",
  "Separation",
  "Stability",
  "Extension",
];

export default function DrillSelectionModal({
  isOpen,
  onClose,
  onSelectDrill,
}: DrillSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDrill, setSelectedDrill] = useState<any>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);

  // Exercise configuration form state
  const [exerciseConfig, setExerciseConfig] = useState({
    sets: 3,
    reps: 10,
    tempo: "",
    notes: "",
    supersetWithId: "",
  });

  const { data: libraryItems = [], isLoading } = trpc.library.list.useQuery({
    search: searchTerm || undefined,
    category: selectedCategory !== "All" ? selectedCategory : undefined,
  });

  const handleSelectDrill = (item: any) => {
    setSelectedDrill(item);
    setShowConfigForm(true);
  };

  const handleConfigSubmit = () => {
    if (!selectedDrill) return;

    onSelectDrill({
      title: selectedDrill.title,
      description: selectedDrill.description,
      duration: selectedDrill.duration || "",
      videoUrl: selectedDrill.url || "",
      notes: exerciseConfig.notes,
      sets: exerciseConfig.sets,
      reps: exerciseConfig.reps,
      tempo: exerciseConfig.tempo,
      supersetWithId: exerciseConfig.supersetWithId,
      // Add YouTube-specific information
      isYoutube: selectedDrill.isYoutube || false,
      youtubeId: selectedDrill.youtubeId || null,
      videoId: selectedDrill.id || null,
      videoTitle: selectedDrill.title || null,
      videoThumbnail: selectedDrill.thumbnail || null,
    });

    // Reset form but don't close modal - let user add more exercises
    setSelectedDrill(null);
    setShowConfigForm(false);
    setExerciseConfig({
      sets: 3,
      reps: 10,
      tempo: "",
      notes: "",
      supersetWithId: "",
    });
    // Don't call onClose() here - let user add more exercises
  };

  const handleBackToSelection = () => {
    setSelectedDrill(null);
    setShowConfigForm(false);
    setExerciseConfig({
      sets: 3,
      reps: 10,
      tempo: "",
      notes: "",
      supersetWithId: "",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] overflow-y-auto bg-[#2A3133] border-gray-600">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-white">
                {showConfigForm
                  ? "Configure Exercise"
                  : "Select Drill from Library"}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {showConfigForm
                  ? "Set the parameters for this exercise"
                  : "Choose a drill from your library to add to this day"}
              </DialogDescription>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
            >
              Done
            </Button>
          </div>
        </DialogHeader>

        {showConfigForm && selectedDrill ? (
          // Exercise Configuration Form
          <div className="space-y-6">
            {/* Selected Drill Preview */}
            <Card className="bg-[#3A4245] border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-medium">
                        {selectedDrill.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className="bg-blue-500/10 text-blue-600 border-blue-500/20"
                      >
                        {selectedDrill.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-green-500/10 text-green-600 border-green-500/20"
                      >
                        {selectedDrill.difficulty}
                      </Badge>
                    </div>
                    {selectedDrill.description && (
                      <p className="text-gray-400 text-sm mb-2">
                        {selectedDrill.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToSelection}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Exercise Configuration Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sets */}
              <div>
                <Label
                  htmlFor="sets"
                  className="text-white text-sm font-medium"
                >
                  Sets
                </Label>
                <Input
                  id="sets"
                  type="number"
                  min="1"
                  value={exerciseConfig.sets}
                  onChange={e =>
                    setExerciseConfig(prev => ({
                      ...prev,
                      sets: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="mt-1 bg-[#3A4245] border-gray-600 text-white"
                  placeholder="3"
                />
              </div>

              {/* Reps */}
              <div>
                <Label
                  htmlFor="reps"
                  className="text-white text-sm font-medium"
                >
                  Reps
                </Label>
                <Input
                  id="reps"
                  type="number"
                  min="1"
                  value={exerciseConfig.reps}
                  onChange={e =>
                    setExerciseConfig(prev => ({
                      ...prev,
                      reps: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="mt-1 bg-[#3A4245] border-gray-600 text-white"
                  placeholder="10"
                />
              </div>

              {/* Tempo */}
              <div>
                <Label
                  htmlFor="tempo"
                  className="text-white text-sm font-medium"
                >
                  Tempo (e.g., 3-1-1)
                </Label>
                <Input
                  id="tempo"
                  type="text"
                  value={exerciseConfig.tempo}
                  onChange={e =>
                    setExerciseConfig(prev => ({
                      ...prev,
                      tempo: e.target.value,
                    }))
                  }
                  className="mt-1 bg-[#3A4245] border-gray-600 text-white"
                  placeholder="3-1-1"
                />
              </div>

              {/* Superset */}
              <div>
                <Label
                  htmlFor="superset"
                  className="text-white text-sm font-medium"
                >
                  Superset With (Optional)
                </Label>
                <Input
                  id="superset"
                  type="text"
                  value={exerciseConfig.supersetWithId}
                  onChange={e =>
                    setExerciseConfig(prev => ({
                      ...prev,
                      supersetWithId: e.target.value,
                    }))
                  }
                  className="mt-1 bg-[#3A4245] border-gray-600 text-white"
                  placeholder="Exercise ID or name"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-white text-sm font-medium">
                Notes
              </Label>
              <textarea
                id="notes"
                value={exerciseConfig.notes}
                onChange={e =>
                  setExerciseConfig(prev => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                className="mt-1 w-full px-3 py-2 rounded-md bg-[#3A4245] border border-gray-600 text-white resize-none"
                rows={3}
                placeholder="Additional notes for this exercise..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleBackToSelection}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Back to Selection
              </Button>
              <Button
                onClick={handleConfigSubmit}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={exerciseConfig.sets <= 0 || exerciseConfig.reps <= 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Exercise
              </Button>
            </div>
          </div>
        ) : (
          // Drill Selection List
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search drills..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#3A4245] border-gray-600 text-white"
                  />
                </div>
              </div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full sm:w-40 bg-[#3A4245] border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#3A4245] border-gray-600">
                  {categories.map(category => (
                    <SelectItem
                      key={category}
                      value={category}
                      className="text-white hover:bg-[#2A3133]"
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Drill List */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : libraryItems.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No drills found. Try adjusting your search or filters.
                </div>
              ) : (
                libraryItems.map(item => (
                  <Card
                    key={item.id}
                    className="bg-[#3A4245] border-gray-600 hover:bg-[#4A5457] transition-colors cursor-pointer"
                    onClick={() => handleSelectDrill(item)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-white font-medium">
                              {item.title}
                            </h3>
                            <Badge
                              variant="outline"
                              className="bg-blue-500/10 text-blue-600 border-blue-500/20"
                            >
                              {item.category}
                            </Badge>
                          </div>
                          {item.description && (
                            <p className="text-gray-400 text-sm mb-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            {item.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{item.duration}</span>
                              </div>
                            )}
                            {item.type === "video" && (
                              <div className="flex items-center gap-1">
                                <Play className="h-3 w-3" />
                                <span>Video</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
