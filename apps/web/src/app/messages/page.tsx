"use client";

import type { EntityType } from "@rythmons/db";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { EntitySelector } from "@/components/entity-selector";
import { trpc } from "@/utils/trpc";

export default function MessagesPage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();
	const conversationId = searchParams.get("conversationId");

	const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);
	const [selectedSenderType, setSelectedSenderType] =
		useState<EntityType | null>(null);
	const [messageContent, setMessageContent] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Récupérer les entités utilisateur
	const { data: myEntities = [] } = useQuery({
		...trpc.conversation.getMyEntities.queryOptions(),
	});

	// Auto-select si une seule entité
	useEffect(() => {
		if (myEntities.length === 1 && !selectedSenderId) {
			setSelectedSenderId(myEntities[0].entityId);
			setSelectedSenderType(myEntities[0].entityType);
		}
	}, [myEntities, selectedSenderId]);

	// Récupérer toutes les conversations
	const { data: conversations = [] } = useQuery({
		...trpc.conversation.getAll.queryOptions(),
	});

	const selectedEntity = myEntities.find(
		(e) =>
			e.entityId === selectedSenderId && e.entityType === selectedSenderType,
	);

	type Participant = {
		entityId: string;
		entityType: string;
	};

	const entityConversations = selectedEntity
		? conversations.filter((conv) =>
				conv.participants.some(
					(p: Participant) =>
						p.entityId === selectedSenderId &&
						p.entityType === selectedSenderType,
				),
			)
		: [];

	type Conversation = {
		id: string;
		participants: Participant[];
	};

	// Obtenir le nom de l'entité opposée dans une conversation
	const getOtherEntityName = (conv: Conversation) => {
		if (selectedSenderId && selectedSenderType) {
			const otherParticipant = conv.participants.find(
				(p: Participant) =>
					p.entityId !== selectedSenderId ||
					p.entityType !== selectedSenderType,
			);
			return otherParticipant?.name || "Inconnue";
		}

		return conv.participants?.[0]?.name || "Inconnue";
	};

	const currentConversation = entityConversations.find(
		(conv) => conv.id === conversationId,
	);

	const currentConversationTitle = currentConversation
		? getOtherEntityName(currentConversation)
		: "Conversation";

	// Ouvrir automatiquement la dernière conversation de l'entité sélectionnée si aucune n'est sélectionnée
	useEffect(() => {
		if (!selectedSenderId || !selectedSenderType) {
			return;
		}

		if (entityConversations.length === 0) {
			if (conversationId) {
				router.replace("/messages");
			}
			return;
		}

		if (
			!conversationId ||
			!entityConversations.some((conv) => conv.id === conversationId)
		) {
			router.replace(`/messages?conversationId=${entityConversations[0].id}`);
		}
	}, [
		selectedSenderId,
		selectedSenderType,
		conversationId,
		entityConversations,
		router,
	]);

	// Récupérer les messages de la conversation actuelle
	const { data: messages = [] } = useQuery({
		...trpc.conversation.getMessages.queryOptions({
			conversationId: conversationId || "",
		}),
		enabled: !!conversationId,
		refetchInterval: 2000, // Rafraîchir toutes les 2 secondes
	});

	// Envoyer le message
	const sendMessageMutation = useMutation({
		...trpc.conversation.sendMessage.mutationOptions(),
		onSuccess: () => {
			setMessageContent("");
			// Invalider les queries pour rafraîchir
			queryClient.invalidateQueries({
				queryKey: trpc.conversation.getMessages.getQueryKey({
					conversationId: conversationId || "",
				}),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.conversation.getAll.getQueryKey(),
			});
		},
	});

	const handleSendMessage = useCallback(async () => {
		if (
			!selectedSenderId ||
			!selectedSenderType ||
			!conversationId ||
			!messageContent.trim()
		) {
			return;
		}

		await sendMessageMutation.mutateAsync({
			conversationId,
			content: messageContent,
			senderId: selectedSenderId,
			senderType: selectedSenderType,
		});
	}, [
		selectedSenderId,
		selectedSenderType,
		conversationId,
		messageContent,
		sendMessageMutation,
	]);

	// Scroll vers le bas quand de nouveaux messages arrivent
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	return (
		<div className="container mx-auto h-screen max-w-6xl px-4 py-8">
			<div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<h1 className="font-bold text-3xl">Messages</h1>
				<div className="w-full max-w-md">
					<EntitySelector
						entities={myEntities}
						selectedEntityId={selectedSenderId ?? undefined}
						selectedEntityType={selectedSenderType ?? undefined}
						onSelect={(id, type) => {
							setSelectedSenderId(id);
							setSelectedSenderType(type);
						}}
						label="Sélectionnez une entité"
						autoSelectIfOne={true}
					/>
				</div>
			</div>
			{/* 
			<div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
				<p className="text-sm">
					Vous gérez vos messages en tant que:{" "}
					<span className="font-semibold text-primary">
						{selectedEntity?.name || "Aucune entité sélectionnée"}
					</span>
				</p>
			{selectedEntity ? (
				<p className="text-xs text-primary/700 mt-1">
					Entité active : {selectedEntity.name} ({selectedEntity.entityType.toLowerCase()})
				</p>
			) : (
				<p className="text-xs text-muted-foreground mt-1">
					Sélectionnez une entité ci-dessus pour afficher ses conversations.
				</p>
			)}
		</div> */}
			<div className="grid h-[calc(100vh-200px)] gap-6 lg:grid-cols-3">
				{/* Liste des conversations */}
				<div className="flex flex-col overflow-hidden rounded-lg border border-border/50 bg-card">
					<div className="flex-shrink-0 border-border/50 border-b p-4">
						<h2 className="font-semibold">Conversations</h2>
						<p className="mt-1 text-muted-foreground text-xs">
							{entityConversations.length} conversation
							{entityConversations.length > 1 ? "s" : ""}
						</p>
					</div>
					<div className="flex-1 overflow-y-auto">
						{entityConversations.length === 0 ? (
							<p className="p-4 text-center text-muted-foreground text-sm">
								Aucune conversation pour cette entité
							</p>
						) : (
							entityConversations.map((conv) => (
								<button
									type="button"
									key={conv.id}
									onClick={() =>
										router.push(`/messages?conversationId=${conv.id}`)
									}
									className={`w-full border-border/30 border-b p-4 text-left transition-colors hover:bg-muted/50 ${
										conversationId === conv.id ? "bg-muted/80" : ""
									}`}
								>
									<p className="font-medium text-sm">
										{getOtherEntityName(conv)}
									</p>
									<p className="mt-1 truncate text-muted-foreground text-xs">
										{conv.messages?.[0]?.content?.substring(0, 50) ||
											"Aucun message"}
									</p>
									<p className="mt-1 text-muted-foreground text-xs">
										{new Date(conv.updatedAt).toLocaleDateString()}
									</p>
								</button>
							))
						)}
					</div>
				</div>

				{/* Fenêtre de chat */}
				<div className="flex flex-col overflow-hidden rounded-lg border border-border/50 bg-card lg:col-span-2">
					{conversationId ? (
						<>
							<div className="flex-shrink-0 border-border/50 border-b p-4">
								<p className="font-semibold">{currentConversationTitle}</p>
								<p className="mt-1 text-muted-foreground text-xs">
									{messages.length} message{messages.length > 1 ? "s" : ""}
								</p>
							</div>

							<div className="flex-1 space-y-4 overflow-y-auto p-4">
								{messages.length === 0 ? (
									<p className="py-8 text-center text-muted-foreground text-sm">
										Aucun message pour le moment. Commencez la conversation!
									</p>
								) : (
									messages.map((msg) => (
										<div
											key={msg.id}
											className={`flex ${
												msg.senderId === selectedSenderId
													? "justify-end"
													: "justify-start"
											}`}
										>
											<div
												className={`max-w-xs rounded-lg p-3 ${
													msg.senderId === selectedSenderId
														? "bg-primary text-primary-foreground"
														: "bg-muted"
												}`}
											>
												<p className="text-sm">{msg.content}</p>
												<p className="mt-1 text-xs opacity-70">
													{new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
														hour: "2-digit",
														minute: "2-digit",
													})}
												</p>
											</div>
										</div>
									))
								)}
								<div ref={messagesEndRef} />
							</div>

							<div className="flex-shrink-0 space-y-2 border-border/50 border-t p-4">
								<textarea
									value={messageContent}
									onChange={(e) => setMessageContent(e.target.value)}
									onKeyDown={(e) => {
										if (
											e.key === "Enter" &&
											!e.shiftKey &&
											messageContent.trim()
										) {
											e.preventDefault();
											handleSendMessage();
										}
									}}
									placeholder="Entrez votre message (Shift+Enter pour nouvelle ligne)..."
									className="h-20 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
								/>
								<button
									type="button"
									onClick={handleSendMessage}
									disabled={
										!messageContent.trim() || sendMessageMutation.isPending
									}
									className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
								>
									{sendMessageMutation.isPending ? "Envoi..." : "Envoyer"}
								</button>
							</div>
						</>
					) : (
						<div className="flex flex-1 items-center justify-center">
							<p className="text-muted-foreground">
								Sélectionnez une conversation
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
