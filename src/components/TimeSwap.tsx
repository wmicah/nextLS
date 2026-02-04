"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface TimeSwapProps {
  onClose: () => void;
}

/** Minimal client type to avoid deep tRPC inference. */
interface TimeSwapClient {
  id: string;
  name?: string | null;
  email?: string | null;
  coach?: { name?: string | null } | null;
}

export default function TimeSwap({ onClose }: TimeSwapProps) {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedRequesterEvent, setSelectedRequesterEvent] = useState<
    string | null
  >(null);
  const [selectedTargetEvent, setSelectedTargetEvent] = useState<string | null>(
    null
  );
  const [step, setStep] = useState<
    "select-client" | "select-events" | "confirm"
  >("select-client");

  // Queries
  const { data: availableClientsRaw = [], isLoading: clientsLoading } =
    trpc.timeSwap.getAvailableClients.useQuery();
  const availableClients: TimeSwapClient[] =
    availableClientsRaw as TimeSwapClient[];

  const { data: targetEvents = [], isLoading: eventsLoading } =
    trpc.timeSwap.getClientEvents.useQuery(
      { clientId: selectedClient! },
      { enabled: !!selectedClient }
    );

  const { data: myEvents = [] } =
    trpc.clientRouter.getClientUpcomingLessons.useQuery();

  // Mutations
  const createSwapRequest =
    trpc.timeSwap.createSwapRequestFromLesson.useMutation({
      onSuccess: () => {
        onClose();
      },
    });

  const handleClientSelect = (clientId: string) => {
    setSelectedClient(clientId);
    setStep("select-events");
  };

  const handleEventSelect = (
    requesterEventId: string,
    targetEventId: string
  ) => {
    // Find the events
    const requesterEvent = myEvents.find(e => e.id === requesterEventId);
    const targetEvent = targetEvents.find(e => e.id === targetEventId);

    // Validate that both events are with the same coach
    if (
      requesterEvent &&
      targetEvent &&
      requesterEvent.coach?.id !== targetEvent.coach?.id
    ) {
      alert(
        "⚠️ You can only swap lessons with the same coach. Please select lessons that are both with the same coach."
      );
      return;
    }

    setSelectedRequesterEvent(requesterEventId);
    setSelectedTargetEvent(targetEventId);
    setStep("confirm");
  };

  const handleConfirmSwap = () => {
    if (selectedRequesterEvent && selectedTargetEvent) {
      createSwapRequest.mutate({
        requesterEventId: selectedRequesterEvent,
        targetEventId: selectedTargetEvent,
      });
    }
  };

  const reset = () => {
    setSelectedClient(null);
    setSelectedRequesterEvent(null);
    setSelectedTargetEvent(null);
    setStep("select-client");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Request Time Switch
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {/* Step 1: Select Client */}
          {step === "select-client" && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Choose a client to switch with
              </h3>

              {clientsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid gap-3">
                  {availableClients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => handleClientSelect(client.id)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {client.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {client.email}
                          </p>
                          {client.coach && (
                            <p className="text-xs text-blue-600 mt-1">
                              Coach: {client.coach.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Events */}
          {step === "select-events" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={reset}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Back
                </button>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Select events to switch
                </h3>
              </div>

              {eventsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* My Events */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Your upcoming lessons:
                    </h4>
                    <div className="space-y-2">
                      {myEvents.map(event => (
                        <div
                          key={event.id}
                          className="p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <div className="flex-1">
                              <p className="font-medium">{event.title}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(event.date).toLocaleDateString()} at{" "}
                                {new Date(event.date).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              {event.coach && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Coach: {event.coach.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Target Client Events */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      {
                        availableClients.find(c => c.id === selectedClient)
                          ?.name
                      }
                      's upcoming lessons:
                    </h4>
                    <div className="space-y-2">
                      {targetEvents.map(event => {
                        // Only show events that can be swapped with (same coach as myEvents)
                        const canSwapWith = myEvents.some(
                          myEvent => myEvent.coach?.id === event.coach?.id
                        );

                        return (
                          <button
                            key={event.id}
                            onClick={() => {
                              // Find the matching event with the same coach
                              const matchingMyEvent = myEvents.find(
                                myEvent => myEvent.coach?.id === event.coach?.id
                              );
                              if (matchingMyEvent) {
                                handleEventSelect(matchingMyEvent.id, event.id);
                              }
                            }}
                            disabled={!canSwapWith}
                            className={`w-full p-3 border rounded-lg transition-colors text-left ${
                              canSwapWith
                                ? "border-gray-200 hover:border-green-300 hover:bg-green-50"
                                : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <div className="flex-1">
                                <p className="font-medium">{event.title}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(event.date).toLocaleDateString()} at{" "}
                                  {new Date(event.date).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                                {event.coach && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    Coach: {event.coach.name}
                                  </p>
                                )}
                                {!canSwapWith && (
                                  <p className="text-xs text-red-600 mt-1">
                                    ⚠️ No matching lesson with this coach
                                  </p>
                                )}
                              </div>
                              {canSwapWith && (
                                <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === "confirm" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setStep("select-events")}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Back
                </button>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Confirm switch request
                </h3>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">
                      Default message will be sent:
                    </p>
                    <p className="text-yellow-700">
                      "Hey, could we switch times this week?"
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Your lesson:
                  </h4>
                  {myEvents.find(e => e.id === selectedRequesterEvent) && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {
                            myEvents.find(e => e.id === selectedRequesterEvent)
                              ?.title
                          }
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(
                            myEvents.find(e => e.id === selectedRequesterEvent)
                              ?.date || ""
                          ).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(
                            myEvents.find(e => e.id === selectedRequesterEvent)
                              ?.date || ""
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {myEvents.find(e => e.id === selectedRequesterEvent)
                          ?.coach && (
                          <p className="text-xs text-blue-600 mt-1">
                            Coach:{" "}
                            {
                              myEvents.find(
                                e => e.id === selectedRequesterEvent
                              )?.coach?.name
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {availableClients.find(c => c.id === selectedClient)?.name}
                    's lesson:
                  </h4>
                  {targetEvents.find(e => e.id === selectedTargetEvent) && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {
                            targetEvents.find(e => e.id === selectedTargetEvent)
                              ?.title
                          }
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(
                            targetEvents.find(e => e.id === selectedTargetEvent)
                              ?.date || ""
                          ).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(
                            targetEvents.find(e => e.id === selectedTargetEvent)
                              ?.date || ""
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {targetEvents.find(e => e.id === selectedTargetEvent)
                          ?.coach && (
                          <p className="text-xs text-blue-600 mt-1">
                            Coach:{" "}
                            {
                              targetEvents.find(
                                e => e.id === selectedTargetEvent
                              )?.coach?.name
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Coach Validation Message */}
                {myEvents.find(e => e.id === selectedRequesterEvent)?.coach
                  ?.id ===
                  targetEvents.find(e => e.id === selectedTargetEvent)?.coach
                    ?.id && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-sm text-green-800">
                        ✓ Both lessons are with the same coach - swap is valid
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleConfirmSwap}
                  disabled={createSwapRequest.isPending}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {createSwapRequest.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Send Switch Request
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
