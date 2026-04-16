"use client";

import type { EntityType } from "@rythmons/db";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { trpc } from "@/utils/trpc";

/**
 * Hook pour gérer les conversations et messages
 *
 * Utilisation:
 * ```tsx
 * const {
 *   myEntities,
 *   conversations,
 *   messages,
 *   sendMessage,
 *   getOrCreateConversation
 * } = useConversations(selectedSenderId, selectedSenderType);
 * ```
 */
export function useConversations(
	selectedSenderId: string | null,
	selectedSenderType: EntityType | null,
) {
	const queryClient = useQueryClient();

	// Récupérer les entités de l'utilisateur
	const { data: myEntities = [], isLoading: entitiesLoading } = useQuery({
		...trpc.conversation.getMyEntities.queryOptions(),
	});

	// Récupérer les conversations pour l'entité sélectionnée
	const { data: conversations = [], isLoading: conversationsLoading } =
		useQuery({
			...trpc.conversation.getAll.queryOptions(),
			enabled: !!selectedSenderId && !!selectedSenderType,
		});

	// Envoyer un message
	const sendMessageMutation = useMutation({
		...trpc.conversation.sendMessage.mutationOptions(),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: trpc.conversation.getMessages.getQueryKey({
					conversationId: variables.conversationId,
				}),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.conversation.getAll.getQueryKey(),
			});
		},
	});

	// Créer ou récupérer une conversation
	const getOrCreateConversationMutation = useMutation({
		...trpc.conversation.getOrCreate.mutationOptions(),
	});

	const handleSendMessage = useCallback(
		async (conversationId: string, content: string) => {
			if (!selectedSenderId || !selectedSenderType) {
				throw new Error("Aucune entité sélectionnée");
			}

			return sendMessageMutation.mutateAsync({
				conversationId,
				content,
				senderId: selectedSenderId,
				senderType: selectedSenderType,
			});
		},
		[selectedSenderId, selectedSenderType, sendMessageMutation],
	);

	const handleGetOrCreateConversation = useCallback(
		async (targetId: string, targetType: EntityType) => {
			if (!selectedSenderId || !selectedSenderType) {
				throw new Error("Aucune entité sélectionnée");
			}

			return getOrCreateConversationMutation.mutateAsync({
				senderId: selectedSenderId,
				senderType: selectedSenderType,
				targetId,
				targetType,
			});
		},
		[selectedSenderId, selectedSenderType, getOrCreateConversationMutation],
	);

	return {
		myEntities,
		conversations,
		sendMessage: handleSendMessage,
		getOrCreateConversation: handleGetOrCreateConversation,
		isLoading: entitiesLoading || conversationsLoading,
		isSending: sendMessageMutation.isPending,
	};
}

/**
 * Hook pour obtenir les messages d'une conversation
 *
 * Utilisation:
 * ```tsx
 * const { messages, isLoading } = useConversationMessages(conversationId);
 * ```
 */
export function useConversationMessages(conversationId: string | null) {
	const { data: messages = [], isLoading } = useQuery({
		...trpc.conversation.getMessages.queryOptions({
			conversationId: conversationId || "",
		}),
		enabled: !!conversationId,
		refetchInterval: 2000, // Rafraîchir toutes les 2 secondes
	});

	return {
		messages,
		isLoading,
	};
}
