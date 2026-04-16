"use client";

import type { EntityType } from "@rythmons/db";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { trpc } from "@/utils/trpc";
import { EntitySelector } from "./entity-selector";

interface MessageModalProps {
	isOpen: boolean;
	onClose: () => void;
	targetId: string;
	targetType: EntityType;
	targetName: string;
}

export function MessageModal({
	isOpen,
	onClose,
	targetId,
	targetType,
	targetName,
}: MessageModalProps) {
	const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);
	const [selectedSenderType, setSelectedSenderType] =
		useState<EntityType | null>(null);
	const [messageContent, setMessageContent] = useState("");

	// Récupérer les entités utilisateur
	const { data: myEntities = [] } = useQuery({
		...trpc.conversation.getMyEntities.queryOptions(),
		enabled: isOpen,
	});

	// Auto-select si une seule entité
	useEffect(() => {
		if (myEntities.length === 1 && !selectedSenderId) {
			setSelectedSenderId(myEntities[0].entityId);
			setSelectedSenderType(myEntities[0].entityType);
		}
	}, [myEntities, selectedSenderId]);

	// Créer ou récupérer la conversation
	const getOrCreateConvMutation = useMutation({
		...trpc.conversation.getOrCreate.mutationOptions(),
	});

	// Envoyer le message
	const sendMessageMutation = useMutation({
		...trpc.conversation.sendMessage.mutationOptions(),
		onSuccess: () => {
			setMessageContent("");
			setSelectedSenderId(null);
			setSelectedSenderType(null);
			onClose();
		},
	});

	const handleSendMessage = useCallback(async () => {
		if (!selectedSenderId || !selectedSenderType || !messageContent.trim()) {
			return;
		}

		try {
			// Créer ou récupérer la conversation
			const conversation = await getOrCreateConvMutation.mutateAsync({
				senderId: selectedSenderId,
				senderType: selectedSenderType,
				targetId,
				targetType,
			});

			// Envoyer le message
			await sendMessageMutation.mutateAsync({
				conversationId: conversation.id,
				content: messageContent,
				senderId: selectedSenderId,
				senderType: selectedSenderType,
			});
		} catch (error) {
			console.error("Erreur lors de l'envoi du message:", error);
		}
	}, [
		selectedSenderId,
		selectedSenderType,
		messageContent,
		targetId,
		targetType,
		getOrCreateConvMutation.mutateAsync,
		sendMessageMutation.mutateAsync,
	]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
				<div className="mb-4">
					<h2 className="font-semibold text-lg">
						Envoyer un message à{" "}
						<span className="text-primary">{targetName}</span>
					</h2>
				</div>

				<div className="space-y-4">
					{/* Sélecteur d'entité */}
					<EntitySelector
						entities={myEntities}
						onSelect={(id, type) => {
							setSelectedSenderId(id);
							setSelectedSenderType(type);
						}}
						selectedEntityId={selectedSenderId || undefined}
						selectedEntityType={selectedSenderType || undefined}
						label="Envoyer en tant que"
					/>

					{/* Zone de texte */}
					<div>
						<label
							htmlFor="message-content"
							className="mb-2 block font-medium text-foreground text-sm"
						>
							Votre message
						</label>
						<textarea
							value={messageContent}
							onChange={(e) => setMessageContent(e.target.value)}
							placeholder="Entrez votre message..."
							className="h-24 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
						/>
					</div>

					{/* Boutons */}
					<div className="flex gap-2">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 rounded-lg border border-border bg-background px-4 py-2 font-medium text-sm transition-colors hover:bg-muted"
						>
							Annuler
						</button>
						<button
							type="button"
							onClick={handleSendMessage}
							disabled={
								!selectedSenderId ||
								!selectedSenderType ||
								!messageContent.trim() ||
								sendMessageMutation.isPending
							}
							className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
						>
							{sendMessageMutation.isPending ? "Envoi..." : "Envoyer"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
