"use client";

import type { EntityType } from "@rythmons/db";
import { useEffect, useState } from "react";

interface Entity {
	entityId: string;
	entityType: EntityType;
	name: string; // Maintenant toujours présent
}

interface EntitySelectorProps {
	entities: Entity[];
	onSelect: (entityId: string, entityType: EntityType) => void;
	selectedEntityId?: string;
	selectedEntityType?: EntityType;
	label?: string;
	autoSelectIfOne?: boolean; // Auto-select si une seule entité
}

export function EntitySelector({
	entities,
	onSelect,
	selectedEntityId,
	selectedEntityType,
	label = "Sélectionnez une entité",
	autoSelectIfOne = true,
}: EntitySelectorProps) {
	const [isOpen, setIsOpen] = useState(false);

	// Auto-select si une seule entité
	useEffect(() => {
		if (autoSelectIfOne && entities.length === 1 && !selectedEntityId) {
			const entity = entities[0];
			onSelect(entity.entityId, entity.entityType);
		}
	}, [entities, selectedEntityId, onSelect, autoSelectIfOne]);

	const selectedEntity = entities.find(
		(e) =>
			e.entityId === selectedEntityId && e.entityType === selectedEntityType,
	);

	const getEntityLabel = (type: EntityType): string => {
		const labels: Record<EntityType, string> = {
			ARTIST: "Artiste",
			VENUE: "Lieu",
			MEDIA: "Média",
		};
		return labels[type] || type;
	};

	return (
		<div className="relative w-full">
			<label
				htmlFor="entity-selector"
				className="mb-2 block font-medium text-foreground text-sm"
			>
				{label}
			</label>

			<button
				id="entity-selector"
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-2 text-left text-sm transition-colors hover:border-primary/50"
			>
				{selectedEntity ? (
					<span>
						<span className="font-medium">{selectedEntity.name}</span>
						<span className="ml-2 text-muted-foreground text-xs">
							({getEntityLabel(selectedEntity.entityType)})
						</span>
					</span>
				) : (
					<span className="text-muted-foreground">{label}</span>
				)}
				<span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
					▼
				</span>
			</button>

			{isOpen && (
				<div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-lg border border-border bg-background shadow-lg">
					{entities.length === 0 ? (
						<div className="px-4 py-2 text-muted-foreground text-sm">
							Aucune entité disponible
						</div>
					) : (
						entities.map((entity) => (
							<button
								key={`${entity.entityType}-${entity.entityId}`}
								type="button"
								onClick={() => {
									onSelect(entity.entityId, entity.entityType);
									setIsOpen(false);
								}}
								className={`w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-muted ${
									selectedEntityId === entity.entityId &&
									selectedEntityType === entity.entityType
										? "bg-primary/10 font-medium text-primary"
										: ""
								}`}
							>
								<span className="font-medium">{entity.name}</span>
								<span className="ml-2 text-muted-foreground text-xs">
									({getEntityLabel(entity.entityType)})
								</span>
							</button>
						))
					)}
				</div>
			)}
		</div>
	);
}
